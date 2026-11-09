import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

import lupa from "../../../assets/images/icons/lupa.svg";
import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";

import EmptyState from "../../../components/EmptyState/EmptyState";
import Modal from "../../../components/Modal/Modal";
import Loading from "../../../components/Loading/Loading";

import processService from "../../../services/processService";

import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buscarTudo } from "../../../utils/buscarTudo";
import { corDoStatus } from "../../../utils/statusProcesso";
import { nomeDoCliente, labelDe, STATUS_PROCESSO_OPTIONS, FASE_PROCESSO_OPTIONS } from "../../../utils/enums";
import { mensagemDesativarProcesso, mensagemReativarProcesso, motivoDeNaoReativar } from "../../../utils/ativacaoProcesso";
import { useFiltroNaUrl } from "../../../hooks/useFiltroNaUrl";

import "./Processos.css";

function Processos() {
    const location = useLocation();
    const navigate = useNavigate();

    const [processos, setProcessos] = useState([]);
    const [total, setTotal] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null, mensagem: "" });
    const [modalExcluirSelecionados, setModalExcluirSelecionados] = useState(false);
    const [excluindoSelecionados, setExcluindoSelecionados] = useState(false);
    const [mensagemFalhaExclusao, setMensagemFalhaExclusao] = useState(null);

    const [modalReativar, setModalReativar] = useState({ aberto: false, id: null, mensagem: "" });

    const [buscaAtrasada, setBuscaAtrasada] = useFiltroNaUrl("busca");
    const [busca, setBusca] = useState(() => location.state?.busca ?? buscaAtrasada);

    const [processosSelecionados, setProcessosSelecionados] = useState([]);

    const [filtroStatus, setFiltroStatus] = useFiltroNaUrl("status");
    const [filtroFase, setFiltroFase] = useFiltroNaUrl("fase");
    const [filtroLiminar, setFiltroLiminar] = useFiltroNaUrl("liminar");
    const [filtroSituacao, setFiltroSituacao] = useFiltroNaUrl("situacao");
    const [filtroTipoAcao, setFiltroTipoAcao] = useFiltroNaUrl("tipoAcao");
    const [filtroPortal, setFiltroPortal] = useFiltroNaUrl("portal");
    const [tiposDeAcao, setTiposDeAcao] = useState([]);

    const [gruposAbertos, setGruposAbertos] = useState({});

    const modoSelecao = processosSelecionados.length > 0;

    const selecionarProcesso = (id) => {
        setProcessosSelecionados((selecionados) => {
            if (selecionados.includes(id)) {
                return selecionados.filter((processoId) => processoId !== id);
            }
            return [...selecionados, id];
        });
    };

    const selecionarTodos = () => {
        const idsVisiveis = processos.map((processo) => processo._id);

        const todosJaSelecionados = idsVisiveis.every((id) =>
            processosSelecionados.includes(id)
        );

        if (todosJaSelecionados) {
            setProcessosSelecionados((selecionados) =>
                selecionados.filter((id) => !idsVisiveis.includes(id))
            );
        } else {
            setProcessosSelecionados((selecionados) => [
                ...new Set([...selecionados, ...idsVisiveis]),
            ]);
        }
    };

    const todosSelecionados = processos.length > 0 && processos.every((processo) => processosSelecionados.includes(processo._id));

    const alternarGrupo = (chave) => {
        setGruposAbertos((atual) => ({ ...atual, [chave]: !atual[chave] }));
    };

    const grupos = processos.reduce((acc, processo) => {
        const chave = processo.tipoAcao?.trim() || "Sem tipo definido";
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(processo);
        return acc;
    }, {});

    const chavesOrdenadas = Object.keys(grupos).sort((a, b) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );

    useEffect(() => {
        const t = setTimeout(() => setBuscaAtrasada(busca), 400);
        return () => clearTimeout(t);
    }, [busca, setBuscaAtrasada]);

    const buscarProcessos = async () => {
        setCarregando(true);
        setErro("");

        try {
            const lista = await buscarTudo(processService.listProcesses, {
                busca: buscaAtrasada || undefined,
                status: filtroStatus || undefined,
                fase: filtroFase || undefined,
                liminar: filtroLiminar || undefined,
                situacao: filtroSituacao || undefined,
                tipoAcao: filtroTipoAcao || undefined,
                portal: filtroPortal || undefined,
            });

            setProcessos(lista);
            setTotal(lista.length);
        } catch (err) {
            setErro(getApiErrorMessage(err, "Falha ao buscar processos."));
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarProcessos();
    }, [buscaAtrasada, filtroStatus, filtroFase, filtroLiminar, filtroSituacao, filtroTipoAcao, filtroPortal]);

    useEffect(() => {
        processService.listarTiposDeAcao()
            .then((res) => setTiposDeAcao(res.data.data ?? []))
            .catch(() => {});
    }, []);

    const confirmarExclusao = async (id) => {
        setModalExcluir({ aberto: true, id, mensagem: "Conferindo o efeito desta ação…" });
        try {
            const res = await processService.getActivationPreview(id);
            setModalExcluir({ aberto: true, id, mensagem: mensagemDesativarProcesso(res.data.vinculosAfetados) });
        } catch {
            setModalExcluir({ aberto: true, id, mensagem: mensagemDesativarProcesso(0) });
        }
    };

    const handleExcluir = async () => {
        const { id } = modalExcluir;
        setModalExcluir({ aberto: false, id: null, mensagem: "" });
        try {
            await processService.deleteProcess(id);
            setProcessos((atual) => atual.filter((p) => p._id !== id));
            setTotal((atual) => atual - 1);
            setProcessosSelecionados((atual) => atual.filter((processoId) => processoId !== id));
            toast.success("Processo desativado. Você pode reativá-lo em \"Somente desativados\".");
        } catch (err) {
            setMensagemFalhaExclusao(getApiErrorMessage(err, "Erro ao excluir processo."));
        }
    };

    const handleExcluirSelecionados = async () => {
        setModalExcluirSelecionados(false);
        setExcluindoSelecionados(true);

        const idsSelecionados = processosSelecionados;

        const resultados = await Promise.allSettled(
            idsSelecionados.map((id) => processService.deleteProcess(id))
        );

        const sucesso = [];
        const falhas = [];

        resultados.forEach((resultado, indice) => {
            const id = idsSelecionados[indice];
            if (resultado.status === "fulfilled") {
                sucesso.push(id);
            } else {
                const processo = processos.find((p) => p._id === id);
                falhas.push({
                    nome: processo ? processo.titulo : "Processo",
                    motivo: getApiErrorMessage(resultado.reason, "motivo desconhecido"),
                });
            }
        });

        setProcessosSelecionados(idsSelecionados.filter((id) => !sucesso.includes(id)));
        setExcluindoSelecionados(false);
        buscarProcessos();

        if (falhas.length === 0) {
            toast.success(`${sucesso.length} processo(s) desativado(s).`);
            return;
        }

        const resumo = sucesso.length > 0
            ? `${sucesso.length} de ${idsSelecionados.length} processos foram excluídos. Os outros ${falhas.length} não puderam:`
            : `Nenhum dos ${falhas.length} processos selecionados pôde ser excluído:`;

        const detalhes = falhas.map((f) => `• ${f.nome} — ${f.motivo}`).join("\n");

        setMensagemFalhaExclusao(`${resumo}\n\n${detalhes}`);
    };

    const confirmarReativacao = async (id) => {
        try {
            const res = await processService.getActivationPreview(id);
            const impedimento = motivoDeNaoReativar(res.data.impedimentosDeReativacao);
            if (impedimento) {
                toast.error(`Não é possível reativar. ${impedimento}`);
                return;
            }
            setModalReativar({ aberto: true, id, mensagem: mensagemReativarProcesso(res.data.vinculosAfetados) });
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Não foi possível conferir o efeito desta ação."));
        }
    };

    const handleReativar = async () => {
        const { id } = modalReativar;
        setModalReativar({ aberto: false, id: null, mensagem: "" });
        try {
            await processService.reactivateProcess(id);
            toast.success("Processo reativado com sucesso.");
            buscarProcessos();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Erro ao reativar processo."));
        }
    };

    const abrirDetalhe = (id) => navigate(`/processos/detalhes/${id}`);

    if (carregando) return <Loading />;

    return (
        <div className="tela telaProcessos">
            <div className="baloesTelasAdvogada">
                <div className="parteSuperior">
                    {modoSelecao ? (
                        <div className="barraSelecao">
                            <label className="checkboxMestre">
                                <input
                                    type="checkbox"
                                    checked={todosSelecionados}
                                    onChange={selecionarTodos}
                                    aria-label="Selecionar todos os processos"
                                />
                            </label>

                            <span className="textoSelecao">{processosSelecionados.length} selecionado(s)</span>

                            <button
                                type="button"
                                className="botaoIcone botaoIconePerigo botaoExcluirSelecionados"
                                title="Excluir selecionados"
                                onClick={() => setModalExcluirSelecionados(true)}
                                disabled={excluindoSelecionados}
                            >
                                <img src={lixeira} alt="Excluir selecionados" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 className="processos">
                                Processos <span className="contadorProcessos">({total})</span>
                            </h1>

                            <form className="barraPesquisar" onSubmit={(e) => e.preventDefault()}>
                                <button title="Buscar" type="submit">
                                    <img src={lupa} alt="" />
                                </button>

                                <input className="inputProcessoBuscar"
                                    type="text"
                                    placeholder="Buscar por título, número, cliente ou outras informações..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    maxLength={150}
                                />
                            </form>

                            <Link to="/processos/novo" className="novoProcesso">+</Link>
                        </>
                    )}
                </div>

                <div className="linhaFiltros">
                    <div className="select">
                        <select className="selectForm"
                            value={filtroStatus} 
                            onChange={(e) => setFiltroStatus(e.target.value)}
                        >
                            <option value="">Todos os status</option>
                            
                            {STATUS_PROCESSO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="select">
                        <select className="selectForm" 
                            value={filtroFase} 
                            onChange={(e) => setFiltroFase(e.target.value)}
                        >
                            <option value="">Todas as fases</option>
                            
                            {FASE_PROCESSO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="select">
                        <select className="selectForm" 
                            value={filtroLiminar} 
                            onChange={(e) => setFiltroLiminar(e.target.value)}
                        >
                            <option value="">Com e sem liminar</option>
                            <option value="com">Somente com liminar</option>
                            <option value="sem">Somente sem liminar</option>
                        </select>
                    </div>

                    <div className="select">
                        <select className="selectForm" 
                            value={filtroSituacao} 
                            onChange={(e) => setFiltroSituacao(e.target.value)}
                        >
                            <option value="">Somente ativos</option>
                            <option value="inativos">Somente desativados</option>
                            <option value="todos">Ativos e desativados</option>
                        </select>
                    </div>

                    <div className="select">
                        <select className="selectForm" value={filtroTipoAcao} onChange={(e) => setFiltroTipoAcao(e.target.value)}>
                            <option value="">Todos os tipos de ação</option>
                            {tiposDeAcao.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                        </select>
                    </div>

                    <div className="select">
                        <select className="selectForm" value={filtroPortal} onChange={(e) => setFiltroPortal(e.target.value)}>
                            <option value="">Liberados ou não no portal</option>
                            <option value="liberado">Liberados no portal</option>
                            <option value="nao_liberado">Com cliente não liberado</option>
                        </select>
                    </div>
                </div>

                {erro && <p className="mensagemErro">{erro}</p>}

                {processos.length === 0 ? (
                    <EmptyState titulo="Nenhum processo encontrado." descricao="Tente ajustar os filtros ou cadastre um novo processo." />
                ) : (
                    chavesOrdenadas.map((chave) => {
                        const processosDoGrupo = grupos[chave];
                        const aberto = Boolean(gruposAbertos[chave]);

                        return (
                            <div key={chave} className="listaProcessos">
                                <button title="Mostrar ou esconder os processos deste tipo" className="itemProcesso"
                                    type="button" 
                                    onClick={() => alternarGrupo(chave)}
                                >
                                    <span className={`setaProcesso ${aberto ? "setaProcessoAberta" : ""}`} />
                                    <span className="processoTitulo">{chave}</span>
                                    <span className="contadorQuantidadeProcesso">{processosDoGrupo.length}</span>
                                </button>

                                {aberto && (
                                    <div className="tabelaContainer">
                                        <table className={`tabela ${modoSelecao ? "tabela--modoSelecao" : ""}`}>
                                            <thead>
                                                <tr>
                                                    <th>Nº do processo</th>
                                                    <th>Cliente</th>
                                                    <th>Fase</th>
                                                    <th>Status</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {processosDoGrupo.map((processo) => {
                                                    const selecionado = processosSelecionados.includes(processo._id);
                                                    const desativado = processo.ativo === false;

                                                    return (
                                                        <tr
                                                            key={processo._id}
                                                            className={selecionado ? "linhaSelecionada" : ""}
                                                            onClick={() => !desativado && abrirDetalhe(processo._id)}
                                                        >
                                                            <td>
                                                                <div className="checkBoxProcesso">
                                                                    <div className="checkBoxProcessoConteudo" onClick={(e) => e.stopPropagation()}>
                                                                        <span
                                                                            className="avatarProcesso"
                                                                            style={{ backgroundColor: corDoStatus(processo.status) }}
                                                                            title={labelDe(STATUS_PROCESSO_OPTIONS, processo.status)}
                                                                        />
                                                                        <div className="checkBoxCirculo">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selecionado}
                                                                                onChange={() => selecionarProcesso(processo._id)}
                                                                                aria-label={`Selecionar ${processo.titulo}`}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <span>{processo.numeroProcesso || "—"}</span>
                                                                    {desativado && <span className="tagDesativado">Desativado</span>}
                                                                </div>
                                                            </td>

                                                            <td>{nomeDoCliente(processo.clientePrincipalId)}</td>

                                                            <td>{labelDe(FASE_PROCESSO_OPTIONS, processo.fase)}</td>

                                                            <td>{labelDe(STATUS_PROCESSO_OPTIONS, processo.status)}</td>

                                                            <td className="botoesAcoes" onClick={(e) => e.stopPropagation()}>
                                                                {desativado ? (
                                                                    <button title="Volta o processo para a lista de ativos" type="button" className="buttonOutlined botaoReativar" onClick={() => confirmarReativacao(processo._id)}>
                                                                        Reativar
                                                                    </button>
                                                                ) : (
                                                                    <>
                                                                        <Link to={`/processos/editar/${processo._id}`} className="botaoIcone" title="Editar">
                                                                            <img src={lapis} alt="Editar" />
                                                                        </Link>

                                                                        <button className="botaoIcone botaoIconePerigo"
                                                                            type="button"
                                                                            title="Excluir"
                                                                            onClick={() => confirmarExclusao(processo._id)}
                                                                        >
                                                                            <img src={lixeira} alt="Excluir" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <Modal
                aberto={modalExcluir.aberto}
                titulo="Excluir processo"
                mensagem={modalExcluir.mensagem}
                perigo
                labelConfirmar="Excluir"
                onConfirmar={handleExcluir}
                onCancelar={() => setModalExcluir({ aberto: false, id: null, mensagem: "" })}
            />

            <Modal
                aberto={modalReativar.aberto}
                titulo="Reativar processo"
                mensagem={modalReativar.mensagem}
                labelConfirmar="Reativar"
                onConfirmar={handleReativar}
                onCancelar={() => setModalReativar({ aberto: false, id: null, mensagem: "" })}
            />

            <Modal
                aberto={modalExcluirSelecionados}
                titulo="Excluir processos selecionados"
                mensagem={`Os ${processosSelecionados.length} processos selecionados serão desativados, com os participantes vinculados. Nada é apagado: dá para reativar depois em "Somente desativados".`}
                perigo
                labelConfirmar="Excluir"
                onConfirmar={handleExcluirSelecionados}
                onCancelar={() => setModalExcluirSelecionados(false)}
            />

            <Modal
                aberto={Boolean(mensagemFalhaExclusao)}
                titulo="Resultado da exclusão"
                mensagem={mensagemFalhaExclusao}
                somenteInfo
                labelConfirmar="Entendi"
                onConfirmar={() => setMensagemFalhaExclusao(null)}
            />
        </div>
    );
}

export default Processos;