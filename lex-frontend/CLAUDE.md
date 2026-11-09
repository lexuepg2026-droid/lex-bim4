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

## DEC-083 (reescrita para o front da Raniele) — o toast por tipo (fase R2)

O texto original está em `docs/CLAUDE-front-v1.md`. No front dela:

- `src/utils/toast.js`: `success`, `info` (a DEC-066: o tipo existe) e `error`,
  com a duração de cada um (3 s, 4 s e 6 s) e a **deduplicação** da mesma
  mensagem do mesmo tipo por 4 s. As funções puras (`duracaoDe`, `regiaoDe`,
  `deveEmitir`) são testadas em `tests/toast.test.js`.
- `src/components/ToastContainer/ToastContainer.jsx`: o contêiner fica **sempre
  montado**, com duas regiões vivas no DOM desde o início (`role="status"`
  para sucesso e info, `role="alert"` para erro); região criada junto com a
  mensagem não é anunciada. Cada aviso tem um fechar com `.buttonNoBorder` e o
  `fechar.svg` dela.
- Visual: as classes dela (`toastItem`, `toastItem--*`); o `info` usa
  `--verdeClaro` e `--bege`, que invertem sozinhos no tema claro. Nenhuma cor
  nova. O contêiner cabe em 360 px (`max-width: min(24rem, calc(100vw - 3rem))`).

## DEC-084 (reescrita para o front da Raniele) — o toast global de erro (fase R2)

O interceptor da advogada (`src/api/axiosConfig.js`) emite toast só para o que
**nenhuma tela sabe explicar**. A política é `deveExibirToastGlobal(erro,
config, online)`, em `src/api/toastGlobal.js`:

- **5xx**, **sem resposta com o navegador online** (back fora do ar) e **429**
  viram toast;
- **400, 403, 404, 409 e 422 ficam com a tela**, que sabe destacar o campo;
- **sem sinal**, a camada offline já explicou (escrita barrada, enfileirada,
  leitura do espelho): nada de toast;
- `semToastGlobal: true` no config do axios desliga o toast para quem mostra o
  erro de outro jeito.

A frase é a de `src/utils/apiError.js` (`getApiErrorMessage`): a tela que
também avisa usa a mesma frase, e a deduplicação deixa um aviso só.

**O 401** (sessão perdida) não vira toast na hora: o interceptor recarrega a
página para `/login` (`window.location`), e o toast morreria com ela. A mensagem
vai para o `sessionStorage` (`lex:aviso-sessao`) antes do redirecionamento, e o
`ToastContainer` a mostra ao montar, uma vez.

**Erro não vira lista vazia.** Toda lista com `EmptyState` o desenha só sem
erro (`!erro && <EmptyState …>`): Clientes, Processos, Honorários, Parcelas,
Pagamentos, Documentos, Modelos e Seções. Na Home, "Todas as parcelas estão em
dia" e "Sem dados mensais" só aparecem com a resposta na mão (com erro, a
mensagem; durante a carga, "Carregando..."). No detalhe do cliente, as abas
Processos e Pagamentos mostram o erro em vez de "nenhum". As cargas auxiliares
(opções de seletor, catálogo de variáveis) avisam o erro; ficam vazios, com o
motivo escrito, só a sugestão do próximo número da parcela, a marcação de
confirmações vistas e o sino. Travas em `tests/toast.test.js` e
`tests/listas.test.js`.

## DEC-170 — as larguras mínimas das telas públicas e do portal (fase R2)

A 360 px as telas públicas rolavam 24 px de lado e o portal deixava 150 px para
o texto (auditoria de paridade, C.1). A correção é a mínima, sem redesenho:

- **Telas públicas:** as cinco larguras fixas de 24 rem viraram
  `min(24rem, 100%)` (`Login.css`: `input.login`, `.buttonLogin`, `.erroLogin`,
  `.infoLogin`; `LayoutAutenticacao.css`: `.direitaAutenticacao a`). Acima de
  384 px nada muda.
- **Portal:** abaixo de 600 px, `.cardPortal` e `.cardPortal.cardPortalLargo`
  ocupam 100% com padding de 1,5 rem × 1 rem, e `.secaoPortal` fica com 1 rem
  (`Portal.css` e `ProcessoPortal.css`, cada arquivo com a `@media` das
  próprias classes, para a ordem do bundle não desfazer a regra);
  `.botoesDocumentoPortal` e `.acoesCabecalhoPortal` ganharam `flex-wrap`.

Conferido a 360, 390 e 412 px (capturas `C1-depois-*`).

## DEC-164 (reescrita para o front da Raniele) — "Precisa de atenção" com processo e cliente (fase R3)

O bloco "Parcelas que precisam de atenção" da Home (`Home.jsx`) dizia só o
honorário e "Parcela N" (apontamento 3 da banca). Agora:

- cada linha diz também **"processo · cliente"**, com o `processo` resumido que
  `GET /installments` já manda (título ou número, e `clientePrincipalNome`);
- **a linha inteira é um link** para o processo da parcela
  (`/processos/detalhes/:id`). O `<li className="homeItemParcelaUrgente">` fica
  (o `:last-child` e o hover dela continuam valendo) e o `Link` dentro dele
  herda o layout do item (`display`, direção e espaçamento com `inherit`),
  inclusive a coluna do celular. Sem cor nova; o foco é o anel `--bege70` dos
  outros links da Home.

## DEC-165 (reescrita para o front da Raniele) — o prazo por datas de calendário (fase R3)

O vencimento chega como meia-noite UTC, e a Home o lia no fuso do navegador:
em Brasília, a parcela de daqui a 2 dias saía "Vence amanhã" (reproduzido na
auditoria de paridade, A.8). `src/utils/datas.js` compara **datas de
calendário**: os dez primeiros caracteres do vencimento (`dataDeCalendario`)
contra o dia de hoje no relógio de quem olha (`hojeLocal`).

- `prazoDaParcela` devolve os textos da Raniele ("Venceu há N dias", "Venceu
  ontem", "Vence hoje", "Vence amanhã", "Vence em N dias");
- o recorte dos 7 dias usa a mesma conta (`venceAte`, `diaLocalDaquiA`);
- a causa 1 da DEC-165 original (só a primeira página) não existe aqui:
  `buscarTudo` baixa todas;
- a causa 3 (o status `vencido` só é gravado num recálculo do back) continua
  sendo regra do back e aguarda decisão.

Trava: `tests/datas.test.js`, que passa em qualquer fuso (conferido com
`America/Sao_Paulo`, `UTC` e `Asia/Tokyo`).

## DEC-052 (reescrita para o front da Raniele) — reativar sem adivinhar (fase R3)

- **Processo:** a prévia (`GET /processes/:id/activation-preview`) vem antes do
  modal, e a frase diz quantos participantes voltam (`utils/ativacaoProcesso.js`,
  dela). Já estava assim.
- **Cliente:** **não consulta prévia**, porque não cascateia; o modal diz que os
  processos dele não voltam junto. O modal dela já fazia isso (a auditoria de
  paridade, A.7 item 2, tinha apontado falta por engano).
- **Compromisso (novo):** a Agenda tem o seletor "Somente ativos" / "Somente
  desativados". Os desativados vêm de `GET /events?situacao=inativos`,
  recortados ao período na tela, e o popup deles troca Editar e Excluir por
  "Reativar" (`PATCH /events/:id/reactivate`, com `.buttonOutlined
  .botaoReativar`, o mesmo das listas). O 409 do processo desativado aparece com
  a frase do back (DEC-053).
- **O filtro de situação** manda `inativos`, o valor que o back aceita, em
  Processos, Clientes e na Agenda; a trava de contrato confere os três.

Trava: `tests/reativacao.test.js`.

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

### Fase R2 — o que engana na demonstração (09/11/2026)

- 360 px nas telas públicas e no portal (DEC-170).
- Toast por tipo e toast global de erro (DEC-083 e DEC-084 reescritas); o
  aviso do 401 sobrevive ao recarregamento.
- Erro do back não vira lista vazia (oito listas, Home, detalhe do cliente);
  as cargas auxiliares que engoliam o erro passam a avisar.
- Só a resposta da busca mais recente vale (Clientes, Processos, Honorários,
  Parcelas, Pagamentos); a busca de Clientes e Processos não perde o foco.
- `useIsMounted` em TextoFinal e MontagemModelo (resposta tardia).
- "Honorários em aberto" na Home (DEC-069).
- Testes novos: `toast.test.js`, `listas.test.js`, `guardas.test.js`.

### Fase R3 — "Precisa de atenção" e reativação (09/11/2026)

- `utils/datas.js`: o prazo e o recorte dos 7 dias por datas de calendário
  (DEC-165); a linha com "processo · cliente" e como link (DEC-164).
- Reativação de compromisso na Agenda (DEC-052); o cliente já estava certo.
- Testes novos: `datas.test.js`, `reativacao.test.js`; a trava de contrato
  confere o seletor da Agenda.

### O que fica para a sessão 2

- O resto do Bloco A da paridade: aba "Financeiro" do cliente (renomeia a aba
  "Pagamentos" quando ganhar as listas, DEC-167), gerações do reparcelamento e
  "Parcela N de M" (DEC-048, DEC-051), pré-visualização da seção, régua de hoje
  na linha do tempo (DEC-056), conferir a DEC-044 no extrato.
- O login a 360 px, que continua em duas colunas (o formulário fica com cerca
  de 170 px); é o desenho dela, fora da correção mínima da R2.
- As guardas restantes (`regeneration.js`, `useSerialQueue`), os testes do grupo
  (a), a acessibilidade, o lint e o restante do `CLAUDE.md` (seção B.4 da
  paridade).
- Pendente fora do código: a troca dos segredos (senha do banco e os dois JWT),
  em `relatorios/RENDER-TROCA-PARA-LEX-BIM4.md`, seção "Pendente".
