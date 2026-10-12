import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Clipboard, Eraser, FileText, Link2, LoaderCircle, QrCode, ScanLine, ShieldCheck, Smartphone } from 'lucide-react'
import type { ScanInput, ScanType } from '../types'

const scanTabs: { type: ScanType; label: string; icon: typeof Link2; placeholder: string; inputLabel: string }[] = [
  { type: 'URL', label: 'URL / Link', icon: Link2, placeholder: 'Paste a suspicious URL or domain...', inputLabel: 'URL or domain' },
  { type: 'SMS', label: 'SMS / Text', icon: Smartphone, placeholder: 'Paste a suspicious text message...', inputLabel: 'Message text' },
  { type: 'Email', label: 'Email / Header', icon: FileText, placeholder: 'Paste email text or headers (avoid sensitive information)...', inputLabel: 'Email text or headers' },
  { type: 'QR', label: 'QR Payload', icon: QrCode, placeholder: 'Paste the decoded text or URL from a QR code...', inputLabel: 'Decoded QR payload' },
]

interface ScanPanelProps {
  onAnalyze: (input: ScanInput) => Promise<void>
  compact?: boolean
}

export function ScanPanel({ onAnalyze, compact = false }: ScanPanelProps) {
  const [type, setType] = useState<ScanType>('URL')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const textarea = useRef<HTMLTextAreaElement>(null)
  const activeTab = scanTabs.find((tab) => tab.type === type) ?? scanTabs[0]

  async function pasteContent() {
    setError('')
    setNotice('')
    try {
      if (!navigator.clipboard?.readText) throw new Error('Clipboard access is unavailable in this browser.')
      const value = await navigator.clipboard.readText()
      setContent(value)
      textarea.current?.focus()
    } catch {
      setError('Clipboard access was blocked. Paste using Ctrl+V or Command+V instead.')
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = content.trim()
    if (!value) {
      setError('Enter content to run the demo analysis.')
      textarea.current?.focus()
      return
    }
    if (value.length > 5000) {
      setError('Keep the submission under 5,000 characters.')
      return
    }
    setError('')
    setNotice('')
    setLoading(true)
    try {
      await onAnalyze({ content: value, type })
      setNotice('Demo analysis complete. No network security checks were performed.')
    } catch {
      setError('The demo analysis could not be completed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const ActiveIcon = activeTab.icon

  return (
    <section className={`scan-panel ${compact ? 'scan-panel-compact' : ''}`} aria-labelledby="scan-panel-title">
      {!compact && <div className="panel-heading scan-panel-heading"><div><div className="eyebrow"><ScanLine size={14} /> START AN INVESTIGATION</div><h2 id="scan-panel-title">What would you like a second look at?</h2><p>Paste only the link or message you want to review. This demo stays in your browser.</p></div><span className="demo-chip">DEMO</span></div>}
      <div className="scan-tabs" role="tablist" aria-label="Content type">
        {scanTabs.map((tab) => {
          const Icon = tab.icon
          return <button key={tab.type} id={`tab-${tab.type}`} className={`scan-tab ${type === tab.type ? 'active' : ''}`} type="button" role="tab" aria-selected={type === tab.type} aria-controls="scan-input-panel" onClick={() => { setType(tab.type); setError(''); setNotice('') }}><Icon size={16} /><span>{tab.label}</span></button>
        })}
      </div>
      <form onSubmit={submit} noValidate>
        <div id="scan-input-panel" className="scan-input-wrap" role="tabpanel" aria-labelledby={`tab-${type}`}>
          <div className="input-toolbar"><label htmlFor="scan-input"><ActiveIcon size={15} /> {activeTab.inputLabel}</label><div className="input-actions"><button type="button" onClick={pasteContent} className="text-action"><Clipboard size={14} /> Paste</button><span className="toolbar-divider" /><button type="button" className="text-action muted-action" onClick={() => { setContent(''); setError(''); setNotice(''); textarea.current?.focus() }}><Eraser size={14} /> Clear</button></div></div>
          <textarea ref={textarea} id="scan-input" className={type === 'URL' || type === 'QR' ? 'mono-input' : ''} value={content} onChange={(event) => { setContent(event.target.value); setError(''); setNotice('') }} placeholder={activeTab.placeholder} rows={compact ? 4 : 5} maxLength={6000} aria-invalid={Boolean(error)} aria-describedby="scan-hint scan-counter scan-feedback" />
          <div className="input-footer"><span id="scan-hint"><ShieldCheck size={13} /> Local demo. Nothing is sent to a server.</span><span id="scan-counter">{content.length.toLocaleString()} / 5,000 chars</span></div>
        </div>
        <div className="scan-submit-row"><p>Results are illustrative and cannot establish whether content is safe.</p><button type="submit" className="button button-primary analyze-button" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <ScanLine size={17} />}{loading ? 'Analyzing…' : 'Analyze for threats'}</button></div>
        <div id="scan-feedback" aria-live="polite" className={`scan-feedback ${error ? 'error' : notice ? 'success' : ''}`}>{error && <><AlertCircle size={15} /> {error}</>}{notice && <><CheckCircle2 size={15} /> {notice}</>}</div>
      </form>
    </section>
  )
}