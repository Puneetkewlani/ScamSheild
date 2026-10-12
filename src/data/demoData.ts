import type { ScanRecord } from '../types'

export const demoScans: ScanRecord[] = [
  {
    id: 'sample-1',
    content: 'https://account-notice.example/sign-in',
    type: 'URL',
    createdAt: '2026-10-12T14:32:00.000Z',
    score: 82,
    risk: 'high',
    summary: 'Urgent account language and a sign-in path match demo warning patterns.',
    findings: [
      { category: 'Language', title: 'Urgency wording', explanation: 'The sample contains account-notice language commonly used to pressure a quick response.', status: 'signal' },
      { category: 'URL structure', title: 'Sign-in path present', explanation: 'A sign-in path was found in the submitted text. This alone does not establish whether a site is malicious.', status: 'signal' },
      { category: 'Reputation', title: 'Live reputation lookup', explanation: 'Not connected in this demo.', status: 'unavailable' },
    ],
    recommendations: ['Do not enter credentials from an unexpected link.', 'Open the service using a saved bookmark or its official app.', 'Verify account alerts through a known support channel.'],
    demo: true,
  },
  {
    id: 'sample-2',
    content: 'Your delivery is waiting. Pay a small redelivery fee today.',
    type: 'SMS',
    createdAt: '2026-10-12T14:20:00.000Z',
    score: 68,
    risk: 'suspicious',
    summary: 'The message combines a delivery claim with a payment request.',
    findings: [
      { category: 'Language', title: 'Delivery and payment request', explanation: 'The sample matches a demonstration pattern pairing a delivery claim with a fee request.', status: 'signal' },
      { category: 'Sender', title: 'Sender verification', explanation: 'Sender identity cannot be verified by this offline demo.', status: 'unavailable' },
      { category: 'Link analysis', title: 'No URL supplied', explanation: 'There was no URL in the submitted message to inspect.', status: 'clear' },
    ],
    recommendations: ['Check delivery status directly with the carrier.', 'Avoid payment links in unexpected messages.', 'Do not reply with personal or payment information.'],
    demo: true,
  },
  {
    id: 'sample-3',
    content: 'Quarterly planning notes for the team',
    type: 'Email',
    createdAt: '2026-10-12T13:44:00.000Z',
    score: 12,
    risk: 'low',
    summary: 'No matching high-risk demo phrases were found in this short sample.',
    findings: [
      { category: 'Language', title: 'No demo warning phrase observed', explanation: 'The local sample rules did not match their configured urgency or payment phrases.', status: 'clear' },
      { category: 'Sender', title: 'Sender verification', explanation: 'No sender headers were supplied for inspection.', status: 'unavailable' },
      { category: 'Attachment', title: 'Attachment inspection', explanation: 'Attachments are not available to this demo.', status: 'unavailable' },
    ],
    recommendations: ['Treat unexpected requests cautiously, even when no demo pattern is found.', 'Verify sensitive requests through a separate, trusted channel.'],
    demo: true,
  },
  {
    id: 'sample-4',
    content: 'https://docs.example.org/resources/guide',
    type: 'URL',
    createdAt: '2026-10-12T12:05:00.000Z',
    score: 8,
    risk: 'low',
    summary: 'No matching high-risk demo phrases were found in this sample.',
    findings: [
      { category: 'Language', title: 'No demo warning phrase observed', explanation: 'The local demo rules did not find configured urgency or credential-request phrases.', status: 'clear' },
      { category: 'URL structure', title: 'Basic text review only', explanation: 'No live DNS, redirect, certificate, or reputation checks are performed.', status: 'unavailable' },
    ],
    recommendations: ['A low demo score is not a guarantee of safety.', 'Check the destination carefully before sharing information.'],
    demo: true,
  },
]

export const demoEvents = [
  { id: 'event-1', category: 'Phishing pattern', title: 'Credential request wording matched', detail: 'Example event · demo feed', risk: 'high' as const, time: '2 min ago', scanId: 'sample-1' },
  { id: 'event-2', category: 'Suspicious message', title: 'Delivery fee request in SMS', detail: 'Example event · demo feed', risk: 'suspicious' as const, time: '18 min ago', scanId: 'sample-2' },
  { id: 'event-3', category: 'URL review', title: 'No configured warning pattern found', detail: 'Example event · demo feed', risk: 'low' as const, time: '42 min ago', scanId: 'sample-4' },
]

export const securityTips = [
  { category: 'Phishing', title: 'Pause before acting on urgency', text: 'Unexpected threats, account closures, and limited-time rewards are common pressure tactics. Open the service independently instead of following a message link.' },
  { category: 'Safe browsing', title: 'Inspect the actual destination', text: 'Read the full domain from right to left, watch for misspellings, and remember that HTTPS only encrypts a connection; it does not prove a site is trustworthy.' },
  { category: 'Accounts', title: 'Use a password manager and passkeys', text: 'Unique credentials reduce the impact of password reuse. Turn on multifactor authentication, preferably with a passkey or security key.' },
  { category: 'Messages', title: 'Verify payment requests out of band', text: 'Use a known phone number or official app to confirm delivery fees, invoices, or requests from colleagues before paying.' },
  { category: 'Email', title: 'Treat attachments as untrusted', text: 'Confirm unexpected files with the sender using another channel. Do not enable macros or sign in from an attachment prompt.' },
  { category: 'QR codes', title: 'Preview links before opening', text: 'A QR code hides its destination until scanned. Preview the complete URL, then check the domain before entering information.' },
]