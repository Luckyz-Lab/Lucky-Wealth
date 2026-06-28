import { Button } from './Button'

interface HelpDialogProps {
  open: boolean
  onClose: () => void
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  if (!open) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog dialog--wide" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="dialog__header">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="help-title">เว็บนี้ทำงานอย่างไร</h2>
          </div>
          <button type="button" className="icon-button" aria-label="ปิดหน้าช่วยเหลือ" onClick={onClose}>
            <i aria-hidden="true" className="ti ti-x" />
          </button>
        </div>

        <div className="help-grid">
          <article>
            <strong>1. เลือกเครื่องมือที่ต้องการ</strong>
            <p>หน้า Tools Hub รวมเครื่องคำนวณภาษี สินเชื่อ เกษียณ เอกสาร และ AI Advisor แต่ละเครื่องมือมีผลลัพธ์หลักและวิธีคำนวณแยกชัดเจน</p>
          </article>
          <article>
            <strong>2. กรอกข้อมูลตามช่องพร้อมคำอธิบาย</strong>
            <p>วางเมาส์หรือโฟกัสที่ไอคอนเครื่องหมายคำถามในแต่ละช่องเพื่อดูว่าช่องนั้นคืออะไร ใช้ทำอะไร และควรกรอกข้อมูลจากเอกสารใด</p>
          </article>
          <article>
            <strong>3. ภาษีเป็น filing preparation</strong>
            <p>หน้า Tax เตรียมข้อมูล ภ.ง.ด.90/91/94, ตรวจ warning, สร้าง document checklist และ export package แต่ยังไม่ส่งข้อมูลเข้า e-Filing แทนผู้ใช้</p>
          </article>
          <article>
            <strong>4. ข้อมูลอยู่ในเครื่อง</strong>
            <p>ระบบใช้ localStorage เป็นหลัก ยังไม่มี cloud sync ข้อมูลจึงอยู่ใน browser นี้ ควร export backup ก่อนล้างข้อมูลหรือเปลี่ยนเครื่อง</p>
          </article>
        </div>

        <div className="dialog__actions">
          <Button onClick={onClose}>เข้าใจแล้ว</Button>
        </div>
      </section>
    </div>
  )
}
