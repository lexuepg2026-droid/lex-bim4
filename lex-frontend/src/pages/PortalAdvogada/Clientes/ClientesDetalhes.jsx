import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";
import Loading from "../../../components/Loading/Loading";
import EmptyState from "../../../components/EmptyState/EmptyState";
import Modal from "../../../components/Modal/Modal";

import clientService from "../../../services/clientService";
import processService from "../../../services/processService";
import financeiroService from "../../../services/financeiroService";

import { formatCPF, formatCNPJ, formatPhone, formatCEP, formatDate, formatCurrency } from "../../../utils/formatters";
import { labelDe, SEXO_OPTIONS, ESTADO_CIVIL_OPTIONS, nomeDoCliente, FASE_PROCESSO_OPTIONS, STATUS_PROCESSO_OPTIONS } from "../../../utils/enums";
import { corDoAvatar, inicialDoAvatar } from "../../../utils/avatarCliente";
import { buscarTudo } from "../../../utils/buscarTudo";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../utils/apiError";

import PortalDoCliente from "./PortalDoCliente";

import "./Clientes.css";

function ClientesDetalhes() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [cliente, setCliente] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    
    const [aba, setAba] = useState(location.state?.aba || "detalhes");
    
    const [processos, setProcessos] = useState([]);
    const [carregandoProcessos, setCarregandoProcessos] = useState(true);
    
    const [fichas, setFichas] = useState(null);
    const [carregandoFichas, setCarregandoFichas] = useState(false);

    const [gruposProcessosAbertos, setGruposProcessosAbertos] = useState({});
    
    const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });
    const [mensagemFalhaExclusao, setMensagemFalhaExclusao] = useState(null);

    useEffect(() => {
        setCarregando(true);
        setErro("");

        clientService.getClientById(id)
            .then((res) => setCliente(res.data))
            .catch((err) => setErro(getApiErrorMessage(err, "Não foi possível carregar o cliente.")))
            .finally(() => setCarregando(false));
    }, [id]);

    useEffect(() => {
        setCarregandoProcessos(true);
        buscarTudo(processService.listProcesses)
            .then((todos) => {
                const doCliente = todos.filter((processo) => {
                    const principalId = processo.clientePrincipalId?._id ?? processo.clientePrincipalId;
                    if (String(principalId) === id) return true;
                    return (processo.participantes ?? []).some(
                        (p) => String(p.clienteId?._id ?? p.clienteId) === id
                    );
                });
                setProcessos(doCliente);
            })
            .catch(() => setProcessos([]))
            .finally(() => setCarregandoProcessos(false));
    }, [id]);

    useEffect(() => {
        if (aba !== "pagamentos" || fichas !== null || processos.length === 0) return;

        setCarregandoFichas(true);
        Promise.all(processos.map((processo) => financeiroService.getFichaDoProcesso(processo._id)))
            .then((respostas) => setFichas(respostas.map((res) => res.data)))
            .catch(() => setFichas([]))
            .finally(() => setCarregandoFichas(false));
    }, [aba, processos, fichas]);

    if (carregando) return <Loading />;

    if (erro) {
        return (
            <div className="tela telaClientes">
                <div className="baloesTelasAdvogada">
                    <p className="mensagemErro">{erro}</p>
                </div>
            </div>
        );
    }

    const {
        tipoPessoa, nomeCompleto, cpf,
        rg, dataNascimento, sexo, estadoCivil, profissao, nacionalidade,
        razaoSocial, nomeFantasia, cnpj, representanteLegal,
        email, telefone, endereco, observacoes,
    } = cliente;

    const nome = nomeDoCliente(cliente);

    const temRepresentante = Boolean(
        representanteLegal && (representanteLegal.nome || representanteLegal.cpf || representanteLegal.cargo)
    );

    const confirmarExclusao = (id) => setModalExcluir({ aberto: true, id });
    
    const handleExcluir = async () => {
        const { id: clienteIdParaExcluir } = modalExcluir;
        setModalExcluir({ aberto: false, id: null });
        try {
            await clientService.deleteClient(clienteIdParaExcluir);
            toast.success("Cliente desativado. Você pode reativá-lo na lista de clientes.");
            navigate("/clientes");
        } catch (err) {
            setMensagemFalhaExclusao(getApiErrorMessage(err, "Erro ao excluir cliente."));
        }
    };

    const alternarGrupoProcesso = (chave) => {
        setGruposProcessosAbertos((atual) => ({ ...atual, [chave]: !atual[chave] }));
    };

    const gruposProcessos = processos.reduce((acc, processo) => {
        const chave = processo.tipoAcao?.trim() || "Sem tipo definido";
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(processo);
        return acc;
    }, {});

    const chavesProcessosOrdenadas = Object.keys(gruposProcessos).sort((a, b) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );

    return (
        <div className="tela telaClientes">
            <div className="baloesTelasAdvogada">
                <div className="detalheTopo">
                    <div className="detalheIdentidade">
                        <span className="detalheAvatar" 
                            style={{ backgroundColor: corDoAvatar(id) }}>
                            {inicialDoAvatar(nome)}
                        </span>
                        <div>
                            <h1 className="tituloPagina">{nome}</h1>
                            <p className="detalheSubtitulo">{tipoPessoa === "fisica" ? "Pessoa física" : "Pessoa jurídica"}</p>
                        </div>
                    </div>

                    <div className="acoesDetalhe">
                        <Link to={`/clientes/editar/${id}`} className="botaoIcone" 
                            title="Editar">
                            <img src={lapis} alt="Editar" />
                        </Link>

                        <button className="botaoIcone botaoIconePerigo"
                            title="Excluir"
                            onClick={() => confirmarExclusao(cliente._id)}
                        >
                            <img src={lixeira} alt="Excluir" />
                        </button>
                        
                        <BotaoVoltar />
                    </div>
                </div>

                <div className="detalheAbas">
                    <div className="detalheAbasBotoes">
                        <button type="button" className={`detalheAba ${aba === "detalhes" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("detalhes")}>
                            Detalhes
                        </button>

                        <button type="button" className={`detalheAba ${aba === "processos" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("processos")}>
                            Processos
                        </button>

                        <button type="button" className={`detalheAba ${aba === "pagamentos" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("pagamentos")}>
                            Pagamentos
                        </button>

                        <button type="button" className={`detalheAba ${aba === "portal" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("portal")}>
                            Portal
                        </button>
                    </div>

                    {aba === "processos" && (
                        <Link className="detalheBotaoNovo"
                            to="/processos/novo"
                            state={{ clienteId: id }}
                            title="Novo processo"
                        >
                            +
                        </Link>
                    )}

                    {aba === "pagamentos" && (
                        <Link className="detalheBotaoNovo"
                            to="/financeiro"
                            title="Novo pagamento"
                        >
                            +
                        </Link>
                    )}
                </div>

                {aba === "detalhes" && (
                    <>
                        {tipoPessoa === "fisica" ? (
                            <div className="secaoForm">
                                <h3>Informações pessoais</h3>

                                <div className="tituloInput informacaoNormal">
                                    <label>Nome completo</label>
                                    <span className="valorLeitura">{nomeCompleto || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>CPF</label>
                                    <span className="valorLeitura">{formatCPF(cpf)}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>RG</label>
                                    <span className="valorLeitura">{rg || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>Data de nascimento</label>
                                    <span className="valorLeitura">{formatDate(dataNascimento)}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>Sexo</label>
                                    <span className="valorLeitura">{labelDe(SEXO_OPTIONS, sexo)}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>Estado civil</label>
                                    <span className="valorLeitura">{labelDe(ESTADO_CIVIL_OPTIONS, estadoCivil)}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>Profissão</label>
                                    <span className="valorLeitura">{profissao || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>Nacionalidade</label>
                                    <span className="valorLeitura">{nacionalidade || "—"}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="secaoForm">
                                <div className="tituloInput informacaoPequena">
                                    <label>CNPJ</label>
                                    <span className="valorLeitura">{formatCNPJ(cnpj)}</span>
                                </div>

                                <div className="tituloInput informacaoNormal">
                                    <label>Razão social</label>
                                    <span className="valorLeitura">{razaoSocial || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoGrande">
                                    <label>Nome fantasia</label>
                                    <span className="valorLeitura">{nomeFantasia || "—"}</span>
                                </div>
                            </div>
                        )}

                        {tipoPessoa === "juridica" && temRepresentante && (
                            <div className="secaoForm">
                                <h3>Representante legal</h3>

                                <div className="tituloInput informacaoNormal">
                                    <label>Nome</label>
                                    <span className="valorLeitura">{representanteLegal.nome || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>CPF</label>
                                    <span className="valorLeitura">{formatCPF(representanteLegal.cpf)}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>Cargo</label>
                                    <span className="valorLeitura">{representanteLegal.cargo || "—"}</span>
                                </div>
                            </div>
                        )}

                        <div className="secaoForm">
                            <h3>Contato</h3>

                            <div className="tituloInput informacaoNormal">
                                <label>Email</label>
                                <span className="valorLeitura">{email || "—"}</span>
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>Telefone</label>
                                <span className="valorLeitura">{formatPhone(telefone)}</span>
                            </div>
                        </div>

                        {endereco && Object.values(endereco).some(Boolean) && (
                            <div className="secaoForm">
                                <h3>Endereço</h3>

                                <div className="tituloInput informacaoPequena">
                                    <label>CEP</label>
                                    <span className="valorLeitura">{formatCEP(endereco.cep) || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>País</label>
                                    <span className="valorLeitura">{endereco.pais || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoPequena">
                                    <label>Estado (UF)</label>
                                    <span className="valorLeitura">{endereco.estado || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoQuaseNormal">
                                    <label>Cidade</label>
                                    <span className="valorLeitura">{endereco.cidade || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoQuaseNormal">
                                    <label>Bairro</label>
                                    <span className="valorLeitura">{endereco.bairro || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoQuaseGrande">
                                    <label>Logradouro</label>
                                    <span className="valorLeitura">{endereco.logradouro || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoMuitoPequeno">
                                    <label>Número</label>
                                    <span className="valorLeitura">{endereco.numero || "—"}</span>
                                </div>

                                <div className="tituloInput informacaoGrande">
                                    <label>Complemento</label>
                                    <span className="valorLeitura">{endereco.complemento || "—"}</span>
                                </div>
                            </div>
                        )}

                        <div className="secaoForm">
                            <h3>Observações</h3>

                            <div className="tituloInput informacaoGrande">
                                <span className="observacaoBox">{observacoes || "Nenhuma observação registrada."}</span>
                            </div>
                        </div>
                    </>
                )}

                {aba === "processos" && (
                    <div className="secaoForm">
                        {carregandoProcessos ? (
                            <p className="detalheCarregando">Carregando processos…</p>
                        ) : processos.length === 0 ? (
                            <EmptyState titulo="Nenhum processo vinculado." descricao="Esse cliente ainda não está em nenhum processo." />
                        ) : (
                            chavesProcessosOrdenadas.map((chave) => {
                                const processosDoGrupo = gruposProcessos[chave];
                                const aberto = Boolean(gruposProcessosAbertos[chave]);

                                return (
                                    <div key={chave} className="detalheListaProcessos">
                                        <button title="Mostrar ou esconder os processos deste tipo" className="detalheItemProcesso"
                                            type="button" 
                                            onClick={() => alternarGrupoProcesso(chave)}
                                        >
                                            <span className={`setaDetalhes ${aberto ? "setaDetalhesAberta" : ""}`} />
                                            <span className="detalheItemTitulo">{chave}</span>
                                            <span className="contadorQuantidade">{processosDoGrupo.length}</span>
                                        </button>

                                        {aberto && (
                                            <div className="detalheListaFinanceiro">
                                                {processosDoGrupo.map((processo) => (
                                                    <div
                                                        key={processo._id}
                                                        className="detalheCardFinanceiro detalheItemClicavel"
                                                        onClick={() => navigate(`/processos/detalhes/${processo._id}`)}
                                                    >
                                                        <h4>{processo.titulo}</h4>

                                                        <div className="detalheFinanceiroLinha">
                                                            <span>Número</span>
                                                            
                                                            <strong>{processo.numeroProcesso || "—"}</strong>
                                                        </div>

                                                        <div className="detalheFinanceiroLinha">
                                                            <span>Fase</span>

                                                            <strong>{labelDe(FASE_PROCESSO_OPTIONS, processo.fase)}</strong>
                                                        </div>
                                                        
                                                        <div className="detalheFinanceiroLinha">
                                                            <span>Status</span>

                                                            <strong>{labelDe(STATUS_PROCESSO_OPTIONS, processo.status)}</strong>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {aba === "portal" && <PortalDoCliente clienteId={id} nomeCliente={nome} />}

                {aba === "pagamentos" && (
                    <div className="secaoForm">
                        {carregandoFichas ? (
                            <p className="detalheCarregando">Carregando pagamentos…</p>
                        ) : !fichas || fichas.length === 0 ? (
                            <EmptyState titulo="Nada por aqui ainda." descricao="Esse cliente não tem cobranças registradas em nenhum processo." />
                        ) : (
                            <div className="detalheListaFinanceiro">
                                {fichas.map((ficha) => (
                                    <div
                                        key={ficha.processo._id}
                                        className="detalheCardFinanceiro detalheItemClicavel"
                                        onClick={() => navigate(`/processos/detalhes/${ficha.processo._id}`)}
                                    >
                                        <h4>{ficha.processo.titulo}</h4>

                                        <div className="detalheFinanceiroLinha">
                                            <span>Contratado</span>
                                            <strong>{formatCurrency(ficha.totais.contratado)}</strong>
                                        </div>

                                        <div className="detalheFinanceiroLinha">
                                            <span>Pago</span>
                                            <strong>{formatCurrency(ficha.totais.pago)}</strong>
                                        </div>

                                        <div className="detalheFinanceiroLinha">
                                            <span>Em aberto</span>
                                            <strong>{formatCurrency(ficha.totais.emAberto)}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                aberto={modalExcluir.aberto}
                titulo="Excluir cliente"
                mensagem={"O cliente será desativado e deixa de aparecer na lista. Nada é apagado: você pode reativá-lo depois em \"Somente desativados\"."}
                perigo
                labelConfirmar="Excluir"
                onConfirmar={handleExcluir}
                onCancelar={() => setModalExcluir({ aberto: false, id: null })}
            />

            <Modal
                aberto={Boolean(mensagemFalhaExclusao)}
                titulo="Não foi possível excluir"
                mensagem={mensagemFalhaExclusao}
                somenteInfo
                labelConfirmar="Entendi"
                onConfirmar={() => setMensagemFalhaExclusao(null)}
            />
        </div>
    );
}

export default ClientesDetalhes;