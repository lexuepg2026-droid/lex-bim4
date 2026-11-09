# CLAUDE.md — LEX (monorepo)

Este repositório tem duas pastas, cada uma com o seu `CLAUDE.md`:

- `lex-backend/CLAUDE.md` — o back: contrato, regras de negócio e as DECs do back;
- `lex-frontend/CLAUDE.md` — o front: as regras de tela e as DECs do front.

A numeração de DECs é única entre os dois lados.

Regras do monorepo:

- o repositório é **público**: nenhum `.env` e nenhum segredo entra nele;
- os testes do front leem `../lex-backend/`; as duas pastas ficam lado a lado;
- o deploy está em `render.yaml`, na raiz.
