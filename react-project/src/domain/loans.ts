import type { LoanScenario } from '../types'

export function loanCalc(balance: number, rate: number, payment: number, extra = 0): LoanScenario {
  if (balance <= 0 || payment <= 0) return { months: 0, totalInt: 0 }

  const monthlyRate = (rate / 100) / 12
  let remaining = balance
  let months = 0
  let totalInterest = 0

  while (remaining > 0.01 && months < 600) {
    months += 1
    const interest = remaining * monthlyRate
    const paid = Math.min(payment + extra, remaining + interest)
    totalInterest += interest
    remaining -= paid - interest

    if (paid <= interest && monthlyRate > 0) break
  }

  return { months, totalInt: Math.round(totalInterest) }
}
