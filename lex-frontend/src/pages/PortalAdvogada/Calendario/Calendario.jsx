import { useState, useEffect, useCallback } from "react";

import { useNavigate } from "react-router-dom";

import calendarService from "../../../services/calendarService";
import eventService from "../../../services/eventService";
import processService from "../../../services/processService";
import Modal from "../../../components/Modal/Modal";
import Loading from "../../../components/Loading/Loading";
import { toast } from "../../../utils/toast";
import { buscarTudo } from "../../../utils/buscarTudo";
import { getApiErrorMessage } from "../../../utils/apiError";
import FiltroDeOpcoes from "../../../components/FiltroDeOpcoes/FiltroDeOpcoes";
import { filtrarOpcoes } from "../../../utils/filtrarOpcoes";
import { formatCurrency } from "../../../utils/formatters";
import { TIPO_EVENTO_OPTIONS, STATUS_PARCELA_OPTIONS, labelDe, nomeDoCliente } from "../../../utils/enums";

import "./Calendario.css";

import lupa from "../../../assets/images/icons/lupa.svg";
import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";
import folder from "../../../assets/images/icons/folder.svg";
import localizacao from "../../../assets/images/icons/localizacao.svg";
import fechar from "../../../assets/images/icons/fechar.svg";
import calendario from "../../../assets/images/icons/calendario.svg";
import relogio from "../../../assets/images/icons/relogio.svg";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const DIAS_SEMANA_EXTENSO = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado",
];

const VISTA_OPTIONS = [
    { value: "dia", label: "Dia", atalho: "D" },
    { value: "semana", label: "Semana", atalho: "W" },
    { value: "mes", label: "Mês", atalho: "M" },
    { value: "ano", label: "Ano", atalho: "Y" },
    { value: "programacao", label: "Programação", atalho: "A" },
];

const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const ehFimDeSemana = (date) => date.getDay() === 0 || date.getDay() === 6;

const diasDaGradeDoMes = (anoGrade, mesGrade) => {
    const primeiro = new Date(anoGrade, mesGrade, 1);
    const ultimo = new Date(anoGrade, mesGrade + 1, 0);
    const semanas = Math.ceil((primeiro.getDay() + ultimo.getDate()) / 7);
    return Array.from({ length: semanas * 7 }, (_, i) => new Date(anoGrade, mesGrade, 1 - primeiro.getDay() + i));
};

const paraChave = (date) => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
};

const FORM_VAZIO = {
    tipo: "audiencia",
    titulo: "",
    data: "",
    hora: "",
    local: "",
    descricao: "",
    processoId: "",
};

const LIMITE_VISIVEL = 3;

function Calendario() {
    const navigate = useNavigate();
    const hoje = new Date();
    const [dataAtual, setDataAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
    const [itensPorDia, setItensPorDia] = useState({});
    const [hojeServidor, setHojeServidor] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [processos, setProcessos] = useState([]);
    const [filtroProcesso, setFiltroProcesso] = useState("");

    const [diaPopup, setDiaPopup] = useState(null);
    const [eventoPopup, setEventoPopup] = useState(null);

    const [vistaMenuAberto, setVistaMenuAberto] = useState(false);
    const [vistaAtual, setVistaAtual] = useState("mes");
    const [mostrarFinsDeSemana, setMostrarFinsDeSemana] = useState(true);
    const [mostrarConcluidas, setMostrarConcluidas] = useState(true);
    const [buscaTexto, setBuscaTexto] = useState("");

    const [form, setForm] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);

    const inicioGrade = new Date(primeiroDiaMes);
    inicioGrade.setDate(inicioGrade.getDate() - primeiroDiaMes.getDay());

    const fimGrade = new Date(ultimoDiaMes);
    fimGrade.setDate(fimGrade.getDate() + (6 - ultimoDiaMes.getDay()));

    const dias = [];
    for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) {
        dias.push(new Date(d));
    }

    const inicioSemana = new Date(ano, mes, dataAtual.getDate() - dataAtual.getDay());
    const fimSemana = new Date(ano, mes, dataAtual.getDate() - dataAtual.getDay() + 6);
    const diasDaSemana = Array.from({ length: 7 }, (_, i) => new Date(ano, mes, dataAtual.getDate() - dataAtual.getDay() + i));

    const periodos = {
        dia: [dataAtual, dataAtual],
        semana: [inicioSemana, fimSemana],
        mes: [inicioGrade, fimGrade],
        ano: [new Date(ano, 0, 1), new Date(ano, 11, 31)],
        programacao: [primeiroDiaMes, ultimoDiaMes],
    };
    const inicioChave = paraChave(periodos[vistaAtual][0]);
    const fimChave = paraChave(periodos[vistaAtual][1]);

    const diasSemanaVisiveis = mostrarFinsDeSemana ? DIAS_SEMANA : DIAS_SEMANA.slice(1, 6);
    const diasVisiveis = mostrarFinsDeSemana ? dias : dias.filter((d) => !ehFimDeSemana(d));
    const diasDaSemanaVisiveis = mostrarFinsDeSemana ? diasDaSemana : diasDaSemana.filter((d) => !ehFimDeSemana(d));
    const colunasGrade = mostrarFinsDeSemana ? 7 : 5;

    const textoPeriodo = vistaAtual === "dia"
        ? `${DIAS_SEMANA_EXTENSO[dataAtual.getDay()]}, ${dataAtual.getDate()} de ${MESES[mes]}`
        : vistaAtual === "semana"
            ? `${inicioSemana.getDate()} de ${MESES[inicioSemana.getMonth()]} a ${fimSemana.getDate()} de ${MESES[fimSemana.getMonth()]}`
            : "";

    const itemCorrespondeABusca = (item) => {
        if (!buscaTexto.trim()) return true;
        const termo = buscaTexto.trim().toLowerCase();
        const campos = [
            item.titulo,
            item.descricao,
            item.local,
            item.subtitulo,
            item.processo?.titulo,
            item.processo?.numeroProcesso,
        ];
        return campos.some((campo) => campo && campo.toLowerCase().includes(termo));
    };

    const itemVisivelPeloFiltro = (item) => (mostrarConcluidas || !itemConcluido(item)) && itemCorrespondeABusca(item);

    const itensDe = (chave) => (itensPorDia[chave] ?? []).filter(itemVisivelPeloFiltro);

    const anos = [];
    for (let a = hoje.getFullYear() - 5; a <= hoje.getFullYear() + 5; a++) anos.push(a);

    const buscarCalendario = useCallback(() => {
        setCarregando(true);
        setErro("");
        calendarService.getCalendario(inicioChave, fimChave)
            .then((res) => {
                const agrupado = {};
                res.data.itens.forEach((item) => {
                    if (!agrupado[item.data]) agrupado[item.data] = [];
                    agrupado[item.data].push(item);
                });
                setItensPorDia(agrupado);
                setHojeServidor(res.data.hoje);
            })
            .catch((err) => setErro(getApiErrorMessage(err, "Falha ao buscar a agenda.")))
            .finally(() => setCarregando(false));
    }, [inicioChave, fimChave]);

    useEffect(() => {
        buscarCalendario();
    }, [buscarCalendario]);

    useEffect(() => {
        const aoTeclar = (e) => {
            if (form || e.ctrlKey || e.metaKey || e.altKey) return;
            if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
            const opcao = VISTA_OPTIONS.find((o) => o.atalho === e.key.toUpperCase());
            if (!opcao) return;
            setVistaMenuAberto(false);
            setVistaAtual(opcao.value);
        };
        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, [form]);

    useEffect(() => {
        buscarTudo(processService.listProcesses)
            .then(setProcessos)
            .catch(() => {});
    }, []);

    const navegar = (direcao) => {
        if (vistaAtual === "dia") setDataAtual(new Date(ano, mes, dataAtual.getDate() + direcao));
        else if (vistaAtual === "semana") setDataAtual(new Date(ano, mes, dataAtual.getDate() + 7 * direcao));
        else if (vistaAtual === "ano") setDataAtual(new Date(ano + direcao, mes, 1));
        else setDataAtual(new Date(ano, mes + direcao, 1));
    };

    const irParaAnterior = () => navegar(-1);
    const irParaProximo = () => navegar(1);
    const irParaHoje = () => setDataAtual(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
    const mudarMes = (e) => setDataAtual(new Date(ano, Number(e.target.value), 1));
    const mudarAno = (e) => setDataAtual(new Date(Number(e.target.value), mes, 1));

    const selecionarVista = (valor) => {
        setVistaMenuAberto(false);
        setVistaAtual(valor);
    };

    const abrirDia = (dia) => {
        setDataAtual(dia);
        setVistaAtual("dia");
    };

    const abrirMes = (indiceMes) => {
        setDataAtual(new Date(ano, indiceMes, 1));
        setVistaAtual("mes");
    };

    const abrirNovo = (dataPreenchida) => {
        setForm({ ...FORM_VAZIO, data: dataPreenchida ?? paraChave(hoje) });
    };

    const abrirEdicao = (item) => {
        setForm({
            _id: item._id,
            tipo: item.tipo,
            titulo: item.titulo,
            data: item.data,
            hora: item.hora ?? "",
            local: item.local ?? "",
            descricao: item.descricao ?? "",
            processoId: item.processoId ?? "",
            concluido: item.concluido,
            updatedAt: item.updatedAt ?? null,
        });
    };

    const fecharForm = () => setForm(null);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSalvar = async (e) => {
        e.preventDefault();
        if (!form.titulo.trim() || !form.data) {
            toast.error("Preencha ao menos o título e a data.");
            return;
        }

        const dados = {
            tipo: form.tipo,
            titulo: form.titulo.trim(),
            data: form.data,
            hora: form.hora || null,
            local: form.local || null,
            descricao: form.descricao || null,
            processoId: form.processoId || null,
        };

        setSalvando(true);
        try {
            if (form._id) {
                await eventService.updateEvent(form._id, dados, form.updatedAt);
                toast.success("Compromisso atualizado com sucesso.");
            } else {
                await eventService.createEvent(dados);
                toast.success("Compromisso criado com sucesso.");
            }
            fecharForm();
            buscarCalendario();
        } catch (err) {
            if (err.enfileirado) {
                toast.success(`${err.message} Ele aparece na agenda depois do envio.`);
                fecharForm();
                return;
            }
            toast.error(getApiErrorMessage(err, "Erro ao salvar compromisso."));
        } finally {
            setSalvando(false);
        }
    };

    const handleConcluir = async () => {
        try {
            await eventService.concludeEvent(form._id, !form.concluido, form.updatedAt);
            toast.success(form.concluido ? "Compromisso reaberto." : "Compromisso concluído.");
            fecharForm();
            buscarCalendario();
        } catch (err) {
            if (err.enfileirado) {
                toast.success(err.message);
                fecharForm();
                return;
            }
            toast.error(getApiErrorMessage(err, "Erro ao concluir compromisso."));
        }
    };

    const confirmarExclusao = () => setModalExcluir({ aberto: true, id: form._id });

    const handleExcluir = async () => {
        const { id } = modalExcluir;
        setModalExcluir({ aberto: false, id: null });
        try {
            await eventService.deleteEvent(id);
            toast.success("Compromisso excluído com sucesso.");
            fecharForm();
            buscarCalendario();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Erro ao excluir compromisso."));
        }
    };

    const itemConcluido = (item) => (item.natureza === "evento" ? item.concluido : item.status === "pago");

    const renderItem = (item) => {
        const cor = item.natureza === "evento" ? "calendarioEvento--evento" : "calendarioEvento--derivada";
        const concluido = itemConcluido(item) ? "calendarioEvento--concluido" : "";

        const aoClicar = (e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setEventoPopup({ item, top: rect.bottom + 6, left: rect.left });
        };

        if (!item.hora) {
            return (
                <button
                    type="button"
                    key={item._id}
                    className={`calendarioEventoBarra ${cor} ${concluido}`}
                    title={item.titulo}
                    onClick={aoClicar}
                >
                    {item.titulo}
                </button>
            );
        }

        return (
            <button
                type="button"
                key={item._id}
                className={`calendarioEventoLinha ${cor} ${concluido}`}
                title={`${item.hora} — ${item.titulo}`}
                onClick={aoClicar}
            >
                <span className="calendarioEventoPonto" />
                <span className="calendarioEventoHora">{item.hora}</span>
                <span className="calendarioEventoTitulo">{item.titulo}</span>
            </button>
        );
    };

    if (carregando && Object.keys(itensPorDia).length === 0) return <Loading />;

    const LARGURA_POPUP = 300;

    const diaPopupInfo = diaPopup
        ? (() => {
            const [anoP, mesP, diaP] = diaPopup.chave.split("-").map(Number);
            const larguraJanela = window.innerWidth;
            const alturaJanela = window.innerHeight;

            const left = Math.min(Math.max(diaPopup.left, 12), larguraJanela - LARGURA_POPUP - 12);
            const top = Math.min(Math.max(diaPopup.top, 12), alturaJanela - 400);

            return { data: new Date(anoP, mesP - 1, diaP), numero: diaP, top, left };
        })()
        : null;

    const eventoPopupInfo = eventoPopup
        ? (() => {
            const [anoE, mesE, diaE] = eventoPopup.item.data.split("-").map(Number);
            const larguraJanela = window.innerWidth;
            const alturaJanela = window.innerHeight;

            const left = Math.min(Math.max(eventoPopup.left, 12), larguraJanela - LARGURA_POPUP - 12);
            const top = Math.min(Math.max(eventoPopup.top, 12), alturaJanela - 320);

            return { data: new Date(anoE, mesE - 1, diaE), top, left };
        })()
        : null;

    return (
        <div className="tela telaCalendario">
            <div className="baloesTelasAdvogada calendarioCardPrincipal">
                <div className="calendarioCabecalhoTopo">
                    <div className="calendarioCabecalhoEsquerda">
                        <h1 className="calendarioTitulo">Calendário</h1>

                        <button type="button" className="calendarioBotaoHoje" onClick={irParaHoje} title="Voltar para hoje">Hoje</button>

                        <div className="calendarioSetasGrupo">
                            <button type="button" className="calendarioSeta" onClick={irParaAnterior} title="Período anterior">
                                <span className="calendarioSetaIcone calendarioSetaIcone--esquerda" />
                            </button>
                            <button type="button" className="calendarioSeta" onClick={irParaProximo} title="Próximo período">
                                <span className="calendarioSetaIcone calendarioSetaIcone--direita" />
                            </button>
                        </div>

                        {vistaAtual !== "ano" && (
                            <div className="select calendarioSelectNav">
                                <select value={mes} onChange={mudarMes} className="selectForm">
                                    {MESES.map((nome, indice) => (
                                        <option key={nome} value={indice}>{capitalizar(nome)}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="select calendarioSelectNav">
                            <select value={ano} onChange={mudarAno} className="selectForm">
                                {anos.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>

                        {textoPeriodo && <span className="calendarioPeriodoTexto">{textoPeriodo}</span>}
                    </div>

                    <div className="calendarioCabecalhoDireita">
                        <div className="calendarioBusca">
                            <img src={lupa} alt="" className="calendarioBuscaIcone" />
                            <input
                                type="text"
                                className="calendarioBuscaInput"
                                placeholder="Buscar"
                                value={buscaTexto}
                                onChange={(e) => setBuscaTexto(e.target.value)}
                            />
                            {buscaTexto && (
                                <button
                                    type="button"
                                    className="calendarioBuscaLimpar"
                                    onClick={() => setBuscaTexto("")}
                                    title="Limpar busca"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="calendarioVistaContainer">
                            <button
                                type="button"
                                className="calendarioVistaBotao"
                                onClick={() => setVistaMenuAberto((v) => !v)}
                                title="Trocar a visualização (atalhos: D, W, M, Y, A)"
                            >
                                {VISTA_OPTIONS.find((o) => o.value === vistaAtual)?.label}
                                <span className="calendarioSetaIcone calendarioSetaIcone--baixo" />
                            </button>

                            {vistaMenuAberto && (
                                <>
                                    <div className="calendarioVistaFundo" onClick={() => setVistaMenuAberto(false)} />
                                    <div className="calendarioVistaMenu">
                                        {VISTA_OPTIONS.map((opcao) => (
                                            <button
                                                type="button"
                                                key={opcao.value}
                                                className={`calendarioVistaItem ${opcao.value === vistaAtual ? "calendarioVistaItem--ativa" : ""}`}
                                                onClick={() => selecionarVista(opcao.value)}
                                            >
                                                <span>{opcao.label}</span>
                                                <span className="calendarioVistaAtalho">{opcao.atalho}</span>
                                            </button>
                                        ))}

                                        <div className="calendarioVistaDivisor" />

                                        <label className="calendarioVistaCheckbox">
                                            <input
                                                type="checkbox"
                                                checked={mostrarFinsDeSemana}
                                                onChange={() => setMostrarFinsDeSemana((v) => !v)}
                                            />
                                            Mostrar fins de semana
                                        </label>

                                        <label className="calendarioVistaCheckbox">
                                            <input
                                                type="checkbox"
                                                checked={mostrarConcluidas}
                                                onChange={() => setMostrarConcluidas((v) => !v)}
                                            />
                                            Mostrar tarefas concluídas
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>

                        <button type="button" className="calendarioNovo" onClick={() => abrirNovo()} title="Novo compromisso">+</button>
                    </div>
                </div>

                {erro && <p className="mensagemErro">{erro}</p>}

                {vistaAtual === "mes" && (
                    <>
                        <div className="calendarioGradeCabecalho" style={{ gridTemplateColumns: `repeat(${colunasGrade}, 1fr)` }}>
                            {diasSemanaVisiveis.map((dia) => <div key={dia}>{dia}</div>)}
                        </div>

                        <div className="calendarioGrade" style={{ gridTemplateColumns: `repeat(${colunasGrade}, 1fr)` }}>
                            {diasVisiveis.map((dia) => {
                                const chave = paraChave(dia);
                                const itensDoDia = (itensPorDia[chave] ?? []).filter(itemVisivelPeloFiltro);
                                const foraDoMes = dia.getMonth() !== mes;
                                const ehHoje = hojeServidor === chave;
                                const itensVisiveis = itensDoDia.slice(0, LIMITE_VISIVEL);
                                const restantes = itensDoDia.length - itensVisiveis.length;

                                return (
                                    <div
                                        key={chave}
                                        className={`calendarioDia ${foraDoMes ? "calendarioDia--foraDoMes" : ""}`}
                                        onClick={() => abrirNovo(chave)}
                                        title="Clique para criar um compromisso neste dia"
                                    >
                                        <span className={`calendarioDiaNumero ${ehHoje ? "calendarioDiaNumero--hoje" : ""}`}>
                                            {dia.getDate()}
                                        </span>

                                        <div className="calendarioDiaEventos">
                                            {itensVisiveis.map((item) => renderItem(item))}

                                            {restantes > 0 && (
                                                <button title="Ver todos os compromissos deste dia"
                                                    type="button"
                                                    className="calendarioMaisChip"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setDiaPopup({ chave, top: rect.bottom + 6, left: rect.left });
                                                    }}
                                                >
                                                    Mais {restantes}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {vistaAtual === "semana" && (
                    <div className="calendarioSemana" style={{ gridTemplateColumns: `repeat(${diasDaSemanaVisiveis.length}, 1fr)` }}>
                        {diasDaSemanaVisiveis.map((dia) => {
                            const chave = paraChave(dia);

                            return (
                                <div key={chave} className="calendarioSemanaColuna" onClick={() => abrirNovo(chave)}>
                                    <button title="Abrir este dia"
                                        type="button"
                                        className="calendarioSemanaCabecalho"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            abrirDia(dia);
                                        }}
                                    >
                                        <span className="calendarioSemanaNome">{DIAS_SEMANA[dia.getDay()]}</span>
                                        <span className={`calendarioDiaNumero ${hojeServidor === chave ? "calendarioDiaNumero--hoje" : ""}`}>
                                            {dia.getDate()}
                                        </span>
                                    </button>

                                    <div className="calendarioDiaEventos">
                                        {itensDe(chave).map((item) => renderItem(item))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {vistaAtual === "dia" && (
                    <div className="calendarioDiaVista" onClick={() => abrirNovo(paraChave(dataAtual))}>
                        {itensDe(paraChave(dataAtual)).length === 0 ? (
                            <p className="calendarioSemItens">Nenhum compromisso ou vencimento neste dia.</p>
                        ) : (
                            <div className="calendarioListaItens">
                                {itensDe(paraChave(dataAtual)).map((item) => renderItem(item))}
                            </div>
                        )}
                    </div>
                )}

                {vistaAtual === "ano" && (
                    <div className="calendarioAno">
                        {MESES.map((nomeMes, indiceMes) => (
                            <div key={nomeMes} className="calendarioAnoMes">
                                <button title="Abrir este mês" type="button" className="calendarioAnoMesTitulo" onClick={() => abrirMes(indiceMes)}>
                                    {capitalizar(nomeMes)}
                                </button>

                                <div className="calendarioAnoGrade">
                                    {DIAS_SEMANA.map((dia) => <span key={dia} className="calendarioAnoSemana">{dia.charAt(0)}</span>)}

                                    {diasDaGradeDoMes(ano, indiceMes).map((dia) => {
                                        const chave = paraChave(dia);

                                        if (dia.getMonth() !== indiceMes) return <span key={chave} />;

                                        return (
                                            <button title="Abrir este dia"
                                                type="button"
                                                key={chave}
                                                className={`calendarioAnoDia ${itensDe(chave).length > 0 ? "calendarioAnoDia--comItens" : ""} ${hojeServidor === chave ? "calendarioAnoDia--hoje" : ""}`}
                                                onClick={() => abrirDia(dia)}
                                            >
                                                {dia.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {vistaAtual === "programacao" && (
                    <div className="calendarioProgramacao">
                        {Object.keys(itensPorDia)
                            .filter((chave) => chave >= inicioChave && chave <= fimChave && itensDe(chave).length > 0)
                            .sort()
                            .map((chave) => {
                                const [anoP, mesP, diaP] = chave.split("-").map(Number);
                                const dia = new Date(anoP, mesP - 1, diaP);

                                return (
                                    <div key={chave} className="calendarioProgramacaoDia">
                                        <button title="Abrir este dia" type="button" className="calendarioProgramacaoData" onClick={() => abrirDia(dia)}>
                                            <span className={`calendarioDiaNumero ${hojeServidor === chave ? "calendarioDiaNumero--hoje" : ""}`}>
                                                {diaP}
                                            </span>
                                            <span className="calendarioProgramacaoSemana">
                                                {MESES[mesP - 1].slice(0, 3).toUpperCase()}, {DIAS_SEMANA[dia.getDay()]}
                                            </span>
                                        </button>

                                        <div className="calendarioListaItens">
                                            {itensDe(chave).map((item) => renderItem(item))}
                                        </div>
                                    </div>
                                );
                            })}

                        {Object.keys(itensPorDia).every((chave) => chave < inicioChave || chave > fimChave || itensDe(chave).length === 0) && (
                            <p className="calendarioSemItens">Nenhum compromisso ou vencimento neste mês.</p>
                        )}
                    </div>
                )}
            </div>

            {diaPopupInfo && (
                <>
                    <div className="calendarioDiaPopupFundo" onClick={() => setDiaPopup(null)} />

                    <div
                        className="calendarioDiaPopup"
                        style={{ top: diaPopupInfo.top, left: diaPopupInfo.left, width: LARGURA_POPUP }}
                    >
                        <button type="button" className="calendarioDiaPopupFechar" onClick={() => setDiaPopup(null)} title="Fechar">×</button>

                        <div className="calendarioDiaPopupCabecalho">
                            <span className="calendarioDiaPopupSemana">{DIAS_SEMANA[diaPopupInfo.data.getDay()]}.</span>
                            <span className="calendarioDiaPopupNumero">{diaPopupInfo.numero}</span>
                        </div>

                        <div className="calendarioDiaPopupLista">
                            {(itensPorDia[diaPopup.chave] ?? []).filter(itemVisivelPeloFiltro).length === 0 ? (
                                <p className="calendarioSemItens">Nenhum compromisso ou vencimento neste dia.</p>
                            ) : (
                                (itensPorDia[diaPopup.chave] ?? []).filter(itemVisivelPeloFiltro).map((item) => renderItem(item))
                            )}
                        </div>

                        <button title="Criar um compromisso neste dia"
                            type="button"
                            className="calendarioDiaPopupNovo"
                            onClick={() => {
                                const chave = diaPopup.chave;
                                setDiaPopup(null);
                                abrirNovo(chave);
                            }}
                        >
                            + Novo compromisso
                        </button>
                    </div>
                </>
            )}

            {eventoPopupInfo && (
                <>
                    <div className="calendarioDiaPopupFundo calendarioEventoPopupFundo" onClick={() => setEventoPopup(null)} />

                    <div
                        className="calendarioEventoPopup"
                        style={{ top: eventoPopupInfo.top, left: eventoPopupInfo.left, width: LARGURA_POPUP }}
                    >
                        <div className="calendarioEventoPopupAcoes">
                            {eventoPopup.item.natureza === "evento" ? (
                                <>
                                    <button
                                        type="button"
                                        title="Editar"
                                        onClick={() => {
                                            abrirEdicao(eventoPopup.item);
                                            setEventoPopup(null);
                                        }}
                                    >
                                        <img src={lapis} alt="Editar" />
                                    </button>

                                    <button
                                        type="button"
                                        title="Excluir"
                                        onClick={() => {
                                            setModalExcluir({ aberto: true, id: eventoPopup.item._id });
                                            setEventoPopup(null);
                                        }}
                                    >
                                        <img src={lixeira} alt="Excluir" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    title="Ir para o Financeiro"
                                    onClick={() => {
                                        setEventoPopup(null);
                                        navigate("/financeiro");
                                    }}
                                >
                                    <img src={folder} alt="Ir para o Financeiro" />
                                </button>
                            )}
                            <button
                                type="button"
                                title="Fechar"
                                onClick={() => {
                                    setEventoPopup(null);
                                }}
                            >
                                <img src={fechar} alt="Fechar pop-up" />
                            </button>
                        </div>

                        <div className="calendarioEventoPopupTitulo">
                            <span className={`calendarioEventoPopupBolinha ${eventoPopup.item.natureza === "evento" ? "calendarioEventoPopupBolinha--evento" : "calendarioEventoPopupBolinha--derivada"} ${itemConcluido(eventoPopup.item) ? "calendarioEvento--concluido" : ""}`} />
                            <span className={itemConcluido(eventoPopup.item) ? "calendarioEvento--concluido" : ""}>
                                {eventoPopup.item.titulo}
                            </span>
                        </div>

                        <p className="calendarioEventoPopupData">
                            {DIAS_SEMANA_EXTENSO[eventoPopupInfo.data.getDay()]}, {eventoPopupInfo.data.getDate()} de {MESES[eventoPopupInfo.data.getMonth()]}
                            {eventoPopup.item.hora && ` · ${eventoPopup.item.hora}`}
                        </p>

                        {eventoPopup.item.natureza === "evento" ? (
                            <>
                                {eventoPopup.item.local && (
                                    <p className="calendarioEventoPopupDetalhe calendarioEventoPopupDetalhe--icone">
                                        <img src={localizacao} alt="" />
                                        <span>{eventoPopup.item.local}</span>
                                    </p>
                                )}

                                {eventoPopup.item.processo?.titulo && (
                                    <p className="calendarioEventoPopupDetalhe calendarioEventoPopupDetalhe--icone">
                                        <img src={folder} alt="" />
                                        <span>{eventoPopup.item.processo.titulo}</span>
                                    </p>
                                )}

                                {eventoPopup.item.descricao && (
                                    <p className="calendarioEventoPopupDetalhe">{eventoPopup.item.descricao}</p>
                                )}
                            </>
                        ) : (
                            <>
                                {eventoPopup.item.valor != null && (
                                    <p className="calendarioEventoPopupDetalhe">
                                        Valor: {formatCurrency(eventoPopup.item.valor)}
                                        {eventoPopup.item.valorPago > 0 && ` (pago: ${formatCurrency(eventoPopup.item.valorPago)})`}
                                    </p>
                                )}

                                <p className="calendarioEventoPopupDetalhe">
                                    Status: {labelDe(STATUS_PARCELA_OPTIONS, eventoPopup.item.status) ?? eventoPopup.item.status}
                                </p>

                                {eventoPopup.item.processo?.titulo && (
                                    <p className="calendarioEventoPopupDetalhe calendarioEventoPopupDetalhe--icone">
                                        <img src={folder} alt="" />
                                        <span>{eventoPopup.item.processo.titulo}</span>
                                    </p>
                                )}

                                <p className="calendarioEventoPopupNota">
                                    Parcelas são editadas no Financeiro, não pelo calendário.
                                </p>
                            </>
                        )}
                    </div>
                </>
            )}

            {form && (
                <div className="modalOverlay" onClick={fecharForm}>
                    <div className="modalCaixa calendarioFormCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">{form._id ? "Editar compromisso" : "Novo compromisso"}</h2>

                        <form onSubmit={handleSalvar} className="calendarioForm">
                            <div className="divLabelTop">
                                <label htmlFor="tipo">Tipo</label>
                                <select id="tipo" name="tipo" className="select selectForm" value={form.tipo} onChange={handleFormChange}>
                                    {TIPO_EVENTO_OPTIONS.map((opcao) => (
                                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="titulo">Título</label>
                                <input id="titulo" name="titulo" type="text" maxLength={200} value={form.titulo} onChange={handleFormChange} required />
                            </div>

                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="data">Data</label>

                                    <div className="calendarioCampoIcone">
                                        <input
                                            id="data"
                                            name="data"
                                            type="date"
                                            value={form.data}
                                            onChange={handleFormChange}
                                            required
                                        />

                                        <img src={calendario} alt="" />
                                    </div>
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="hora">Hora (opcional)</label>

                                    <div className="calendarioCampoIcone">
                                        <input
                                            id="hora"
                                            name="hora"
                                            type="time"
                                            value={form.hora}
                                            onChange={handleFormChange}
                                        />

                                        <img src={relogio} alt="" />
                                    </div>
                                </div>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="local">Local (opcional)</label>
                                <input id="local" name="local" type="text" maxLength={200} value={form.local} onChange={handleFormChange} />
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="processoId">Processo (opcional)</label>
                                <FiltroDeOpcoes valor={filtroProcesso} onChange={setFiltroProcesso} total={processos.length} placeholder="Buscar processo pelo título ou número..." />
                                <select id="processoId" name="processoId" className="select selectForm" value={form.processoId} onChange={handleFormChange}>
                                    <option value="">Nenhum</option>
                                    {filtrarOpcoes(processos, filtroProcesso, (p) => `${p.titulo ?? ""} ${p.numeroProcesso ?? ""} ${nomeDoCliente(p.clientePrincipalId)}`, form.processoId).map((processo) => (
                                        <option key={processo._id} value={processo._id}>
                                            {processo.titulo ?? "Processo"} — {nomeDoCliente(processo.clientePrincipalId)}{processo.numeroProcesso ? ` — nº ${processo.numeroProcesso}` : ""}
                                        </option>
                                    ))}
                                </select>
                                <small className="notaCampo">Vinculado a um processo, o compromisso também aparece na linha do tempo dele.</small>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="descricao">Descrição (opcional)</label>
                                <textarea id="descricao" name="descricao" rows={3} maxLength={2000} value={form.descricao} onChange={handleFormChange} />
                            </div>

                            <div className="modalAcoes calendarioFormAcoes">
                                {form._id && (
                                    <>
                                        <button title={form.concluido ? "Voltar o compromisso para pendente" : "Marcar o compromisso como feito"} type="button" className="buttonOutlined modalBotao" onClick={handleConcluir}>
                                            {form.concluido ? "Reabrir" : "Concluir"}
                                        </button>
                                        <button title="Excluir este compromisso" type="button" className="modalBotao modalBotaoPerigo" onClick={confirmarExclusao}>
                                            Excluir
                                        </button>
                                    </>
                                )}
                                <button type="button" className="buttonOutlined modalBotao" onClick={fecharForm}>Cancelar</button>
                                <button type="submit" className="button modalBotao" disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Modal
                aberto={modalExcluir.aberto}
                titulo="Excluir compromisso"
                mensagem="Tem certeza que deseja excluir este compromisso? Esta ação não pode ser desfeita."
                perigo
                labelConfirmar="Excluir"
                onConfirmar={handleExcluir}
                onCancelar={() => setModalExcluir({ aberto: false, id: null })}
            />
        </div>
    );
}

export default Calendario;