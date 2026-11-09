import { useSyncExternalStore } from 'react';
import { lerOnline } from '../offline/online';

const assinar = (avisar) => {
    window.addEventListener('online', avisar);
    window.addEventListener('offline', avisar);
    return () => {
        window.removeEventListener('online', avisar);
        window.removeEventListener('offline', avisar);
    };
};

export default function useOnlineStatus() {
    return useSyncExternalStore(assinar, lerOnline, () => true);
}
