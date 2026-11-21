const originalFetch = globalThis.fetch;
globalThis.fetch = function (input, init) {
  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  const connection = headers.get("Neon-Connection-String");
  if (connection) {
    const url = new URL(connection);
    if (url.hostname !== "legalpagesqa20261121.local" || url.pathname !== "/legalpagesqa20261121" || url.username !== "legalpagesqa20261121")
      throw new Error("Legal Pages QA database guard");
    return originalFetch("http://127.0.0.1:4558/sql", { ...init, headers });
  }
  return originalFetch(input, init);
};
