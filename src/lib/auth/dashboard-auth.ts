export const DASHBOARD_SESSION_COOKIE = "cmc_dashboard_session";
const encoder = new TextEncoder();

export function parseDashboardUsers(raw: string | undefined) {
  if (!raw) {
    return {};
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === "string" &&
        typeof entry[1] === "string" &&
        entry[0].trim().length > 0 &&
        entry[1].trim().length > 0,
    ),
  );
}

export function getDashboardUsers(env: NodeJS.ProcessEnv = process.env) {
  return parseDashboardUsers(env.DASHBOARD_USERS_JSON);
}

export function getDashboardSessionSecret(env: NodeJS.ProcessEnv = process.env) {
  return env.DASHBOARD_SESSION_SECRET ?? "cmc-dashboard-dev-secret";
}

export function authenticateDashboardUser(
  users: Record<string, string>,
  username: string,
  password: string,
) {
  return users[username] === password;
}

function toBase64Url(bytes: Uint8Array) {
  const base64 = Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(Buffer.from(padded, "base64"));
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    result |= leftBytes[index] ^ rightBytes[index];
  }

  return result === 0;
}

export async function createSessionToken(username: string, secret: string) {
  const payload = Buffer.from(JSON.stringify({ username }), "utf8").toString("base64url");
  const signature = await signValue(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = await signValue(payload, secret);
  if (!constantTimeEqual(signature, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(fromBase64Url(payload)).toString("utf8")) as {
      username?: unknown;
    };

    return typeof parsed.username === "string" ? { username: parsed.username } : null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedDashboardUserAsync(
  token: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token, getDashboardSessionSecret(env));
  if (!session) {
    return null;
  }

  const users = getDashboardUsers(env);
  return users[session.username] ? session : null;
}
