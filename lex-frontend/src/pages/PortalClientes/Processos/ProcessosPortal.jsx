import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";

import { usePortalAuth } from "../../../contexts/PortalAuthContext";

import portalService from "../../../services/portalService";

import { getApiErrorMessage } from "../../../utils/apiError";

import { rotuloFase, rotuloPapel, formatarData } from "../../../utils/portalLabels";

import "../Processo/ProcessoPortal.css";

const novidades = (processo) => {
    if (processo.documentosNovos === 1) return "1 documento novo";
    if (processo.documentosNovos > 1) return `${processo.documentosNovos} documentos novos`;
    return null;
};

function ProcessosPortal() {
    const { cliente, sair } = usePortalAuth();

    const [processos, setProcessos] = useState(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;

        portalService.listarProcessos()
            .then((res) => {
                if (ativo) setProcessos(res.data.data ?? []);
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Não foi possível carregar os seus processos."));
            });

        return () => { ativo = false; };
    }, []);

    if (erro) {
        return (
            <div className="telaPortal">
                <div className="cardPortal">
                    <p className="erroPortal">{erro}</p>
                </div>
            </div>
        );
    }

    if (processos === null) {
        return (
            <div className="telaPortal">
                <p className="info">Carregando os seus processos...</p>
            </div>
        );
    }

    if (processos.length === 1) {
        return <Navigate to={`/portal/processo/${processos[0].id}`} replace />;
    }

    return (
        <div className="telaPortal telaPortalProcesso">
            <div className="cardPortal cardPortalLargo">
                <div className="cabecalhoPortalProcesso">
                    <div>
                        <h1 className="tituloPortal tituloPortalEsquerda">Olá, {cliente?.nome}</h1>
                        <p className="info infoEsquerda">
                            {processos.length === 0
                                ? "Nenhum processo liberado para você no momento. Fale com a sua advogada."
                                : "Estes são os processos que a advogada liberou para você. Escolha um para ver os detalhes e os documentos."}
                        </p>
                    </div>
                    <button title="Sair do portal" type="button" className="buttonNoBorder" onClick={sair}>Sair</button>
                </div>

                {processos.length > 0 && (
                    <ul className="listaProcessosPortal">
                        {processos.map((processo) => {
                            const novos = novidades(processo);
                            return (
                                <li key={processo.id}>
                                    <Link to={`/portal/processo/${processo.id}`} className="itemProcessoPortal">
                                        <h2>{processo.titulo || "Processo"}</h2>
                                        <p className="infoSecundaria">
                                            {processo.numeroProcesso || "Ainda não distribuído"}
                                            {processo.fase ? ` · ${rotuloFase(processo.fase)}` : ""}
                                            {processo.meuPapel ? ` · ${rotuloPapel(processo.meuPapel)}` : ""}
                                        </p>
                                        {processo.transitoEmJulgadoEm && (
                                            <p className="infoSecundaria">Trânsito em julgado em {formatarData(processo.transitoEmJulgadoEm)}</p>
                                        )}
                                        {(novos || processo.confirmacaoPendente) && (
                                            <div className="selosProcessoPortal">
                                                {novos && <span className="seloPortal seloPortal--alerta">{novos}</span>}
                                                {processo.confirmacaoPendente && <span className="seloPortal">Confirmação de leitura pendente</span>}
                                            </div>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ProcessosPortal;
