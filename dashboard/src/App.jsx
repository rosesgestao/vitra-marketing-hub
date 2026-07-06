import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Bot, Building2, CalendarDays, ChevronDown, ChevronsLeft, ChevronsRight, Gem, Home, Images, Layers, LayoutGrid, LogOut, Megaphone, Menu, Search, Wand2, X } from 'lucide-react'
import { viewIdFromHash, hashForViewId } from './lib/hashRoute.js'
import { supabase } from './lib/supabase.js'
import CommandPalette from './components/CommandPalette.jsx'
import Inicio from './views/Inicio.jsx'
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
  { id: 'central', title: 'Central', icon: Home, items: [{ id: 'inicio', label: 'Início', icon: Home }] },
  ...BRAND_SECTIONS.map(section => ({ id: section.scope, title: section.title, icon: section.scope === BRAND_SCOPES.premium ? Gem : Building2, items: section.items })),
  { id: 'conteudo', title: 'Produção de conteúdo', icon: Layers, items: CONTEUDO_ORGANICO },
  { id: 'criativos', title: 'Estúdio de Criativos', icon: Wand2, items: CRIATIVOS_NAV },
  { id: 'pecas', title: 'Estúdio de Peças', icon: LayoutGrid, items: PECAS_NAV },
  { id: 'operacao', title: 'Inteligência & automação', icon: Bot, items: TRANSVERSAL },
]

const ALL_VIEWS = NAV_SECTIONS.flatMap(section => section.items)
// Itens da busca global (⌘K): toda view navegável, com o título da seção como grupo (desambigua os
// labels repetidos — "Conteúdo"/"Tráfego Pago" das duas marcas).
const COMMAND_ITEMS = NAV_SECTIONS.flatMap(section =>
  section.items.map(item => ({ id: item.id, label: item.label, group: section.title, icon: item.icon })),
)
const DEFAULT_VIEW_ID = 'inicio'
const NAV_STORAGE_KEY = 'vitra-operational-dashboard.active-view'
const SIDEBAR_COLLAPSED_KEY = 'vitra-operational-dashboard.sidebar-collapsed'

function readInitialCollapsed() {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1' } catch { return false }
}

// Nome/e-mail/inicial do usuario logado para o perfil no rodape da sidebar.
function accountDisplay(user) {
  const full = user?.user_metadata?.full_name
  const email = user?.email || ''
  const name = full && full.trim() ? full.trim() : email ? email.split('@')[0] : 'Conta Vitra'
  const initial = (name[0] || 'V').toUpperCase()
  return { name, email, initial }
}

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
  // Sidebar recolhida (rail) no desktop — persistida. Nao afeta o mobile (drawer sempre expandido).
  const [collapsed, setCollapsed] = useState(readInitialCollapsed)
  // Usuario logado para o perfil no rodape — leitura da sessao Supabase (nao altera regras de auth).
  const [account, setAccount] = useState(null)
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

  // Persiste o estado recolhido da sidebar.
  useEffect(() => {
    try { window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0') } catch { /* storage restrito */ }
  }, [collapsed])

  // Trava a rolagem do fundo enquanto o drawer mobile estiver aberto.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileNavOpen])

  // Perfil do usuario logado (rodape). Read-only; o AuthGate segue dono do ciclo de auth.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => { if (active) setAccount(data?.session?.user || null) }).catch(() => {})
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setAccount(session?.user || null))
    return () => { active = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  const acc = accountDisplay(account)
  // Logout — mesma regra de auth (o AuthGate reage ao onAuthStateChange e volta para a tela de login).
  const signOut = () => { supabase.auth.signOut().catch(() => {}) }

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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-shrink-0 flex-col border-r border-gold-500/15 bg-[color:var(--surface-0)] transition-[transform,width] duration-300 ease-out md:static md:z-auto md:translate-x-0 ${collapsed ? 'md:w-[76px]' : 'md:w-72'} ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,148,42,0.10),transparent_18rem)]" />

        {/* Cabeçalho — expandido / mobile (logo + controles numa linha; kicker em bloco de largura total) */}
        <div className={`relative px-6 pb-6 pt-7 ${collapsed ? 'md:hidden' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <BrandHorizontalLogo brandScope={activeBrandScope} className="scale-[0.82] origin-left" />
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Recolher menu"
                title="Recolher menu"
                className="hidden h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/65 transition-colors hover:border-gold-500/40 hover:bg-white/[0.06] hover:text-gold-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 md:grid"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Fechar menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 md:hidden"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <p className="mt-5 border-t border-gold-500/20 pt-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-500/70">
            {activeBrand.shellKicker}
          </p>
        </div>

        {/* Cabeçalho — rail recolhido (desktop) */}
        <div className={`relative flex-col items-center gap-3 px-3 pb-4 pt-7 ${collapsed ? 'hidden md:flex' : 'hidden'}`}>
          <BrandV brandScope={activeBrandScope} size={26} />
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expandir menu"
            title="Expandir menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/65 transition-colors hover:border-gold-500/40 hover:bg-white/[0.06] hover:text-gold-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          >
            <ChevronsRight size={18} />
          </button>
        </div>

        <div className="gold-line mx-0" />

        {/* Navegação — expandida / mobile */}
        <nav className={`relative flex-1 space-y-2 overflow-y-auto px-4 py-5 ${collapsed ? 'md:hidden' : ''}`} aria-label="Navegação principal">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mb-1 flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/45 transition-colors hover:border-gold-500/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
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

        {/* Navegação — rail recolhido (desktop): ícones de seção + tooltip; clique expande e abre a seção */}
        <nav className={`relative flex-1 flex-col items-center gap-1.5 overflow-y-auto px-3 py-5 ${collapsed ? 'hidden md:flex' : 'hidden'}`} aria-label="Navegação (recolhida)">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            title="Buscar telas (⌘K)"
            aria-label="Buscar telas"
            className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-gold-400/80 transition-colors hover:border-gold-500/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          >
            <Search size={16} aria-hidden="true" />
          </button>
          <div className="my-1.5 h-px w-8 bg-white/10" />
          {NAV_SECTIONS.map(section => {
            const SectionIcon = section.icon
            const hasActive = section.items.some(item => item.id === view)
            return (
              <button
                key={section.id}
                type="button"
                title={section.title}
                aria-label={section.title}
                onClick={() => { setOpenSection(section.id); setCollapsed(false) }}
                className={`relative grid h-11 w-11 place-items-center rounded-lg border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 ${hasActive ? 'border-gold-500/40 bg-gold-500/[0.12] text-gold-200' : 'border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'}`}
              >
                {hasActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400" aria-hidden="true" />}
                {SectionIcon && <SectionIcon size={18} aria-hidden="true" />}
              </button>
            )
          })}
        </nav>

        <div className="gold-line mx-0" />

        {/* Rodapé — perfil do usuário logado + Sair (expandido) */}
        <div className={`relative px-4 py-4 ${collapsed ? 'md:hidden' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-gold-500/40 bg-gold-500/10 text-sm font-semibold text-gold-200">
              {acc.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/85">{acc.name}</p>
              {acc.email && <p className="truncate text-[11px] text-white/40">{acc.email}</p>}
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sair da conta"
              title="Sair"
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
            >
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Rodapé — avatar + Sair (rail recolhido) */}
        <div className={`relative flex-col items-center gap-2 px-3 py-4 ${collapsed ? 'hidden md:flex' : 'hidden'}`}>
          <div title={acc.name} className="grid h-9 w-9 place-items-center rounded-full border border-gold-500/40 bg-gold-500/10 text-sm font-semibold text-gold-200">
            {acc.initial}
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sair da conta"
            title="Sair"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
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
            {view === 'inicio' && <Inicio onNavigate={navigate} />}
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
      className={`group relative flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 ${
        active
          ? 'border-gold-500/40 bg-gold-500/[0.12] font-semibold text-gold-200'
          : 'border-transparent font-medium text-white/60 hover:border-white/10 hover:bg-white/[0.04] hover:text-white'
      }`}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400" aria-hidden="true" />}
      {Icon && <Icon size={16} className={active ? 'text-gold-300' : 'text-white/45 transition-colors group-hover:text-white/80'} aria-hidden="true" />}
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
        className="group flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors duration-200 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
      >
        <span className={`text-[9px] font-semibold uppercase tracking-[0.24em] transition-colors duration-200 ${highlight ? 'text-gold-300' : 'text-gold-500/50 group-hover:text-gold-400/80'}`}>
          {section.title}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform duration-200 ${highlight ? 'text-gold-300/70' : 'text-gold-500/40'} ${open ? 'rotate-180' : ''}`}
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
