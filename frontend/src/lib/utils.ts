export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getRiskBadgeClass(level: string): string {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider font-ui border-0"
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return base + ' rounded bg-risk-critical text-white shadow-sm'
    case 'HIGH':     return base + ' rounded-md bg-risk-high text-white shadow-sm'
    case 'MODERATE': return base + ' rounded-full bg-risk-watch text-[#3D2E06] shadow-sm'
    case 'LOW':      return base + ' rounded-full bg-risk-normal text-white shadow-sm'
    default:         return base + ' rounded-full bg-risk-normal text-white shadow-sm'
  }
}

export function getRiskColor(level: string): string {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return 'text-risk-critical'
    case 'HIGH':     return 'text-risk-high'
    case 'MODERATE': return 'text-risk-watch'
    case 'LOW':      return 'text-risk-normal'
    default:         return 'text-risk-normal'
  }
}

export function getRiskBg(level: string): string {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return 'bg-risk-critical text-white'
    case 'HIGH':     return 'bg-risk-high text-white'
    case 'MODERATE': return 'bg-risk-watch text-[#3D2E06]'
    case 'LOW':      return 'bg-risk-normal text-white'
    default:         return 'bg-risk-normal text-white'
  }
}

export function getRiskIcon(level: string): string {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return '✕'
    case 'HIGH':     return '△'
    case 'MODERATE': return '◐'
    case 'LOW':      return '✓'
    default:         return '✓'
  }
}

export function fmtGW(val: number | undefined | null): string {
  if (val === undefined || val === null) return '—'
  return Math.abs(val).toFixed(1) + ' m'
}

export function formatMonth(m: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[m - 1] || String(m)
}

export function getChipClass(level: string, active: string): string {
  const base = "px-3.5 py-1.5 rounded text-[11px] font-semibold font-mono transition-colors border-0"
  if (level !== active) return base + " border border-border-ui bg-surface-card text-text-secondary hover:border-text-secondary hover:text-text-primary"
  
  switch (level?.toUpperCase()) {
    case 'ALL':      return base + " bg-text-primary text-surface-page"
    case 'CRITICAL': return base + " bg-risk-critical text-white"
    case 'HIGH':     return base + " bg-risk-high text-white"
    case 'MODERATE': return base + " bg-risk-watch text-[#3D2E06]"
    case 'LOW':      return base + " bg-risk-normal text-white"
    default:         return base + " bg-risk-normal text-white"
  }
}
