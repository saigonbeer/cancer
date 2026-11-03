'use client';

import { useEffect, useState, useRef } from 'react';

export default function DoctorMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchTab, setSearchTab] = useState<'patient' | 'doctor'>('patient');
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [starting, setStarting] = useState(false);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setMyUserId(d.user?.userId || null));
  }, []);

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

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations(true);
      if (activeIdRef.current) loadMessages(activeIdRef.current);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadPatients() {
    const res = await fetch('/api/messages?action=contacts');
    const data = await res.json();
    setPatients(data.contacts || []);
  }

  async function loadDoctors() {
    const res = await fetch('/api/messages?action=doctors');
    const data = await res.json();
    setDoctors(data.doctors || []);
  }

  async function startChat(targetUserId: string, targetType?: 'doctor') {
    setStarting(true);
    try {
      const params = new URLSearchParams({ targetUserId });
      if (targetType) params.set('targetType', targetType);
      const res = await fetch('/api/messages?' + params.toString());
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      if (data.conversation) {
        await loadConversations();
        selectConv(data.conversation);
        setShowSearch(false);
        setSearchTerm('');
      }
    } finally {
      setStarting(false);
    }
  }

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

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientCode.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDoctors = doctors.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const existingContactIds = new Set(
    conversations.flatMap((c) =>
      c.participants?.filter((p: any) => p.user?.id !== myUserId).map((p: any) => p.user.id) || []
    )
  );

  function otherParticipant(c: any) {
    return c.participants?.find((p: any) => p.user?.id !== myUserId)?.user;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Liên lạc</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            Trao đổi với bệnh nhân đang điều trị và bác sĩ khác trong khoa
          </div>
        </div>
        <button
          type='button'
          className='addbtn'
          onClick={() => {
            const next = !showSearch;
            setShowSearch(next);
            setSearchTerm('');
            if (next) { loadPatients(); loadDoctors(); }
          }}
        >
          + Nhắn tin mới
        </button>
      </div>

      {showSearch && (
        <div className='sec-card' style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, borderBottom: '1px solid var(--line-soft)' }}>
            <button
              type='button'
              onClick={() => { setSearchTab('patient'); setSearchTerm(''); }}
              style={{
                border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
                padding: '6px 2px 10px', cursor: 'pointer',
                borderBottom: searchTab === 'patient' ? '2px solid var(--teal)' : '2px solid transparent',
                color: searchTab === 'patient' ? 'var(--teal-deep)' : 'var(--ink-soft)',
              }}
            >
              Bệnh nhân đang điều trị
            </button>
            <button
              type='button'
              onClick={() => { setSearchTab('doctor'); setSearchTerm(''); }}
              style={{
                border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
                padding: '6px 2px 10px', cursor: 'pointer',
                borderBottom: searchTab === 'doctor' ? '2px solid var(--teal)' : '2px solid transparent',
                color: searchTab === 'doctor' ? 'var(--teal-deep)' : 'var(--ink-soft)',
              }}
            >
              Bác sĩ khác
            </button>
          </div>

          <input
            type='text'
            placeholder={searchTab === 'patient' ? 'Tìm theo tên hoặc mã bệnh nhân...' : 'Tìm theo tên hoặc khoa...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 10 }}
          />

          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {searchTab === 'patient' ? (
              filteredPatients.length === 0 ? (
                <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
                  {patients.length === 0 ? 'Chưa có bệnh nhân nào đang điều trị.' : 'Không tìm thấy bệnh nhân phù hợp.'}
                </div>
              ) : (
                filteredPatients.map((p) => (
                  <div
                    key={p.userId}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)',
                      background: existingContactIds.has(p.userId) ? 'var(--teal-tint)' : '#fff'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</span>
                      <span style={{ color: 'var(--ink-soft)', fontSize: 12, marginLeft: 8 }}>{p.patientCode}</span>
                    </div>
                    <button
                      type='button'
                      className='addbtn'
                      style={{ fontSize: 12, padding: '4px 12px' }}
                      disabled={starting}
                      onClick={() => startChat(p.userId)}
                    >
                      {existingContactIds.has(p.userId) ? 'Mở' : 'Nhắn tin'}
                    </button>
                  </div>
                ))
              )
            ) : (
              filteredDoctors.length === 0 ? (
                <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
                  {doctors.length === 0 ? 'Không có bác sĩ nào khác trong hệ thống.' : 'Không tìm thấy bác sĩ phù hợp.'}
                </div>
              ) : (
                filteredDoctors.map((d) => (
                  <div
                    key={d.userId}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)',
                      background: existingContactIds.has(d.userId) ? 'var(--teal-tint)' : '#fff'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{d.name}</span>
                      <span style={{ color: 'var(--ink-soft)', fontSize: 12, marginLeft: 8 }}>{d.department}</span>
                    </div>
                    <button
                      type='button'
                      className='addbtn'
                      style={{ fontSize: 12, padding: '4px 12px' }}
                      disabled={starting}
                      onClick={() => startChat(d.userId, 'doctor')}
                    >
                      {existingContactIds.has(d.userId) ? 'Mở' : 'Nhắn tin'}
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: '70vh' }}>
        <div className='sec-card' style={{ padding: 14, overflowY: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Hội thoại</div>
          {loading ? (
            <div style={{ color: 'var(--ink-soft)' }}>Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Chưa có cuộc hội thoại nào. Nhấn "Nhắn tin mới" để bắt đầu.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {conversations.map((c) => {
                const other = otherParticipant(c);
                const lastMsg = c.messages?.[0];
                const isOtherDoctor = other?.role === 'DOCTOR';
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{other?.name || 'Người dùng'}</span>
                      {isOtherDoctor && (
                        <span className='pill' style={{ fontSize: 10, background: 'var(--purple-tint)', color: 'var(--purple)' }}>BS</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastMsg ? `${lastMsg.senderId === myUserId ? 'Bạn' : other?.name || ''}: ${lastMsg.content}` : 'Nhấn để xem tin nhắn'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className='sec-card' style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
          {!activeConv ? (
            <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>
              Chọn một hội thoại hoặc tạo mới để bắt đầu.
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 6 }}>
                {messages.length === 0 ? (
                  <div style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>
                    Chưa có tin nhắn trong cuộc trò chuyện này.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === myUserId;
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          background: isMe ? 'var(--teal)' : 'var(--bg)',
                          color: isMe ? '#fff' : 'var(--ink)',
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
                  placeholder='Nhập nội dung tin nhắn tư vấn...'
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
