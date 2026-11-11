const fetchOriginal = globalThis.fetch;
const allowed = new Set(["translationsretirementqa", "translationsretirementunitqa"]);
globalThis.fetch = function (input, init) {
  const headers = new Headers(
    init?.headers || (input instanceof Request ? input.headers : undefined),
  );
  const connection = headers.get("Neon-Connection-String");
  if (connection) {
    const u = new URL(connection),
      name = u.pathname.slice(1);
    if (!allowed.has(name) || u.hostname !== name + ".local" || u.username !== name)
      throw Error("QA database guard");
    return fetchOriginal("http://127.0.0.1:4558/sql", { ...init, headers });
  }
  return fetchOriginal(input, init);
};
