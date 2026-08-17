import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const port = 5123;
const metadata = {
  dep_id: process.env.DEV_DEP_ID || "a0768d25-ff37-4146-93a7-4f07ca3e1a86",
  email: process.env.DEV_EMAIL || "local@local.tld",
  lab_id: process.env.DEV_LAB_ID || "d4e9e425",
  petname: process.env.DEV_NAMESPACE || "helped-quagga",
};

const deployment = {
  deployment: {
    id: metadata.dep_id,
    components: [
      {
        name: "Arcadia Crypto - Cluster",
        accessMethods: {
          https: [
            {
              host: "origin-1.example.test",
              port: 443,
              internalIp: "10.1.1.7",
              internalPort: 5001,
              parameters: { unauthenticated: true, ssl: false },
              label: "Arcadia Origin Pool 1",
            },
            {
              host: "origin-2.example.test",
              port: 443,
              internalIp: "10.1.1.7",
              internalPort: 5002,
              parameters: { unauthenticated: true, ssl: false },
              label: "Arcadia Origin Pool 2",
            },
            {
              host: "origin-3.example.test",
              port: 443,
              internalIp: "10.1.1.7",
              internalPort: 5003,
              parameters: { unauthenticated: true, ssl: false },
              label: "Arcadia Origin Pool 3",
            },
          ],
        },
      },
    ],
  },
};

const metadataServer = createServer((request, response) => {
  const bodies = { "/metadata": metadata, "/deployment": deployment };
  const body = bodies[request.url];
  if (request.method !== "GET" || !body) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  response.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(body));
});

metadataServer.listen(port, host, () => {
  console.log(
    `Development metadata server: http://localhost:${port}/metadata and /deployment (${metadata.petname})`,
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
