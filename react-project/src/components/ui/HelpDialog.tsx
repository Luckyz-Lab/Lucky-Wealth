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
            <strong>1. กรอกข้อมูลจริงเป็นรายเดือน</strong>
            <p>รายรับ รายจ่าย หนี้ และสินทรัพย์ใช้หน่วยบาทต่อเดือนหรือมูลค่าปัจจุบัน ระบบจะคำนวณภาพรวมอัตโนมัติในเครื่องของคุณ</p>
          </article>
          <article>
            <strong>2. ภาษีเป็นประมาณการ</strong>
            <p>หน้า Tax ใช้ปีภาษี 2569 เป็น estimator เพื่อวางแผน ไม่ใช่เอกสารยื่นภาษีจริง ต้องตรวจเอกสารกับกรมสรรพากรก่อนยื่น</p>
          </article>
          <article>
            <strong>3. ข้อมูลเก็บใน Browser</strong>
            <p>ระบบใช้ localStorage ยังไม่มี cloud sync ข้อมูลจึงอยู่บนเครื่อง/เบราว์เซอร์นี้เป็นหลัก</p>
          </article>
          <article>
            <strong>4. เครื่องหมายคำถามในแต่ละช่อง</strong>
            <p>วางเมาส์หรือกดโฟกัสที่ไอคอน ? เพื่อดูว่าช่องนั้นคืออะไร ควรกรอกแบบไหน และมีข้อจำกัดอะไร</p>
          </article>
        </div>

        <div className="dialog__actions">
          <Button onClick={onClose}>เข้าใจแล้ว</Button>
        </div>
      </section>
    </div>
  )
}
