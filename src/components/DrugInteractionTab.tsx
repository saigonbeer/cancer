'use client';

import { useEffect, useState } from 'react';
import { useToast, useConfirm } from '@/components/UIFeedback';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

type InteractionItem = {
  id: string;
  severity: Severity;
  description: string;
  drugA: { id: string; name: string };
  drugB: { id: string; name: string };
};

type DrugOption = { id: string; name: string; group: string | null; abbreviation: string | null };

const SEVERITY_LABEL: Record<Severity, string> = { LOW: 'Nhẹ', MEDIUM: 'Trung bình', HIGH: 'Nặng' };
const SEVERITY_STYLE: Record<Severity, React.CSSProperties> = {
  LOW: { background: 'var(--teal-tint)', color: 'var(--teal-deep)' },
  MEDIUM: { background: 'var(--amber-tint)', color: 'var(--amber)' },
  HIGH: { background: 'var(--red-tint)', color: 'var(--red)' },
};

const fieldStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', background: '#fff',
};

function DrugPicker({ label, value, onSelect }: { label: string; value: DrugOption | null; onSelect: (d: DrugOption | null) => void }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<DrugOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value || query.trim().length < 2) {
      setOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch('/api/doctor/medications/search?q=' + encodeURIComponent(query.trim()));
      const data = await res.json().catch(() => ({ drugs: [] }));
      setOptions(data.drugs || []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, value]);

  if (value) {
    return (
      <div>
        <label className='field-label'>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px', background: 'var(--teal-tint)' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--teal-deep)', flex: 1 }}>{value.name}</span>
          <button type='button' onClick={() => { onSelect(null); setQuery(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 14 }}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <label className='field-label'>{label}</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => options.length > 0 && setOpen(true)}
        placeholder='Nhập ≥2 ký tự để tìm thuốc...'
        style={fieldStyle}
      />
      {open && options.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 20, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--line)', borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
          {options.map((o) => (
            <div
              key={o.id}
              onClick={() => { onSelect(o); setOpen(false); }}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <strong>{o.name}</strong>
              {o.group && <span style={{ color: 'var(--ink-soft)', marginLeft: 6 }}>· {o.group}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DrugInteractionTab() {
  const toast = useToast();
  const confirmFn = useConfirm();

  const [items, setItems] = useState<InteractionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [drugA, setDrugA] = useState<DrugOption | null>(null);
  const [drugB, setDrugB] = useState<DrugOption | null>(null);
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ severity: Severity; description: string }>({ severity: 'MEDIUM', description: '' });

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function load(p = page, q = search) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch('/api/admin/catalog/interactions?' + params.toString());
    const data = await res.json().catch(() => ({ items: [], total: 0 }));
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    load(1, search);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    load(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function addInteraction() {
    setFormError(null);
    if (!drugA || !drugB) {
      setFormError('Vui lòng chọn đủ 2 thuốc.');
      return;
    }
    if (!description.trim()) {
      setFormError('Vui lòng nhập mô tả tương tác.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/catalog/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drugAId: drugA.id, drugBId: drugB.id, severity, description: description.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFormError(data.error || 'Không thêm được.');
      return;
    }
    setDrugA(null);
    setDrugB(null);
    setSeverity('MEDIUM');
    setDescription('');
    toast.success('Đã thêm tương tác thuốc.');
    load(1, search);
    setPage(1);
  }

  function startEdit(it: InteractionItem) {
    setEditingId(it.id);
    setEditDraft({ severity: it.severity, description: it.description });
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/catalog/interactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft),
    });
    if (!res.ok) {
      toast.error('Không lưu được.');
      return;
    }
    setEditingId(null);
    toast.success('Đã lưu thay đổi.');
    load(page, search);
  }

  async function removeInteraction(it: InteractionItem) {
    const ok = await confirmFn(`Xoá tương tác "${it.drugA.name} ↔ ${it.drugB.name}"?`, 'Hành động này không thể hoàn tác.');
    if (!ok) return;
    const res = await fetch(`/api/admin/catalog/interactions/${it.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Không xoá được.');
      return;
    }
    toast.success('Đã xoá tương tác.');
    load(page, search);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className='sec-card'>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thêm tương tác thuốc mới</h2>
        </div>
        <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'start' }}>
          <DrugPicker label='Thuốc A' value={drugA} onSelect={setDrugA} />
          <DrugPicker label='Thuốc B' value={drugB} onSelect={setDrugB} />
          <div>
            <label className='field-label'>Mức độ</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} style={fieldStyle}>
              <option value='LOW'>Nhẹ</option>
              <option value='MEDIUM'>Trung bình</option>
              <option value='HIGH'>Nặng</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className='field-label'>Mô tả tương tác</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder='VD: Tăng nguy cơ chảy máu khi phối hợp...' style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>
          <div>
            <button type='button' className='addbtn' onClick={addInteraction} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Thêm tương tác'}
            </button>
          </div>
        </div>
        {formError && <div style={{ padding: '0 22px 16px', color: 'var(--red)', fontSize: 13 }}>{formError}</div>}
      </section>

      <section className='sec-card' style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Danh sách tương tác ({total.toLocaleString('vi-VN')})</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Tìm theo tên thuốc...'
            style={{ ...fieldStyle, width: 240 }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Đang tải...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Không tìm thấy tương tác nào.</div>
        ) : (
          items.map((it) => (
            <div key={it.id} style={{ padding: '14px 22px', borderBottom: '1px solid var(--line-soft)' }}>
              {editingId === it.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.drugA.name} ↔ {it.drugB.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}>
                    <select value={editDraft.severity} onChange={(e) => setEditDraft((d) => ({ ...d, severity: e.target.value as Severity }))} style={fieldStyle}>
                      <option value='LOW'>Nhẹ</option>
                      <option value='MEDIUM'>Trung bình</option>
                      <option value='HIGH'>Nặng</option>
                    </select>
                    <input value={editDraft.description} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} style={fieldStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type='button' className='ghostbtn' onClick={() => saveEdit(it.id)}>Lưu</button>
                    <button type='button' className='ghostbtn' onClick={() => setEditingId(null)}>Hủy</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.drugA.name} ↔ {it.drugB.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>{it.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className='pill' style={SEVERITY_STYLE[it.severity]}>{SEVERITY_LABEL[it.severity]}</span>
                    <button type='button' className='ghostbtn' onClick={() => startEdit(it)}>Sửa</button>
                    <button type='button' className='ghostbtn' style={{ color: 'var(--red)' }} onClick={() => removeInteraction(it)}>Xóa</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center' }}>
            <button type='button' className='ghostbtn' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Trước</button>
            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Trang {page} / {totalPages}</span>
            <button type='button' className='ghostbtn' disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau →</button>
          </div>
        )}
      </section>
    </div>
  );
}
