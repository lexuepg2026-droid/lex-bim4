import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

import sininho from "../../assets/images/icons/sino.svg";
import calendarService from "../../services/calendarService";
import { useAuth } from "../../contexts/AuthContext";
import { chaveDoUsuario } from "../../utils/dadosDoUsuario";

import "./Notificacoes.css";

const PREFIXO_LIDOS = "lex:avisos-lidos:";
const INTERVALO_BUSCA_MS = 60000;

const lerLidos = (chave) => {
    if (!chave) return [];
    try {
        const salvo = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(salvo) ? salvo : [];
    } catch {
        return [];
    }
};

const gravarLidos = (chave, lista) => {
    if (!chave) return;
    try {
        localStorage.setItem(chave, JSON.stringify(lista));
    } catch {
        return;
    }
};

function Notificacoes() {
    const { user } = useAuth();
    const chave = chaveDoUsuario(PREFIXO_LIDOS, user);
    const salvarLidos = useCallback((lista) => gravarLidos(chave, lista), [chave]);

    const [avisos, setAvisos] = useState(null);
    const [lidos, setLidos] = useState(() => lerLidos(chave));
    const [aberto, setAberto] = useState(false);
    const containerRef = useRef(null);

    const buscarAvisos = useCallback(() => {
        calendarService.getAvisos()
            .then((res) => {
                setAvisos(res.data);

                const idsAtuais = new Set([
                    ...res.data.eventosHoje.map((item) => item._id),
                    ...res.data.eventosAtrasados.map((item) => item._id),
                    ...res.data.parcelasVencidas.map((item) => item._id),
                ]);

                setLidos((atual) => {
                    const filtrado = atual.filter((id) => idsAtuais.has(id));
                    if(filtrado.length !== atual.length) salvarLidos(filtrado);
                    return filtrado;
                });
            })
            // O sino consulta de novo sozinho; falha de servidor ou de rede já aparece no
            // toast global (DEC-084), e repetir aqui seria o mesmo aviso a cada consulta.
            .catch(() => {});
    }, [salvarLidos]);

    useEffect(() => {
        buscarAvisos();
        const intervalo = setInterval(buscarAvisos, INTERVALO_BUSCA_MS);
        return () => clearInterval(intervalo);
    }, [buscarAvisos]);

    useEffect(() => {
        const aoClicarFora = (e) => {
            if(containerRef.current && !containerRef.current.contains(e.target)) {
                setAberto(false);
            }
        };
        document.addEventListener("mousedown", aoClicarFora);
        return () => document.removeEventListener("mousedown", aoClicarFora);
    }, []);

    const todosOsItens = avisos
        ? [
            ...avisos.eventosHoje.map((item) => ({ ...item, grupo: "Hoje" })),
            ...avisos.eventosAtrasados.map((item) => ({ ...item, grupo: "Atrasado" })),
            ...avisos.parcelasVencidas.map((item) => ({ ...item, grupo: "Parcela vencida" })),
        ]
        : [];

    const naoLidos = todosOsItens.filter((item) => !lidos.includes(item._id));

    const marcarComoLida = (id) => {
        setLidos((atual) => {
            const novo = [...atual, id];
            salvarLidos(novo);
            return novo;
        });
    };

    const marcarTodasComoLidas = () => {
        const todosOsIds = todosOsItens.map((item) => item._id);
        setLidos(todosOsIds);
        salvarLidos(todosOsIds);
    };

    return (
        <div className={`notificacoesContainer ${aberto ? 'ativo' : ''}`} 
            ref={containerRef}>
            
            <button
                type="button"
                className="sininhoBotao"
                title="Notificações"
                onClick={() => setAberto((valor) => !valor)}
            >
                <img src={sininho} alt="Notificações" />
                {naoLidos.length > 0 && <span className="sininhoBadge">{naoLidos.length}</span>}
            </button>

            {aberto && (
                <div className="notificacoesLista">
                    <div className="notificacoesListaCabecalho">
                        <span>Notificações</span>
                        {naoLidos.length > 0 && (
                            <button title="Tira o destaque de todas as notificações" type="button" className="notificacoesMarcarTodas" onClick={marcarTodasComoLidas}>
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    {todosOsItens.length === 0 ? (
                        <p className="notificacoesVazio">Nenhuma pendência no momento.</p>
                    ) : (
                        todosOsItens.map((item) => {
                            const lida = lidos.includes(item._id);
                            return (
                                <div key={item._id} className={`notificacoesItem ${lida ? "notificacoesItemLida" : ""}`}>
                                    <Link
                                        to={item.processoId ? `/processos/detalhes/${item.processoId}` : "/calendario"}
                                        className="notificacoesItemLink"
                                    >
                                        <span className="notificacoesItemGrupo">{item.grupo}</span>
                                        <span className="notificacoesItemTitulo">{item.titulo}</span>
                                        {item.subtitulo && <span className="notificacoesItemSubtitulo">{item.subtitulo}</span>}
                                    </Link>

                                    {!lida && (
                                        <button
                                            type="button"
                                            className="notificacoesItemMarcar"
                                            title="Marcar como lida"
                                            onClick={() => marcarComoLida(item._id)}
                                        >
                                            ✓
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default Notificacoes;