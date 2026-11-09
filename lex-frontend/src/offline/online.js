export const lerOnline = () =>
  typeof navigator === 'undefined' || navigator.onLine !== false;
