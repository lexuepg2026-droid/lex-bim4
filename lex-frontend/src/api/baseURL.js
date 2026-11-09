const FALLBACK_DEV = 'http://localhost:3001/api';

export const BASE_URL = (() => {
    const url = (import.meta.env.VITE_API_URL ?? '').trim();
    if (url !== '') return url;

    if (import.meta.env.DEV) return FALLBACK_DEV;

    throw new Error('VITE_API_URL não está definida neste build. Veja o .env.production.example.');
})();

export default BASE_URL;
