'use client';

import { useEffect, useState, useRef } from 'react';

export default function PatientMessagesPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const activeIdRef = useRef<string | null>(null);

  async function loadDoctors() {
    const res = await fetch('/api/messages?action=contacts');
    const data = await res.json();
    setDoctors(data.contacts || []);
  }

  async function loadConversations(isRefresh = false) {
    if (!isRefresh) setLoading(true);
    const res = await fetch('/api/messages');
    const data = await res.json();
    const convs = data.conversations || [];
    setConversations(convs);

    if (!isRefresh && convs.length > 0 && !activeIdRef.current) {
      selectConv(convs[0]);
    }
    if (!isRefresh) setLoading(false);
  }

  async function loadMessages(convId: string) {
    const res = await fetch('/api/messages?conversationId=' + convId);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  function selectConv(conv: any) {
    setActiveConv(conv);
    activeIdRef.current = conv.id;
    loadMessages(conv.id);
  }

  async function startChat(doctorUserId: string) {
    setStarting(true);
    try {
      const res = await fetch('/api/messages?targetUserId=' + doctorUserId);
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      if (data.conversation) {
        await loadConversations();
        selectConv(data.conversation);
      }
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    loadDoctors();
    loadConversations();
    const interval = setInterval(() => {
      loadConversations(true);
      if (activeIdRef.current) loadMessages(activeIdRef.current);
    }, 10000);
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
      setMessages((prev) => [...prev, data.message]);
      setInputContent('');
    }
  }

  const existingDoctorIds = new Set(
    conversations.flatMap((c) =>
      c.participants?.filter((p: any) => p.user?.role === 'DOCTOR').map((p: any) => p.user.id) || []
    )
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Nhắn tin & Tư vấn với Bác sĩ</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Trao đổi trực tiếp với các Bác sĩ đang và đã điều trị cho bạn
        </div>
      </div>

      {doctors.length === 0 && !loading && (
        <div className='sec-card' style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>
          Bạn chưa được gán bác sĩ điều trị nào. Vui lòng liên hệ quầy tiếp nhận để được phân công bác sĩ.
        </div>
      )}

      {doctors.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {doctors.map((d) => (
            <div
              key={d.userId}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px', borderRadius: 10,
                border: '1px solid var(--line)', background: '#fff', fontSize: 13
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{d.name}</span>
                {d.isCurrent && (
                  <span style={{ fontSize: 11, color: 'var(--teal)', marginLeft: 6 }}>Đang điều trị</span>
                )}
              </div>
              {!existingDoctorIds.has(d.userId) && (
                <button
                  type='button'
                  className='addbtn'
                  style={{ fontSize: 11, padding: '3px 10px' }}
                  disabled={starting}
                  onClick={() => startChat(d.userId)}
                >
                  Nhắn tin
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: conversations.length > 1 ? '240px 1fr' : '1fr', gap: 20, height: '70vh' }}>
        {conversations.length > 1 && (
          <div className='sec-card' style={{ padding: 14, overflowY: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Hội thoại</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {conversations.map((c) => {
                const doc = c.participants?.find((p: any) => p.user?.role === 'DOCTOR')?.user;
                const lastMsg = c.messages?.[0];
                return (
                  <div
                    key={c.id}
                    onClick={() => selectConv(c)}
                    style={{
                      padding: 10, borderRadius: 8, cursor: 'pointer',
                      background: activeConv?.id === c.id ? 'var(--teal-tint)' : '#fff',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{doc?.name || 'Bác sĩ'}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastMsg?.content || 'Nhấn để xem tin nhắn'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className='sec-card' style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>Đang kết nối hội thoại...</div>
          ) : !activeConv ? (
            <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>
              {conversations.length === 0
                ? 'Chưa có tin nhắn nào. Nhấn "Nhắn tin" bên cạnh tên bác sĩ để bắt đầu.'
                : 'Chọn một hội thoại để xem tin nhắn.'}
            </div>
          ) : (
            <>
              {conversations.length <= 1 && (
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: 'var(--teal)' }}>
                  {activeConv.participants?.find((p: any) => p.user?.role === 'DOCTOR')?.user?.name || 'Bác sĩ'}
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 6 }}>
                {messages.length === 0 ? (
                  <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>
                    Bạn chưa có tin nhắn nào. Hãy gửi câu hỏi nếu có thắc mắc về đơn thuốc hoặc điều trị!
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
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                  placeholder='Nhập câu hỏi hoặc tình trạng cần hỏi bác sĩ...'
                />
                <button type='button' className='addbtn' onClick={send}>
                  Gửi
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
