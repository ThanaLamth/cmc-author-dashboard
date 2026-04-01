import { startWorkerLoop } from "@/lib/worker/poll";

async function main() {
  console.log("cmc-author-dashboard worker booting");
  await startWorkerLoop();
}

main().catch((error) => {
  console.error("worker crashed", error);
  process.exit(1);
});
