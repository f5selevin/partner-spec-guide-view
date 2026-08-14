import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const port = 5123;
const metadata = {
  metadata: {
    petname: process.env.DEV_NAMESPACE || "local-dev",
  },
};

const metadataServer = createServer((request, response) => {
  if (request.method !== "GET" || request.url !== "/metadata") {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(metadata));
});

metadataServer.listen(port, host, () => {
  console.log(
    `Development metadata server: http://localhost:${port}/metadata (${metadata.metadata.petname})`,
  );
});

const nextBin = fileURLToPath(
  new URL("./node_modules/next/dist/bin/next", import.meta.url),
);
const next = spawn(process.execPath, [nextBin, "dev"], {
  stdio: "inherit",
  env: process.env,
});

let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  metadataServer.close();
  if (!next.killed) next.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stop(signal));
}

next.on("exit", (code, signal) => {
  metadataServer.close(() => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
  });
});

next.on("error", (error) => {
  console.error("Unable to start the Next.js development server:", error);
  metadataServer.close(() => process.exit(1));
});
