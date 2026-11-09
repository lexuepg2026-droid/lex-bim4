import { useState, useEffect } from "react";
import { subscribe } from "../../utils/toast";

import "./ToastContainer.css";

function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribe((novoToast) => {
            setToasts((atual) => [...atual, novoToast]);

            setTimeout(() => {
                setToasts((atual) => atual.filter((t) => t.id !== novoToast.id));
            }, 4000);
        });

        return unsubscribe;
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="toastContainer">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toastItem toastItem--${toast.type}`}>
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

export default ToastContainer;