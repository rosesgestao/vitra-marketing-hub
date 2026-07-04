// Vitra UI — DATA TABLE: tabela responsiva por grid. SEMPRE rolável no mobile (overflow-x-auto + min-width)
// e com tabular-nums nas células — o padrão que estava sendo refeito à mão (e quebrava no tablet).
// Colunas: [{ key, label, align?: 'left'|'right'|'center', width?: fr string }]. Célula por renderCell(row,col)
// ou row[col.key]. `empty` (nó) aparece quando não há linhas.
function alignCls(a) {
  return a === 'right' ? 'text-right justify-self-end' : a === 'center' ? 'text-center justify-self-center' : 'text-left'
}

export default function DataTable({ columns = [], rows = [], renderCell, rowKey, minWidth = 640, empty = null, className = '' }) {
  const gridTemplateColumns = columns.map((c) => c.width || '1fr').join(' ')
  return (
    <div className={`overflow-x-auto rounded-lg border border-white/10 ${className}`}>
      <div
        className="grid gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-2xs font-semibold uppercase tracking-[0.14em] text-white/42"
        style={{ gridTemplateColumns, minWidth }}
      >
        {columns.map((c) => <span key={c.key} className={alignCls(c.align)}>{c.label}</span>)}
      </div>
      {rows.length ? (
        <div className="divide-y divide-white/10">
          {rows.map((row, r) => (
            <div
              key={rowKey ? rowKey(row, r) : r}
              className="grid gap-3 px-4 py-3 text-sm tabular-nums text-white/62"
              style={{ gridTemplateColumns, minWidth }}
            >
              {columns.map((c) => (
                <span key={c.key} className={`min-w-0 truncate ${alignCls(c.align)}`}>
                  {renderCell ? renderCell(row, c) : row[c.key]}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : empty}
    </div>
  )
}
