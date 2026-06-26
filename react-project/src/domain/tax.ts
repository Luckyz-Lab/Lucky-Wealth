import type { AppState, TaxEstimate } from '../types'

export function calcTax(state: AppState): TaxEstimate {
  const ann = state.incomes.reduce((sum, item) => sum + item.a * 12, 0)
  const deductions = state.ded
  const exd = ann * 0.5
  const lifeHealth = Math.min((deductions.lifeIns || 0) + (deductions.healthIns || 0), 100000)
  const retirementFunds = Math.min(
    (deductions.pvd || 0) + (deductions.rmf || 0) + (deductions.ssf || 0),
    500000,
  )
  const esg = Math.min(deductions.thaiEsg || 0, ann * 0.3, 300000)
  const tot =
    (deductions.personal || 60000) +
    (deductions.spouse || 0) +
    (deductions.children || 0) * 30000 +
    lifeHealth +
    (deductions.sso || 0) +
    retirementFunds +
    esg +
    Math.min(deductions.homeLoan || 0, 100000) +
    (deductions.charity || 0) +
    (deductions.easyReceipt || 0)
  const net = Math.max(0, ann - exd - tot)

  const brackets = [
    { m: 150000, r: 0 },
    { m: 150000, r: 0.05 },
    { m: 200000, r: 0.1 },
    { m: 250000, r: 0.15 },
    { m: 250000, r: 0.2 },
    { m: 1000000, r: 0.25 },
    { m: 3000000, r: 0.3 },
    { m: Infinity, r: 0.35 },
  ]

  let rem = net
  let tax = 0
  let mg = 0
  const bd: TaxEstimate['bd'] = []

  for (const bracket of brackets) {
    const taxable = bracket.m === Infinity ? rem : Math.min(rem, bracket.m)
    const bracketTax = Math.round(taxable * bracket.r)
    if (taxable > 0 && bracket.r > 0) mg = bracket.r * 100
    tax += bracketTax
    bd.push({ rate: bracket.r * 100, tax: bracketTax, txbl: taxable })
    rem -= taxable
    if (rem <= 0) break
  }

  return {
    ann,
    net,
    tax,
    mg,
    bd,
    exd,
    tot,
    rmfR: Math.max(0, Math.min(ann * 0.3, 500000) - (deductions.rmf || 0)),
    ssfR: Math.max(0, Math.min(ann * 0.3, 200000) - (deductions.ssf || 0)),
    esgR: Math.max(0, Math.min(ann * 0.3, 300000) - (deductions.thaiEsg || 0)),
  }
}
