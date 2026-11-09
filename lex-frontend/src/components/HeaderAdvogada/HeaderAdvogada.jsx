import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import LEXHorizontal from "../../assets/images/logos/LEX_horizontal.svg";

import { useAuth } from "../../contexts/AuthContext";
import { useOutbox } from "../../contexts/OutboxContext";

import Notificacoes from "../Notificacoes/Notificacoes";
import Modal from "../Modal/Modal";

import { mensagemDeLogoutComFila } from "../../offline/outboxMessages";

import "./HeaderAdvogada.css";

function getIniciais(nome) {
    if(!nome) return "?";

    return nome.split(" ").map((parte) => parte[0]).slice(0, 2).join("").toUpperCase();
}

function HeaderAdvogada() {
    const { user, logout } = useAuth();
    const { quantidade: pendentes, falhas } = useOutbox();
    const [confirmarSaida, setConfirmarSaida] = useState(false);

    const sair = () => {
        if (pendentes > 0) {
            setConfirmarSaida(true);
            return;
        }
        logout();
    };

    const location = useLocation();
    const navRef = useRef(null);
    const menuUsuarioRef = useRef(null);
    const [indicador, setIndicador] = useState({ left: 0, width: 0 });
    const [menuAberto, setMenuAberto] = useState(false);
    const [escondido, setEscondido] = useState(false);
    const ultimoScrollY = useRef(0);

    useEffect(() => {
        const linkAtivo = navRef.current?.querySelector("a.active");
        if (linkAtivo) {
            setIndicador({
                left: linkAtivo.offsetLeft,
                width: linkAtivo.offsetWidth,
            });
        }
    }, [location.pathname]);

    useEffect(() => {
        const aoClicarFora = (e) => {
            if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target)) {
                setMenuAberto(false);
            }
        };
        document.addEventListener("mousedown", aoClicarFora);
        return () => document.removeEventListener("mousedown", aoClicarFora);
    }, []);

    useEffect(() => {
        ultimoScrollY.current = window.scrollY;
        let ticking = false;

        const aoRolar = () => {
            const atual = window.scrollY;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const descendo = atual > ultimoScrollY.current;
                    const passouDoTopo = atual > 80;

                    setEscondido(descendo && passouDoTopo);

                    ultimoScrollY.current = atual;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", aoRolar, { passive: true });
        return () => window.removeEventListener("scroll", aoRolar);
    }, []);

    const primeiroNome = user?.nomeCompleto?.split(" ")[0] || "";

    return (
        <header className={`headerAdvogada ${escondido ? "headerAdvogada--escondido" : ""}`}>

            <Link to="/home" className="headerLogo">
                <img src={LEXHorizontal} alt="LEX" title="Home"/>
            </Link>

            <nav className="navHeader" ref={navRef}>
                <NavLink to="/home" title="Home">Home</NavLink>
                <NavLink to="/clientes" title="Clientes">Clientes</NavLink>
                <NavLink to="/processos" title="Processos">Processos</NavLink>
                <NavLink to="/financeiro" title="Financeiro">Financeiro</NavLink>
                <NavLink to="/calendario" title="Calendário">Calendário</NavLink>

                <span
                    className="indicadorNav"
                    style={{ left: indicador.left, width: indicador.width }}
                />
            </nav>

            {user && (
                <div className="headerAcoes">
                    {pendentes > 0 && (
                        <Link
                            to="/pendencias"
                            className={`headerPendencias ${falhas > 0 ? "headerPendencias--falha" : ""}`}
                            title={falhas > 0 ? "Há alteração feita sem conexão que não pôde ser enviada" : "Alterações feitas sem conexão, aguardando envio"}
                            aria-label={`${pendentes} ${pendentes === 1 ? "alteração não enviada" : "alterações não enviadas"}`}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3" />
                                <path d="M12 12v9" />
                                <path d="m16 16-4-4-4 4" />
                            </svg>
                            <span className="headerPendenciasContador">{pendentes}</span>
                        </Link>
                    )}

                    <Notificacoes />

                    <div className={`menuUsuario ${menuAberto ? 'ativo' : ''}`}
                        ref={menuUsuarioRef}
                        onClick={() => setMenuAberto((valor) => !valor)}
                        title="Menu do usuário"
                    >
                        <span className="saudacaoHeader">Olá, {primeiroNome}</span>

                        <div className="avatarUsuario">
                            {getIniciais(user.nomeCompleto)}
                        </div>

                        {menuAberto && (
                            <div className="dropdownUsuario">
                                <Link to="/modelos" title="Meus modelos">Meus modelos</Link>
                                <Link to="/configuracoes" title="Configurações">Configurações</Link>

                                <button onClick={sair} className="headerSair" title="Sair">Sair</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Modal
                aberto={confirmarSaida}
                titulo="Sair com alterações não enviadas"
                mensagem={mensagemDeLogoutComFila(pendentes)}
                perigo
                labelConfirmar="Sair e descartar"
                onConfirmar={() => { setConfirmarSaida(false); logout(); }}
                onCancelar={() => setConfirmarSaida(false)}
            />
        </header>
    );
}

export default HeaderAdvogada;