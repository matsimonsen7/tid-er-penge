import { defineConfig } from 'vite'
import { readdirSync, existsSync } from 'fs'
import { resolve } from 'path'

function getStockPages(): Record<string, string> {
  const aktierDir = resolve(__dirname, 'aktier')
  if (!existsSync(aktierDir)) return {}

  const entries: Record<string, string> = {}
  const dirs = readdirSync(aktierDir, { withFileTypes: true })

  for (const dir of dirs) {
    if (dir.isDirectory()) {
      const htmlPath = resolve(aktierDir, dir.name, 'index.html')
      if (existsSync(htmlPath)) {
        entries[`aktier-${dir.name}`] = htmlPath
      }
    }
  }

  return entries
}

function getOptionalInput(name: string, path: string): Record<string, string> {
  return existsSync(resolve(__dirname, path)) ? { [name]: resolve(__dirname, path) } : {}
}

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...getOptionalInput('aktier', 'aktier/index.html'),
        ...getOptionalInput('om', 'om/index.html'),
        ...getStockPages(),
      },
      output: {
        manualChunks: {
          chart: ['chart.js'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
