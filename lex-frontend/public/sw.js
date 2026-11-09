const VERSAO = "projeto-v1";
const CACHE = `${VERSAO}-shell`;

const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icone-192.png", "/icone-512.png"];

const assetsDoHtml = (html) => {
  const encontrados = new Set();
  const regex = /(?:href|src)\s*=\s*["'](\/assets\/[^"']+)["']/g;
  let m;
  while ((m = regex.exec(html)) !== null) encontrados.add(m[1]);
  return [...encontrados];
};

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      await cache.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })));

      const resposta = await fetch("/index.html", { cache: "reload" }).catch(() => null);
      if (resposta?.ok) {
        const assets = assetsDoHtml(await resposta.text());
        await Promise.allSettled(assets.map((u) => cache.add(new Request(u, { cache: "reload" }))));
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

const ehNavegacao = (req) =>
  req.mode === "navigate" ||
  (req.method === "GET" && (req.headers.get("accept") || "").includes("text/html"));

const ehAssetImutavel = (url) => url.pathname.startsWith("/assets/");

self.addEventListener("fetch", (evento) => {
  const req = evento.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) return;

  if (ehAssetImutavel(url)) {
    evento.respondWith(
      (async () => {
        const cacheado = await caches.match(req);
        if (cacheado) return cacheado;

        const resposta = await fetch(req);
        if (resposta.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, resposta.clone());
        }
        return resposta;
      })()
    );
    return;
  }

  if (ehNavegacao(req)) {
    evento.respondWith(
      (async () => {
        try {
          const resposta = await fetch(req);
          if (resposta.ok) {
            const cache = await caches.open(CACHE);
            cache.put("/index.html", resposta.clone());
          }
          return resposta;
        } catch {
          const cacheado = (await caches.match("/index.html")) || (await caches.match("/"));
          if (cacheado) return cacheado;
          return new Response("Sem conexão e sem cópia local.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        }
      })()
    );
    return;
  }

  evento.respondWith(
    (async () => {
      try {
        const resposta = await fetch(req);
        if (resposta.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, resposta.clone());
        }
        return resposta;
      } catch {
        const cacheado = await caches.match(req);
        if (cacheado) return cacheado;
        throw new Error("recurso indisponível offline");
      }
    })()
  );
});
