import { createClient } from '@supabase/supabase-js'

const fallbackUrl = 'https://birxcfkyuzqnhyvetbjv.supabase.co'
const url = import.meta.env.VITE_SUPABASE_URL || fallbackUrl
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || 'missing-public-key'

export const supabaseConfig = {
  url,
  projectRef: url.replace(/^https?:\/\//, '').split('.')[0],
  hasPublicKey: key !== 'missing-public-key',
}

// Chave publishable/anon resolvida (PUBLICA por design — ja vai no bundle). Usada para autorizar o
// render-asset com uma credencial que NUNCA expira: essa Edge exige JWT (verify_jwt) mas nao precisa da
// identidade do usuario (ela usa o service role internamente). Se o render usasse o token de sessao do
// usuario, ele daria 401 quando a sessao expirasse no meio de uma leva de cortes.
export const supabaseAnonKey = key

export const supabase = createClient(url, key)
