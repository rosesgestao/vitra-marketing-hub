import { createClient } from '@supabase/supabase-js'

const fallbackUrl = 'https://birxcfkyuzqnhyvetbjv.supabase.co'
const url = import.meta.env.VITE_SUPABASE_URL || fallbackUrl
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || 'missing-public-key'

export const supabaseConfig = {
  url,
  projectRef: url.replace(/^https?:\/\//, '').split('.')[0],
  hasPublicKey: key !== 'missing-public-key',
}

export const supabase = createClient(url, key)
