import type { ScanInput, ScanRecord } from '../types'

const urgencyTerms = ['urgent', 'immediately', 'today', 'within 24', 'account notice', 'account suspended']
const paymentTerms = ['payment', 'pay ', 'fee', 'wire transfer', 'gift card', 'redelivery']
const credentialTerms = ['sign-in', 'login', 'verify your account', 'password', 'credentials']

function matchingTerms(content: string, terms: string[]) {
  const normalized = content.toLowerCase()
  return terms.filter((term) => normalized.includes(term))
}

export async function analyzeDemo(input: ScanInput): Promise<ScanRecord> {
  await new Promise((resolve) => window.setTimeout(resolve, 850))

  const content = input.content.trim()
  const urgency = matchingTerms(content, urgencyTerms)
  const payment = matchingTerms(content, paymentTerms)
  const credentials = matchingTerms(content, credentialTerms)
  const urlPresent = /https?:\/\/|www\./i.test(content)
  const signals = urgency.length + payment.length + credentials.length
  const score = Math.min(94, 8 + (urgency.length * 18) + (payment.length * 20) + (credentials.length * 25) + (urlPresent && signals > 0 ? 9 : 0))
  const risk = score >= 70 ? 'high' : score >= 40 ? 'suspicious' : 'low'
  const findings: ScanRecord['findings'] = []

  if (urgency.length) {
    findings.push({ category: 'Language', title: 'Urgency phrase matched', explanation: `The local demo rule matched: ${urgency.join(', ')}. This is a text pattern, not proof of malicious intent.`, status: 'signal' })
  } else {
    findings.push({ category: 'Language', title: 'No configured urgency phrase observed', explanation: 'The local demo rule did not find its configured urgency phrases.', status: 'clear' })
  }

  if (payment.length) {
    findings.push({ category: 'Payment request', title: 'Payment phrase matched', explanation: `The local demo rule matched: ${payment.join(', ')}. Verify unexpected payment requests independently.`, status: 'signal' })
  } else {
    findings.push({ category: 'Payment request', title: 'No configured payment phrase observed', explanation: 'The local demo rule did not find its configured payment phrases.', status: 'clear' })
  }

  if (credentials.length) {
    findings.push({ category: 'Credentials', title: 'Account access phrase matched', explanation: `The local demo rule matched: ${credentials.join(', ')}. No page or destination was contacted.`, status: 'signal' })
  } else {
    findings.push({ category: 'Credentials', title: 'No configured credential phrase observed', explanation: 'The local demo rule did not find its configured credential phrases.', status: 'clear' })
  }

  findings.push({ category: 'Live checks', title: 'Network reputation and destination checks', explanation: 'Unavailable in demo mode. No DNS, redirect, certificate, sender, or threat-feed lookup was performed.', status: 'unavailable' })

  const recommendations = risk === 'high'
    ? ['Do not use links or contact details in the submitted content.', 'Verify requests through the service’s official app or a known contact.', 'Do not share passwords, verification codes, or payment details.']
    : risk === 'suspicious'
      ? ['Pause before responding or paying.', 'Confirm the request through a trusted, separate channel.', 'Avoid sharing personal information until independently verified.']
      : ['This demo found few configured warning phrases; that is not a safety guarantee.', 'Check the sender and destination independently before taking action.']

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content,
    type: input.type,
    createdAt: new Date().toISOString(),
    score,
    risk,
    summary: signals ? `Matched ${signals} configured text pattern${signals === 1 ? '' : 's'} in local demo rules.` : 'No configured high-risk text patterns were matched by local demo rules.',
    findings,
    recommendations,
    demo: true,
  }
}