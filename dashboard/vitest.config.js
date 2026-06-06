import { defineConfig } from 'vitest/config'

// Config dedicada de testes (Fase 0 - rede de seguranca).
// Standalone de proposito: NAO estende o vite.config.js para nao carregar o
// middleware de dev (scraping/sharp/heic) no runtime de teste. As funcoes
// cobertas em src/lib sao puras (geracao/variacao/distribuicao de imagem/formatos).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
