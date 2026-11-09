import { useState, useEffect, useCallback } from "react";
import { subscribe, toast as emitir, regiaoDe } from "../../utils/toast";
import { consumirAvisoDeSessao } from "../../api/toastGlobal";
import fechar from "../../assets/images/icons/fechar.svg";

import "./ToastContainer.css";

// DEC-083 (reescrita na fase R2): o contêiner fica SEMPRE montado, com as duas
// regiões vivas no DOM desde o início. Uma região criada junto com a mensagem
// não é anunciada pelos leitores de tela.
function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    const remover = useCallback((id) => {
        setToasts((atual) => atual.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        const unsubscribe = subscribe((novoToast) => {
            setToasts((atual) => [...atual, novoToast]);
            setTimeout(() => remover(novoToast.id), novoToast.duracao);
        });

        // A mensagem da sessão perdida, guardada antes do recarregamento (DEC-084).
        const aviso = consumirAvisoDeSessao(window.sessionStorage);
        if (aviso) emitir.info(aviso);

        return unsubscribe;
    }, [remover]);

    const daRegiao = (regiao) => toasts.filter((t) => regiaoDe(t.type) === regiao);

    const item = (toast) => (
        <div key={toast.id} className={`toastItem toastItem--${toast.type}`}>
            <span className="toastMensagem">{toast.message}</span>
            <button
                type="button"
                className="buttonNoBorder toastFechar"
                onClick={() => remover(toast.id)}
                aria-label="Fechar aviso"
            >
                <img src={fechar} alt="" aria-hidden="true" />
            </button>
        </div>
    );

    return (
        <div className="toastContainer">
            <div role="status" aria-live="polite" className="toastRegiao">
                {daRegiao("status").map(item)}
            </div>
            <div role="alert" aria-live="assertive" className="toastRegiao">
                {daRegiao("alert").map(item)}
            </div>
        </div>
    );
}

export default ToastContainer;
