import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";
import Loading from "../../../components/Loading/Loading";

import documentService from "../../../services/documentService";

import { getApiErrorMessage } from "../../../utils/apiError";

import MontagemModelo from "./MontagemModelo";
import TextoFinal from "./TextoFinal";

import "./Documentos.css";

function DocumentoDetalhes() {
    const { id } = useParams();

    const [documento, setDocumento] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;
        setCarregando(true);
        setErro("");

        documentService.getDocumentById(id)
            .then((res) => {
                if (ativo) setDocumento(res.data);
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Não foi possível carregar o documento."));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => { ativo = false; };
    }, [id]);

    if (carregando) return <Loading />;

    if (erro || !documento) {
        return (
            <div className="tela telaClientes">
                <BotaoVoltar />
                <div className="baloesTelasAdvogada">
                    <p className="mensagemErro">{erro || "Documento não encontrado."}</p>
                </div>
            </div>
        );
    }

    return documento.ehModelo
        ? <MontagemModelo key={documento._id} documento={documento} onAtualizado={setDocumento} />
        : <TextoFinal key={documento._id} documento={documento} />;
}

export default DocumentoDetalhes;
