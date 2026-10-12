export type ScanType = 'URL' | 'SMS' | 'Email' | 'QR'

export type RiskLevel = 'low' | 'suspicious' | 'high'

export type FindingStatus = 'signal' | 'clear' | 'unavailable'

export interface ScanFinding {
  category: string
  title: string
  explanation: string
  status: FindingStatus
}

export interface ScanRecord {
  id: string
  content: string
  type: ScanType
  createdAt: string
  score: number
  risk: RiskLevel
  summary: string
  findings: ScanFinding[]
  recommendations: string[]
  demo: true
}

export interface ScanInput {
  content: string
  type: ScanType
}