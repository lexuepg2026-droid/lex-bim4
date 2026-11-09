# LEX — gestão para advocacia autônoma

PWA de gestão para advogada autônoma (TCC, UEPG). Este repositório reúne os dois lados do sistema:

- **`lex-backend/`** — API em Node.js, Express e MongoDB (Mongoose). Ver `lex-backend/README.md`.
- **`lex-frontend/`** — interface em React e Vite. Ver `lex-frontend/README.md`.

O histórico dos repositórios anteriores (`LEX-back` e `LEX-front`) foi trazido inteiro, com `git subtree`.

## Rodar localmente

```bash
# back (porta 3001)
cd lex-backend && cp .env.example .env   # preencha os valores
npm ci && npm run dev

# front (porta 5173)
cd lex-frontend && cp .env.example .env
npm ci && npm run dev
```

Os testes do front leem `../lex-backend/`, por isso as duas pastas ficam lado a lado.

## Deploy

`render.yaml` na raiz declara os dois serviços do Render, cada um com o seu `rootDir`.
