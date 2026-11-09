import { useCallback, useState } from "react";

const TABELAS = {
    comarcas: { arquivo: "comarcas-pr", extrair: (d) => d.itens.map((i) => i.nome) },
    nacionalidades: { arquivo: "nacionalidades", extrair: (d) => d.itens.flatMap((i) => [i.feminino, i.masculino]) },
    profissoes: { arquivo: "profissoes-cbo", extrair: (d) => d.itens.map((i) => i.nome) },
    classesCnj: { arquivo: "classes-assuntos-cnj", extrair: (d) => d.classes.map((i) => i.nome) },
    assuntosCnj: { arquivo: "classes-assuntos-cnj", extrair: (d) => d.assuntos.map((i) => i.nome) },
};

const arquivosCarregados = new Map();

const carregarArquivo = (arquivo) => {
    if (!arquivosCarregados.has(arquivo)) {
        const promessa = fetch(`/tabelas/${arquivo}.json`)
            .then((resposta) => {
                if (!resposta.ok) throw new Error(arquivo);
                return resposta.json();
            })
            .catch((erro) => {
                arquivosCarregados.delete(arquivo);
                throw erro;
            });
        arquivosCarregados.set(arquivo, promessa);
    }
    return arquivosCarregados.get(arquivo);
};

export function useTabela(nome) {
    const [lista, setLista] = useState([]);

    const ativar = useCallback(() => {
        if (lista.length > 0) return;
        const tabela = TABELAS[nome];
        carregarArquivo(tabela.arquivo)
            .then((dados) => setLista([...new Set(tabela.extrair(dados).filter(Boolean))]))
            .catch(() => {});
    }, [nome, lista.length]);

    return [lista, ativar];
}
