import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Activity, AlertTriangle, Bell, BookOpen, CheckCircle2, ChevronDown, CircleHelp, FileSearch, Globe2, LayoutDashboard, LockKeyhole, Menu, Moon, Search, Settings, Shield, ShieldAlert, ShieldCheck, Sun, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ScanHistoryTable } from './components/ScanHistoryTable'
import { ScanPanel } from './components/ScanPanel'
import { ScanReport } from './components/ScanReport'
import { demoScans, securityTips } from './data/demoData'
import { analyzeDemo } from './services/scanService'
import type { ScanInput, ScanRecord } from './types'

type PageId = 'overview' | 'new-scan' | 'history' | 'intelligence' | 'tips' | 'settings'

const navigation: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'new-scan', label: 'New scan', icon: Activity },
  { id: 'history', label: 'Scan history', icon: FileSearch },
  { id: 'intelligence', label: 'Threat intelligence', icon: Globe2 },
  { id: 'tips', label: 'Security tips', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const pageTitles: Record<PageId, string> = {
  overview: 'Overview',
  'new-scan': 'New scan',
  history: 'Scan history',
  intelligence: 'Threat intelligence',
  tips: 'Security tips',
  settings: 'Settings',
}

const categories = [
  { label: 'Phishing', percent: 45, color: 'var(--red)' },
  { label: 'Suspicious messages', percent: 30, color: 'var(--amber)' },
  { label: 'Malicious redirects', percent: 25, color: 'var(--green)' },
]

function DistributionChart({ large = false }: { large?: boolean }) {
  return <div className={`distribution-chart ${large ? 'large-chart' : ''}`}>
    <div className="donut-wrap"><svg className="donut-svg" viewBox="0 0 120 120" role="img" aria-label="Example threat distribution: phishing 45 percent, suspicious messages 30 percent, and malicious redirects 25 percent."><circle className="donut-track" cx="60" cy="60" r="43" pathLength="100" />{categories.map((category) => {
      const currentOffset = categories.slice(0, categories.indexOf(category)).reduce((total, previous) => total + previous.percent, 0)
      return <circle key={category.label} cx="60" cy="60" r="43" pathLength="100" fill="none" stroke={category.color} strokeWidth="12" strokeDasharray={`${category.percent} ${100 - category.percent}`} strokeDashoffset={-currentOffset} className="donut-segment" />
    })}</svg><div className="donut-center"><strong>89</strong><span>DEMO FLAGS</span></div></div>
    <div className="chart-legend">{categories.map((category) => <div className="legend-row" key={category.label}><span className="legend-dot" style={{ background: category.color }} /><span>{category.label}</span><strong>{category.percent}%</strong></div>)}</div>
  </div>
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [scans, setScans] = useState<ScanRecord[]>(demoScans)
  const [report, setReport] = useState<ScanRecord | null>(null)
  const [historyQuery, setHistoryQuery] = useState('')
  const [tipsQuery, setTipsQuery] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [preferences, setPreferences] = useState({ threatAlerts: true, weeklyDigest: false, sessionHistory: true })

  const filteredTips = useMemo(() => securityTips.filter((tip) => `${tip.category} ${tip.title} ${tip.text}`.toLowerCase().includes(tipsQuery.toLowerCase())), [tipsQuery])

  async function runAnalysis(input: ScanInput) {
    const result = await analyzeDemo(input)
    if (preferences.sessionHistory) setScans((current) => [result, ...current])
    setReport(result)
  }

  function navigate(nextPage: PageId) {
    setPage(nextPage)
    setMobileNavOpen(false)
    setNotificationsOpen(false)
    setProfileOpen(false)
  }

  function searchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate('history')
  }

  function togglePreference(name: keyof typeof preferences) {
    const nextValue = !preferences[name]
    setPreferences((current) => ({ ...current, [name]: nextValue }))
    if (name === 'sessionHistory' && !nextValue) setScans(demoScans)
  }

  const pageContent = (() => {
    if (page === 'overview') return <>
      <section className="welcome-stage"><div className="welcome-copy"><div className="eyebrow welcome-eyebrow">A SECOND LOOK FOR THE INTERNET</div><h1>Before you click,<br />know.</h1><p>ScamShield examines suspicious links and messages, then explains what its local demo rules noticed.</p></div><div className="environment-badge"><div className="environment-icon"><ShieldCheck size={19} /></div><div><span>Analysis mode</span><strong>Local demonstration</strong></div></div></section>
      <ScanPanel onAnalyze={runAnalysis} />
      <section className="investigation-layout" aria-label="Session overview and recent investigations">
        <article className="session-overview"><div className="eyebrow">SESSION NOTES</div><h2>What is in view</h2><p>Example records help demonstrate the report format. They are not live threat intelligence.</p><div className="session-counts"><div><strong>{scans.length.toString().padStart(2, '0')}</strong><span>records in view</span></div><div><strong>{scans.filter((scan) => scan.risk !== 'low').length.toString().padStart(2, '0')}</strong><span>demo patterns flagged</span></div></div><button className="text-link" type="button" onClick={() => navigate('history')}>Browse all records <span aria-hidden="true">-&gt;</span></button></article>
        <article className="timeline-card"><div className="timeline-heading"><div><div className="eyebrow">MOST RECENT FIRST</div><h2>Investigation trail</h2></div><span className="example-stamp">EXAMPLE DATA</span></div><ol className="investigation-timeline">{scans.slice(0, 3).map((scan) => {
          const EvidenceIcon = scan.risk === 'high' ? ShieldAlert : scan.risk === 'suspicious' ? AlertTriangle : ShieldCheck
          const dateLabel = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(scan.createdAt))
          return <li key={scan.id} className={`timeline-entry ${scan.risk}`}><div className="timeline-marker"><EvidenceIcon size={15} /></div><div className="timeline-copy"><div className="timeline-meta"><span>{scan.type} / {dateLabel}</span><span className={`timeline-verdict ${scan.risk}`}>{scan.risk === 'high' ? 'High risk' : scan.risk === 'suspicious' ? 'Suspicious' : 'Low risk'}</span></div><strong className={`timeline-target ${scan.type === 'URL' || scan.type === 'QR' ? 'mono' : ''}`}>{scan.content}</strong><p>{scan.summary}</p></div><button className="timeline-open" type="button" onClick={() => setReport(scan)}>Open report</button></li>
        })}</ol><p className="timeline-footnote">Demo assessments use local phrase matching; no destination or sender was contacted.</p></article>
      </section>
      <ScanHistoryTable scans={scans} onReport={setReport} search={historyQuery} onSearch={setHistoryQuery} />
    </>

    if (page === 'new-scan') return <div className="page-stack"><PageHeading eyebrow="LOCAL DEMONSTRATION" title="New scan" description="Analyze text against a small, deterministic set of demo patterns. No network requests are made." /><ScanPanel onAnalyze={runAnalysis} /><div className="notice-strip"><LockKeyhole size={17} /><div><strong>Keep sensitive content out of demo scans</strong><p>Submissions remain in memory for this session only when session history is enabled. Avoid pasting passwords, account numbers, or private email content.</p></div></div></div>

    if (page === 'history') return <div className="page-stack"><PageHeading eyebrow="THIS BROWSER SESSION" title="Scan history" description="Search, sort, filter, and open example reports. New scan records stay in memory only while session history is enabled." /><ScanHistoryTable scans={scans} onReport={setReport} search={historyQuery} onSearch={setHistoryQuery} expanded /></div>

    if (page === 'intelligence') return <div className="page-stack"><PageHeading eyebrow="THREAT INTELLIGENCE" title="Signals, not certainty" description="Illustrative category breakdown and sample observations. This workspace is not connected to live threat feeds." action={<span className="demo-chip"><span className="status-dot" /> Demo data</span>} /><div className="intel-summary-grid"><article className="intel-stat"><span>Example categories</span><strong className="mono">03</strong><small>Configured for display</small></article><article className="intel-stat"><span>Feed connections</span><strong className="mono">00</strong><small>No live sources</small></article><article className="intel-stat"><span>Sample flags</span><strong className="mono">089</strong><small>Illustrative count</small></article></div><div className="intel-content-grid"><article className="surface-card intel-chart-card"><div className="section-head"><div><div className="eyebrow">SAMPLE DISTRIBUTION</div><h2>Observed categories</h2></div><span className="period-chip">Illustrative</span></div><DistributionChart large /></article><article className="surface-card"><div className="section-head"><div><div className="eyebrow">HOW TO READ THIS</div><h2>Signal definitions</h2></div></div><div className="definition-list"><div><span className="legend-dot" style={{ background: 'var(--red)' }} /><div><strong>Phishing</strong><p>Example category for messages that may imitate trusted organizations or request credentials.</p></div></div><div><span className="legend-dot" style={{ background: 'var(--amber)' }} /><div><strong>Suspicious messages</strong><p>Example category for pressure language, unexpected payment requests, or unusual contact.</p></div></div><div><span className="legend-dot" style={{ background: 'var(--cyan)' }} /><div><strong>Malicious redirects</strong><p>Display-only sample category. This app does not follow links or inspect destinations.</p></div></div></div></article></div><div className="notice-strip"><CircleHelp size={17} /><div><strong>No live intelligence sources are connected</strong><p>These charts and counts are static examples for demonstrating the interface.</p></div></div></div>

    if (page === 'tips') return <div className="page-stack"><PageHeading eyebrow="PRACTICAL GUIDANCE" title="Security tips" description="Short, actionable habits for spotting suspicious requests and protecting your accounts." /><label className="tips-search"><Search size={17} /><input aria-label="Search security tips" value={tipsQuery} onChange={(event) => setTipsQuery(event.target.value)} placeholder="Search topics, e.g. QR codes or passwords" />{tipsQuery && <button className="icon-button small" type="button" aria-label="Clear search" onClick={() => setTipsQuery('')}><X size={15} /></button>}</label>{filteredTips.length ? <div className="tips-grid">{filteredTips.map((tip, index) => <article className="tip-card" key={tip.title}><div className="tip-top"><span className="tip-index mono">{String(index + 1).padStart(2, '0')}</span><span className="type-pill">{tip.category}</span></div><h2>{tip.title}</h2><p>{tip.text}</p><span className="tip-rule" /></article>)}</div> : <div className="empty-state tips-empty"><div className="empty-icon"><Search size={19} /></div><h3>No tips match that search</h3><p>Try searching for phishing, browsing, messages, accounts, or QR codes.</p></div>}</div>

    return <div className="page-stack"><PageHeading eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Control local interface preferences and review how this demo handles scan content." /><div className="settings-layout"><div className="settings-column"><section className="surface-card settings-card"><div className="section-head"><div><div className="eyebrow">APPEARANCE</div><h2>Theme</h2></div></div><p className="settings-description">Choose a display preference for this browser session.</p><div className="theme-picker"><button type="button" className={`theme-option ${theme === 'dark' ? 'selected' : ''}`} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={17} /><span>Dark</span>{theme === 'dark' && <CheckCircle2 size={15} />}</button><button type="button" className={`theme-option ${theme === 'light' ? 'selected' : ''}`} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun size={17} /><span>Light</span>{theme === 'light' && <CheckCircle2 size={15} />}</button></div></section><section className="surface-card settings-card"><div className="section-head"><div><div className="eyebrow">PREFERENCES</div><h2>Notifications</h2></div></div><div className="preference-list"><label className="preference-row"><span><strong>Threat alert indicators</strong><small>Show alert badges in this interface.</small></span><input type="checkbox" checked={preferences.threatAlerts} onChange={() => togglePreference('threatAlerts')} /></label><label className="preference-row"><span><strong>Weekly security digest</strong><small>Demo preference only; no messages are sent.</small></span><input type="checkbox" checked={preferences.weeklyDigest} onChange={() => togglePreference('weeklyDigest')} /></label><label className="preference-row"><span><strong>Session history</strong><small>Keep demo scan records visible until you close the page.</small></span><input type="checkbox" checked={preferences.sessionHistory} onChange={() => togglePreference('sessionHistory')} /></label></div></section></div><div className="settings-column"><section className="surface-card settings-card"><div className="section-head"><div><div className="eyebrow">PRIVACY</div><h2>Demo data handling</h2></div><LockKeyhole size={17} className="quiet-icon" /></div><div className="privacy-list"><p><CheckCircle2 size={15} /> Analysis runs locally in your browser.</p><p><CheckCircle2 size={15} /> Scan text is not written to localStorage.</p><p><CheckCircle2 size={15} /> No external scan API or threat feed is configured.</p><p><AlertTriangle size={15} /> Avoid pasting passwords or confidential content.</p></div></section><section className="surface-card settings-card account-card"><div className="section-head"><div><div className="eyebrow">ACCOUNT</div><h2>Personal workspace</h2></div></div><div className="account-row"><div className="avatar avatar-large">EV</div><div><strong>Elena Vance</strong><span>Local demo profile</span></div><span className="type-pill">Demo</span></div><p className="settings-description">Authentication, organization management, and account synchronization are not connected.</p></section></div></div></div>
  })()

  return <div className="app-shell" data-theme={theme}>
    {mobileNavOpen && <button className="drawer-scrim" aria-label="Close navigation" type="button" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation"><div><button className="brand" type="button" onClick={() => navigate('overview')}><span className="brand-mark"><Shield size={19} /></span><span className="brand-copy"><strong>ScamShield</strong><small>THREAT DEFENSE</small></span></button><div className="side-label">WORKSPACE</div><nav className="side-nav">{navigation.map((item) => {
      const Icon = item.icon
      return <button key={item.id} type="button" className={`nav-item ${page === item.id ? 'active' : ''}`} aria-current={page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon size={17} /><span>{item.label}</span>{page === item.id && <span className="nav-active-mark" />}</button>
    })}</nav></div><div className="sidebar-bottom"><div className="engine-card"><div className="engine-head"><span>ANALYSIS MODE</span><span className="offline-tag"><i /> LOCAL</span></div><p>Deterministic demo rules</p><span>No live engine connected</span></div><div className="sidebar-foot"><span>SCAMSHIELD</span><span>FRONTEND DEMO · 0.1</span></div></div></aside>
    <div className="app-frame"><header className="topbar"><div className="topbar-start"><button className="icon-button mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{pageTitles[page]}</strong></div></div><div className="topbar-actions"><form className="global-search" role="search" onSubmit={searchSubmit}><Search size={15} /><input aria-label="Search scan history" placeholder="Search scans..." value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} /><kbd>Enter</kbd></form><div className="popover-anchor"><button className={`icon-button notification-button ${notificationsOpen ? 'is-open' : ''}`} type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false) }}><Bell size={18} /><i /></button>{notificationsOpen && <div className="popover notification-popover"><div className="popover-heading"><strong>Notifications</strong><span className="type-pill">Demo</span></div><p><span className="notification-indicator" />No live alert service is connected.</p><p>Your interface preferences are stored only for this session.</p></div>}</div><div className="popover-anchor"><button className="profile-button" type="button" aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false) }}><span className="avatar">EV</span><span className="profile-copy"><strong>Elena Vance</strong><small>Personal workspace</small></span><ChevronDown size={14} /></button>{profileOpen && <div className="popover profile-popover"><div className="profile-menu-title"><span className="avatar">EV</span><div><strong>Elena Vance</strong><small>Local demo profile</small></div></div><button type="button" onClick={() => navigate('settings')}><Settings size={15} /> Workspace settings</button><div className="profile-menu-note">Demo account · no sign-in</div></div>}</div></div></header>
      <main className="main-content" id="main-content" key={page}><div className="content-column">{pageContent}<footer className="app-footer"><span><span className="status-dot subdued" /> SAMPLE VERIFICATION DATA</span><span>ScamShield frontend demonstration</span><button type="button" onClick={() => navigate('settings')}>Privacy &amp; settings</button></footer></div></main>
    </div>
    {report && <ScanReport scan={report} onClose={() => setReport(null)} onAnalyzeAnother={() => { setReport(null); navigate('new-scan') }} />}
  </div>
}

export default App