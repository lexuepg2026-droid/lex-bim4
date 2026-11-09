import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const exigirApiUrlNoBuild = () => ({
  name: 'lex-exigir-vite-api-url',
  apply: 'build',
  config(_config, { mode }) {
    if (mode !== 'production') return

    const env = loadEnv(mode, process.cwd(), '')
    const url = (env.VITE_API_URL ?? '').trim()

    if (url === '') {
      throw new Error(
        '\n\n  VITE_API_URL não está definida — o build de produção foi abortado.\n' +
          '  Copie o .env.production.example para .env.production e coloque a URL da API (com /api no final).\n'
      )
    }
  },
})

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    exigirApiUrlNoBuild(),
  ],
})
