import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import LEX_horizontal from "../../../assets/images/logos/LEX_horizontal.svg";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";

import { useAuth } from "../../../contexts/AuthContext";

import { unmask } from "../../../utils/masks";
import { getApiErrorMessage } from "../../../utils/apiError";
import { toast } from "../../../utils/toast";
import { UFS } from "../../../utils/enums";

import "./Cadastrar.css";

function Cadastrar() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [numOAB, setNumOAB] = useState("");
    const [estadoOAB, setEstadoOAB] = useState("");
    const [nomeCompleto, setNomeCompleto] = useState("");
    const [cpf, setCpf] = useState("");

    const [nomeAdvocacia, setNomeAdvocacia] = useState("");

    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    const realizarCadastro = async (evento) => {
        evento.preventDefault();
        setErro("");

        if (senha !== confirmarSenha) {
            setErro("As senhas devem ser iguais.");
            return;
        }

        setCarregando(true);

        const payload = {
            email: email.trim(),
            senha: senha,
            oab: {
                numero: unmask(numOAB),
                estado: estadoOAB,
            },
            nomeCompleto: nomeCompleto.trim(),
            cpf: unmask(cpf),
            advocacia: {
                nome: nomeAdvocacia.trim(),
            },
        };

        try {
            await register(payload);
            toast.success(`Conta criada! Enviamos um link de confirmação para ${payload.email}. Ele vale por 24 horas.`);
            navigate("/home", { replace: true });
        } catch (erro) {
            setErro(getApiErrorMessage(erro, "Não foi possível realizar o cadastro."));
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="telaCadastro">
            <BotaoVoltar />

            <div className="containerCadastro">
                <div className="logoCadastro">
                    <img src={LEX_horizontal} alt="Logo LEX"/>
                </div>

                <h1 className="cadastro">Comece a usar agora</h1>
                <p className="cadastro">Cadastre-se para gerenciar sua advocacia.</p>

                <form onSubmit={realizarCadastro}>
                    <h2 className="cadastro">Informações da conta</h2>

                    <div className="divLabelInLine">
                        <input className="input cadastrar"
                            id="email"
                            type="email"
                            value={email}
                            placeholder=" "
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label htmlFor="email">E-mail</label>
                    </div>

                    <div className="divLabelInLine">
                        <input
                            className="input cadastrar"
                            id="senha"
                            type="password"
                            value={senha}
                            placeholder=" "
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                        <label htmlFor="senha">Senha</label>
                    </div>
                    <small className="notaCampo">Mínimo de 8 caracteres, com pelo menos uma letra e um número.</small>

                    <div className="divLabelInLine">
                        <input
                            className="input cadastrar"
                            id="confirmarSenha"
                            type="password"
                            value={confirmarSenha}
                            placeholder=" "
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                        />
                        <label htmlFor="confirmarSenha">
                            Confirmar senha
                        </label>
                    </div>

                    <h2 className="cadastro">Informações da(o) advogada(o)</h2>

                    <div className="selectsCadastrar">
                        <div className="divLabelInLine selectLabelInLine">
                            <div className="select">
                                <select className="cadastrar"
                                    id="estadoOAB"
                                    value={estadoOAB}
                                    onChange={(e) => setEstadoOAB(e.target.value)}
                                    required
                                >
                                    <option value="" disabled hidden></option>
                                    {UFS.map((uf) => <option key={uf.value} value={uf.value}>{uf.label}</option>)}
                                </select>
                            </div>

                            <label htmlFor="estadoOAB">Estado da OAB</label>
                        </div>

                        <div className="divLabelInLine">
                            <input className="input cadastrar numOABCadastrar"
                                id="numOAB"
                                type="text"
                                value={numOAB}
                                placeholder=" "
                                onChange={(e) => setNumOAB(e.target.value)}
                                required
                            />
                            <label htmlFor="numOAB">Número da OAB</label>
                        </div>

                    </div>
                    <small className="notaCampo">Somente números, até 6 dígitos.</small>

                    <div className="divLabelInLine">
                        <input
                            className="input cadastrar"
                            id="nomeCompleto"
                            type="text"
                            value={nomeCompleto}
                            placeholder=" "
                            onChange={(e) => setNomeCompleto(e.target.value)}
                            required
                        />
                        <label htmlFor="nomeCompleto">
                            Nome completo
                        </label>
                    </div>

                    <div className="divLabelInLine">
                        <input
                            className="input cadastrar"
                            id="cpf"
                            type="text"
                            value={cpf}
                            placeholder=" "
                            onChange={(e) => setCpf(e.target.value)}
                            required
                        />
                        <label htmlFor="cpf">
                            CPF
                        </label>
                    </div>
                    <small className="notaCampo">Usado nos documentos que pedem o seu CPF.</small>

                    <h2 className="cadastro">Informações da advocacia</h2>

                    <div className="divLabelInLine">
                        <input
                            className="input cadastrar"
                            id="nomeAdvocacia"
                            type="text"
                            value={nomeAdvocacia}
                            placeholder=" "
                            onChange={(e) => setNomeAdvocacia(e.target.value)}
                            required
                        />
                        <label htmlFor="nomeAdvocacia">
                            Nome advocacia
                        </label>
                    </div>
                    <small className="notaCampo">Aparece no topo do timbrado dos documentos e recibos.</small>

                    {erro && (
                        <p className="erroCadastro">
                            {erro}
                        </p>
                    )}

                    <button className="button buttonCriar buttonCadastrar"
                        type="submit"
                        disabled={
                            !email ||
                            !senha ||
                            !confirmarSenha ||
                            !numOAB ||
                            !estadoOAB ||
                            !nomeCompleto ||
                            !cpf ||
                            !nomeAdvocacia ||
                            carregando
                        }
                    >
                        {carregando ? "Criando conta..." : "Criar conta"}
                    </button>
                </form>

                <Link title="Ir para o login" className="buttonNoBorder buttonCadastrar" to="/login">
                    Já tenho uma conta
                </Link>
            </div>
        </div>
    )
}

export default Cadastrar