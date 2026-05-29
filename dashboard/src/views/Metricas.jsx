import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { TrendingUp, Users, BarChart3, Play, Repeat2 } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, cor = '#D4A84A' }) {
  return (
    <div className="card-hover">
      <div className="flex items-start justify-between mb-4">
        <p className="label-section">{label}</p>
        <Icon size={15} style={{ color: cor }} />
      </div>
      <p className="font-display text-3xl font-semibold" style={{ color: cor }}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-[11px] text-gray-500 mt-1.5">{sub}</p>}
    </div>
  )
}

function BarraProgresso({ label, valor, max }) {
  const pct = max > 0 ? Math.min((valor / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-500">{valor?.toLocaleString('pt-BR') ?? '0'}</span>
      </div>
      <div className="h-1 bg-navy-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #C4942A, #E4C06E)',
          }}
        />
      </div>
    </div>
  )
}

const PLATAFORMA_COR = {
  instagram: '#E1306C',
  facebook:  '#1877F2',
  youtube:   '#FF0000',
  tiktok:    '#69C9D0',
}

export default function Metricas() {
  const [metricas, setMetricas] = useState([])
  const [publicacoes, setPublicacoes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from('metricas').select('*').order('data_coleta', { ascending: false }).limit(20),
        supabase.from('publicacoes').select('*').order('publicado_em', { ascending: false }).limit(20),
      ])
      setMetricas(m || [])
      setPublicacoes(p || [])
      setLoading(false)
    }
    carregar()
  }, [])

  const porPlataforma = metricas.reduce((acc, m) => {
    if (!acc[m.plataforma]) acc[m.plataforma] = { seguidores: 0, curtidas: 0, visualizacoes: 0, alcance: 0 }
    acc[m.plataforma].seguidores     = Math.max(acc[m.plataforma].seguidores,     m.seguidores || 0)
    acc[m.plataforma].curtidas      += m.curtidas || 0
    acc[m.plataforma].visualizacoes += m.visualizacoes || 0
    acc[m.plataforma].alcance       += m.alcance || 0
    return acc
  }, {})

  const ig = porPlataforma['instagram'] || {}
  const yt = porPlataforma['youtube']   || {}
  const fb = porPlataforma['facebook']  || {}

  const totalPublicados = publicacoes.length
  const publicadosHoje  = publicacoes.filter(p =>
    new Date(p.publicado_em).toDateString() === new Date().toDateString()
  ).length

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <p className="label-section mb-2">Performance consolidada</p>
          <h1 className="font-display text-2xl text-white font-semibold">Métricas</h1>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28">
              <div className="skeleton h-3 w-24 mb-4" />
              <div className="skeleton h-8 w-20 mb-2" />
              <div className="skeleton h-2.5 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="label-section mb-2">Performance consolidada</p>
        <h1 className="font-display text-2xl text-white font-semibold">Métricas</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Instagram"
          value={(ig.seguidores || 6723).toLocaleString('pt-BR')}
          sub="seguidores"
          icon={Users}
          cor="#E1306C"
        />
        <StatCard
          label="Facebook"
          value={(fb.seguidores || 17288).toLocaleString('pt-BR')}
          sub="seguidores"
          icon={Users}
          cor="#1877F2"
        />
        <StatCard
          label="Posts publicados"
          value={totalPublicados}
          sub={`${publicadosHoje} hoje`}
          icon={BarChart3}
          cor="#4ADE80"
        />
        <StatCard
          label="YouTube"
          value={yt.seguidores ? yt.seguidores.toLocaleString('pt-BR') : '—'}
          sub="inscritos"
          icon={Play}
          cor="#FF0000"
        />
      </div>

      {metricas.length > 0 && (
        <>
          <div className="gold-line mb-6" />
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-medium text-white">Engajamento acumulado</p>
              <Repeat2 size={14} className="text-navy-600" />
            </div>
            <div className="space-y-4">
              <BarraProgresso label="Curtidas Instagram"  valor={ig.curtidas}      max={10000} />
              <BarraProgresso label="Visualizações"       valor={ig.visualizacoes} max={100000} />
              <BarraProgresso label="Alcance"             valor={ig.alcance}       max={200000} />
            </div>
          </div>
        </>
      )}

      {publicacoes.length > 0 && (
        <>
          <div className="gold-line mb-6" />
          <div className="card">
            <p className="text-sm font-medium text-white mb-5">Últimas publicações</p>
            <div>
              {publicacoes.slice(0, 8).map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 py-2.5 transition-colors hover:bg-navy-800/40 px-2 -mx-2 rounded-lg"
                  style={{ borderBottom: i < 7 ? '1px solid rgba(20,45,88,0.8)' : 'none' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: PLATAFORMA_COR[p.plataforma] || '#ADB5BD' }}
                  />
                  <span className="text-xs text-gray-400 capitalize w-20 flex-shrink-0">{p.plataforma}</span>
                  <span className="text-xs text-gray-300 flex-1 truncate">{p.url_post || 'post publicado'}</span>
                  <span className="label-section flex-shrink-0">
                    {new Date(p.publicado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {metricas.length === 0 && publicacoes.length === 0 && (
        <div className="card flex flex-col items-center justify-center h-48 text-center">
          <TrendingUp size={22} className="text-navy-600 mb-3" />
          <p className="text-gray-400 text-sm font-medium">Aguardando dados</p>
          <p className="text-navy-600 text-xs mt-1">Métricas coletadas pelo Ag.1 toda sexta às 17h</p>
        </div>
      )}
    </div>
  )
}
