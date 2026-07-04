// Vitra UI — STAT TILE: cartão de indicador (rótulo + número grande + subtexto + ícone opcional).
// Canonicaliza o padrão que vivia inline em várias telas. Número em tabular-nums (não "dança" ao atualizar).
export default function StatTile({ label, value, sub, icon: Icon, tone = '#C4942A' }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-4 transition duration-200 hover:border-gold-500/30 hover:bg-white/[0.045]">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-white/45">{label}</p>
        {Icon && (
          <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.03]" style={{ color: tone }}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <p className="font-display text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-[#F4EFE3]">
        {value}
      </p>
      {sub && <p className="mt-2 text-xs leading-5 text-white/45">{sub}</p>}
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-9 rounded-full transition-all duration-200 group-hover:w-16"
        style={{ backgroundColor: tone }}
      />
    </div>
  )
}
