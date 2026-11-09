import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../../components/EmptyState/EmptyState";

import documentService from "../../../services/documentService";

import { getApiErrorMessage } from "../../../utils/apiError";
import { formatDate } from "../../../utils/formatters";
import { labelDe, TIPO_DOCUMENTO_OPTIONS } from "../../../utils/enums";

import "./Documentos.css";

function DocumentosLista() {
    const [documentos, setDocumentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    useEffect(() => {
        let ativo = true;
        setCarregando(true);
        setErro("");

        documentService.listDocuments({ page: pagina, limit: 20, ehModelo: false, busca: busca.trim() || undefined })
            .then((res) => {
                if (!ativo) return;
                setDocumentos(res.data.data ?? res.data);
                setTotalPaginas(res.data.totalPages ?? 1);
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Falha ao buscar documentos."));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => { ativo = false; };
    }, [pagina, busca]);

    return (
        <div className="tela telaClientes">
            <div className="baloesTelasAdvogada">
                <div className="financeiroSecaoCabecalho">
                    <h1 className="tituloPagina">Documentos</h1>
                    <Link title="Criar e editar os modelos usados para gerar documentos" to="/modelos" className="buttonOutlined botaoAcaoParticipante">Meus modelos</Link>
                </div>

                <div className="linhaFiltros">
                    <input
                        type="text"
                        className="financeiroBusca"
                        placeholder="Buscar por nome, número do processo ou cliente..."
                        value={busca}
                        onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                        maxLength={80}
                    />
                </div>
                <p className="notaCampo">Documentos com o selo "Visível no portal" podem ser baixados no portal pelo cliente para quem foram gerados.</p>

                {erro && <p className="mensagemErro">{erro}</p>}

                {carregando ? (
                    <p className="infoSecundariaDetalhe">Carregando...</p>
                ) : documentos.length === 0 ? (
                    !erro && <EmptyState
                        titulo={busca ? "Nenhum documento encontrado." : "Nenhum documento gerado ainda."}
                        descricao={busca ? "Tente outro nome, número do processo ou cliente." : "Vá em \"Meus modelos\" para gerar o primeiro."}
                    />
                ) : (
                    <ul className="listaParcelas">
                        {documentos.map((documento) => (
                            <li key={documento._id} className="linhaDocumento">
                                <Link to={`/documentos/${documento._id}`}>{documento.nome}</Link>
                                <span className="documentoSelo">{labelDe(TIPO_DOCUMENTO_OPTIONS, documento.tipo)}</span>
                                <span>
                                    {documento.processoId?.titulo
                                        ? <Link to={`/processos/detalhes/${documento.processoId._id}`}>{documento.processoId.titulo}</Link>
                                        : "—"}
                                    {documento.cliente?.nome && <span className="infoSecundariaDetalhe"> · {documento.cliente.nome}</span>}
                                </span>
                                <span className="infoSecundariaDetalhe">{formatDate(documento.dataGeracao)}</span>
                                <span className={`documentoSelo ${documento.visivelPortal ? "documentoSeloPortal--visivel" : "documentoSeloPortal--oculto"}`}>
                                    {documento.visivelPortal ? "Visível no portal" : "Não visível"}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {totalPaginas > 1 && (
                    <div className="financeiroPaginacao">
                        <button type="button" className="buttonOutlined" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
                        <span className="infoSecundariaDetalhe">Página {pagina} de {totalPaginas}</span>
                        <button type="button" className="buttonOutlined" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Próxima</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DocumentosLista;
