import type { AppState } from '../types'
import { calcTotals } from './finance'
import { fmt } from './format'
import { calcRetirement } from './retirement'
import { calcTax } from './tax'

export const ADVISOR_PRESETS = [
  'วิเคราะห์ Net Worth และภาพรวมพอร์ต',
  'ควรลงทุน Thai ESG เพิ่มเท่าไร?',
  'วิเคราะห์แผนเกษียณ SWR ของฉัน',
  'DTI ของฉันปลอดภัยไหม?',
  'แนะนำลดหนี้ Snowball vs Avalanche',
]

export function generateAdvisorReply(question: string, state: AppState): string {
  const totals = calcTotals(state)
  const tax = calcTax(state)
  const retirement = calcRetirement(state)
  const q = question.toLowerCase()

  if (q.includes('net worth') || q.includes('ภาพรวม') || q.includes('พอร์ต')) {
    return [
      '**วิเคราะห์ภาพรวมพอร์ต**',
      `Net Worth: ฿${fmt(totals.nw)} ${totals.nw >= 0 ? '(บวก)' : '(ติดลบ ต้องลดหนี้)'}`,
      `อัตราออม: ${totals.sr.toFixed(1)}% ${totals.sr >= 20 ? 'อยู่ในเกณฑ์ดี' : 'ควรขยับให้ถึง 20%+'}`,
      `DTI: ${totals.dti.toFixed(1)}% ${totals.dti <= 40 ? 'ยังรับได้' : 'สูง ควรชะลอหนี้ใหม่'}`,
      `กองทุนฉุกเฉิน: ${totals.em.toFixed(1)} เดือน ${totals.em >= 6 ? 'ครบ' : 'ควรสะสมเพิ่ม'}`,
    ].join('\n')
  }

  if (q.includes('esg') || q.includes('ssf') || q.includes('rmf')) {
    return [
      '**แนะนำกองทุนลดหย่อนภาษี**',
      `Marginal Rate: ${tax.mg}%`,
      `Thai ESG เพิ่มได้: ฿${fmt(tax.esgR)} ประหยัดภาษีโดยประมาณ ฿${fmt(tax.esgR * tax.mg / 100)}`,
      `SSF เพิ่มได้: ฿${fmt(tax.ssfR)} ประหยัดโดยประมาณ ฿${fmt(tax.ssfR * tax.mg / 100)}`,
      `RMF เพิ่มได้: ฿${fmt(tax.rmfR)} ประหยัดโดยประมาณ ฿${fmt(tax.rmfR * tax.mg / 100)}`,
      'หมายเหตุ: ตัวเลขนี้เป็นประมาณการ ต้องตรวจสิทธิ์และประกาศภาษีของปีนั้นก่อนยื่นจริง',
    ].join('\n')
  }

  if (q.includes('เกษียณ') || q.includes('swr')) {
    return [
      '**วิเคราะห์แผนเกษียณ**',
      `Nest Egg เป้าหมาย: ฿${fmt(retirement.nest)}`,
      `พอร์ตประมาณตอนเกษียณ: ฿${fmt(retirement.proj)}`,
      retirement.short > 0
        ? `ยังขาด ฿${fmt(retirement.short)} ควรเพิ่มออมประมาณ ฿${fmt(retirement.short / (retirement.yrs * 12 || 1))}/เดือน`
        : `เกินเป้าประมาณ ฿${fmt(retirement.proj - retirement.nest)}`,
      `SWR 4% ถอนได้ประมาณ ฿${fmt(retirement.swr)}/เดือน`,
    ].join('\n')
  }

  if (q.includes('dti') || q.includes('หนี้')) {
    return [
      '**วิเคราะห์ภาระหนี้**',
      `DTI ปัจจุบัน: ${totals.dti.toFixed(1)}%`,
      totals.dti <= 40
        ? 'ยังอยู่ในกรอบที่ควบคุมได้ แต่ควรทดสอบ cashflow หากรายได้ลดลง'
        : 'สูงกว่าเกณฑ์ที่ควรสบาย ควรลดหนี้ดอกเบี้ยสูงก่อนเพิ่มภาระใหม่',
      'ใช้หน้า ผ่อนบ้าน/รถ เพื่อจำลองโปะเพิ่มและ refinance',
    ].join('\n')
  }

  if (q.includes('snowball') || q.includes('avalanche')) {
    return [
      '**Snowball vs Avalanche**',
      'Snowball: ปิดหนี้ก้อนเล็กก่อน เห็นผลเร็วด้านพฤติกรรม',
      'Avalanche: ปิดดอกเบี้ยสูงก่อน ประหยัดเงินมากกว่า',
      `จากข้อมูลปัจจุบันมีหนี้ ${state.debts.length} ก้อน ถ้ามีวินัยพอให้เลือก Avalanche`,
    ].join('\n')
  }

  return [
    '**สรุปพอร์ตแบบเร็ว**',
    `Net Worth: ฿${fmt(totals.nw)} | ออม ${totals.sr.toFixed(1)}% | DTI ${totals.dti.toFixed(1)}%`,
    `ภาษีประมาณการปีนี้: ก่อนเครดิต ฿${fmt(tax.taxBeforeCredits)} | ต้องชำระเพิ่ม ฿${fmt(tax.taxPayable)} | ขอคืน ฿${fmt(tax.refund)} ที่ marginal rate ${tax.mg}%`,
    `ลดหย่อนเพิ่มได้: ESG ฿${fmt(tax.esgR)}, SSF ฿${fmt(tax.ssfR)}, RMF ฿${fmt(tax.rmfR)}`,
    retirement.short > 0 ? `แผนเกษียณยังขาด ฿${fmt(retirement.short)}` : 'แผนเกษียณเกินเป้าในสมมติฐานนี้',
  ].join('\n')
}
