import { useEffect, useRef, useState } from 'react'
import type { AppState } from '../../types'
import type { WealthActions } from '../../hooks/usePersistentWealthState'
import { ADVISOR_PRESETS, generateAdvisorReply } from '../../domain/advisor'
import { Badge, Button, Card, EmptyState } from '../../components/ui'
import { PageHeader } from '../../components/layout'

interface Props {
  state: AppState
  actions: WealthActions
}

function renderText(text: string) {
  return text.split('\n').map((line, index) => {
    const boldMatch = line.match(/^\*\*(.*)\*\*$/)
    return boldMatch ? <strong key={index}>{boldMatch[1]}</strong> : <span key={index}>{line}</span>
  })
}

export function AIView({ state, actions }: Props) {
  const [input, setInput] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [state.chat])

  const sendChat = (preset?: string) => {
    const text = preset || input.trim()
    if (!text) return
    setInput('')
    actions.addChat({ r: 'user', c: text })
    actions.addChat({ r: 'bot', c: generateAdvisorReply(text, state) })
  }

  return (
    <>
      <PageHeader
        eyebrow="Local advisor"
        title="AI ที่ปรึกษาการเงิน"
        description="รอบนี้ใช้ rule-based advisor ในเครื่องก่อน เพื่อไม่ส่งข้อมูลการเงินไป API โดยตรงจาก browser"
        meta="No client API key"
      />

      <div className="notice notice--info">
        <i aria-hidden="true" className="ti ti-lock" />
        <div>
          <strong>ปิด direct Anthropic API call แล้ว</strong>
          <p>ถ้าจะใช้ LLM จริง ควรทำ backend proxy พร้อม key management และ consent ก่อนส่งข้อมูลพอร์ตออกนอกเครื่อง</p>
        </div>
      </div>

      <Card title="ถามที่ปรึกษา" eyebrow="Advisor">
        <div className="chip-row">
          {ADVISOR_PRESETS.map((question) => (
            <button key={question} type="button" className="chip" onClick={() => sendChat(question)}>{question}</button>
          ))}
        </div>

        <div className="chat" ref={chatRef}>
          {state.chat.length === 0 ? (
            <EmptyState title="ยังไม่มีบทสนทนา" description="เลือกคำถามตัวอย่างหรือพิมพ์คำถามด้านล่าง" />
          ) : state.chat.map((message, index) => (
            <div key={index} className={`message message--${message.r}`}>
              <div className="message__avatar"><i aria-hidden="true" className={`ti ${message.r === 'user' ? 'ti-user' : 'ti-brain'}`} /></div>
              <div className="message__bubble">
                {message.r === 'bot' && <Badge tone="info">Local estimate</Badge>}
                {renderText(message.c)}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') sendChat() }}
            placeholder="พิมพ์คำถาม เช่น ควรซื้อ Thai ESG เพิ่มไหม?"
          />
          <Button icon="ti-send" onClick={() => sendChat()}>ส่ง</Button>
          {state.chat.length > 0 && <Button variant="secondary" icon="ti-trash" onClick={actions.clearChat}>ล้าง</Button>}
        </div>
      </Card>
    </>
  )
}
