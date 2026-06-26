import type { AppState } from '../types'
import { STORAGE_VERSION } from '../types'

export const DEFAULT_STATE: AppState = {
  storageVersion: STORAGE_VERSION,
  ownerName: 'คุณอนิรุทธ์',
  incomes: [
    { id: 'i1', t: 'เงินเดือนวิศวกร', a: 85000, tp: '40_1', wht: 4500 },
    { id: 'i2', t: 'ฟรีแลนซ์', a: 20000, tp: '40_2', wht: 600 },
    { id: 'i3', t: 'ปันผลหุ้น', a: 4500, tp: '40_4', wht: 450 },
  ],
  expenses: [
    { id: 'e1', t: 'ค่าอาหาร', a: 25000, c: 'food' },
    { id: 'e2', t: 'เดินทาง', a: 6500, c: 'transport' },
    { id: 'e3', t: 'ผ่อนคอนโด', a: 15500, c: 'housing' },
    { id: 'e4', t: 'ผ่อนรถ', a: 9000, c: 'housing' },
    { id: 'e5', t: 'สันทนาการ', a: 8000, c: 'leisure' },
  ],
  assets: [
    { id: 'a1', t: 'เงินฝากออมทรัพย์', v: 250000, tp: 'deposit', r: 1.5 },
    { id: 'a2', t: 'พอร์ตหุ้นไทย', v: 350000, tp: 'stock', r: 7 },
    { id: 'a3', t: 'กองทุนรวม', v: 150000, tp: 'fund', r: 3.2 },
    { id: 'a4', t: 'Bitcoin', v: 80000, tp: 'crypto', r: 15 },
  ],
  debts: [
    { id: 'd1', t: 'สินเชื่อคอนโด', b: 2450000, p: 15500, r: 4.8 },
    { id: 'd2', t: 'สินเชื่อรถ', b: 420000, p: 9000, r: 2.75 },
  ],
  ded: {
    personal: 60000,
    spouse: 0,
    children: 1,
    parents: 0,
    disabled: 0,
    maternity: 0,
    lifeIns: 30000,
    healthIns: 15000,
    parentHealthIns: 0,
    pensionLifeIns: 0,
    pvd: 24000,
    gpf: 0,
    teacherFund: 0,
    nssf: 0,
    sso: 9000,
    rmf: 20000,
    ssf: 15000,
    thaiEsg: 30000,
    thaiEsgX: 0,
    homeLoan: 45000,
    generalDonation: 5000,
    educationDonation: 0,
    socialEnterprise: 0,
    easyReceipt: 10000,
  },
  ret: { ca: 32, ra: 60, le: 85, me: 30000, inf: 2.8, rr: 4.5, sso: 6500 },
  docs: [
    { id: 'dc1', t: 'ใบเสร็จบริจาค', c: 'receipt', y: 2569 },
    { id: 'dc2', t: 'ใบ 50 ทวิ เงินเดือน', c: 'tavi_50', y: 2569 },
  ],
  chat: [],
}

export const STORAGE_KEY = 'lucky_wealth_state_v3'

export function cloneDefaultState(): AppState {
  return structuredClone(DEFAULT_STATE)
}
