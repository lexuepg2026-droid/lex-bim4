export const nomeDoAnexo = (response, alternativo) => {
    const disposition = response?.headers?.['content-disposition'] ?? '';
    
    return disposition.match(/filename="?([^";]+)"?/)?.[1] ?? alternativo;
};
