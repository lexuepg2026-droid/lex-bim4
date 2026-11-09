import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";

import clientService from "../../../services/clientService";

import { toast } from "../../../utils/toast";
import { getApiErrorMessage, getApiErrorField } from "../../../utils/apiError";
import { maskCPF, maskCNPJ, maskCEP, maskPhone, unmask } from "../../../utils/masks";
import { UFS, SEXO_OPTIONS, ESTADO_CIVIL_OPTIONS, TIPO_PESSOA_OPTIONS, labelDe, nomeDoCliente } from "../../../utils/enums";
import { buscarEnderecoPorCEP } from "../../../utils/viacep";
import { corDoAvatar, inicialDoAvatar } from "../../../utils/avatarCliente";
import { buscarCidadesPorEstado } from "../../../utils/ibge";
import { useTabela } from "../../../hooks/useTabela";

import "./Clientes.css";
import Ajuda from "../../../components/Ajuda/Ajuda";
import { AJUDA } from "../../../components/Ajuda/textos";

function ClientesForm() {
    const [tipoPessoa, setTipoPessoa] = useState("fisica");
    const [formData, setFormData] = useState({
        nomeCompleto: "", cpf: "",
        rg: "", dataNascimento: "", sexo: "", estadoCivil: "", profissao: "", nacionalidade: "brasileira",
        razaoSocial: "", nomeFantasia: "", cnpj: "",
        repNome: "", repCpf: "", repCargo: "",
        email: "", telefone: "",
        cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", pais: "",
        observacoes: "",
        senhaPortal: "",
    });

    const [portal, setPortal] = useState({ provisoria: false, definidaEm: null });
    const [revogando, setRevogando] = useState(false);
    const [confirmandoRevogacao, setConfirmandoRevogacao] = useState(false);
    const [erro, setErro] = useState("");
    const [campoComErro, setCampoComErro] = useState(null);
    const [cepCarregando, setCepCarregando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [cidadesDisponiveis, setCidadesDisponiveis] = useState([]);
    const [profissoes, ativarProfissoes] = useTabela("profissoes");
    const [nacionalidades, ativarNacionalidades] = useTabela("nacionalidades");
    const [carregandoCidades, setCarregandoCidades] = useState(false);

    const navigate = useNavigate();
    const { id } = useParams();
    const editando = Boolean(id);

    useEffect(() => {
        if (!editando) return;
        const buscarCliente = async () => {
            try {
                const res = await clientService.getClientById(id);
                const d = res.data;
                setTipoPessoa(d.tipoPessoa);
                setFormData({
                    nomeCompleto: d.nomeCompleto || "",
                    cpf: maskCPF(d.cpf || ""),
                    rg: d.rg || "",
                    dataNascimento: d.dataNascimento ? String(d.dataNascimento).slice(0, 10) : "",
                    sexo: d.sexo || "",
                    estadoCivil: d.estadoCivil || "",
                    profissao: d.profissao || "",
                    nacionalidade: d.nacionalidade || "",
                    razaoSocial: d.razaoSocial || "",
                    nomeFantasia: d.nomeFantasia || "",
                    cnpj: maskCNPJ(d.cnpj || ""),
                    repNome: d.representanteLegal?.nome || "",
                    repCpf: maskCPF(d.representanteLegal?.cpf || ""),
                    repCargo: d.representanteLegal?.cargo || "",
                    email: d.email || "",
                    telefone: maskPhone(d.telefone || ""),
                    cep: maskCEP(d.endereco?.cep || ""),
                    logradouro: d.endereco?.logradouro || "",
                    numero: d.endereco?.numero || "",
                    complemento: d.endereco?.complemento || "",
                    bairro: d.endereco?.bairro || "",
                    cidade: d.endereco?.cidade || "",
                    estado: d.endereco?.estado || "",
                    pais: d.endereco?.pais || "",
                    observacoes: d.observacoes || "",
                    senhaPortal: "",
                });
                setPortal({
                    provisoria: d.senhaPortalProvisoria === true,
                    definidaEm: d.senhaPortalDefinidaEm ?? null,
                });
            } catch {
                setErro("Falha ao carregar dados do cliente.");
            }
        };
        buscarCliente();
    }, [id, editando]);

    useEffect(() => {
        if (!formData.estado) {
            setCidadesDisponiveis([]);
            return;
        }

        setCarregandoCidades(true);
        buscarCidadesPorEstado(formData.estado)
            .then((lista) => setCidadesDisponiveis(lista))
            .finally(() => setCarregandoCidades(false));
    }, [formData.estado]);

    const handleEstadoChange = (e) => {
        const estado = e.target.value;
        setFormData((prev) => ({ ...prev, estado, cidade: "" }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMaskedChange = (mask) => (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: mask(value) }));
    };

    const handleCepChange = async (e) => {
        const masked = maskCEP(e.target.value);
        setFormData((prev) => ({ ...prev, cep: masked }));

        if (unmask(masked).length !== 8) return;

        setCepCarregando(true);
        const endereco = await buscarEnderecoPorCEP(masked);
        setCepCarregando(false);
        if (!endereco) return;

        setFormData((prev) => ({
            ...prev,
            logradouro: endereco.logradouro || prev.logradouro,
            bairro: endereco.bairro || prev.bairro,
            cidade: endereco.cidade || prev.cidade,
            estado: endereco.estado || prev.estado,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSalvando(true);
        setErro("");
        setCampoComErro(null);

        const opcional = (valor) => {
            const v = typeof valor === "string" ? valor.trim() : valor;
            if (v) return v;
            return editando ? null : undefined;
        };

        const endereco = {
            cep: opcional(unmask(formData.cep)),
            logradouro: opcional(formData.logradouro),
            numero: opcional(formData.numero),
            complemento: opcional(formData.complemento),
            bairro: opcional(formData.bairro),
            cidade: opcional(formData.cidade),
            estado: opcional(formData.estado),
            pais: opcional(formData.pais),
        };

        const payload = {
            tipoPessoa,
            email: opcional(formData.email),
            telefone: opcional(unmask(formData.telefone)),
            observacoes: opcional(formData.observacoes),
            endereco,
        };

        if (formData.senhaPortal !== "") {
            payload.senhaPortal = formData.senhaPortal;
        }

        if (tipoPessoa === "fisica") {
            payload.nomeCompleto = formData.nomeCompleto;
            payload.cpf = unmask(formData.cpf);
            payload.rg = opcional(formData.rg);
            payload.dataNascimento = opcional(formData.dataNascimento);
            payload.sexo = opcional(formData.sexo);
            payload.estadoCivil = opcional(formData.estadoCivil);
            payload.profissao = opcional(formData.profissao);
            payload.nacionalidade = opcional(formData.nacionalidade);
        } else {
            payload.razaoSocial = formData.razaoSocial;
            payload.nomeFantasia = formData.nomeFantasia;
            payload.cnpj = unmask(formData.cnpj);

            const repNome = formData.repNome.trim();
            const repCpf = unmask(formData.repCpf);
            const repCargo = formData.repCargo.trim();
            payload.representanteLegal = (repNome || repCpf || repCargo)
                ? { nome: opcional(repNome), cpf: opcional(repCpf), cargo: opcional(repCargo) }
                : (editando ? null : undefined);
        }

        try {
            if (editando) {
                await clientService.updateClient(id, payload);
            } else {
                await clientService.createClient(payload);
            }
            toast.success(editando ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.");
            navigate("/clientes");
        } catch (err) {
            setErro(getApiErrorMessage(err, "Erro ao salvar cliente. Verifique os dados."));
            setCampoComErro(getApiErrorField(err));
        } finally {
            setSalvando(false);
        }
    };

    const temAcesso = portal.provisoria || portal.definidaEm !== null;

    const textoDoEstadoDoPortal = portal.provisoria
        ? "senha provisória cadastrada — aguardando o cliente entrar e definir a dele"
        : portal.definidaEm !== null
            ? `o cliente definiu a própria senha em ${new Date(portal.definidaEm).toLocaleDateString("pt-BR")}`
            : "sem acesso ao portal";

    const revogarAcessoPortal = async () => {
        setRevogando(true);
        setErro("");
        try {
            await clientService.revogarSenhaPortal(id);
            setPortal({ provisoria: false, definidaEm: null });
            setFormData((prev) => ({ ...prev, senhaPortal: "" }));
            setConfirmandoRevogacao(false);
            toast.success("Acesso ao portal revogado. O cliente não consegue mais entrar.");
        } catch (err) {
            setErro(getApiErrorMessage(err, "Não foi possível revogar o acesso ao portal."));
        } finally {
            setRevogando(false);
        }
    };

    return (
        <div className="tela telaClientes">
            <div className="baloesTelasAdvogada">
                <BotaoVoltar />
                {editando ? (
                    <div className="detalheTopo">
                        <div className="detalheIdentidade">
                            <span className="detalheAvatar" style={{ backgroundColor: corDoAvatar(id) }}>
                                {inicialDoAvatar(nomeDoCliente({ tipoPessoa, nomeCompleto: formData.nomeCompleto, razaoSocial: formData.razaoSocial }))}
                            </span>
                            <div>
                                <h1 className="tituloPagina">
                                    {nomeDoCliente({ tipoPessoa, nomeCompleto: formData.nomeCompleto, razaoSocial: formData.razaoSocial })}
                                </h1>
                                <p className="detalheSubtitulo">{labelDe(TIPO_PESSOA_OPTIONS, tipoPessoa)}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <h1 className="tituloPagina">Registrar novo cliente</h1>
                )}

                <div className="tituloInput seletorTipoPessoa">
                    <label>Tipo de pessoa:<Ajuda assunto={AJUDA.clienteTipoPessoa.assunto}>{AJUDA.clienteTipoPessoa.texto}</Ajuda></label>
                    <div className="grupoRadio">
                        {TIPO_PESSOA_OPTIONS.map(({ value, label }) => (
                            <div key={value}>
                                <input
                                    type="radio"
                                    id={`tipo_${value}`}
                                    name="tipoPessoa"
                                    value={value}
                                    checked={tipoPessoa === value}
                                    onChange={() => setTipoPessoa(value)}
                                    required
                                />
                                <label htmlFor={`tipo_${value}`}>{label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {tipoPessoa === "fisica" && (
                        <div className="secaoForm">
                            <h3>Informações pessoais</h3>
                            <p className="notaForm">Esses dados preenchem automaticamente as procurações, contratos e declarações gerados pelos seus modelos.</p>

                            <div className="tituloInput informacaoNormal">
                                <label>Nome completo*</label>

                                <input
                                    type="text"
                                    name="nomeCompleto"
                                    value={formData.nomeCompleto}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>CPF*</label>

                                <input className={campoComErro === "cpf" ? "inputErro" : undefined}
                                    type="text"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleMaskedChange(maskCPF)}
                                    placeholder="000.000.000-00"
                                    inputMode="numeric"
                                    required
                                />
                                <small className="notaCampo">Digite só os números. A pontuação é colocada sozinha.</small>
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>RG</label>

                                <input
                                    type="text"
                                    name="rg"
                                    value={formData.rg}
                                    onChange={handleChange}
                                    maxLength={20}
                                />
                                <small className="notaCampo">Do jeito que está no documento, até 20 caracteres.</small>
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>Data de nascimento</label>

                                <input
                                    type="date"
                                    name="dataNascimento"
                                    value={formData.dataNascimento}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>Sexo</label>

                                <div className="select">
                                    <select className="selectForm"
                                        name="sexo"
                                        value={formData.sexo}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecione...</option>

                                        {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>Estado civil</label>

                                <div className="select">
                                    <select className="selectForm"
                                        name="estadoCivil"
                                        value={formData.estadoCivil}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecione...</option>

                                        {ESTADO_CIVIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>Profissão</label>

                                <input
                                    type="text"
                                    name="profissao"
                                    list="profissoesCbo"
                                    value={formData.profissao}
                                    onChange={handleChange}
                                    onFocus={ativarProfissoes}
                                    maxLength={60}
                                />
                                <datalist id="profissoesCbo">
                                    {profissoes.map((profissao) => <option key={profissao} value={profissao} />)}
                                </datalist>
                                <small className="notaCampo">Sugere as profissões da CBO, mas aceita qualquer texto.</small>
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>Nacionalidade</label>

                                <input
                                    type="text"
                                    name="nacionalidade"
                                    list="nacionalidades"
                                    value={formData.nacionalidade}
                                    onChange={handleChange}
                                    onFocus={ativarNacionalidades}
                                    maxLength={50}
                                />
                                <datalist id="nacionalidades">
                                    {nacionalidades.map((nacionalidade) => <option key={nacionalidade} value={nacionalidade} />)}
                                </datalist>
                                <small className="notaCampo">Como aparece na qualificação dos documentos. Ex.: brasileira.</small>
                            </div>
                        </div>
                    )}

                    {tipoPessoa === "juridica" && (
                        <div className="secaoForm">
                            <h3>Dados empresariais</h3>
                            <p className="notaForm">Esses dados preenchem automaticamente os documentos gerados pelos seus modelos.</p>

                            <div className="tituloInput informacaoPequena">
                                <label>CNPJ*</label>

                                <input
                                    type="text"
                                    name="cnpj"
                                    value={formData.cnpj}
                                    onChange={handleMaskedChange(maskCNPJ)}
                                    placeholder="00.000.000/0000-00"
                                    inputMode="numeric"
                                    required
                                    className={campoComErro === "cnpj" ? "inputErro" : undefined} />
                                <small className="notaCampo">Digite só os números. A pontuação é colocada sozinha.</small>
                            </div>

                            <div className="tituloInput informacaoNormal">
                                <label>Razão social*</label>

                                <input
                                    type="text"
                                    name="razaoSocial"
                                    value={formData.razaoSocial}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="tituloInput informacaoGrande">
                                <label>Nome fantasia*</label>

                                <input
                                    type="text"
                                    name="nomeFantasia"
                                    value={formData.nomeFantasia}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {tipoPessoa === "juridica" && (
                        <div className="secaoForm">
                            <h3>Representante legal</h3>
                            <p className="notaForm">Opcional. Se preencher o CPF ou o cargo, o nome passa a ser obrigatório.</p>

                            <div className="tituloInput informacaoNormal">
                                <label>Nome{formData.repCpf || formData.repCargo ? "*" : ""}</label>

                                <input
                                    type="text"
                                    name="repNome"
                                    value={formData.repNome}
                                    onChange={handleChange}
                                    maxLength={255}
                                    required={Boolean(formData.repCpf || formData.repCargo)}
                                />
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>CPF</label>

                                <input
                                    type="text"
                                    name="repCpf"
                                    value={formData.repCpf}
                                    onChange={handleMaskedChange(maskCPF)}
                                    placeholder="000.000.000-00"
                                    inputMode="numeric"
                                />
                            </div>

                            <div className="tituloInput informacaoPequena">
                                <label>Cargo</label>

                                <input
                                    type="text"
                                    name="repCargo"
                                    value={formData.repCargo}
                                    onChange={handleChange}
                                    maxLength={60}
                                />
                            </div>
                        </div>
                    )}

                    <div className="secaoForm">
                        <h3>Contato</h3>

                        <div className="tituloInput informacaoNormal">
                            <label>Email</label>

                            <input
                                type="email"
                                name="email"
                                placeholder="email@exemplo.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={campoComErro === "email" ? "inputErro" : undefined}
                            />
                        </div>

                        <div className="tituloInput informacaoPequena">
                            <label>Telefone</label>

                            <input
                                type="tel"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleMaskedChange(maskPhone)}
                                placeholder="(00) 00000-0000"
                                inputMode="numeric"
                            />
                        </div>
                    </div>

                    <div className="secaoForm">
                        <h3>Endereço</h3>

                        <div className="tituloInput informacaoPequena">
                            <label>CEP {cepCarregando && <span className="infoSecundariaDetalhe">buscando…</span>}</label>

                            <input
                                type="text"
                                name="cep"
                                value={formData.cep}
                                onChange={handleCepChange}
                                placeholder="00000-000"
                                inputMode="numeric"
                            />
                            <small className="notaCampo">Com os 8 números, rua, bairro, cidade e UF são preenchidos sozinhos.</small>
                        </div>

                        <div className="tituloInput informacaoPequena">
                            <label>País</label>

                            <input
                                type="text"
                                name="pais"
                                value={formData.pais}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="tituloInput informacaoPequena">
                            <label>Estado (UF)</label>

                            <div className="select">
                                <select className="selectForm"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleEstadoChange}
                                >
                                    <option value="" hidden>Selecione...</option>
                                    {UFS.map((uf) => <option key={uf.value} value={uf.value}>{uf.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="tituloInput informacaoQuaseNormal">
                            <label>Cidade</label>

                            <div className="select">
                                <select className="selectForm"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    disabled={!formData.estado || carregandoCidades}
                                >
                                    <option value="">
                                        {!formData.estado ? "Selecione um estado primeiro" : "Selecione…"}
                                    </option>

                                    {cidadesDisponiveis.map((cidade) => (
                                        <option key={cidade} value={cidade}>{cidade}</option>
                                    ))}

                                    {formData.cidade && !cidadesDisponiveis.includes(formData.cidade) && (
                                        <option value={formData.cidade}>{formData.cidade}</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="tituloInput informacaoQuaseNormal">
                            <label>Bairro</label>

                            <input
                                type="text"
                                name="bairro"
                                value={formData.bairro}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="tituloInput informacaoNormal">
                            <label>Logradouro</label>

                            <input
                                type="text"
                                name="logradouro"
                                value={formData.logradouro}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="tituloInput informacaoPequena">
                            <label>Número</label>

                            <input
                                type="text"
                                name="numero"
                                value={formData.numero}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="tituloInput informacaoGrande">
                            <label>Complemento</label>

                            <input
                                type="text"
                                name="complemento"
                                value={formData.complemento}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="secaoForm">
                        <h3>Observações</h3>
                        <p className="notaForm">Anotação interna. Nunca aparece no portal do cliente.</p>

                        <div className="tituloInput informacaoGrande">
                            <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} />
                        </div>
                    </div>

                    <div className="secaoForm">
                        <h3>Acesso ao portal<Ajuda assunto={AJUDA.clienteSenhaPortal.assunto}>{AJUDA.clienteSenhaPortal.texto}</Ajuda></h3>

                        {editando && (
                            <p className="notaForm">Situação: {textoDoEstadoDoPortal}.</p>
                        )}

                        <div className="tituloInput informacaoNormal">
                            <label>{temAcesso ? "Nova senha provisória" : "Senha provisória"}</label>

                            <input
                                type="password"
                                name="senhaPortal"
                                value={formData.senhaPortal}
                                onChange={handleChange}
                                autoComplete="new-password"
                                className={campoComErro === "senhaPortal" ? "inputErro" : undefined}
                                aria-describedby="apoio-cliente-senha-portal"
                            />
                        </div>

                        <p className="notaForm" id="apoio-cliente-senha-portal">
                            Em branco, nada muda. Ao gravar uma senha, o acesso fica provisório: no primeiro login o portal pede que o cliente troque por uma que só ele conheça. Não use o CPF ou o CNPJ do cliente. O código de acesso é criado junto e aparece em "Entregar acesso", no processo ou na aba Portal do cliente.
                        </p>

                        {editando && temAcesso && (
                            confirmandoRevogacao ? (
                                <div className="acoesPortalForm">
                                    <span className="infoSecundariaDetalhe">O cliente deixa de conseguir entrar no portal, em todos os processos.</span>
                                    <button type="button" className="buttonOutlined" onClick={() => setConfirmandoRevogacao(false)}>Cancelar</button>
                                    <button title="O cliente deixa de entrar no portal até receber uma nova senha" type="button" className="modalBotao modalBotaoPerigo" onClick={revogarAcessoPortal} disabled={revogando}>
                                        {revogando ? "Revogando..." : "Confirmar revogação"}
                                    </button>
                                </div>
                            ) : (
                                <div className="acoesPortalForm">
                                    <button title="Remove a senha do cliente no portal" type="button" className="buttonOutlined" onClick={() => setConfirmandoRevogacao(true)}>
                                        Revogar acesso ao portal
                                    </button>
                                    <Ajuda assunto={AJUDA.clienteRevogar.assunto}>{AJUDA.clienteRevogar.texto}</Ajuda>
                                </div>
                            )
                        )}
                    </div>

                    {erro && <p className="mensagemErro">{erro}</p>}

                    <div className="acoesForm">
                        <button type="button" onClick={() => navigate("/clientes")} className="buttonOutlined">Cancelar</button>

                        <button type="submit"
                            disabled={salvando}
                            className="button">
                            {salvando ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ClientesForm;