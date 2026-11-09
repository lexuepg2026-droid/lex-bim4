import { useState, useEffect, useCallback } from "react";

import { useAuth } from "../../../contexts/AuthContext";

import authService from "../../../services/authService";

import { getApiErrorMessage } from "../../../utils/apiError";
import { maskCPF, maskCEP, maskPhone, unmask } from "../../../utils/masks";
import { buscarEnderecoPorCEP } from "../../../utils/viacep";
import { UFS } from "../../../utils/enums";
import { prepararLogo, formatarTamanho } from "../../../utils/imagem";
import { toast } from "../../../utils/toast";

import "./Perfil.css";

const buildForm = (u) => ({
    nomeCompleto: u?.nomeCompleto || "",
    cpf: maskCPF(u?.cpf || ""),
    telefone: maskPhone(u?.telefone || ""),
    oabNumero: u?.oab?.numero || "",
    oabEstado: u?.oab?.estado || "",
    advNome: u?.advocacia?.nome || "",
    advChavePix: u?.advocacia?.chavePix || "",
    advInstagram: u?.advocacia?.instagram || "",
    advSite: u?.advocacia?.site || "",
    advLogo: u?.advocacia?.logoBase64 || "",
    cep: maskCEP(u?.endereco?.cep || ""),
    logradouro: u?.endereco?.logradouro || "",
    numero: u?.endereco?.numero || "",
    complemento: u?.endereco?.complemento || "",
    bairro: u?.endereco?.bairro || "",
    cidade: u?.endereco?.cidade || "",
    estado: u?.endereco?.estado || "",
    pais: u?.endereco?.pais || "Brasil",
});

const SENHA_FRACA = "A nova senha deve ter no mínimo 8 caracteres, com ao menos uma letra e um número.";

const senhaForte = (senha) => senha.length >= 8 && /[a-zA-Z]/.test(senha) && /\d/.test(senha);

function Perfil() {
    const { user, updateUser, checkAuth } = useAuth();

    const [form, setForm] = useState(() => buildForm(user));
    const [inicial, setInicial] = useState(() => buildForm(user));
    const [error, setError] = useState("");
    const [hint, setHint] = useState("");
    const [saving, setSaving] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [logoLoading, setLogoLoading] = useState(false);

    const [senhas, setSenhas] = useState({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
    const [senhaError, setSenhaError] = useState("");
    const [senhaSaving, setSenhaSaving] = useState(false);

    const [reenviandoEmail, setReenviandoEmail] = useState(false);
    const [baixandoExemplo, setBaixandoExemplo] = useState(false);

    const resync = useCallback((usuario) => {
        setForm(buildForm(usuario));
        setInicial(buildForm(usuario));
    }, []);

    useEffect(() => {
        if (user) resync(user);
    }, [user, resync]);

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
        setHint("");
    };

    const handleChange = (e) => setField(e.target.name, e.target.value);
    const handleMaskedChange = (mask) => (e) => setField(e.target.name, mask(e.target.value));

    const handleCepChange = async (e) => {
        const masked = maskCEP(e.target.value);
        setField("cep", masked);
        const digits = unmask(masked);
        if (digits.length !== 8) return;

        setCepLoading(true);
        const endereco = await buscarEnderecoPorCEP(digits);
        setCepLoading(false);
        if (!endereco) return;

        setForm((prev) => ({
            ...prev,
            logradouro: endereco.logradouro || prev.logradouro,
            bairro: endereco.bairro || prev.bairro,
            cidade: endereco.cidade || prev.cidade,
            estado: endereco.estado || prev.estado,
        }));
    };

    const handleLogoChange = async (e) => {
        const arquivo = e.target.files?.[0];
        e.target.value = "";
        if (!arquivo) return;

        setLogoLoading(true);
        setError("");
        setHint("");

        try {
            const { dataUri, redimensionada, tamanhoOriginal, tamanhoFinal } = await prepararLogo(arquivo);

            setField("advLogo", dataUri);

            if (redimensionada) {
                toast.success(
                    `Logo redimensionado de ${formatarTamanho(tamanhoOriginal)} para ${formatarTamanho(tamanhoFinal)}.`
                );
            }
            setHint('Logo carregado. Clique em "Salvar alterações" para gravar.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLogoLoading(false);
        }
    };

    const handleRemoverLogo = () => {
        setField("advLogo", "");
        setHint('Logo removido. Clique em "Salvar alterações" para gravar.');
    };

    const buildPayload = () => {
        const payload = {};

        const compara = (destino, chave, atual, base) => {
            if (atual === base) return;
            destino[chave] = atual === "" ? null : atual;
        };

        compara(payload, "nomeCompleto", form.nomeCompleto.trim(), inicial.nomeCompleto.trim());
        compara(payload, "cpf", unmask(form.cpf), unmask(inicial.cpf));
        compara(payload, "telefone", unmask(form.telefone), unmask(inicial.telefone));

        const oab = {};
        compara(oab, "numero", unmask(form.oabNumero), unmask(inicial.oabNumero));
        compara(oab, "estado", form.oabEstado, inicial.oabEstado);
        if (Object.keys(oab).length > 0) payload.oab = oab;

        const advocacia = {};
        compara(advocacia, "nome", form.advNome.trim(), inicial.advNome.trim());
        compara(advocacia, "chavePix", form.advChavePix.trim(), inicial.advChavePix.trim());
        compara(advocacia, "instagram", form.advInstagram.trim(), inicial.advInstagram.trim());
        compara(advocacia, "site", form.advSite.trim(), inicial.advSite.trim());
        compara(advocacia, "logoBase64", form.advLogo, inicial.advLogo);
        if (Object.keys(advocacia).length > 0) payload.advocacia = advocacia;

        const endereco = {};
        compara(endereco, "cep", unmask(form.cep), unmask(inicial.cep));
        compara(endereco, "pais", form.pais.trim(), inicial.pais.trim());
        compara(endereco, "estado", form.estado, inicial.estado);
        compara(endereco, "cidade", form.cidade.trim(), inicial.cidade.trim());
        compara(endereco, "bairro", form.bairro.trim(), inicial.bairro.trim());
        compara(endereco, "logradouro", form.logradouro.trim(), inicial.logradouro.trim());
        compara(endereco, "numero", form.numero.trim(), inicial.numero.trim());
        compara(endereco, "complemento", form.complemento.trim(), inicial.complemento.trim());
        if (Object.keys(endereco).length > 0) payload.endereco = endereco;

        return payload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setHint("");

        const payload = buildPayload();
        if (Object.keys(payload).length === 0) {
            setHint("Nenhuma alteração para salvar.");
            return;
        }

        setSaving(true);
        try {
            const res = await authService.updateMe(payload);
            updateUser(res.data.usuario);
            resync(res.data.usuario);
            toast.success("Perfil atualizado com sucesso.");
        } catch (err) {
            setError(getApiErrorMessage(err, "Erro ao salvar o perfil. Verifique os dados."));
        } finally {
            setSaving(false);
        }
    };

    const handleSenhaChange = (e) => {
        const { name, value } = e.target;
        setSenhas((prev) => ({ ...prev, [name]: value }));
        setSenhaError("");
    };

    const handleSenhaSubmit = async (e) => {
        e.preventDefault();
        setSenhaError("");

        const { senhaAtual, novaSenha, confirmarNovaSenha } = senhas;
        if (!senhaForte(novaSenha)) return setSenhaError(SENHA_FRACA);
        if (novaSenha !== confirmarNovaSenha) return setSenhaError("A confirmação não corresponde à nova senha.");
        if (novaSenha === senhaAtual) return setSenhaError("A nova senha deve ser diferente da senha atual.");

        setSenhaSaving(true);
        try {
            await authService.changePassword(senhaAtual, novaSenha);
            setSenhas({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
            toast.success("Senha alterada com sucesso.");
        } catch (err) {
            setSenhaError(getApiErrorMessage(err, "Não foi possível alterar a senha."));
        } finally {
            setSenhaSaving(false);
        }
    };

    const reenviarConfirmacao = async () => {
        setReenviandoEmail(true);
        try {
            const res = await authService.resendConfirmation();
            if (res.data?.jaConfirmado) {
                await checkAuth();
                toast.success("Seu e-mail já está confirmado.");
            } else {
                toast.success("E-mail enviado. Confira sua caixa de entrada e o spam.");
            }
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Não foi possível enviar o e-mail agora."));
        } finally {
            setReenviandoEmail(false);
        }
    };

    const baixarExemploTimbrado = async () => {
        setBaixandoExemplo(true);
        try {
            await authService.baixarEsalvarExemploTimbrado();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Não foi possível gerar o exemplo do timbrado."));
        } finally {
            setBaixandoExemplo(false);
        }
    };

    const confirmacaoPreenchida = senhas.confirmarNovaSenha !== "";
    const senhasIguais = senhas.novaSenha === senhas.confirmarNovaSenha;

    const situacaoEmail = user?.emailConfirmadoEm
        ? `Confirmado em ${new Date(user.emailConfirmadoEm).toLocaleDateString("pt-BR")}`
        : "Não confirmado";

    const campo = (id, label, props = {}, nota) => (
        <>
            <div className="divLabelInLine">
                <input className="input perfil" id={id} type="text" placeholder=" " aria-describedby={nota ? `${id}Nota` : undefined} {...props} />
                <label htmlFor={id}>{label}</label>
            </div>
            {nota && <small id={`${id}Nota`} className="campoNota">{nota}</small>}
        </>
    );

    const campoUF = (id, label, props = {}) => (
        <div className="divLabelInLine selectLabelInLine">
            <div className="select">
                <select className="perfil" id={id} {...props}>
                    <option value=""></option>
                    {UFS.map((uf) => <option key={uf.value} value={uf.value}>{uf.label}</option>)}
                </select>
            </div>
            <label htmlFor={id}>{label}</label>
        </div>
    );

    return (
        <div className="conteinerPerfil">
            <h1 className="perfil">Meu Perfil</h1>

            <form onSubmit={handleSubmit} className="perfilForm">
                <h2 className="perfil">Dados pessoais</h2>

                {campo("nomeCompleto", "Nome completo*", { name: "nomeCompleto", value: form.nomeCompleto, onChange: handleChange, required: true }, "Aparece no timbrado, junto com o número da OAB.")}
                {campo("cpf", "CPF*", { name: "cpf", value: form.cpf, onChange: handleMaskedChange(maskCPF), inputMode: "numeric", required: true }, "Digite só os números. A pontuação é colocada sozinha.")}

                <div className="divLabelInLine">
                    <input className="input perfil" id="email" type="email" placeholder=" " value={user?.email || ""} disabled />
                    <label htmlFor="email">E-mail*</label>
                    <small className="campoNota">O e-mail não pode ser alterado. {situacaoEmail}.</small>
                    {user && !user.emailConfirmadoEm && (
                        <button title="Envia de novo o link de confirmação para o seu e-mail" type="button" className="buttonOutlined perfilBotao" onClick={reenviarConfirmacao} disabled={reenviandoEmail}>
                            {reenviandoEmail ? "Enviando..." : "Reenviar e-mail de confirmação"}
                        </button>
                    )}
                </div>

                {campo("telefone", "Telefone", { type: "tel", name: "telefone", value: form.telefone, onChange: handleMaskedChange(maskPhone), inputMode: "numeric" }, "Com DDD. Aparece no timbrado dos documentos e recibos.")}

                <h2 className="perfil">OAB</h2>

                <div className="perfilLinha">
                    {campoUF("oabEstado", "UF*", { name: "oabEstado", value: form.oabEstado, onChange: handleChange, required: true })}
                    {campo("oabNumero", "Número da OAB*", { name: "oabNumero", value: form.oabNumero, onChange: (e) => setField("oabNumero", unmask(e.target.value).slice(0, 6)), inputMode: "numeric", required: true })}
                </div>
                <small className="campoNota">Somente números, até 6 dígitos. No timbrado sai como "OAB/UF nº".</small>

                <h2 className="perfil">Advocacia</h2>

                {campo("advNome", "Nome*", { name: "advNome", value: form.advNome, onChange: handleChange, maxLength: 100, required: true }, "Aparece em destaque no topo do timbrado.")}
                {campo("advChavePix", "Chave PIX", { name: "advChavePix", value: form.advChavePix, onChange: handleChange, maxLength: 120 }, "Pode ser usada como variável nos seus modelos de documento.")}
                {campo("advInstagram", "Instagram", { name: "advInstagram", value: form.advInstagram, onChange: handleChange, maxLength: 50 }, "Opcional. Até 50 caracteres.")}
                {campo("advSite", "Site", { name: "advSite", value: form.advSite, onChange: handleChange, maxLength: 200 }, "Opcional. Ex.: www.seuescritorio.com.br")}

                <div className="logoCampo">
                    <p className="logoTitulo">Logo do escritório</p>
                    <p className="campoAjuda">
                        Aparece no cabeçalho dos documentos gerados em PDF e DOCX. PNG ou JPEG. Imagens grandes são reduzidas automaticamente.
                    </p>

                    <div className="logoBloco">
                        <div className="logoPreview">
                            {form.advLogo ? (
                                <img src={form.advLogo} alt="Logo do escritório" />
                            ) : (
                                <span className="logoVazio">Sem logo</span>
                            )}
                        </div>

                        <div className="logoAcoes">
                            <label className="button perfilBotao" htmlFor="advLogoInput">
                                {logoLoading ? "Processando…" : form.advLogo ? "Trocar logo" : "Escolher logo"}
                            </label>
                            <input
                                id="advLogoInput"
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={handleLogoChange}
                                disabled={logoLoading}
                                className="inputArquivo"
                            />
                            {form.advLogo && (
                                <button title="Tira a logo do cabeçalho dos documentos" type="button" className="buttonOutlined perfilBotao" onClick={handleRemoverLogo}>
                                    Remover
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="logoCampo">
                    <p className="logoTitulo">Timbrado</p>
                    <p className="campoAjuda">
                        Baixa uma folha em PDF com o timbrado dos documentos e recibos, montada com os dados já salvos. Salve as alterações antes de conferir.
                    </p>
                    <button title="Baixa um PDF de exemplo com o timbrado atual" type="button" className="buttonOutlined perfilBotao" onClick={baixarExemploTimbrado} disabled={baixandoExemplo}>
                        {baixandoExemplo ? "Gerando..." : "Ver exemplo do timbrado"}
                    </button>
                </div>

                <h2 className="perfil">Endereço</h2>
                <p className="campoAjuda">
                    Aparece no timbrado. A cidade também é usada como local de assinatura nos documentos.
                </p>

                <div className="divLabelInLine">
                    <input className="input perfil" id="cep" type="text" placeholder=" " name="cep" value={form.cep} onChange={handleCepChange} inputMode="numeric" aria-describedby="cepNota" />
                    <label htmlFor="cep">CEP {cepLoading && <span className="cepHint">buscando…</span>}</label>
                </div>
                <small id="cepNota" className="campoNota">Ao digitar os 8 números, rua, bairro, cidade e UF são preenchidos automaticamente.</small>

                {campo("pais", "País", { name: "pais", value: form.pais, onChange: handleChange })}

                <div className="perfilLinha">
                    {campoUF("estado", "UF", { name: "estado", value: form.estado, onChange: handleChange })}
                    {campo("cidade", "Cidade", { name: "cidade", value: form.cidade, onChange: handleChange })}
                </div>

                {campo("bairro", "Bairro", { name: "bairro", value: form.bairro, onChange: handleChange })}
                {campo("logradouro", "Logradouro", { name: "logradouro", value: form.logradouro, onChange: handleChange })}

                <div className="perfilLinha">
                    {campo("numero", "Número", { name: "numero", value: form.numero, onChange: handleChange })}
                    {campo("complemento", "Complemento", { name: "complemento", value: form.complemento, onChange: handleChange })}
                </div>

                {error && <p className="mensagemErro">{error}</p>}
                {hint && <p className="mensagemDica">{hint}</p>}

                <div className="perfilAcoes">
                    <button type="submit" className="button perfilBotao" disabled={saving}>
                        {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                </div>
            </form>

            <form onSubmit={handleSenhaSubmit} className="perfilForm">
                <h2 className="perfil">Segurança</h2>

                {campo("senhaAtual", "Senha atual*", { type: "password", name: "senhaAtual", value: senhas.senhaAtual, onChange: handleSenhaChange, autoComplete: "current-password", required: true })}
                {campo("novaSenha", "Nova senha*", { type: "password", name: "novaSenha", value: senhas.novaSenha, onChange: handleSenhaChange, autoComplete: "new-password", required: true }, "Mínimo de 8 caracteres, com pelo menos uma letra e um número.")}
                {campo("confirmarNovaSenha", "Confirmar nova senha*", { type: "password", name: "confirmarNovaSenha", value: senhas.confirmarNovaSenha, onChange: handleSenhaChange, autoComplete: "new-password", required: true })}
                {confirmacaoPreenchida && (
                    <small className={`campoNota ${senhasIguais ? "" : "campoNotaErro"}`}>
                        {senhasIguais ? "As senhas coincidem." : "As senhas ainda não coincidem."}
                    </small>
                )}

                {senhaError && <p className="mensagemErro">{senhaError}</p>}

                <div className="perfilAcoes">
                    <button type="submit" className="button perfilBotao" disabled={senhaSaving}>
                        {senhaSaving ? "Alterando..." : "Alterar senha"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Perfil;