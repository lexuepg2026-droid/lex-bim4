import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import lupa from "../../../assets/images/icons/lupa.svg";
import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";
import documento from "../../../assets/images/icons/documento.svg";
import dinheiro from "../../../assets/images/icons/dinheiro.svg";

import clientService from "../../../services/clientService";
import EmptyState from "../../../components/EmptyState/EmptyState";
import Modal from "../../../components/Modal/Modal";
import Loading from "../../../components/Loading/Loading";
import { toast } from "../../../utils/toast";
import { buscarTudo } from "../../../utils/buscarTudo";
import { getApiErrorMessage } from "../../../utils/apiError";
import { nomeDoCliente } from "../../../utils/enums";
import { corDoAvatar, inicialDoAvatar } from "../../../utils/avatarCliente";
import { useFiltroNaUrl } from "../../../hooks/useFiltroNaUrl";

import "./Clientes.css";

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [total, setTotal] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [primeiraCarga, setPrimeiraCarga] = useState(true);
    const [erro, setErro] = useState("");

    const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });
    const [modalExcluirSelecionados, setModalExcluirSelecionados] = useState(false);
    const [excluindoSelecionados, setExcluindoSelecionados] = useState(false);
    const [mensagemFalhaExclusao, setMensagemFalhaExclusao] = useState(null);

    const [modalReativar, setModalReativar] = useState({ aberto: false, id: null });

    const [buscaAtrasada, setBuscaAtrasada] = useFiltroNaUrl("busca");
    const [busca, setBusca] = useState(buscaAtrasada);

    const [filtroSituacao, setFiltroSituacao] = useFiltroNaUrl("situacao");
    const [filtroTipo, setFiltroTipo] = useFiltroNaUrl("tipoPessoa");
    const [filtroPortal, setFiltroPortal] = useFiltroNaUrl("portal");
    const [ordem, setOrdem] = useFiltroNaUrl("ordem", "nome_asc");

    const [clientesSelecionados, setClientesSelecionados] = useState([]);

    const navigate = useNavigate();

    const modoSelecao = clientesSelecionados.length > 0;

    const selecionarCliente = (id) => {
        setClientesSelecionados((selecionados) => {
            if (selecionados.includes(id)) {
                return selecionados.filter((clienteId) => clienteId !== id);
            }
            return [...selecionados, id];
        });
    };

    const todosSelecionados = clientes.length > 0 && clientes.every((cliente) => clientesSelecionados.includes(cliente._id));
    const algunsSelecionados = modoSelecao && !todosSelecionados;

    const [menuSelecaoAberto, setMenuSelecaoAberto] = useState(false);
    const menuSelecaoRef = useRef(null);

    const marcarTodos = () => {
        const idsVisiveis = clientes.map((cliente) => cliente._id);
        setClientesSelecionados((selecionados) => [...new Set([...selecionados, ...idsVisiveis])]);
        setMenuSelecaoAberto(false);
    };

    const desmarcarTodos = () => {
        setClientesSelecionados([]);
        setMenuSelecaoAberto(false);
    };

    const clicarCheckboxMestre = () => {
        if (modoSelecao) desmarcarTodos();
        else marcarTodos();
    };

    useEffect(() => {
        if (!menuSelecaoAberto) return;

        const clicouFora = (e) => {
            if (menuSelecaoRef.current && !menuSelecaoRef.current.contains(e.target)) {
                setMenuSelecaoAberto(false);
            }
        };
        const apertouEsc = (e) => {
            if (e.key === "Escape") setMenuSelecaoAberto(false);
        };

        document.addEventListener("mousedown", clicouFora);
        document.addEventListener("keydown", apertouEsc);
        return () => {
            document.removeEventListener("mousedown", clicouFora);
            document.removeEventListener("keydown", apertouEsc);
        };
    }, [menuSelecaoAberto]);

    useEffect(() => {
        const t = setTimeout(() => setBuscaAtrasada(busca), 400);
        return () => clearTimeout(t);
    }, [busca, setBuscaAtrasada]);

    const ultimaBusca = useRef(0);

    // Só a resposta da busca mais recente vale (fase R2). Com a lista em tela
    // durante a carga, os filtros continuam montados e a corrida ficaria possível.
    const buscarClientes = () => {
        const numero = ++ultimaBusca.current;
        setCarregando(true);
        setErro("");

        buscarTudo(clientService.getAllClients, {
            busca: buscaAtrasada || undefined,
            situacao: filtroSituacao || undefined,
            tipoPessoa: filtroTipo || undefined,
            portal: filtroPortal || undefined,
            ordem,
        })
            .then((lista) => {
                if (numero !== ultimaBusca.current) return;
                setClientes(lista);
                setTotal(lista.length);
            })
            .catch((err) => {
                if (numero === ultimaBusca.current) setErro(getApiErrorMessage(err, "Falha ao buscar clientes."));
            })
            .finally(() => {
                if (numero === ultimaBusca.current) {
                    setCarregando(false);
                    setPrimeiraCarga(false);
                }
            });
    };

    useEffect(() => {
        buscarClientes();
    }, [buscaAtrasada, filtroSituacao, filtroTipo, filtroPortal, ordem]);

    const confirmarExclusao = (id) => setModalExcluir({ aberto: true, id });

    const handleExcluir = async () => {
        const { id } = modalExcluir;
        setModalExcluir({ aberto: false, id: null });
        try {
            await clientService.deleteClient(id);
            setClientes((atual) => atual.filter((c) => c._id !== id));
            setTotal((atual) => atual - 1);
            setClientesSelecionados((atual) => atual.filter((clienteId) => clienteId !== id));
            toast.success("Cliente desativado. Você pode reativá-lo em \"Somente desativados\".");
        } catch (err) {
            setMensagemFalhaExclusao(getApiErrorMessage(err, "Erro ao excluir cliente."));
        }
    };

    const handleExcluirSelecionados = async () => {
        setModalExcluirSelecionados(false);
        setExcluindoSelecionados(true);

        const idsSelecionados = clientesSelecionados;

        const resultados = await Promise.allSettled(
            idsSelecionados.map((id) => clientService.deleteClient(id))
        );

        const sucesso = [];
        const falhas = [];

        resultados.forEach((resultado, indice) => {
            const id = idsSelecionados[indice];
            if (resultado.status === "fulfilled") {
                sucesso.push(id);
            } else {
                const cliente = clientes.find((c) => c._id === id);
                falhas.push({
                    nome: cliente ? nomeDoCliente(cliente) : "Cliente",
                    motivo: getApiErrorMessage(resultado.reason, "motivo desconhecido"),
                });
            }
        });

        if (sucesso.length > 0) {
            setClientes((atual) => atual.filter((c) => !sucesso.includes(c._id)));
            setTotal((atual) => atual - sucesso.length);
        }
        setClientesSelecionados(idsSelecionados.filter((id) => !sucesso.includes(id)));
        setExcluindoSelecionados(false);

        if (falhas.length === 0) {
            toast.success(`${sucesso.length} cliente(s) excluído(s) com sucesso.`);
            return;
        }

        const resumo = sucesso.length > 0
            ? `${sucesso.length} de ${idsSelecionados.length} clientes foram excluídos. Os outros ${falhas.length} não puderam:`
            : `Nenhum dos ${falhas.length} clientes selecionados pôde ser excluído:`;

        const detalhes = falhas.map((f) => `• ${f.nome} — ${f.motivo}`).join("\n");

        setMensagemFalhaExclusao(`${resumo}\n\n${detalhes}`);
    };

    const handleReativar = async () => {
        const { id } = modalReativar;
        setModalReativar({ aberto: false, id: null });
        try {
            await clientService.reactivateClient(id);
            toast.success("Cliente reativado. Os processos dele continuam como estavam.");
            buscarClientes();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Erro ao reativar cliente."));
        }
    };

    const abrirDetalhes = (id) => navigate(`/clientes/detalhes/${id}`);

    // Na primeira carga ainda não existe busca digitada: a tela inteira dá lugar
    // ao Loading, como no desenho dela (R4). Nas buscas seguintes o Loading fica
    // na área da lista, e não no lugar da tela: a tela inteira desmontava a cada
    // busca e o campo de busca perdia o foco (fase R2).
    if (primeiraCarga) return <Loading />;

    return (
        <div className="tela telaClientes">
            <div className="baloesTelasAdvogada">
                <div className="parteSuperior">
                    {modoSelecao ? (
                        <div className="barraSelecao">
                            <div className="seletorMestre" ref={menuSelecaoRef}>
                                <label className="checkboxMestre">
                                    <input
                                        type="checkbox"
                                        ref={(el) => { if (el) el.indeterminate = algunsSelecionados; }}
                                        checked={todosSelecionados}
                                        onChange={clicarCheckboxMestre}
                                        aria-label={modoSelecao ? "Desmarcar todos" : "Selecionar todos"}
                                    />
                                </label>

                                <button title="Opções de seleção"
                                    type="button"
                                    className="botaoSetaSelecao"
                                    onClick={() => setMenuSelecaoAberto((aberto) => !aberto)}
                                    aria-haspopup="menu"
                                    aria-expanded={menuSelecaoAberto}
                                    aria-label="Opções de seleção"
                                >
                                    <span className="setaSelecao" />
                                </button>

                                {menuSelecaoAberto && (
                                    <ul className="menuSelecao" role="menu">
                                        <li><button title="Selecionar todos os clientes" type="button" role="menuitem" onClick={marcarTodos}>Todos</button></li>
                                        <li><button title="Desmarcar todos os clientes" type="button" role="menuitem" onClick={desmarcarTodos}>Nenhum</button></li>
                                    </ul>
                                )}
                            </div>

                            <span className="textoSelecao">
                                {clientesSelecionados.length} {clientesSelecionados.length === 1 ? "selecionado" : "selecionados"}
                            </span>

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
                            <h1 className="clientes">
                                Clientes <span className="contadorClientes">({total})</span>
                            </h1>

                            <form className="barraPesquisar" onSubmit={(e) => e.preventDefault()}>
                                <button title="Buscar" type="submit">
                                    <img src={lupa} alt="" />
                                </button>

                                <input className="inputClienteBuscar"
                                    type="text"
                                    placeholder="Buscar por nome, e-mail, telefone, CPF/CNPJ, endereço ou outras informações..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    maxLength={150}
                                />
                            </form>

                            <Link to="/clientes/novo" className="novoCliente">+</Link>
                        </>
                    )}
                </div>

                <div className="linhaFiltros">
                    <div className="select">
                        <select className="selectForm" value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)}>
                            <option value="">Somente ativos</option>
                            <option value="inativos">Somente desativados</option>
                            <option value="todos">Ativos e desativados</option>
                        </select>
                    </div>

                    <div className="select">
                        <select className="selectForm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                            <option value="">Pessoa física e jurídica</option>
                            <option value="PF">Somente pessoa física</option>
                            <option value="PJ">Somente pessoa jurídica</option>
                        </select>
                    </div>

                    <div className="select">
                        <select className="selectForm" value={filtroPortal} onChange={(e) => setFiltroPortal(e.target.value)}>
                            <option value="">Com e sem acesso ao portal</option>
                            <option value="com_acesso">Com acesso ao portal</option>
                            <option value="sem_acesso">Sem acesso ao portal</option>
                            <option value="nao_liberado">Com processo não liberado</option>
                        </select>
                    </div>

                    <div className="select">
                        <select className="selectForm" value={ordem} onChange={(e) => setOrdem(e.target.value)}>
                            <option value="nome_asc">Nome de A a Z</option>
                            <option value="nome_desc">Nome de Z a A</option>
                        </select>
                    </div>
                </div>

                {erro && <p className="mensagemErro">{erro}</p>}

                {carregando ? (
                    <Loading />
                ) : clientes.length === 0 ? (
                    !erro && <EmptyState titulo="Nenhum cliente encontrado." descricao="Tente ajustar os filtros ou cadastre um novo cliente." />
                ) : (
                    <div className="tabelaContainer">
                        <table className={`tabela ${modoSelecao ? "tabela--modoSelecao" : ""}`}>
                            <thead>
                                <tr>
                                    <th>Nome/Razão social</th>
                                    <th>Tipo</th>
                                    <th>Email</th>
                                    <th>Telefone</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientes.map((cliente) => {
                                    const selecionado = clientesSelecionados.includes(cliente._id);
                                    const nome = nomeDoCliente(cliente);
                                    const desativado = cliente.ativo === false;

                                    return (
                                        <tr
                                            key={cliente._id}
                                            className={selecionado ? "linhaSelecionada" : ""}
                                            onClick={() => !desativado && abrirDetalhes(cliente._id)}
                                        >
                                            <td>
                                                <div className="checkBoxCliente">
                                                    <div className="checkBoxClienteConteudo" onClick={(e) => e.stopPropagation()}>
                                                        <span
                                                            className="avatarCliente"
                                                            style={{ backgroundColor: corDoAvatar(cliente._id) }}
                                                        >
                                                            {inicialDoAvatar(nome)}
                                                        </span>
                                                        <div className="checkBoxCirculo">
                                                            <input
                                                                type="checkbox"
                                                                checked={selecionado}
                                                                onChange={() => selecionarCliente(cliente._id)}
                                                                aria-label={`Selecionar ${nome}`}
                                                            />
                                                        </div>
                                                    </div>

                                                    {nome}
                                                    {desativado && <span className="tagDesativado">Desativado</span>}
                                                </div>
                                            </td>

                                            <td>{cliente.tipoPessoa === "fisica" ? "Física" : "Jurídica"}</td>

                                            <td>{cliente.email || "—"}</td>

                                            <td>{cliente.telefone || "—"}</td>

                                            <td className="botoesAcoes" onClick={(e) => e.stopPropagation()}>
                                                {desativado ? (
                                                    <button title="Volta o cliente para a lista de ativos" type="button" className="buttonOutlined botaoReativar" onClick={() => setModalReativar({ aberto: true, id: cliente._id })}>
                                                        Reativar
                                                    </button>
                                                ) : (
                                                    <>
                                                        <Link
                                                            to={`/clientes/detalhes/${cliente._id}`}
                                                            state={{ aba: "processos" }}
                                                            className="botaoIcone"
                                                            title="Processos"
                                                        >
                                                            <img src={documento} alt="Processos" />
                                                        </Link>

                                                        <Link
                                                            to={`/clientes/detalhes/${cliente._id}`}
                                                            state={{ aba: "pagamentos" }}
                                                            className="botaoIcone"
                                                            title="Pagamentos"
                                                        >
                                                            <img src={dinheiro} alt="Pagamentos" />
                                                        </Link>

                                                        <Link to={`/clientes/editar/${cliente._id}`} className="botaoIcone" title="Editar">
                                                            <img src={lapis} alt="Editar" />
                                                        </Link>

                                                        <button className="botaoIcone botaoIconePerigo"
                                                            type="button"
                                                            title="Excluir"
                                                            onClick={() => confirmarExclusao(cliente._id)}
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
                aberto={modalReativar.aberto}
                titulo="Reativar cliente"
                mensagem="Este cliente será reativado. Os processos dele não voltam junto: cada processo se reativa por si."
                labelConfirmar="Reativar"
                onConfirmar={handleReativar}
                onCancelar={() => setModalReativar({ aberto: false, id: null })}
            />

            <Modal
                aberto={modalExcluirSelecionados}
                titulo="Excluir clientes selecionados"
                mensagem={`Os ${clientesSelecionados.length} clientes selecionados serão desativados. Nada é apagado: dá para reativar depois.`}
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

export default Clientes;