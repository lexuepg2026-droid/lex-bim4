// Os textos da ajuda ao usuário (DEC-172), num lugar só.
//
// São conteúdo do Daniel: entram no main só depois de aprovados (fase R5). Toda
// frase que descreve uma regra do sistema foi conferida no código do back; o
// arquivo e a linha de cada uma estão em relatorios/AJUDA-TEXTOS.md.
//
// Cada balão tem até 3 frases. `assunto` vai para o aria-label do botão
// ("Ajuda: <assunto>").

export const AJUDA = {
    // ── Processos ───────────────────────────────────────────────────────────
    processoStatus: {
        assunto: "status do processo",
        texto: "O status diz se o processo está ativo, suspenso ou encerrado. A fase diz em que etapa ele está e é salva à parte, mais abaixo, ficando registrada na linha do tempo. Um processo encerrado continua com a última fase em que parou.",
    },
    processoFase: {
        assunto: "fase do processo",
        texto: "Conhecimento, sentença, execução ou recursos. Cada mudança fica na linha do tempo, com o motivo, se você escrever um. Sem internet, a mudança fica guardada e é enviada sozinha quando o sinal voltar.",
    },
    processoLiminar: {
        assunto: "liminar",
        texto: "Marque quando o processo tiver pedido de liminar. A liminar não é uma fase: o processo continua na fase em que está. A observação e a data são opcionais.",
    },
    processoTipoAcao: {
        assunto: "tipo de ação",
        texto: "A lista de processos agrupa pelo texto exato do tipo de ação. Escreva sempre do mesmo jeito: \"Ação de cobrança\" e \"Ação de Cobrança\" viram dois grupos. Sem tipo, o processo fica em \"Sem tipo definido\".",
    },
    processoParticipantes: {
        assunto: "participantes e portal",
        texto: "São os clientes deste processo, cada um com o seu papel. O botão liga e desliga o processo no portal para aquele cliente: ligado, ele vê o processo e os documentos marcados como visíveis; desligado, deixa de ver na próxima tela que abrir. Remover um participante tira só o vínculo, e o cadastro do cliente continua.",
    },
    processoFinanceiro: {
        assunto: "financeiro do processo",
        texto: "Cada honorário tem as suas parcelas e os seus pagamentos. O status do honorário muda sozinho conforme as parcelas são pagas. Nada do financeiro aparece no portal do cliente.",
    },
    processosDesativar: {
        assunto: "desativar e reativar processos",
        texto: "Desativar um processo tira junto os vínculos com os clientes dele. Reativar devolve só os vínculos que saíram nessa desativação, e não reativa o cliente. Se o cliente principal estiver desativado, o sistema diz qual é, e ele precisa ser reativado antes.",
    },

    // ── Financeiro ──────────────────────────────────────────────────────────
    honorarioNovo: {
        assunto: "honorário e parcelas",
        texto: "O honorário é o valor combinado. As parcelas são lançadas depois, uma a uma, em \"+ Nova parcela\". Sem parcelas, o pagamento recebido fica como saldo adiantado e quita as parcelas criadas depois.",
    },
    honorarioTipo: {
        assunto: "tipo de honorário",
        texto: "Fixo: um valor em reais. Percentual: o sistema calcula o valor pelo percentual sobre o valor base, arredondado em centavos. Custas: despesas do processo cobradas do cliente.",
    },
    parcelaVencimento: {
        assunto: "vencimento da parcela",
        texto: "Passado o dia do vencimento sem pagamento, a parcela aparece como vencida. Se recebeu só uma parte, ela aparece como parcial, mesmo depois do vencimento. Ao ser criada, a parcela já usa o saldo adiantado do honorário, se houver.",
    },
    pagamentoDistribuicao: {
        assunto: "como o pagamento é distribuído",
        texto: "O valor quita as parcelas em aberto da mais antiga para a mais nova, pelo vencimento. O que sobrar vira saldo adiantado do honorário. A prévia usa a mesma conta da gravação, então mostra exatamente o que vai acontecer.",
    },
    reparcelar: {
        assunto: "reparcelamento",
        texto: "As parcelas em aberto são canceladas e trocadas pelas novas, que precisam somar exatamente o valor em aberto. As parcelas pagas não mudam, e o que já entrou numa parcela parcial continua registrado nela.",
    },
    estorno: {
        assunto: "estorno",
        texto: "O estorno devolve parte ou todo o valor e tira esse dinheiro das parcelas, começando pela de vencimento mais novo. Nada é apagado: o pagamento e o estorno ficam no extrato. Para desfazer, use \"Anular\", na lista de estornos do pagamento.",
    },
    anularEstorno: {
        assunto: "anular estorno",
        texto: "Anular faz o valor voltar a contar como pago. Ele procura parcelas de novo, da mais antiga para a mais nova, e não necessariamente as mesmas de antes. O estorno e a anulação continuam no extrato.",
    },
    extrato: {
        assunto: "extrato",
        texto: "É a história do dinheiro deste honorário, em ordem de data: pagamentos, estornos, para qual parcela cada valor foi, reparcelamentos e mudanças de status. O que deixou de valer aparece marcado, sem ser apagado.",
    },

    // ── Clientes ────────────────────────────────────────────────────────────
    clienteTipoPessoa: {
        assunto: "pessoa física ou jurídica",
        texto: "Pessoa física usa nome e CPF; pessoa jurídica usa razão social, CNPJ e o representante legal. O tipo decide quais variáveis os documentos conseguem preencher para este cliente.",
    },
    clienteSenhaPortal: {
        assunto: "senha provisória e código pessoal",
        texto: "A senha que você define é provisória: no primeiro acesso, o portal pede que o cliente crie uma só dele. Junto com a senha nasce o código pessoal (LEX-…), que é o login do cliente e serve para todos os processos dele.",
    },
    clienteRevogar: {
        assunto: "revogar o acesso ao portal",
        texto: "Revogar apaga a senha, e o cliente não consegue mais entrar. O código pessoal continua reservado e volta a valer se você der uma senha nova.",
    },
    clientePortal: {
        assunto: "portal do cliente",
        texto: "Aqui ficam o código pessoal e a situação da senha. O cliente vê no portal só os processos ligados para ele, que você liga e desliga em cada processo.",
    },
    clientesDesativar: {
        assunto: "desativar e reativar clientes",
        texto: "Só dá para desativar um cliente que não participa de nenhum processo ativo; desvincule-o dos processos antes, sem precisar desativá-los. Reativar o cliente não reativa processos, e reativar um processo não reativa o cliente.",
    },

    // ── Documentos ──────────────────────────────────────────────────────────
    modelos: {
        assunto: "modelo e documento",
        texto: "O modelo é o texto-base, montado com seções. O documento é o que sai quando você gera um modelo para um processo e um cliente, com as variáveis preenchidas. Mudar o modelo depois não muda os documentos já gerados.",
    },
    secoes: {
        assunto: "seções e variáveis",
        texto: "Seções são trechos reutilizáveis, como uma cláusula ou a qualificação. As variáveis, entre chaves duplas como {{nomeCliente}}, são trocadas na hora de gerar pelos dados do processo, do cliente, do honorário ou do seu perfil.",
    },
    secaoVariaveis: {
        assunto: "variáveis no texto",
        texto: "A seção guarda o texto com as chaves; os dados entram só na hora de gerar. Mudar uma seção não muda os documentos já gerados, só os que você gerar ou regerar depois. Uma seção usada em algum documento não pode ser excluída.",
    },
    gerar: {
        assunto: "gerar documento",
        texto: "O processo e o cliente escolhidos preenchem as variáveis. Se faltar algum dado, o documento não é gerado, e a lista diz o que completar. O documento novo nasce fora do portal.",
    },
    textoFinal: {
        assunto: "texto final",
        texto: "É o texto do documento com os dados já preenchidos, e você pode editar à mão. As lacunas, como linhas para preencher, aparecem na lista para você achar no texto. Editar aqui não muda o modelo.",
    },
    regerar: {
        assunto: "regerar",
        texto: "Regerar cria o documento de novo, com as seções e os dados de hoje. Se este texto foi editado à mão, o sistema pede confirmação e, confirmando, substitui o anterior, que fica guardado. O documento regerado nasce fora do portal, mesmo que o anterior estivesse visível.",
    },
    visivelPortal: {
        assunto: "visível no portal",
        texto: "Liberado, o cliente para quem o documento foi gerado vê e baixa o arquivo no portal, desde que o processo esteja ligado no portal para ele. Todo documento novo nasce fora do portal.",
    },

    // ── Agenda ──────────────────────────────────────────────────────────────
    agendaCores: {
        assunto: "cores da agenda",
        texto: "Verde: compromissos que você cadastrou, como audiência, prazo e reunião. Azul: vencimentos de parcelas e honorários, que aparecem sozinhos e só mudam no financeiro. Riscado: compromisso concluído ou parcela paga.",
    },
    agendaSituacao: {
        assunto: "compromissos desativados",
        texto: "\"Somente desativados\" mostra os compromissos excluídos. Abra um deles e use \"Reativar\" para trazê-lo de volta. O compromisso de um processo desativado só volta depois que o processo voltar.",
    },
    agendaProcesso: {
        assunto: "processo do compromisso",
        texto: "Ligar o compromisso a um processo é opcional. Sem internet, o compromisso fica guardado neste aparelho e é enviado sozinho quando o sinal voltar.",
    },

    // ── Início ──────────────────────────────────────────────────────────────
    inicioResumo: {
        assunto: "o que cada cartão soma",
        texto: "Processos ativos conta os de status ativo; honorários em aberto, os pendentes e os parcialmente pagos. Parcelas vencidas são as que passaram do vencimento sem pagamento. Confirmações novas são leituras do portal que você ainda não viu.",
    },
    inicioAtencao: {
        assunto: "precisa de atenção",
        texto: "As parcelas vencidas e as que vencem nos próximos 7 dias, contados por data. Cada linha leva ao processo da parcela.",
    },

    // ── Pendências ──────────────────────────────────────────────────────────
    pendencias: {
        assunto: "fila sem internet",
        texto: "A fila guarda compromissos da agenda e mudanças de fase feitos sem internet neste aparelho. Ela é enviada sozinha, na ordem, quando o sinal volta. Se alguém mudou o mesmo registro em outro aparelho, você escolhe qual versão fica.",
    },

    // ── Portal do cliente ───────────────────────────────────────────────────
    portalCodigo: {
        assunto: "código de acesso",
        texto: "O código pessoal (LEX-…) é enviado pelo escritório e vale para todos os seus processos. No primeiro acesso, use a senha que o escritório passou: o portal vai pedir que você crie uma senha só sua.",
    },
    portalConfirmar: {
        assunto: "confirmar leitura",
        texto: "Confirmar registra que você viu as informações e os documentos deste processo, com a data e a hora. Cada confirmação fica guardada, e você pode confirmar de novo quando houver novidade.",
    },

    // ── Perfil ──────────────────────────────────────────────────────────────
    timbrado: {
        assunto: "timbrado",
        texto: "O timbrado é o cabeçalho e o rodapé dos documentos e recibos: o logo, se houver, a advocacia, o seu nome com a OAB, o endereço, o telefone e o e-mail. Ele é montado com os dados salvos nesta tela; salve antes de ver o exemplo.",
    },
};

// Textos de apoio embaixo de campos (uma linha, ligados por aria-describedby).
export const APOIO = {
    pagamentoData: "O dia em que o dinheiro entrou: é ele que conta no recebido do mês e sai no recibo.",
};

// A página "Como usar", em Configurações: uma seção por fluxo.
export const COMO_USAR = [
    {
        titulo: "Clientes e portal",
        linhas: [
            "Cadastre o cliente como pessoa física ou jurídica; o tipo decide quais variáveis os documentos conseguem preencher.",
            "Para dar acesso ao portal, defina uma senha provisória no cadastro. Junto nasce o código pessoal (LEX-…), que é o login do cliente.",
            "No primeiro acesso, o portal pede que o cliente crie uma senha só dele.",
            "O cliente vê só os processos que você liga no portal, em cada processo, na aba Participantes.",
            "Revogar o acesso apaga a senha; o código continua reservado e volta a valer com uma senha nova.",
            "Um cliente só pode ser desativado se não participar de nenhum processo ativo. Reativar não traz os processos de volta.",
        ],
    },
    {
        titulo: "Processos",
        linhas: [
            "O status diz se o processo está ativo, suspenso ou encerrado; a fase diz em que etapa ele está.",
            "A fase é salva à parte, no formulário de edição, e cada mudança fica na linha do tempo.",
            "Liminar não é fase: é uma marcação ao lado dela, com observação e data opcionais.",
            "Na aba Participantes ficam os clientes, o papel de cada um e o botão do portal.",
            "Desativar um processo tira junto os vínculos dele; reativar devolve só esses vínculos e não reativa o cliente.",
        ],
    },
    {
        titulo: "Financeiro",
        linhas: [
            "O honorário é o valor combinado: fixo, percentual (calculado sobre um valor base) ou custas.",
            "As parcelas são lançadas uma a uma. Passado o vencimento sem pagamento, a parcela fica vencida; com pagamento de uma parte, fica parcial.",
            "O pagamento quita as parcelas em aberto da mais antiga para a mais nova. O que sobra vira saldo adiantado e quita as próximas parcelas criadas.",
            "Antes de salvar um pagamento, a prévia mostra quais parcelas ele vai quitar.",
            "Reparcelar troca as parcelas em aberto por novas com a mesma soma. As pagas não mudam.",
            "O estorno devolve parte ou todo um pagamento, começando pela parcela mais nova. A anulação desfaz o estorno.",
            "O extrato mostra tudo em ordem de data, e nada é apagado.",
        ],
    },
    {
        titulo: "Documentos",
        linhas: [
            "Seções são trechos reutilizáveis de texto, com variáveis entre chaves duplas, como {{nomeCliente}}.",
            "O modelo junta seções numa ordem. Gerar o modelo para um processo e um cliente cria o documento, com as variáveis preenchidas.",
            "Se faltar algum dado, o documento não é gerado, e a tela diz o que completar.",
            "O texto final pode ser editado à mão; editar o documento não muda o modelo.",
            "Regerar refaz o texto com os dados de hoje. Se o documento foi editado à mão, o sistema pede confirmação antes de substituir.",
            "Todo documento novo nasce fora do portal. Use \"Liberar no portal\" no documento para o cliente ver.",
        ],
    },
    {
        titulo: "Agenda",
        linhas: [
            "Em verde ficam os compromissos que você cadastra: audiência, prazo, reunião ou outro.",
            "Em azul aparecem sozinhos os vencimentos de parcelas e honorários; eles mudam só no financeiro.",
            "Compromisso concluído e parcela paga aparecem riscados.",
            "Ligar um compromisso a um processo é opcional.",
            "Compromissos excluídos ficam em \"Somente desativados\", onde podem ser reativados.",
        ],
    },
    {
        titulo: "Sem internet",
        linhas: [
            "Sem conexão, você consulta as telas já abertas neste aparelho, com os últimos dados carregados.",
            "As outras gravações são recusadas até o sinal voltar, com um aviso na tela.",
            "Compromissos da agenda e mudanças de fase feitos sem conexão ficam numa fila neste aparelho.",
            "A fila é enviada sozinha, na ordem, quando o sinal volta. O número no cabeçalho mostra quantos itens faltam.",
            "Em Pendências você vê a fila, envia na hora ou descarta um item.",
            "Se o mesmo registro foi mudado em outro aparelho, você escolhe qual versão fica.",
        ],
    },
];
