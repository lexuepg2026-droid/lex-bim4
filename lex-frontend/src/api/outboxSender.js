import api from './axiosConfig';
import { CABECALHO_VERSAO } from '../offline/versionHeader';

export const enviarEntrada = (entrada) =>
    api.request({
        method: entrada.method,
        url: entrada.url,
        data: entrada.body ?? undefined,
        daFila: true,
        headers: {
            'Idempotency-Key': entrada.chaveIdempotencia,
            ...(entrada.versaoVista ? { [CABECALHO_VERSAO]: entrada.versaoVista } : {}),
        },
    });

export default { enviarEntrada };
