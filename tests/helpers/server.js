let httpServer;
let baseUrl;

export async function startServer() {
  process.env.NODE_ENV = "test";
  const mod = await import("../../server/index.js");
  httpServer = mod.httpServer;

  return new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, () => {
      httpServer.removeListener("error", reject);
      const { port } = httpServer.address();
      baseUrl = `http://localhost:${port}`;
      resolve(baseUrl);
    });
  });
}

export async function stopServer() {
  if (!httpServer) return;
  return new Promise((resolve) => {
    httpServer.closeAllConnections?.();
    httpServer.close(() => resolve());
  });
}

export function getBaseUrl() {
  return baseUrl;
}
