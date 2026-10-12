import { useEffect, useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, CircleHelp, Clipboard, X } from 'lucide-react'
import type { RiskLevel, ScanRecord } from '../types'

interface ScanReportProps {
  scan: ScanRecord
  onClose: () => void
  onAnalyzeAnother: () => void
}

const riskLabels: Record<RiskLevel, string> = { low: 'Low risk', suspicious: 'Suspicious', high: 'High risk' }

export function ScanReport({ scan, onClose, onAnalyzeAnother }: ScanReportProps) {
  const [copied, setCopied] = useState(false)
  const findingGroups = [
    { status: 'signal' as const, title: 'Observed text patterns', description: 'Local heuristic matches, not verified threat indicators.' },
    { status: 'clear' as const, title: 'No matching pattern observed', description: 'A missing match does not establish that content is safe.' },
    { status: 'unavailable' as const, title: 'Not checked', description: 'This demo cannot access network or sender intelligence.' },
  ].map((group) => ({ ...group, findings: scan.findings.filter((finding) => finding.status === group.status) })).filter((group) => group.findings.length > 0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function copyReport() {
    const report = [
      'ScamShield - Demo Analysis',
      `Assessment: ${riskLabels[scan.risk]} (${scan.score}/100)`,
      `Type: ${scan.type}`,
      `Submitted: ${scan.content}`,
      `Summary: ${scan.summary}`,
      '',
      'Findings:',
      ...scan.findings.map((finding) => `- [${finding.status}] ${finding.title}: ${finding.explanation}`),
      '',
      'Limitations: Local text-pattern demonstration only. No live network or security checks were performed.',
    ].join('\n')
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <header className="report-header"><div><span className="eyebrow">DEMO ANALYSIS <span className="demo-marker">LOCAL TEXT PATTERNS</span></span><h2 id="report-title">Security investigation</h2></div><button className="icon-button" type="button" aria-label="Close report" onClick={onClose}><X size={19} /></button></header>
        <div className="report-scroll">
          <div className={`report-summary ${scan.risk}`}><div className="risk-score-ring"><span>{scan.score}</span><small>/100</small></div><div><span className="field-caption">LOCAL PATTERN SCORE</span><h3 className={`report-verdict ${scan.risk}`}>{riskLabels[scan.risk]}</h3><p>{scan.summary}</p></div></div>
          <div className="submitted-block"><span className="field-caption">SUBMITTED {scan.type}</span><p className={scan.type === 'URL' || scan.type === 'QR' ? 'mono' : ''}>{scan.content}</p></div>
          <div className="report-section"><div className="section-title"><h3>Evidence trail</h3><span>{scan.findings.length} demo checks</span></div><div className="evidence-groups">{findingGroups.map((group) => <section className={`evidence-group ${group.status}`} key={group.status}><div className="evidence-group-heading"><div><h4>{group.title}</h4><p>{group.description}</p></div><span className={`finding-status ${group.status}`}>{group.findings.length.toString().padStart(2, '0')}</span></div><ol className="findings-list">{group.findings.map((finding, index) => {
            const Icon = finding.status === 'signal' ? AlertTriangle : finding.status === 'clear' ? CheckCircle2 : CircleHelp
            return <li key={`${finding.title}-${index}`}><div className={`finding-icon ${finding.status}`}><Icon size={16} /></div><div><div className="finding-meta"><span>{finding.category}</span><span className={`finding-status ${finding.status}`}>{finding.status === 'signal' ? 'Pattern match' : finding.status === 'clear' ? 'Not observed' : 'Unavailable'}</span></div><h4>{finding.title}</h4><p>{finding.explanation}</p></div></li>
          })}</ol></section>)}</div></div>
          <div className="report-section"><div className="section-title"><h3>Recommended next steps</h3></div><ol className="recommendations">{scan.recommendations.map((item) => <li key={item}><span><Check size={14} /></span>{item}</li>)}</ol></div>
          <div className="report-caveat"><CircleHelp size={16} /><p>This is a deterministic demo based on local text patterns. It does not contact the destination, check reputation, or verify a sender. A low score is not a safety guarantee.</p></div>
        </div>
        <footer className="report-footer"><button className="button button-quiet" type="button" onClick={copyReport}><Clipboard size={15} />{copied ? 'Copied' : 'Copy report'}</button><button className="button button-primary" type="button" onClick={onAnalyzeAnother}>Analyze another</button></footer>
      </section>
    </div>
  )
}