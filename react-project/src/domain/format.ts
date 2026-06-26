export const fmt = (n: number) => Math.round(n).toLocaleString('th-TH')

export const pct = (value: number, total: number) => (
  total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0
)

export const uid = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(16).slice(2, 6)}`
