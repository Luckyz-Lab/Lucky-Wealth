import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { AppState, DocumentRecord } from '../../types'
import type { WealthActions } from '../../hooks/usePersistentWealthState'
import { validateImportedState } from '../../hooks/usePersistentWealthState'
import { Badge, Button, Card, DataTable, EmptyState, Input, Select } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  actions: WealthActions
}

const DOC_LABELS: Record<DocumentRecord['c'], string> = {
  tavi_50: 'ใบ 50 ทวิ',
  insurance: 'ประกัน',
  receipt: 'ใบเสร็จ',
  loan: 'สินเชื่อ',
  other: 'อื่นๆ',
}

const DOC_ICONS: Record<DocumentRecord['c'], string> = {
  tavi_50: 'ti-file-text',
  insurance: 'ti-shield',
  receipt: 'ti-receipt',
  loan: 'ti-home',
  other: 'ti-folder',
}

export function VaultView({ state, actions }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<DocumentRecord['c']>('tavi_50')
  const [year, setYear] = useState(2569)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const addDoc = () => {
    if (!title.trim()) return
    actions.addDocument({ t: title.trim(), c: category, y: year })
    setTitle('')
  }

  const exportData = () => {
    const anchor = document.createElement('a')
    anchor.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state, null, 2))}`
    anchor.download = `lucky-wealth-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
  }

  const importData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(String(loadEvent.target?.result || ''))
        const validated = validateImportedState(parsed)
        if (!validated) {
          setMessage('ไฟล์ไม่ตรงกับรูปแบบข้อมูล Lucky Wealth')
          return
        }
        actions.importState(validated)
        setMessage('นำเข้าข้อมูลสำเร็จ')
      } catch {
        setMessage('อ่านไฟล์ไม่ได้ กรุณาตรวจว่าเป็น JSON ที่ถูกต้อง')
      } finally {
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <PageHeader
        eyebrow="Evidence vault"
        title="คลังหลักฐานลดหย่อน"
        description="บันทึกรายการเอกสารและสำรองข้อมูลพอร์ตเป็น JSON สำหรับใช้งานส่วนตัว"
      />

      {message && <div className="notice notice--info"><i aria-hidden="true" className="ti ti-info-circle" /><p>{message}</p></div>}

      <Card title="เพิ่มเอกสาร" eyebrow="Documents">
        <div className="form-grid form-grid--4">
          <Input label="ชื่อเอกสาร" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="เช่น ใบ 50 ทวิ, ใบเสร็จค่าประกัน" />
          <Select label="หมวดหมู่" value={category} onChange={(event) => setCategory(event.target.value as DocumentRecord['c'])}>
            {Object.entries(DOC_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Input label="ปีภาษี" type="number" value={year} onChange={(event) => setYear(Number(event.target.value) || 2569)} />
          <Button icon="ti-plus" onClick={addDoc}>เพิ่ม</Button>
        </div>

        <DataTable headers={['เอกสาร', 'หมวด', 'ปีภาษี', '']}>
          {state.docs.length === 0 ? <tr><td colSpan={4}><EmptyState title="ยังไม่มีเอกสาร" description="เพิ่มรายการหลักฐานที่ต้องใช้ประกอบการยื่นภาษี" /></td></tr> : state.docs.map((doc) => (
            <tr key={doc.id}>
              <td><span className="doc-title"><i aria-hidden="true" className={`ti ${DOC_ICONS[doc.c]}`} /> <strong>{doc.t}</strong></span></td>
              <td><Badge tone="info">{DOC_LABELS[doc.c]}</Badge></td>
              <td>{doc.y}</td>
              <td className="action-cell"><Button variant="ghost" icon="ti-trash" onClick={() => actions.removeDocument(doc.id)}>ลบ</Button></td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <div className="content-grid content-grid--balanced">
        <Card title="สำรองข้อมูล" eyebrow="Export">
          <p className="muted">ดาวน์โหลดข้อมูลทั้งหมดในเครื่องเป็น JSON เก็บไว้เอง</p>
          <Button icon="ti-download" onClick={exportData}>ดาวน์โหลด JSON</Button>
        </Card>
        <Card title="กู้คืนข้อมูล" eyebrow="Import">
          <p className="muted">นำเข้าเฉพาะไฟล์ JSON ที่ผ่าน schema validation ขั้นต้น</p>
          <Button variant="secondary" icon="ti-upload" onClick={() => fileRef.current?.click()}>เลือกไฟล์ JSON</Button>
          <input ref={fileRef} className="visually-hidden" type="file" accept=".json,application/json" onChange={importData} />
        </Card>
      </div>
    </>
  )
}
