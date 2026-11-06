import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: Number(env.PORT) || 5173,
      fs: {
        allow: [rootDir],
      },
    },
  }
})