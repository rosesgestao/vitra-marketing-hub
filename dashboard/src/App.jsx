import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Bot, Building2, CalendarDays, ChevronDown, Gem, Images, Layers, LayoutGrid, Megaphone, Menu, Search, Wand2, X } from 'lucide-react'
import { viewIdFromHash, hashForViewId } from './lib/hashRoute.js'
import CommandPalette from './components/CommandPalette.jsx'
import PremiumDashboard from './views/PremiumDashboard.jsx'
import Pipeline from './views/Pipeline.jsx'
import Calendario from './views/Calendario.jsx'
import Kanban from './views/Kanban.jsx'
import Biblioteca from './views/Biblioteca.jsx'
import Agentes from './views/Agentes.jsx'
import Metricas from './views/Metricas.jsx'
import { BrandHorizontalLogo, BrandV } from './components/PremiumBrand.jsx'
import { BRAND_SCOPES, getBrandProfile } from './lib/brandProfiles.js'
import EstudioPecas from './views/EstudioPecas.jsx'
import EstudioCriativos from './views/EstudioCriativos.jsx'
import Copilot from './components/Copilot.jsx'
import { PECAS_PLATFORMS } from './lib/pecasCatalog.js'

// Marca-mae (Vitra Imobiliaria) PRIMEIRO: e a marca principal do sistema. Vitra Premium
// segue disponivel como sub-marca, logo abaixo.
const BRAND_SECTIONS = [
  {
    title: 'Vitra Imobiliária',
    scope: BRAND_SCOPES.imobiliaria,
    items: [
      { id: 'imobiliaria', label: 'Conteúdo', icon: Building2, brandScope: BRAND_SCOPES.imobiliaria },
      { id: 'imobiliaria-trafego', label: 'Tráfego Pago', icon: Megaphone, brandScope: BRAND_SCOPES.imobiliaria, focusMode: 'trafego' },
    ],
  },
  {
    title: 'Vitra Premium',
    scope: BRAND_SCOPES.premium,
    items: [
      { id: 'premium', label: 'Conteúdo', icon: Gem, brandScope: BRAND_SCOPES.premium },
      { id: 'premium-trafego', label: 'Tráfego Pago', icon: Megaphone, brandScope: BRAND_SCOPES.premium, focusMode: 'trafego' },
    ],
  },
]

// Producao de conteudo ORGANICO (transversal as marcas): planejar e produzir a presenca em redes.
// Pipeline foi MESCLADO em "Conteúdos" (mesmo job de quadro por etapa/status) e saiu do menu para
// reduzir redundancia — o componente segue no codigo e no renderizador (reversivel: basta readicionar
// o item aqui). NENHUMA logica de tela foi alterada.
const CONTEUDO_ORGANICO = [
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  { id: 'kanban', label: 'Conteúdos', icon: Layers },
  { id: 'biblioteca', label: 'Biblioteca', icon: Images },
]

// Transversal: atende organico E pago.
const TRANSVERSAL = [
  { id: 'agentes', label: 'Agentes', icon: Bot },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
]

// Navegação do Estúdio de Peças derivada do catálogo (escalável: nova plataforma no
// catálogo aparece aqui automaticamente). "Visão geral" é o hub das seções.
const PECAS_NAV = [
  { id: 'pecas:overview', label: 'Visão geral', icon: LayoutGrid },
  ...PECAS_PLATFORMS.map(platform => ({ id: `pecas:${platform.id}`, label: platform.label, icon: platform.icon })),
]

const CRIATIVOS_NAV = [
  { id: 'criativos:novo', label: 'Novo criativo', icon: Wand2 },
]

// Modelo unico de seções da sidebar (acordeão): cada seção tem id, título e itens.
// Arquitetura por INTENCAO: cada marca tem os 2 pilares (Conteúdo & Curadoria = organico; Tráfego Pago
// = pago); depois a producao de conteudo organico, os estudios (producao de artes, servem aos dois) e,
// por fim, o que e transversal (automacao + metricas). So navegacao/nomenclatura — telas inalteradas.
const NAV_SECTIONS = [
  ...BRAND_SECTIONS.map(section => ({ id: section.scope, title: section.title, items: section.items })),
  { id: 'conteudo', title: 'Produção de conteúdo', items: CONTEUDO_ORGANICO },
  { id: 'criativos', title: 'Estúdio de Criativos', items: CRIATIVOS_NAV },
  { id: 'pecas', title: 'Estúdio de Peças', items: PECAS_NAV },
  { id: 'operacao', title: 'Inteligência & automação', items: TRANSVERSAL },
]

const ALL_VIEWS = NAV_SECTIONS.flatMap(section => section.items)
// Itens da busca global (⌘K): toda view navegável, com o título da seção como grupo (desambigua os
// labels repetidos — "Conteúdo"/"Tráfego Pago" das duas marcas).
const COMMAND_ITEMS = NAV_SECTIONS.flatMap(section =>
  section.items.map(item => ({ id: item.id, label: item.label, group: section.title, icon: item.icon })),
)
const DEFAULT_VIEW_ID = 'imobiliaria'
const NAV_STORAGE_KEY = 'vitra-operational-dashboard.active-view'

function normalizeViewId(viewId) {
  return ALL_VIEWS.some(item => item.id === viewId) ? viewId : DEFAULT_VIEW_ID
}

// Qual seção contém uma view — usado para manter aberta a seção da view ativa.
function sectionIdForView(viewId) {
  const section = NAV_SECTIONS.find(item => item.items.some(navItem => navItem.id === viewId))
  return section ? section.id : NAV_SECTIONS[0].id
}

function readInitialView() {
  if (typeof window === 'undefined') return DEFAULT_VIEW_ID

  // Deep-link: a URL (hash) tem prioridade — abrir #/metricas direto cai na tela certa.
  const fromHash = viewIdFromHash(window.location.hash)
  if (fromHash) return normalizeViewId(fromHash)

  try {
    return normalizeViewId(window.localStorage.getItem(NAV_STORAGE_KEY))
  } catch {
    return DEFAULT_VIEW_ID
  }
}

export default function App() {
  const [view, setView] = useState(readInitialView)
  // Acordeão da sidebar: só uma seção aberta por vez (a da view ativa, por padrão).
  const [openSection, setOpenSection] = useState(() => sectionIdForView(readInitialView()))
  // Drawer da navegação no mobile: abaixo de `lg` a sidebar vira off-canvas (oculta por padrão).
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // Busca global (⌘K).
  const [searchOpen, setSearchOpen] = useState(false)
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

  // Sempre que a view muda (clique, navegação programática ou estado restaurado),
  // garante que a seção dona dela esteja aberta — recolhendo as demais.
  useEffect(() => {
    setOpenSection(sectionIdForView(view))
  }, [view])

  // Navega para uma view escrevendo no HASH — que dirige o estado via listener abaixo. Assim o
  // voltar/avançar do browser e o deep-link funcionam; o localStorage segue como fallback.
  const navigate = useCallback(viewId => {
    const normalized = normalizeViewId(viewId)
    const target = hashForViewId(normalized)
    if (typeof window !== 'undefined' && window.location.hash !== target) {
      window.location.hash = target // dispara hashchange -> setView (e cria entrada de histórico)
    } else {
      setView(normalized) // hash já igual: garante o estado
    }
    setMobileNavOpen(false)
  }, [])

  // Atalho global de busca: ⌘K / Ctrl+K abre/fecha o command palette.
  useEffect(() => {
    const onKey = event => {
      if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Voltar/avançar do browser (ou edição manual da URL) -> atualiza a view.
  useEffect(() => {
    const onHashChange = () => {
      const id = viewIdFromHash(window.location.hash)
      if (id) setView(normalizeViewId(id))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // No primeiro load, se a URL não tem hash (estado veio do localStorage/default), reflete a view atual
  // na URL sem criar histórico — para o link já nascer compartilhável.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!viewIdFromHash(window.location.hash)) {
      window.history.replaceState(null, '', hashForViewId(view))
    }
    // Intencionalmente só na montagem (sincroniza a URL inicial). `view` lido via closure é aceitável aqui.
  }, [])

  return (
    <div className="flex h-screen overflow-hidden text-white">
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-shrink-0 flex-col border-r border-gold-500/15 bg-[color:var(--surface-0)] transition-transform duration-300 ease-out md:static md:z-auto md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,148,42,0.10),transparent_18rem)]" />

        <div className="relative flex items-start justify-between gap-2 px-6 pb-6 pt-7">
          <div>
            <BrandHorizontalLogo brandScope={activeBrandScope} className="scale-[0.82] origin-left" />
            <p className="mt-5 border-t border-gold-500/20 pt-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-500/70">
              {activeBrand.shellKicker}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Fechar menu"
            className="-mr-1 rounded-lg p-1.5 text-white/55 transition hover:bg-white/5 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="gold-line mx-0" />

        <nav className="relative flex-1 space-y-2 overflow-y-auto px-4 py-5" aria-label="Navegação principal">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mb-1 flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/45 transition-colors hover:border-gold-500/30 hover:text-white"
          >
            <Search size={14} className="text-gold-400/70" aria-hidden="true" />
            <span className="flex-1">Buscar telas…</span>
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/40">⌘K</kbd>
          </button>
          {NAV_SECTIONS.map(section => (
            <NavSection
              key={section.id}
              section={section}
              open={openSection === section.id}
              hasActive={section.items.some(item => item.id === view)}
              onToggle={() => setOpenSection(current => (current === section.id ? null : section.id))}
              view={view}
              onSelect={navigate}
            />
          ))}
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-gold-500/15 bg-[color:var(--surface-0)] px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileNavOpen}
            className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:border-gold-500/30 hover:text-white"
          >
            <Menu size={18} />
          </button>
          <BrandHorizontalLogo brandScope={activeBrandScope} className="scale-[0.62] origin-left" />
        </header>

        <main className="flex-1 overflow-y-auto bg-transparent">
          <div key={view} className="view-enter">
            {view === 'premium' && <PremiumDashboard brandScope={BRAND_SCOPES.premium} />}
            {view === 'premium-trafego' && <PremiumDashboard brandScope={BRAND_SCOPES.premium} focusMode="trafego" />}
            {view === 'imobiliaria' && <PremiumDashboard brandScope={BRAND_SCOPES.imobiliaria} />}
            {view === 'imobiliaria-trafego' && <PremiumDashboard brandScope={BRAND_SCOPES.imobiliaria} focusMode="trafego" />}
            {view.startsWith('criativos:') && <EstudioCriativos />}
            {view.startsWith('pecas:') && <EstudioPecas platformId={view.slice('pecas:'.length)} onNavigate={navigate} />}
            {view === 'pipeline' && <Pipeline />}
            {view === 'calendario' && <Calendario onNavigate={navigate} />}
            {view === 'kanban' && <Kanban onNavigate={navigate} />}
            {view === 'biblioteca' && <Biblioteca />}
            {view === 'agentes' && <Agentes />}
            {view === 'metricas' && <Metricas />}
          </div>
        </main>
      </div>

      {/* Busca global (⌘K) — navega para qualquer tela */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} items={COMMAND_ITEMS} onNavigate={navigate} />

      {/* Copiloto da Operação (voz + texto) — onipresente, desktop e mobile */}
      <Copilot brandScope={activeBrandScope} onNavigate={navigate} />
    </div>
  )
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
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

// Seção do acordeão: cabeçalho clicável (expande/recolhe) + itens visíveis só quando aberta.
// `hasActive` destaca a seção dona da view atual mesmo quando recolhida.
function NavSection({ section, open, hasActive, onToggle, view, onSelect }) {
  const highlight = open || hasActive
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors duration-200 hover:bg-white/[0.04]"
      >
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.24em] transition-colors duration-200"
          style={{ color: highlight ? 'rgba(228,192,110,0.85)' : 'rgba(196,148,42,0.5)' }}
        >
          {section.title}
        </span>
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: highlight ? 'rgba(228,192,110,0.7)' : 'rgba(196,148,42,0.4)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {section.items.map(item => (
            <NavButton key={item.id} item={item} active={view === item.id} onClick={() => onSelect(item.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
