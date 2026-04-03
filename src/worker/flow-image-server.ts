import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import {
  generateImageViaFlow,
  getFlowWorkerConfig,
  parseFlowWorkerRequest,
} from "@/lib/worker/flow-image-worker";

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const config = getFlowWorkerConfig();

  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method not allowed" });
        return;
      }

      if (request.url !== "/" && request.url !== "/generate") {
        sendJson(response, 404, { error: "Not found" });
        return;
      }

      if (config.bearerToken) {
        const authHeader = request.headers.authorization;
        if (authHeader !== `Bearer ${config.bearerToken}`) {
          sendJson(response, 401, { error: "Unauthorized" });
          return;
        }
      }

      const rawBody = await readRequestBody(request);
      const input = parseFlowWorkerRequest(JSON.parse(rawBody));
      const result = await generateImageViaFlow(config, input);

      sendJson(response, 200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Flow worker error";
      sendJson(response, 500, { error: message });
    }
  });

  server.listen(config.port, () => {
    console.log(`flow-image-worker listening on http://127.0.0.1:${config.port}`);
  });
}

main().catch((error) => {
  console.error("flow-image-worker crashed", error);
  process.exit(1);
});
