import { useMemo, useState } from 'react'
import { ArrowDownUp, FileSearch, Search, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import type { RiskLevel, ScanRecord } from '../types'

interface ScanHistoryTableProps {
  scans: ScanRecord[]
  onReport: (scan: ScanRecord) => void
  search: string
  onSearch: (value: string) => void
  expanded?: boolean
}

function riskLabel(risk: RiskLevel) {
  return risk === 'high' ? 'High risk' : risk === 'suspicious' ? 'Suspicious' : 'Low risk'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function ScanHistoryTable({ scans, onReport, search, onSearch, expanded = false }: ScanHistoryTableProps) {
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const [sort, setSort] = useState<'recent' | 'score-high' | 'score-low'>('recent')
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return scans.filter((scan) => (riskFilter === 'all' || scan.risk === riskFilter) && (!query || `${scan.content} ${scan.type} ${scan.summary}`.toLowerCase().includes(query)))
      .sort((a, b) => sort === 'recent' ? b.createdAt.localeCompare(a.createdAt) : sort === 'score-high' ? b.score - a.score : a.score - b.score)
  }, [scans, search, riskFilter, sort])

  return (
    <section className={`history-panel ${expanded ? 'history-expanded' : ''}`} aria-labelledby="history-heading">
      <div className="history-heading-row">
        <div className="panel-heading"><div><div className="eyebrow"><FileSearch size={14} /> SESSION RECORDS</div><h2 id="history-heading">Recent scan history</h2><p>Example records and scans from this browser session.</p></div></div>
        <div className="table-controls">
          <label className="table-search"><Search size={15} /><input aria-label="Search scan history" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search scans" /></label>
          <label className="select-wrap"><span className="sr-only">Filter by risk</span><select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as typeof riskFilter)}><option value="all">All risk levels</option><option value="high">High risk</option><option value="suspicious">Suspicious</option><option value="low">Low risk</option></select></label>
          <label className="select-wrap sort-select"><ArrowDownUp size={14} /><span className="sr-only">Sort scans</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="recent">Most recent</option><option value="score-high">Highest score</option><option value="score-low">Lowest score</option></select></label>
        </div>
      </div>
      <div className="table-scroll"><table className="scan-table"><thead><tr><th scope="col">Submitted content</th><th scope="col">Type</th><th scope="col">Date</th><th scope="col">Score</th><th scope="col">Assessment</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>
        {filtered.map((scan) => {
          const RiskIcon = scan.risk === 'high' ? ShieldAlert : scan.risk === 'suspicious' ? ShieldQuestion : ShieldCheck
          return <tr key={scan.id}><td className="content-cell"><span className={`table-content ${scan.type === 'URL' || scan.type === 'QR' ? 'mono' : ''}`} title={scan.content}>{scan.content}</span><span className="table-summary">{scan.summary}</span></td><td><span className="type-pill">{scan.type}</span></td><td className="date-cell">{formatDate(scan.createdAt)}</td><td><span className={`score-number ${scan.risk}`}>{String(scan.score).padStart(2, '0')}</span><span className="score-out-of"> / 100</span></td><td><span className={`risk-pill ${scan.risk}`}><RiskIcon size={13} />{riskLabel(scan.risk)}</span></td><td className="action-cell"><button className="button button-quiet view-report" type="button" onClick={() => onReport(scan)}>View report</button></td></tr>
        })}
      </tbody></table></div>
      {filtered.length === 0 && <div className="empty-state"><div className="empty-icon"><Search size={19} /></div><h3>No scans found</h3><p>{scans.length ? 'Try a different search or risk filter.' : 'Your session scan history will appear here.'}</p>{(search || riskFilter !== 'all') && <button className="button button-quiet" type="button" onClick={() => { onSearch(''); setRiskFilter('all') }}>Clear filters</button>}</div>}
      <div className="table-foot"><span>{filtered.length} {filtered.length === 1 ? 'record' : 'records'} shown</span><span><span className="status-dot subdued" /> Saved to your account; heuristic demo results are not live verification.</span></div>
    </section>
  )
}