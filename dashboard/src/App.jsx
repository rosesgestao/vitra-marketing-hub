import { useState } from 'react'
import { BarChart3, Bot, CalendarDays, Gem, Layers, Zap } from 'lucide-react'
import PremiumDashboard from './views/PremiumDashboard.jsx'
import Pipeline from './views/Pipeline.jsx'
import Calendario from './views/Calendario.jsx'
import Kanban from './views/Kanban.jsx'
import Agentes from './views/Agentes.jsx'
import Metricas from './views/Metricas.jsx'

const VIEWS = [
  { id: 'premium', label: 'Premium', icon: Gem },
  { id: 'pipeline', label: 'Pipeline', icon: Zap },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  { id: 'kanban', label: 'Conteúdos', icon: Layers },
  { id: 'agentes', label: 'Agentes', icon: Bot },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
]

export default function App() {
  const [view, setView] = useState('premium')

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-gold-500/15 bg-[#070708]">
        <div className="px-5 pb-5 pt-7">
          <p className="font-display text-xl font-semibold tracking-wide text-white">VITRA</p>
          <p
            className="label-section mt-1"
            style={{ borderBottom: '1px solid rgba(196,148,42,0.3)', paddingBottom: '16px' }}
          >
            Premium Ops
          </p>
        </div>

        <div className="gold-line mx-0" />

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200"
                style={{
                  background: active ? 'rgba(196,148,42,0.10)' : 'transparent',
                  color: active ? '#D4A84A' : '#ADB5BD',
                  fontWeight: active ? 500 : 400,
                  borderLeft: active ? '2px solid #D4A84A' : '2px solid transparent',
                }}
                onMouseEnter={event => {
                  if (!active) {
                    event.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    event.currentTarget.style.color = '#FFFFFF'
                  }
                }}
                onMouseLeave={event => {
                  if (!active) {
                    event.currentTarget.style.background = 'transparent'
                    event.currentTarget.style.color = '#ADB5BD'
                  }
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="gold-line mx-0" />

        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            <span className="text-[10px] text-navy-600">Sistema ativo</span>
          </div>
          <p className="text-[11px] font-medium text-white/60">Vitra Premium</p>
          <p className="mt-0.5 text-[10px] text-navy-600">Fase 1 · Mai/2026</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#050506]">
        {view === 'premium' && <PremiumDashboard />}
        {view === 'pipeline' && <Pipeline />}
        {view === 'calendario' && <Calendario />}
        {view === 'kanban' && <Kanban />}
        {view === 'agentes' && <Agentes />}
        {view === 'metricas' && <Metricas />}
      </main>
    </div>
  )
}
