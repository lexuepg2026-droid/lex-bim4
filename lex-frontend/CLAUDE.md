# CLAUDE.md — LEX Frontend (base: front da Raniele v2)

Interface do LEX, PWA de gestão para advocacia autônoma (TCC, UEPG). Desde a
fase R1 (09/11/2026) a base é o front da Raniele (DEC-168). O front anterior
está na tag `front-lex-v1`, e o `CLAUDE.md` dele, sem mudanças, em
`docs/CLAUDE-front-v1.md`: as DECs antigas (até a 167) continuam buscáveis ali.

## Stack

- React 19, react-router 7, axios;
- Vite 8 (rolldown), Tailwind 4 (`@tailwindcss/vite`), ESLint 10;
- Node `>=20.19.0 <23` (`engines`);
- testes com `node --test` (`npm test`), em `tests/`; a trava de contrato lê
  `../lex-backend/`, por isso o front fica ao lado do back no monorepo.

Estrutura de pastas da Raniele: `src/pages/PortalAdvogada/…`,
`src/pages/PortalClientes/…`, `src/pages/AreaPublica/…`, `src/services/` (as
chamadas à API), `src/components/`, `src/layouts/`, `src/offline/` (a camada
offline trazida do front LEX), `src/styles/global.css` (os tokens).

## O princípio da interface preservada

A interface da Raniele é preservada. Isso quer dizer:

- **Não mudar o que não for necessário.** Ficam como estão: o layout, a
  organização das páginas, a navegação, os componentes, as classes, os tokens,
  os ícones, os textos e as ferramentas dela (Tailwind, Vite 8, ESLint 10).
- **O que precisar ser acrescentado entra no estilo dela.**
  - Reaproveite os componentes dela: `Modal`, `StatusBadge`, `EmptyState`,
    `ToastContainer`, `ContextoDoProcesso` e os botões de `styles/buttons.css`.
  - Reaproveite as classes dela e os tokens de `styles/global.css`.
  - Não use nenhuma cor nova.
- **O código do front LEX entra só como fonte de lógica:** regras, guardas e
  funções puras. Nunca como fonte de visual.
- **Correção de tela é a mínima.**

## DEC-168 — o front da Raniele passa a ser a base oficial (fase R1, 09/11/2026)

**Decisão do Daniel.** O vídeo de demonstração e o sistema em produção usam o
layout e a organização da Raniele, então o front dela (v2) passou a ser o
`lex-frontend/` do monorepo `lex-bim4`.

- **O que entrou:** o front dela inteiro, a partir da cópia normalizada para LF
  da auditoria, num commit só e explícito. Sem `node_modules`, `dist`, `.git`,
  `.env` e sem o `render.yaml` dela (o deploy é o da raiz).
- **O que ficou preservado:** o front LEX, na tag `front-lex-v1`; o `CLAUDE.md`
  dele em `docs/CLAUDE-front-v1.md`.
- **O que vem do front LEX como lógica:** a camada offline e a fila (já
  portadas por ela), e, nas fases seguintes, as guardas da regeração, as regras
  de prazo e as funções puras listadas no relatório de paridade.
- **O back não mudou:** é o `main` do `LEX-back` (`dc324da`).
- **Por que não o contrário** (a pele dela sobre o nosso código, como nas fases
  1 a 3.10): a v2 dela já era um front completo contra o nosso back (as 104
  chamadas batem, os fluxos passam), e a interface é o que a banca e o vídeo
  veem. O custo aceito: os 1.986 testes do front LEX não vêm junto; a meta é a
  trava de contrato, o deploy, o contraste e um teste por recurso trazido.
- **Auditorias:** `relatorios/AUDITORIA-RANIELE-V2.md` e
  `relatorios/PARIDADE-FRONT-RANIELE.md`.

## DEC-169 — os gráficos da Home ficam; a DEC-161 está revogada (fase R1)

**Decisão do Daniel.** A DEC-161 tirou os gráficos do Início do front LEX. A
Home da Raniele tem os dela ("Honorários contratados por mês" e "Distribuição
por status", em SVG, sem biblioteca), e pelo princípio da interface preservada
eles ficam. As rotas `GET /dashboard/honorarios-por-mes` e
`GET /dashboard/status`, que só ela usa, continuam no back.

## DEC-061 (reescrita para o monorepo) — dois serviços, uma origem só

O texto original está em `docs/CLAUDE-front-v1.md`. O que muda no `lex-bim4`:

- **Um `render.yaml` na raiz**, com os dois serviços e o `rootDir` de cada um:
  `lex-uepg-api` (`rootDir: lex-backend`, `npm ci`, `npm start`) e
  `lex-uepg-app` (`rootDir: lex-frontend`, `npm ci && npm run build`,
  `staticPublishPath: ./dist`, relativo ao `rootDir`).
- **O front chama `/api` na mesma origem** (`VITE_API_URL=/api`, lido em
  `src/api/baseURL.js`; o `.env.production.example` traz esse valor). O static
  site reescreve `/api/*` para `https://lex-uepg-api.onrender.com/api/*` e, em
  seguida, `/*` para `/index.html` (a SPA). **A ordem é a regra**: invertidas,
  toda chamada de API volta como o HTML do app. **Rewrite, nunca Redirect.**
- **O cookie só funciona por causa disso.** Em produção o `lex-token` é
  `httpOnly`, `secure` e `sameSite: "strict"`
  (`lex-backend/src/controllers/authController.js`). Com o rewrite o navegador
  vê uma origem só. Trocar o `VITE_API_URL` pela URL absoluta do back quebra a
  sessão sem erro no build: dois subdomínios de `onrender.com` são sites
  diferentes, e o cookie `strict` deixa de ir.
- **Variáveis só com nome** no `render.yaml` (`sync: false`); os valores ficam
  no painel. O back lê `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`,
  `JWT_PORTAL_SECRET`, `CORS_ORIGIN`, `APP_URL` (a base dos links dos e-mails;
  sem ela, em produção, os links saem sem endereço) e as quatro de e-mail.
- **Travas:** `tests/infra/deploy.test.js` (o modelo de produção com `/api`, a
  guarda do build, nenhum `localhost:porta` no `dist/`, o teto do Node e o
  `render.yaml` da raiz) e `tests/contrato.test.js` (rotas, enumerações e os
  valores dos filtros).

## Registro de sessões

### Fase R1 — monorepo, adoção e deploy (09/11/2026)

- `lex-bim4` montado com `git subtree` (histórico inteiro dos dois
  repositórios), tag `front-lex-v1`, troca do front num commit só.
- `render.yaml` na raiz; teto no `engines.node`; modelo de produção com `/api`.
- `situacao=desativados` → `inativos` em Processos e Clientes (o filtro
  "Somente desativados" devolvia 400).
- Testes: trava de contrato (nova), deploy (adaptado), e `moeda`,
  `percentualVetores`, `offline/fila` e `offline/idade` trazidos sem mudança.
- Próximo passo: fase R2 (o que engana na demonstração).
