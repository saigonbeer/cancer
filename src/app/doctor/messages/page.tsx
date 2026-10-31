'use client';

import { useEffect, useState } from 'react';

export default function DoctorMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    const res = await fetch('/api/messages');
    const data = await res.json();
    const convs = data.conversations || [];
    setConversations(convs);

    setActiveConv((prev: any) => {
      const match = prev ? convs.find((c: any) => c.id === prev.id) : null;
      const selected = match || (convs.length > 0 ? convs[0] : null);
      setMessages(selected?.messages || []);
      return selected;
    });
    if (!isRefresh) setLoading(false);
  }

  function selectConv(conv: any) {
    setActiveConv(conv);
    setMessages(conv.messages || []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 10000);
    return () => clearInterval(interval);
  }, []);

  async function send() {
    if (!activeConv || !inputContent.trim()) return;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConv.id, content: inputContent.trim() })
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
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Liên lạc Bệnh nhân Điều trị</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Kênh trao đổi nội bộ an toàn tuân thủ phân quyền điều trị
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: '70vh' }}>
        <div className='sec-card' style={{ padding: 14, overflowY: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Hội thoại</div>
          {loading ? (
            <div style={{ color: 'var(--ink-soft)' }}>Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Chưa có cuộc hội thoại nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {conversations.map((c) => {
                const other = c.participants?.find((p: any) => p.user?.role === 'PATIENT')?.user;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectConv(c)}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: activeConv?.id === c.id ? 'var(--teal-tint)' : '#fff',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{other?.name || 'Bệnh nhân'}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                      {c.messages?.[0]?.content || 'Nhấn để xem tin nhắn'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className='sec-card' style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 6 }}>
            {messages.length === 0 ? (
              <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>
                Chưa có tin nhắn trong cuộc trò chuyện này.
              </div>
            ) : (
              messages.map((m) => {
                const isDoctor = m.sender?.role === 'DOCTOR';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isDoctor ? 'flex-end' : 'flex-start',
                      background: isDoctor ? 'var(--teal)' : 'var(--bg)',
                      color: isDoctor ? '#fff' : 'var(--ink)',
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
              placeholder='Nhập nội dung tin nhắn tư vấn...'
            />
            <button type='button' className='addbtn' onClick={send}>
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}