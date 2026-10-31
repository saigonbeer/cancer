'use client';

import { useEffect, useState } from 'react';

export default function PatientMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>('Bác sĩ điều trị');
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const recRes = await fetch('/api/patient/record');
    const recData = await recRes.json();
    const docUserId = recData.profile?.doctor?.userId;
    if (recData.profile?.doctor?.user?.name) {
      setDoctorName(recData.profile.doctor.user.name);
    }

    if (docUserId) {
      const convRes = await fetch('/api/messages?targetUserId=' + docUserId);
      const convData = await convRes.json();
      if (convData.conversation) {
        setConversationId(convData.conversation.id);
        setMessages(convData.conversation.messages || []);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function send() {
    if (!conversationId || !inputContent.trim()) return;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, content: inputContent.trim() })
    });
    if (res.ok) {
      const data = await res.json();
      setMessages([...messages, data.message]);
      setInputContent('');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Nhắn tin & Tư vấn với Bác sĩ</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Trao đổi trực tiếp với Bác sĩ {doctorName}
        </div>
      </div>

      <div className='sec-card' style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '70vh' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 6 }}>
          {loading ? (
            <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>Đang kết nối hội thoại...</div>
          ) : messages.length === 0 ? (
            <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>
              Bạn chưa có tin nhắn nào với Bác sĩ. Hãy gửi câu hỏi nếu có thắc mắc về đơn thuốc hoặc điều trị!
            </div>
          ) : (
            messages.map((m) => {
              const isPatient = m.sender?.role === 'PATIENT';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isPatient ? 'flex-end' : 'flex-start',
                    background: isPatient ? 'var(--teal)' : 'var(--bg)',
                    color: isPatient ? '#fff' : 'var(--ink)',
                    borderRadius: 12,
                    padding: '8px 14px',
                    maxWidth: '75%',
                    fontSize: 13.5
                  }}
                >
                  <div>{m.content}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, textAlign: 'right' }}>
                    {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input
            type='text'
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send();
            }}
            placeholder='Nhập câu hỏi hoặc tình trạng cần hỏi bác sĩ...'
          />
          <button type='button' className='addbtn' onClick={send}>
            Gá»­i
          </button>
        </div>
      </div>
    </div>
  );
}