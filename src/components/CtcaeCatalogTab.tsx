'use client';

import { useEffect, useState } from 'react';

interface CtcaeItem {
  id: string;
  lltCode: string;
  soc: string;
  term: string;
  socVi: string | null;
  termVi: string | null;
  grade1Vi: string | null;
  grade2Vi: string | null;
  grade3Vi: string | null;
  grade4Vi: string | null;
  grade5Vi: string | null;
  definitionVi: string | null;
  navigationalNoteVi: string | null;
  changeNoteVi: string | null;
}

const fieldStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px',
  fontSize: 13, fontFamily: 'inherit', background: '#fff', resize: 'vertical',
};

type Draft = Pick<
  CtcaeItem,
  'termVi' | 'socVi' | 'grade1Vi' | 'grade2Vi' | 'grade3Vi' | 'grade4Vi' | 'grade5Vi' | 'definitionVi' | 'navigationalNoteVi' | 'changeNoteVi'
>;

function draftFrom(item: CtcaeItem): Draft {
  return {
    termVi: item.termVi,
    socVi: item.socVi,
    grade1Vi: item.grade1Vi,
    grade2Vi: item.grade2Vi,
    grade3Vi: item.grade3Vi,
    grade4Vi: item.grade4Vi,
    grade5Vi: item.grade5Vi,
    definitionVi: item.definitionVi,
    navigationalNoteVi: item.navigationalNoteVi,
    changeNoteVi: item.changeNoteVi,
  };
}

export default function CtcaeCatalogTab() {
  const [items, setItems] = useState<CtcaeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [soc, setSoc] = useState('');
  const [socOptions, setSocOptions] = useState<{ soc: string; socVi: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q.trim()) params.set('q', q.trim());
    if (soc) params.set('soc', soc);
    const res = await fetch('/api/admin/catalog/ctcae?' + params.toString());
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    if (socOptions.length === 0) setSocOptions(data.socOptions || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, soc]);

  function search() {
    setPage(1);
    load();
  }

  function openEdit(item: CtcaeItem) {
    setOpenId(item.id);
    setDraft(draftFrom(item));
    setError(null);
  }

  async function save(id: string) {
    if (!draft) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/catalog/ctcae/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Không lưu được.');
      return;
    }
    setOpenId(null);
    load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className='sec-card'>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tác dụng phụ (CTCAE v6.0)</h2>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
            {total} thuật ngữ · nguồn: NCI CTCAE v6.0, bản dịch tiếng Việt khớp theo mã LLT MedDRA.
          </div>
        </div>
        <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr 260px auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label className='field-label'>Tìm kiếm</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
              placeholder='Tên thuật ngữ (VI/EN) hoặc mã LLT...'
            />
          </div>
          <div>
            <label className='field-label'>Nhóm SOC</label>
            <select value={soc} onChange={(e) => { setSoc(e.target.value); setPage(1); }} style={fieldStyle}>
              <option value=''>Tất cả ({socOptions.length} nhóm)</option>
              {socOptions.map((s) => (
                <option key={s.soc} value={s.soc}>{s.socVi || s.soc}</option>
              ))}
            </select>
          </div>
          <button type='button' className='addbtn' style={{ height: 38 }} onClick={search}>
            Tìm
          </button>
        </div>
      </section>

      <section className='sec-card' style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', gap: 12, padding: '12px 20px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--ink-soft)',
            textTransform: 'uppercase', borderBottom: '1px solid var(--line)',
          }}
        >
          <div>Mã LLT</div>
          <div>Thuật ngữ</div>
          <div>Nhóm SOC</div>
          <div>Hành động</div>
        </div>

        {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Đang tải...</div>}
        {!loading && items.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Không tìm thấy thuật ngữ nào.</div>
        )}

        {!loading && items.map((item) => (
          <div key={item.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', gap: 12, alignItems: 'center', padding: '12px 20px', fontSize: 13.5 }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--ink-soft)' }}>{item.lltCode}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{item.termVi || <em style={{ color: 'var(--amber)' }}>Chưa dịch</em>}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{item.term}</div>
              </div>
              <div style={{ color: 'var(--ink-soft)' }}>{item.socVi || item.soc}</div>
              <div>
                <button type='button' className='ghostbtn' onClick={() => (openId === item.id ? setOpenId(null) : openEdit(item))}>
                  {openId === item.id ? 'Đóng' : 'Sửa'}
                </button>
              </div>
            </div>

            {openId === item.id && draft && (
              <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className='field-label'>Thuật ngữ (VI)</label>
                    <input value={draft.termVi || ''} onChange={(e) => setDraft({ ...draft, termVi: e.target.value })} />
                  </div>
                  <div>
                    <label className='field-label'>Nhóm SOC (VI)</label>
                    <input value={draft.socVi || ''} onChange={(e) => setDraft({ ...draft, socVi: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {(['grade1Vi', 'grade2Vi', 'grade3Vi', 'grade4Vi', 'grade5Vi'] as const).map((key, i) => (
                    <div key={key}>
                      <label className='field-label'>Độ {i + 1}</label>
                      <textarea
                        rows={3}
                        value={draft[key] || ''}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                        style={fieldStyle}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className='field-label'>Định nghĩa</label>
                  <textarea rows={2} value={draft.definitionVi || ''} onChange={(e) => setDraft({ ...draft, definitionVi: e.target.value })} style={fieldStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className='field-label'>Ghi chú điều hướng</label>
                    <textarea rows={2} value={draft.navigationalNoteVi || ''} onChange={(e) => setDraft({ ...draft, navigationalNoteVi: e.target.value })} style={fieldStyle} />
                  </div>
                  <div>
                    <label className='field-label'>Thay đổi so với v5.0</label>
                    <textarea rows={2} value={draft.changeNoteVi || ''} onChange={(e) => setDraft({ ...draft, changeNoteVi: e.target.value })} style={fieldStyle} />
                  </div>
                </div>

                {error && <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type='button' className='addbtn' disabled={saving} onClick={() => save(item.id)}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button type='button' className='ghostbtn' onClick={() => setOpenId(null)}>Hủy</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <button type='button' className='ghostbtn' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Trang {page}/{totalPages}</span>
          <button type='button' className='ghostbtn' disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
}
