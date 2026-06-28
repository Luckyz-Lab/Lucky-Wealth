import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../lib/defaults'
import { calcTotals } from './finance'
import { loanCalc } from './loans'
import { calcRetirement } from './retirement'
import { buildFilingPackage, calcTax } from './tax'

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

describe('tax filing prep', () => {
  it('calculates the default tax estimate with 2569 filing-prep rules', () => {
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
    expect(tax.filingForms).toContain('PND90')
    expect(tax.trace.length).toBeGreaterThan(0)
    expect(tax.documentRequirements.some((doc) => doc.status === 'required')).toBe(true)
  })

  it('selects PND91 for salary-only income', () => {
    const state = structuredClone(DEFAULT_STATE)
    state.incomes = [{ id: 'i1', t: 'เงินเดือน', a: 50000, tp: '40_1', wht: 2500 }]

    const tax = calcTax(state)

    expect(tax.filingForms).toEqual(['PND91'])
    expect(tax.formHint).toContain('ภ.ง.ด.91')
  })

  it('warns instead of silently deducting unsupported 40(6) expenses', () => {
    const state = structuredClone(DEFAULT_STATE)
    state.incomes = [{ id: 'i1', t: 'วิชาชีพอิสระ', a: 100000, tp: '40_6', wht: 0 }]
    state.taxFiling.expenseMethods = []

    const tax = calcTax(state)

    expect(tax.exd).toBe(0)
    expect(tax.validationIssues.some((issue) => issue.code === 'missing-expense-method-40_6')).toBe(true)
  })

  it('applies a selected standard expense method for 40(7)', () => {
    const state = structuredClone(DEFAULT_STATE)
    state.incomes = [{ id: 'i1', t: 'รับเหมา', a: 100000, tp: '40_7', wht: 0 }]
    state.taxFiling.expenseMethods = [
      { id: 'xm1', incomeType: '40_7', method: 'standard', subtype: 'รับเหมาที่จัดหาสัมภาระ', standardRate: 60, actualAmount: 0 },
    ]

    const tax = calcTax(state)

    expect(tax.exd).toBe(720000)
    expect(tax.expenseByType.some((line) => line.label.includes('60%'))).toBe(true)
  })

  it('builds an auditable filing package', () => {
    const pkg = buildFilingPackage(DEFAULT_STATE)

    expect(pkg.taxYear).toBe(2569)
    expect(pkg.ruleVersion).toContain('TH-PIT-2569')
    expect(pkg.trace.length).toBeGreaterThan(0)
    expect(pkg.sourceUrls).toContain('https://www.rd.go.th/557.html')
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
