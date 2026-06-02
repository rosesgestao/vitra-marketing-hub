import { useState } from 'react'
import { BarChart3, Bot, CalendarDays, Gem, Layers, Megaphone, Zap } from 'lucide-react'
import PremiumDashboard from './views/PremiumDashboard.jsx'
import Pipeline from './views/Pipeline.jsx'
import Calendario from './views/Calendario.jsx'
import Kanban from './views/Kanban.jsx'
import Agentes from './views/Agentes.jsx'
import Metricas from './views/Metricas.jsx'
import { PremiumHorizontalLogo, PremiumV } from './components/PremiumBrand.jsx'

const VIEWS = [
  { id: 'premium', label: 'Premium', icon: Gem },
  { id: 'trafego', label: 'Tráfego Pago', icon: Megaphone },
  { id: 'pipeline', label: 'Pipeline', icon: Zap },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  { id: 'kanban', label: 'Conteúdos', icon: Layers },
  { id: 'agentes', label: 'Agentes', icon: Bot },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
]

export default function App() {
  const [view, setView] = useState('premium')

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      <aside className="relative flex w-72 flex-shrink-0 flex-col border-r border-gold-500/15 bg-[#050505]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,148,42,0.10),transparent_18rem)]" />

        <div className="relative px-6 pb-6 pt-7">
          <PremiumHorizontalLogo className="scale-[0.86] origin-left" />
          <p className="mt-5 border-t border-gold-500/20 pt-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-500/70">
            Central de curadoria
          </p>
        </div>

        <div className="gold-line mx-0" />

        <nav className="relative flex-1 space-y-1 px-4 py-5" aria-label="Navegacao principal">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="relative flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition-all duration-200"
                style={{
                  background: active ? 'rgba(196,148,42,0.12)' : 'transparent',
                  borderColor: active ? 'rgba(196,148,42,0.36)' : 'transparent',
                  color: active ? '#E4C06E' : '#A7A29A',
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={event => {
                  if (!active) {
                    event.currentTarget.style.background = 'rgba(255,255,255,0.035)'
                    event.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    event.currentTarget.style.color = '#FFFFFF'
                  }
                }}
                onMouseLeave={event => {
                  if (!active) {
                    event.currentTarget.style.background = 'transparent'
                    event.currentTarget.style.borderColor = 'transparent'
                    event.currentTarget.style.color = '#A7A29A'
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="gold-line mx-0" />

        <div className="relative px-6 py-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
              <PremiumV size={28} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/72">Vitra Premium</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-gold-500/60">Alto padrao</p>
            </div>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Sistema ativo</span>
          </div>
          <p className="text-[10px] text-gray-600">Brandbook aplicado · Maio/2026</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-transparent">
        {view === 'premium' && <PremiumDashboard />}
        {view === 'trafego' && <PremiumDashboard focusMode="trafego" />}
        {view === 'pipeline' && <Pipeline />}
        {view === 'calendario' && <Calendario />}
        {view === 'kanban' && <Kanban />}
        {view === 'agentes' && <Agentes />}
        {view === 'metricas' && <Metricas />}
      </main>
    </div>
  )
}
