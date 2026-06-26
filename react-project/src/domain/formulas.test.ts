import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../lib/defaults'
import { calcTotals } from './finance'
import { loanCalc } from './loans'
import { calcRetirement } from './retirement'
import { calcTax } from './tax'

describe('finance totals', () => {
  it('calculates portfolio totals from the default state', () => {
    const totals = calcTotals(DEFAULT_STATE)

    expect(totals.inc).toBe(109500)
    expect(totals.exp).toBe(64000)
    expect(totals.ast).toBe(830000)
    expect(totals.dbt).toBe(2870000)
    expect(totals.nw).toBe(-2040000)
    expect(totals.dti).toBeCloseTo(22.37, 1)
  })
})

describe('tax estimator', () => {
  it('calculates the default tax estimate with 2569 estimator rules', () => {
    const tax = calcTax(DEFAULT_STATE)

    expect(tax.ann).toBe(1314000)
    expect(tax.exd).toBe(100000)
    expect(tax.tot).toBe(293000)
    expect(tax.net).toBe(921000)
    expect(tax.taxBeforeCredits).toBe(99200)
    expect(tax.withholdingCredit).toBe(66600)
    expect(tax.taxPayable).toBe(32600)
    expect(tax.refund).toBe(0)
    expect(tax.mg).toBe(20)
    expect(tax.formHint).toContain('ภ.ง.ด.90')
  })
})

describe('loan calculator', () => {
  it('reduces interest and months when adding extra payment', () => {
    const normal = loanCalc(1_000_000, 4.5, 10_000)
    const extra = loanCalc(1_000_000, 4.5, 10_000, 5_000)

    expect(extra.totalInt).toBeLessThan(normal.totalInt)
    expect(extra.months).toBeLessThan(normal.months)
  })
})

describe('retirement projection', () => {
  it('returns a deterministic projection for the default state', () => {
    const projection = calcRetirement(DEFAULT_STATE)

    expect(projection.yrs).toBe(28)
    expect(projection.yp).toBe(25)
    expect(projection.nest).toBeGreaterThan(0)
    expect(projection.proj).toBeGreaterThan(0)
    expect(projection.swr).toBe(Math.round((projection.proj * 0.04) / 12))
  })
})
