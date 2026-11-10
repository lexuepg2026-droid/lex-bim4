// O sino diz o que soma (fase R6, DEC-174): o `aria-label` e o `title` do
// botão nomeiam os grupos das notificações não lidas, sem mudar o desenho.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { resumoDoSino } from "../src/components/Notificacoes/resumoDoSino.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const itens = (grupo, n) => Array.from({ length: n }, (_, i) => ({ _id: `${grupo}${i}`, grupo }));

describe("o sino diz o que soma", () => {
    test("os três grupos, no singular e no plural", () => {
        assert.equal(
            resumoDoSino([...itens("Hoje", 2), ...itens("Atrasado", 1), ...itens("Parcela vencida", 3)]),
            "Notificações: 2 compromissos de hoje, 1 compromisso atrasado e 3 parcelas vencidas"
        );
        assert.equal(resumoDoSino(itens("Parcela vencida", 1)), "Notificações: 1 parcela vencida");
        assert.equal(
            resumoDoSino([...itens("Hoje", 1), ...itens("Parcela vencida", 2)]),
            "Notificações: 1 compromisso de hoje e 2 parcelas vencidas"
        );
    });

    test("sem nada novo, e antes da resposta", () => {
        assert.equal(resumoDoSino([]), "Notificações: nada novo");
        assert.equal(resumoDoSino(null), "Notificações");
    });

    test("o botão usa o resumo no aria-label e no title", () => {
        const fonte = readFileSync(resolve(RAIZ, "src/components/Notificacoes/Notificacoes.jsx"), "utf8");
        assert.match(fonte, /title=\{resumoDoSino\(avisos \? naoLidos : null\)\}/);
        assert.match(fonte, /aria-label=\{resumoDoSino\(avisos \? naoLidos : null\)\}/);
    });
});
