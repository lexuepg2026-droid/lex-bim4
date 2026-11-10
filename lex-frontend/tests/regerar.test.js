// Regerar sempre substitui o anterior (fase R6, DEC-173). No front: a tela do
// documento vai para o documento NOVO depois de regerar (o anterior saiu da
// lista e responde 404), com a guarda de montagem da R2; e os textos de ajuda
// dizem a regra nova.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { AJUDA, COMO_USAR } from "../src/components/Ajuda/textos.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fonte = readFileSync(resolve(RAIZ, "src/pages/PortalAdvogada/Documentos/TextoFinal.jsx"), "utf8");

describe("regerar sempre substitui (DEC-173)", () => {
    test("depois de regerar, a tela vai para o documento novo, sem voltar ao anterior", () => {
        const corpo = fonte.slice(fonte.indexOf("const regerar = async"), fonte.indexOf("const tentarRegerar"));
        assert.match(corpo, /if \(!montado\.current\) return;\s*setConflito\(null\);/);
        assert.match(corpo, /navigate\(`\/documentos\/\$\{res\.data\._id\}`, \{ replace: true \}\)/);
    });

    test("o balão e o Como usar dizem que o novo substitui o anterior", () => {
        assert.equal(
            AJUDA.regerar.texto,
            "Regerar cria o documento de novo, com as seções e os dados de hoje, e o novo substitui o anterior, que sai da lista. Se este texto foi editado à mão, o sistema pede confirmação antes. O documento regerado nasce fora do portal, mesmo que o anterior estivesse visível."
        );
        const linhas = JSON.stringify(COMO_USAR);
        assert.ok(linhas.includes("Regerar refaz o texto com os dados de hoje e substitui o anterior. Se o documento foi editado à mão, o sistema pede confirmação antes."));
    });
});
