import type { AppState, RetirementProjection } from '../types'

export function calcRetirement(state: AppState): RetirementProjection {
  const params = state.ret
  const yrs = Math.max(0, params.ra - params.ca)
  const yp = Math.max(0, params.le - params.ra)
  const infl = params.me * Math.pow(1 + params.inf / 100, yrs)
  const requiredMonthly = Math.max(0, infl - params.sso)
  const realReturn = (params.rr - params.inf) / 100
  const nest = realReturn > 0
    ? (requiredMonthly * 12) * ((1 - Math.pow(1 + realReturn, -yp)) / realReturn)
    : requiredMonthly * 12 * yp

  const ast = state.assets.reduce((sum, asset) => sum + asset.v, 0)
  const inc = state.incomes.reduce((sum, item) => sum + item.a, 0)
  const exp = state.expenses.reduce((sum, item) => sum + item.a, 0)
  const sav = Math.max(0, inc - exp)
  const wr = ast > 0
    ? state.assets.reduce((sum, asset) => sum + asset.v * (asset.r / 100), 0) / ast
    : 0.05
  const fv = ast * Math.pow(1 + wr, yrs)
  const fvs = wr > 0
    ? sav * 12 * ((Math.pow(1 + wr, yrs) - 1) / wr)
    : sav * 12 * yrs
  const proj = Math.round(fv + fvs)

  return {
    yrs,
    yp,
    nest: Math.round(nest),
    proj,
    short: Math.max(0, Math.round(nest) - proj),
    swr: Math.round((proj * 0.04) / 12),
    wr,
    ast,
    sav,
    infl: Math.round(infl),
  }
}
