export const getTheme = () => localStorage.getItem('lex-theme') || 'dark';
export const setTheme = (t) => localStorage.setItem('lex-theme', t);
export const removeTheme = () => localStorage.removeItem('lex-theme');
