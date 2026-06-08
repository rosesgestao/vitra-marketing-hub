import globals from 'globals'

// Guardrail FOCADO: so a regra `no-undef`. Pega a classe de bug que o build nao acusa — identificador
// usado sem import/declaracao (ex.: `fieldsForTemplate is not defined` em runtime). Sem regras de estilo
// para nao gerar ruido. As Edges em supabase/functions ja sao cobertas pelo `deno check` no CI.
//
// Nota sobre JSX: a regra base `no-undef` NAO sinaliza nomes de componente JSX (<Field/>) — isso seria
// papel do plugin react. Aqui cobrimos o caso que nos mordeu: chamadas de funcao em expressoes.
export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'error',
    },
  },
]
