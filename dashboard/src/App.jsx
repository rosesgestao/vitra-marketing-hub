import { useEffect, useState } from 'react'
import { BarChart3, Bot, Building2, CalendarDays, Gem, Layers, LayoutGrid, Megaphone, Zap } from 'lucide-react'
import PremiumDashboard from './views/PremiumDashboard.jsx'
import Pipeline from './views/Pipeline.jsx'
import Calendario from './views/Calendario.jsx'
import Kanban from './views/Kanban.jsx'
import Agentes from './views/Agentes.jsx'
import Metricas from './views/Metricas.jsx'
import { BrandHorizontalLogo, BrandV } from './components/PremiumBrand.jsx'
import { BRAND_SCOPES, getBrandProfile } from './lib/brandProfiles.js'
import EstudioPecas from './views/EstudioPecas.jsx'
import { PECAS_PLATFORMS } from './lib/pecasCatalog.js'

// Marca-mae (Vitra Imobiliaria) PRIMEIRO: e a marca principal do sistema. Vitra Premium
// segue disponivel como sub-marca, logo abaixo.
const BRAND_SECTIONS = [
  {
    title: 'Vitra Imobiliária',
    scope: BRAND_SCOPES.imobiliaria,
    items: [
      { id: 'imobiliaria', label: 'Painel Imobiliária', icon: Building2, brandScope: BRAND_SCOPES.imobiliaria },
      { id: 'imobiliaria-trafego', label: 'Tráfego Pago', icon: Megaphone, brandScope: BRAND_SCOPES.imobiliaria, focusMode: 'trafego' },
    ],
  },
  {
    title: 'Vitra Premium',
    scope: BRAND_SCOPES.premium,
    items: [
      { id: 'premium', label: 'Painel Premium', icon: Gem, brandScope: BRAND_SCOPES.premium },
      { id: 'premium-trafego', label: 'Tráfego Pago', icon: Megaphone, brandScope: BRAND_SCOPES.premium, focusMode: 'trafego' },
    ],
  },
]

const OPERATIONS = [
  { id: 'pipeline', label: 'Pipeline', icon: Zap },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  { id: 'kanban', label: 'Conteúdos', icon: Layers },
  { id: 'agentes', label: 'Agentes', icon: Bot },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
]

// Navegação do Estúdio de Peças derivada do catálogo (escalável: nova plataforma no
// catálogo aparece aqui automaticamente). "Visão geral" é o hub das seções.
const PECAS_NAV = [
  { id: 'pecas:overview', label: 'Visão geral', icon: LayoutGrid },
  ...PECAS_PLATFORMS.map(platform => ({ id: `pecas:${platform.id}`, label: platform.label, icon: platform.icon })),
]

const ALL_VIEWS = [...BRAND_SECTIONS.flatMap(section => section.items), ...PECAS_NAV, ...OPERATIONS]
const DEFAULT_VIEW_ID = 'imobiliaria'
const NAV_STORAGE_KEY = 'vitra-operational-dashboard.active-view'

function normalizeViewId(viewId) {
  return ALL_VIEWS.some(item => item.id === viewId) ? viewId : DEFAULT_VIEW_ID
}

function readInitialView() {
  if (typeof window === 'undefined') return DEFAULT_VIEW_ID

  try {
    return normalizeViewId(window.localStorage.getItem(NAV_STORAGE_KEY))
  } catch {
    return DEFAULT_VIEW_ID
  }
}

export default function App() {
  const [view, setView] = useState(readInitialView)
  const currentView = ALL_VIEWS.find(item => item.id === view) || ALL_VIEWS[0]
  // Views compartilhadas (operacao, estudio de pecas) caem na MARCA-MAE por padrao;
  // so paineis Premium re-tingem o chrome para preto (sem azul).
  const activeBrandScope = currentView.brandScope || BRAND_SCOPES.imobiliaria
  const activeBrand = getBrandProfile(activeBrandScope)

  useEffect(() => {
    try {
      window.localStorage.setItem(NAV_STORAGE_KEY, normalizeViewId(view))
    } catch {
      // Navegadores em modo restrito podem bloquear storage; nesse caso mantemos o estado em memória.
    }
  }, [view])

  // Re-tinge todo o chrome conforme a marca ativa (variaveis de tema no <html>).
  useEffect(() => {
    document.documentElement.dataset.brand = activeBrandScope
  }, [activeBrandScope])

  return (
    <div className="flex h-screen overflow-hidden text-white">
      <aside className="relative flex w-72 flex-shrink-0 flex-col border-r border-gold-500/15 bg-[color:var(--surface-0)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,148,42,0.10),transparent_18rem)]" />

        <div className="relative px-6 pb-6 pt-7">
          <BrandHorizontalLogo brandScope={activeBrandScope} className="scale-[0.82] origin-left" />
          <p className="mt-5 border-t border-gold-500/20 pt-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-500/70">
            {activeBrand.shellKicker}
          </p>
        </div>

        <div className="gold-line mx-0" />

        <nav className="relative flex-1 space-y-5 overflow-y-auto px-4 py-5" aria-label="Navegação principal">
          {BRAND_SECTIONS.map(section => (
            <div key={section.scope}>
              <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-gold-500/50">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map(item => (
                  <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-gold-500/50">
              Estúdio de Peças
            </p>
            <div className="space-y-1">
              {PECAS_NAV.map(item => (
                <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-gold-500/50">
              Operação compartilhada
            </p>
            <div className="space-y-1">
              {OPERATIONS.map(item => (
                <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />
              ))}
            </div>
          </div>
        </nav>

        <div className="gold-line mx-0" />

        <div className="relative px-6 py-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--surface-0)]">
              <BrandV brandScope={activeBrandScope} size={28} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/72">{activeBrand.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-gold-500/60">{activeBrand.descriptor}</p>
            </div>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Sistema ativo</span>
          </div>
          <p className="text-[10px] text-gray-500">Brand system aplicado · Junho/2026</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-transparent">
        {view === 'premium' && <PremiumDashboard brandScope={BRAND_SCOPES.premium} />}
        {view === 'premium-trafego' && <PremiumDashboard brandScope={BRAND_SCOPES.premium} focusMode="trafego" />}
        {view === 'imobiliaria' && <PremiumDashboard brandScope={BRAND_SCOPES.imobiliaria} />}
        {view === 'imobiliaria-trafego' && <PremiumDashboard brandScope={BRAND_SCOPES.imobiliaria} focusMode="trafego" />}
        {view.startsWith('pecas:') && <EstudioPecas platformId={view.slice('pecas:'.length)} onNavigate={setView} />}
        {view === 'pipeline' && <Pipeline />}
        {view === 'calendario' && <Calendario />}
        {view === 'kanban' && <Kanban />}
        {view === 'agentes' && <Agentes />}
        {view === 'metricas' && <Metricas />}
      </main>
    </div>
  )
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
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
      {item.label}
    </button>
  )
}
