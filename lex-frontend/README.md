# LEX — Front-end

Sistema de gestão para advogadas autônomas: processos, clientes, financeiro, calendário, documentos e um portal para os clientes acompanharem seus próprios processos.

Front-end em React (Vite), consumindo uma API REST própria (repositório separado, `LEX-back`).

## Stack

- **React 19** + **React Router 7**
- **Vite** (build e dev server)
- **PWA** com service worker próprio (`public/sw.js`) e manifesto (`public/manifest.webmanifest`): o app é instalável e abre sem conexão
- **Axios** para chamadas HTTP
- CSS puro, organizado por página/componente, com variáveis globais de cor em `src/styles/global.css` — sem framework de utilitários (o Tailwind está no `package.json` mas não é usado no projeto atual)

## Pré-requisitos

- Node.js 20.19 ou superior (ou 22.13+)
- O backend (`LEX-back`) rodando — veja o repositório dele para instruções

## Rodando localmente

```bash
npm install
npm run dev
```

O app sobe em `http://localhost:5173` (padrão do Vite) e por padrão aponta para uma API em `http://localhost:3001/api`.

Se o seu backend estiver em outro endereço, crie um arquivo `.env` na raiz:

```
VITE_API_URL=http://localhost:3001/api
```

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento com hot reload |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve localmente o build de produção, pra conferir antes de publicar |
| `npm run lint` | Roda o ESLint no projeto |
| `npm test` | Roda os testes das regras puras (offline, fila, máscaras, honorários) com o `node --test` |

## Estrutura de pastas

```
src/
├── api/            # configuração do axios (advogada e portal do cliente)
├── assets/         # ícones e imagens
├── components/     # componentes reutilizáveis (Header, Modal, Notificações...)
├── contexts/       # autenticação (advogada e cliente) e fila de alterações offline
├── hooks/          # hooks reutilizáveis (status de conexão, filtros na URL, rolagem infinita)
├── layouts/        # layouts de cada área (pública, advogada, portal do cliente)
├── offline/        # cache de leitura no IndexedDB e fila de alterações feitas sem conexão
├── pages/
│   ├── AreaPublica/      # login, cadastro, recuperação de senha
│   ├── PortalAdvogada/   # tudo que a advogada usa logada
│   │   ├── Home/
│   │   ├── Processos/
│   │   ├── Clientes/
│   │   ├── Calendario/
│   │   ├── Financeiro/
│   │   ├── Documentos/   # seções, modelos e documentos gerados
│   │   ├── Pendencias/   # alterações feitas sem conexão aguardando envio
│   │   └── Perfil/       # Configurações
│   └── PortalClientes/   # área que o cliente do escritório acessa
├── routes/         # definição de todas as rotas
├── services/       # uma função por chamada à API, por recurso (feeService, paymentService...)
├── styles/         # CSS global (cores, botões, inputs, seletor)
└── utils/          # formatação, máscaras, tratamento de erro da API, etc.
```

## Áreas do sistema

**Pública** (`/`, `/login`, `/cadastrar`, `/senha/reset`, `/senha/redefinir`)
Cadastro e login da advogada, recuperação de senha por e-mail.

**Portal da advogada** (logada, `/home` em diante)
- **Processos** — cadastro, participantes (clientes vinculados), linha do tempo, aba financeira do processo
- **Clientes** — pessoa física/jurídica, detalhes, processos e pagamentos vinculados
- **Calendário** — visão mensal de compromissos e vencimentos, com busca e detalhes por evento
- **Financeiro** — resumo do escritório, honorários, parcelas e pagamentos (com alocação automática, estorno e recibo)
- **Pendências** (`/pendencias`) — alterações feitas sem conexão que ainda não chegaram ao servidor, com opção de reenviar, descartar ou resolver conflito
- **Documentos** — biblioteca de seções reutilizáveis, modelos de documento e os documentos já gerados para cada processo
- **Configurações** — dados da advogada, dados do escritório (inclusive logo, usada nos PDFs gerados) e troca de senha

**Portal do cliente** (`/portal`)
Área separada, com login próprio, onde o cliente do escritório acompanha o processo dele e os documentos liberados pra ele.

## Sobre o backend

Este repositório é só o front-end. A API (`LEX-back`) é um projeto Node.js/Express + MongoDB separado — sem ele rodando, o app carrega mas nenhuma tela com dados funciona.
## Uso sem conexão

- Toda tela da advogada aberta com sinal fica guardada no aparelho (IndexedDB, separada por usuária, até 5 MB). Sem sinal, essas telas abrem com os dados guardados e um aviso mostra de quando eles são.
- Sem sinal, só quatro alterações são aceitas: criar, editar e concluir compromisso da agenda e mudar a fase do processo. Elas vão para uma fila e são enviadas sozinhas quando a conexão volta, com uma chave de idempotência (não duplicam) e a versão vista do registro (se alguém mudou no meio tempo, a alteração para em Pendências para você decidir).
- Qualquer outra alteração sem sinal é recusada com uma mensagem clara.
- Ao sair da conta, o cache e a fila daquele aparelho são apagados. Se houver alteração ainda não enviada, o app avisa antes.
- O service worker guarda só o app (HTML, JS, CSS, ícones), nunca respostas da API. Recarregar a página sem conexão abre o app, mas a sessão precisa do servidor para ser confirmada, então ele volta para o login.
- Para testar: DevTools → Network → Offline. O service worker só é registrado no build de produção (`npm run build && npm run preview`).

## Deploy (Render)

O `render.yaml` publica o front como site estático:

1. No Render, crie um Blueprint apontando para este repositório.
2. Antes, troque `ENDERECO-DO-SEU-BACKEND` no `render.yaml` pelo endereço do serviço do `LEX-back`.
3. O build usa `VITE_API_URL=/api`: o próprio Render repassa `/api/*` para o backend, então os cookies de sessão ficam no mesmo domínio do app. No backend, coloque o endereço do front em `CORS_ORIGIN`.
4. Todas as outras rotas caem no `index.html` (necessário para o React Router) e o `sw.js` é servido sem cache, para que atualizações cheguem logo.
