import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import taskforgePwa from './pwa/build.js'

const envDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({mode}) => ({
  envDir,
  plugins: [react(), tailwindcss(), taskforgePwa(), {
    name:'taskforge-local-api',
    apply:'serve',
    configureServer(server) {
      const env = loadEnv(mode, envDir, ['MONGODB_'])
      for (const key of ['MONGODB_URI','MONGODB_DB_NAME']) {
        if (env[key] !== undefined) process.env[key] = env[key]
      }
      server.middlewares.use(async (req,res,next) => {
        const pathname = req.url?.split('?')[0]
        if (pathname === '/api/user/profile' || pathname === '/api/user/avatar') {
          const module = pathname.endsWith('avatar') ? await import('./api/user/avatar.js') : await import('./api/user/profile.js')
          return module.default(req,res)
        }
        next()
      })
      server.middlewares.use('/api/auth', async (req, res) => {
        const {default:handler} = await import('./api/auth.js')
        await handler(req, res)
      })
      server.middlewares.use('/api/workspace', async (req, res) => {
        const {default:handler} = await import('./api/workspace.js')
        await handler(req, res)
      })
    },
  }],
}))
