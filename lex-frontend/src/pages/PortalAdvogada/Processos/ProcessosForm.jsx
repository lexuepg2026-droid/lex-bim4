import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";
import Loading from "../../../components/Loading/Loading";

import processService from "../../../services/processService";
import clientService from "../../../services/clientService";

import { getApiErrorMessage } from "../../../utils/apiError";
import { toast } from "../../../utils/toast";
import { corDoStatus } from "../../../utils/statusProcesso";
import { nomeDoCliente, labelDe } from "../../../utils/enums";
import { buscarTudo } from "../../../utils/buscarTudo";
import { useTabela } from "../../../hooks/useTabela";
import FiltroDeOpcoes from "../../../components/FiltroDeOpcoes/FiltroDeOpcoes";
import { filtrarOpcoes } from "../../../utils/filtrarOpcoes";
import { STATUS_PROCESSO_OPTIONS, FASE_PROCESSO_OPTIONS, PAPEL_PROCESSO_OPTIONS } from "../../../utils/enums";

import Ajuda from "../../../components/Ajuda/Ajuda";
import { AJUDA } from "../../../components/Ajuda/textos";
import "./Processos.css";

const FORM_VAZIO = {
    titulo: "",
    numeroProcesso: "",
    tipoAcao: "",
    area: "",
    orgao: "",
    vara: "",
    comarca: "",
    status: "ativo",
    dataDistribuicao: "",
    descricao: "",
    liminar: false,
    liminarObservacao: "",
    liminarEm: "",
};

function ProcessosForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const editando = Boolean(id);

    const [formData, setFormData] = useState(FORM_VAZIO);
    const [clienteId, setClienteId] = useState(location.state?.clienteId ?? "");
    const [papel, setPapel] = useState("autor");
    const [tiposDeAcao, setTiposDeAcao] = useState([]);
    const [classesCnj, ativarClassesCnj] = useTabela("classesCnj");
    const [assuntosCnj, ativarAssuntosCnj] = useTabela("assuntosCnj");
    const [comarcas, ativarComarcas] = useTabela("comarcas");
    const [clientes, setClientes] = useState([]);
    const [filtroCliente, setFiltroCliente] = useState("");

    const [fase, setFase] = useState("conhecimento");
    const [versao, setVersao] = useState(null);
    const [motivoFase, setMotivoFase] = useState("");
    const [salvandoFase, setSalvandoFase] = useState(false);

    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(editando);

    useEffect(() => {
        processService.listarTiposDeAcao()
            .then((res) => setTiposDeAcao(res.data.data ?? []))
            .catch((err) => toast.error(getApiErrorMessage(err, "Não foi possível carregar os tipos de ação.")));
    }, []);

    useEffect(() => {
        buscarTudo(clientService.getAllClients)
            .then(setClientes)
            .catch((err) => toast.error(getApiErrorMessage(err, "Não foi possível carregar os clientes.")));
    }, []);

    useEffect(() => {
        if (!editando) return;
        processService.getProcessById(id)
            .then((res) => {
                const d = res.data;
                setFormData({
                    titulo: d.titulo || "",
                    numeroProcesso: d.numeroProcesso || "",
                    tipoAcao: d.tipoAcao || "",
                    area: d.area || "",
                    orgao: d.orgao || "",
                    vara: d.vara || "",
                    comarca: d.comarca || "",
                    status: d.status || "ativo",
                    dataDistribuicao: d.dataDistribuicao ? String(d.dataDistribuicao).slice(0, 10) : "",
                    descricao: d.descricao || "",
                    liminar: d.liminar === true,
                    liminarObservacao: d.liminarObservacao || "",
                    liminarEm: d.liminarEm ? String(d.liminarEm).slice(0, 10) : "",
                });
                setFase(d.fase || "conhecimento");
                setVersao(d.updatedAt ?? null);
            })
            .catch((err) => setErro(getApiErrorMessage(err, "Falha ao carregar dados do processo.")))
            .finally(() => setCarregando(false));
    }, [id, editando]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const opcional = (valor) => {
        const v = typeof valor === "string" ? valor.trim() : valor;
        if (v) return v;
        return editando ? null : undefined;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro("");
        setSalvando(true);

        const payload = {
            titulo: formData.titulo.trim(),
            numeroProcesso: opcional(formData.numeroProcesso),
            tipoAcao: opcional(formData.tipoAcao),
            area: opcional(formData.area),
            orgao: opcional(formData.orgao),
            vara: opcional(formData.vara),
            comarca: opcional(formData.comarca),
            ...(editando && { status: formData.status }),
            dataDistribuicao: opcional(formData.dataDistribuicao),
            descricao: opcional(formData.descricao),
            liminar: formData.liminar,
            liminarObservacao: opcional(formData.liminarObservacao),
            liminarEm: opcional(formData.liminarEm),
        };

        try {
            if (editando) {
                await processService.updateProcess(id, payload);
                toast.success("Processo atualizado com sucesso.");
                navigate(`/processos/detalhes/${id}`);
            } else {
                if (!clienteId) {
                    setErro("Selecione o cliente principal do processo.");
                    setSalvando(false);
                    return;
                }
                payload.clientes = [{ clienteId, papel, principal: true }];
                const res = await processService.createProcess(payload);
                toast.success("Processo cadastrado com sucesso.");
                navigate(`/processos/detalhes/${res.data._id}`);
            }
        } catch (err) {
            setErro(getApiErrorMessage(err, "Erro ao salvar processo. Verifique os dados."));
        } finally {
            setSalvando(false);
        }
    };

    const salvarFase = async () => {
        setSalvandoFase(true);
        try {
            const res = await processService.changePhase(id, { fase, motivo: motivoFase.trim() || undefined }, versao);
            setVersao(res.data?.updatedAt ?? versao);
            toast.success("Fase atualizada com sucesso.");
            setMotivoFase("");
        } catch (err) {
            if (err.enfileirado) {
                toast.success(err.message);
                setMotivoFase("");
                return;
            }
            toast.error(getApiErrorMessage(err, "Erro ao mudar a fase."));
        } finally {
            setSalvandoFase(false);
        }
    };

    if (carregando) return <Loading />;

    return (
        <div className="tela telaClientes">
            <BotaoVoltar />
            <div className="baloesTelasAdvogada">
                {editando ? (
                    <div className="detalheTopo">
                        <div className="detalheIdentidade">
                            <span className="detalheAvatar" style={{ backgroundColor: corDoStatus(formData.status) }} />
                            <div>
                                <h1 className="tituloPagina">{formData.titulo || "Processo"}</h1>
                                <p className="detalheSubtitulo">{labelDe(STATUS_PROCESSO_OPTIONS, formData.status)}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="tituloPagina">Registrar novo processo</h1>
                        <p className="notaForm">O processo começa como Ativo, na fase de conhecimento. Status e fase podem ser mudados depois, na edição.</p>
                    </>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="secaoForm">
                        <h3>Dados do processo</h3>
                        <div className="tituloInput informacaoNormal">
                            <label>Título*</label>
                            <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required aria-describedby="apoio-processo-titulo" />
                            <small className="notaCampo" id="apoio-processo-titulo">Nome curto para reconhecer o processo nas listas. O cliente também vê no portal.</small>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Número do processo</label>
                            <input type="text" name="numeroProcesso" value={formData.numeroProcesso} onChange={handleChange} aria-describedby="apoio-processo-numero" />
                            <small className="notaCampo" id="apoio-processo-numero">Número CNJ, se já existir. Ex.: 0001234-56.2026.8.16.0019</small>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Tipo de ação<Ajuda assunto={AJUDA.processoTipoAcao.assunto}>{AJUDA.processoTipoAcao.texto}</Ajuda></label>
                            <input type="text" name="tipoAcao" list="tiposDeAcao" value={formData.tipoAcao} onChange={handleChange} onFocus={ativarClassesCnj} aria-describedby="apoio-processo-tipo" />
                            <datalist id="tiposDeAcao">
                                {[...new Set([...tiposDeAcao, ...classesCnj])].map((tipo) => <option key={tipo} value={tipo} />)}
                            </datalist>
                            <small className="notaCampo" id="apoio-processo-tipo">Sugere os tipos que você já usou e as classes do CNJ, mas aceita qualquer texto. A lista de processos é agrupada por ele.</small>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Área</label>
                            <input type="text" name="area" list="assuntosCnj" value={formData.area} onChange={handleChange} onFocus={ativarAssuntosCnj} aria-describedby="apoio-processo-area" />
                            <datalist id="assuntosCnj">
                                {assuntosCnj.map((assunto) => <option key={assunto} value={assunto} />)}
                            </datalist>
                            <small className="notaCampo" id="apoio-processo-area">Sugere os assuntos do CNJ. Ex.: Direito Previdenciário.</small>
                        </div>
                        {editando && (
                            <div className="tituloInput informacaoPequena">
                                <label>Status<Ajuda assunto={AJUDA.processoStatus.assunto}>{AJUDA.processoStatus.texto}</Ajuda></label>
                                <div className="select">
                                    <select name="status" value={formData.status} onChange={handleChange} aria-describedby="apoio-processo-status">
                                        {STATUS_PROCESSO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <small className="notaCampo" id="apoio-processo-status">Situação administrativa. O andamento é a fase, mais abaixo.</small>
                            </div>
                        )}
                        <div className="tituloInput informacaoPequena">
                            <label>Órgão</label>
                            <input type="text" name="orgao" value={formData.orgao} onChange={handleChange} />
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Vara</label>
                            <input type="text" name="vara" value={formData.vara} onChange={handleChange} />
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Comarca</label>
                            <input type="text" name="comarca" list="comarcasPr" value={formData.comarca} onChange={handleChange} onFocus={ativarComarcas} aria-describedby="apoio-processo-comarca" />
                            <datalist id="comarcasPr">
                                {comarcas.map((comarca) => <option key={comarca} value={comarca} />)}
                            </datalist>
                            <small className="notaCampo" id="apoio-processo-comarca">Sugere as comarcas do Paraná, mas aceita qualquer outra.</small>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Data de distribuição</label>
                            <input type="date" name="dataDistribuicao" value={formData.dataDistribuicao} onChange={handleChange} />
                        </div>
                        <div className="tituloInput informacaoGrande">
                            <label>Descrição</label>
                            <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={3} aria-describedby="apoio-processo-descricao" />
                            <small className="notaCampo" id="apoio-processo-descricao">O cliente lê este texto no portal. Escreva de um jeito que ele entenda.</small>
                        </div>
                    </div>

                    <div className="secaoForm">
                        <h3>Liminar<Ajuda assunto={AJUDA.processoLiminar.assunto}>{AJUDA.processoLiminar.texto}</Ajuda></h3>
                        <p className="notaForm">Informação interna: a liminar e a observação dela não aparecem no portal do cliente.</p>
                        <div className="tituloInput informacaoGrande campoCheckbox">
                            <label>
                                <input type="checkbox" name="liminar" checked={formData.liminar} onChange={handleChange} />
                                Este processo tem liminar
                            </label>
                        </div>
                        {formData.liminar && (
                            <>
                                <div className="tituloInput informacaoNormal">
                                    <label>Observação da liminar</label>
                                    <input type="text" name="liminarObservacao" value={formData.liminarObservacao} onChange={handleChange} />
                                </div>
                                <div className="tituloInput informacaoPequena">
                                    <label>Data da liminar</label>
                                    <input type="date" name="liminarEm" value={formData.liminarEm} onChange={handleChange} />
                                </div>
                            </>
                        )}
                    </div>

                    {!editando && (
                        <div className="secaoForm">
                            <h3>Cliente principal</h3>
                            <div className="tituloInput informacaoNormal">
                                <label>Cliente*</label>
                                <FiltroDeOpcoes valor={filtroCliente} onChange={setFiltroCliente} total={clientes.length} placeholder="Buscar cliente pelo nome..." />
                                <div className="select">
                                    <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
                                        <option value="">Selecione…</option>
                                        {filtrarOpcoes(clientes, filtroCliente, nomeDoCliente, clienteId).map((cliente) => (
                                            <option key={cliente._id} value={cliente._id}>{nomeDoCliente(cliente)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="tituloInput informacaoPequena">
                                <label>Papel</label>
                                <div className="select">
                                    <select value={papel} onChange={(e) => setPapel(e.target.value)}>
                                        {PAPEL_PROCESSO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <small className="notaCampo">O cliente vê o próprio papel no portal, com uma explicação.</small>
                            </div>
                            <p className="notaForm">
                                Outros participantes podem ser adicionados depois, na tela de detalhe do processo.
                            </p>
                        </div>
                    )}

                    {erro && <p className="mensagemErro">{erro}</p>}

                    <div className="acoesForm">
                        <button type="button" onClick={() => navigate("/processos")} className="buttonOutlined">Cancelar</button>
                        <button type="submit" disabled={salvando} className="button">
                            {salvando ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </form>

                {editando && (
                    <div className="secaoForm">
                        <h3>Fase do processo<Ajuda assunto={AJUDA.processoFase.assunto}>{AJUDA.processoFase.texto}</Ajuda></h3>
                        <div className="tituloInput informacaoNormal">
                            <label>Fase atual</label>
                            <div className="select">
                                <select value={fase} onChange={(e) => setFase(e.target.value)}>
                                    {FASE_PROCESSO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="tituloInput informacaoNormal">
                            <label>Motivo da mudança (opcional)</label>
                            <input type="text" value={motivoFase} onChange={(e) => setMotivoFase(e.target.value)} maxLength={2000} />
                        </div>
                        <div className="tituloInput informacaoPequena campoAcaoFase">
                            <button title="Salva só a fase, sem mexer no resto do formulário" type="button" className="buttonOutlined" onClick={salvarFase} disabled={salvandoFase}>
                                {salvandoFase ? "Salvando..." : "Salvar fase"}
                            </button>
                        </div>
                        <p className="notaForm">
                            A fase é registrada separadamente porque cada mudança fica guardada na linha do tempo do processo.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProcessosForm;