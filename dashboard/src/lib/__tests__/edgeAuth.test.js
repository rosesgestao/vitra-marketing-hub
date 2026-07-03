import { describe, it, expect } from 'vitest'
// Modulo compartilhado da auth das Edges de IA — mesma logica que roda no servidor.
import { decideAiEdgeAuth } from '../../../../supabase/functions/_shared/edgeAuth.ts'

// Seguranca das Edges de IA: a chave publishable (publica) sozinha NAO autoriza chamada paga; o caminho
// anon exige o gate token (x-copilot-gate). Service role e isenta. Sem o secret, mantem aberto (graceful).

const SERVICE = 'service-role-key'
const ANON = 'anon-publishable-key'
const GATE = 'gate-secret-123'

describe('decideAiEdgeAuth', () => {
  it('sem chave apresentada -> 401', () => {
    const r = decideAiEdgeAuth({ presented: null, gateHeader: null, serviceKey: SERVICE, anonKey: ANON, gate: GATE })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(401)
  })

  it('service role -> ok e ISENTA do gate (mesmo com gate setado, sem header)', () => {
    const r = decideAiEdgeAuth({ presented: SERVICE, gateHeader: null, serviceKey: SERVICE, anonKey: ANON, gate: GATE })
    expect(r.ok).toBe(true)
  })

  it('usuario autenticado (role=authenticated) -> ok via user, mesmo com gate setado e sem header', () => {
    // Caminho de PRODUCAO: usuario logado apresenta o SEU JWT (nao a anon key). verify_jwt=true ja
    // validou a assinatura; o claim role='authenticated' autoriza.
    const r = decideAiEdgeAuth({ presented: 'user-jwt-xyz', presentedRole: 'authenticated', gateHeader: null, serviceKey: SERVICE, anonKey: ANON, gate: GATE })
    expect(r.ok).toBe(true)
    expect(r.via).toBe('user')
  })

  it('JWT com role=anon (nao logado) -> NAO entra pelo caminho de usuario; cai no gate', () => {
    // Um JWT anon apresenta presented=anonKey (nao um user token). Sem gate header -> negado.
    const r = decideAiEdgeAuth({ presented: ANON, presentedRole: 'anon', gateHeader: null, serviceKey: SERVICE, anonKey: ANON, gate: GATE })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(403)
  })

  it('anon + gate setado + SEM header de gate -> 403 forbidden_gate', () => {
    const r = decideAiEdgeAuth({ presented: ANON, gateHeader: null, serviceKey: SERVICE, anonKey: ANON, gate: GATE })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(403)
    expect(r.error).toBe('forbidden_gate')
  })

  it('anon + gate setado + header ERRADO -> 403', () => {
    const r = decideAiEdgeAuth({ presented: ANON, gateHeader: 'errado', serviceKey: SERVICE, anonKey: ANON, gate: GATE })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(403)
  })

  it('anon + gate setado + header CORRETO -> ok (sem openMode)', () => {
    const r = decideAiEdgeAuth({ presented: ANON, gateHeader: GATE, serviceKey: SERVICE, anonKey: ANON, gate: GATE })
    expect(r.ok).toBe(true)
    expect(r.openMode).toBeFalsy()
  })

  it('anon + gate NAO setado -> ok mas openMode=true (graceful aberto, sinalizado p/ alerta)', () => {
    const r = decideAiEdgeAuth({ presented: ANON, gateHeader: null, serviceKey: SERVICE, anonKey: ANON, gate: '' })
    expect(r.ok).toBe(true)
    expect(r.openMode).toBe(true)
  })

  it('chave invalida -> 401', () => {
    const r = decideAiEdgeAuth({ presented: 'chave-aleatoria', gateHeader: GATE, serviceKey: SERVICE, anonKey: ANON, gate: GATE })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(401)
  })
})
