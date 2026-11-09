import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../../components/EmptyState/EmptyState";

import documentService from "../../../services/documentService";
import { buscarTudo } from "../../../utils/buscarTudo";

import { getApiErrorMessage } from "../../../utils/apiError";
import { formatDate } from "../../../utils/formatters";
import { labelDe, TIPO_DOCUMENTO_OPTIONS } from "../../../utils/enums";

import "../Documentos/Documentos.css";

function DocumentosDoProcesso({ processoId }) {
    const [documentos, setDocumentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;

        buscarTudo(documentService.listDocuments, { processoId, ehModelo: false })
            .then((lista) => {
                if (ativo) setDocumentos(lista);
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Não foi possível carregar os documentos do processo."));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => { ativo = false; };
    }, [processoId]);

    return (
        <div className="secaoDetalhe">
            <div className="financeiroDetalheTopo">
                <Link title="Gerar um documento a partir de um modelo para este processo" to="/modelos" className="button botaoAcaoParticipante">Gerar documento</Link>
            </div>
            <p className="notaCampo">Documentos com o selo "Visível no portal" podem ser baixados no portal pelo cliente para quem foram gerados.</p>

            {erro && <p className="mensagemErro">{erro}</p>}

            {carregando ? (
                <p className="infoSecundariaDetalhe">Carregando...</p>
            ) : documentos.length === 0 ? (
                <EmptyState titulo="Nenhum documento gerado para este processo ainda." descricao="Gere documentos a partir dos seus modelos em &quot;Meus modelos&quot;." />
            ) : (
                <ul className="listaParcelas">
                    {documentos.map((documento) => (
                        <li key={documento._id} className="linhaDocumento">
                            <Link to={`/documentos/${documento._id}`}>{documento.nome}</Link>
                            <span className="documentoSelo">{labelDe(TIPO_DOCUMENTO_OPTIONS, documento.tipo)}</span>
                            <span className="infoSecundariaDetalhe">{documento.cliente?.nome ?? "—"}</span>
                            <span className="infoSecundariaDetalhe">{formatDate(documento.dataGeracao)}</span>
                            <span className={`documentoSelo ${documento.visivelPortal ? "documentoSeloPortal--visivel" : "documentoSeloPortal--oculto"}`}>
                                {documento.visivelPortal ? "Visível no portal" : "Não visível"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default DocumentosDoProcesso;
