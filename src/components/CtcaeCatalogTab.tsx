'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast, useConfirm } from '@/components/UIFeedback';

interface CtcaeItem {
  id: string;
  order: number | null;
  lltCode: string | null;
  soc: string | null;
  term: string | null;
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
  width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px',
  fontSize: 13.5, fontFamily: 'inherit', background: '#fff',
};

type FormState = {
  order: string;
  socVi: string;
  termVi: string;
  grade1Vi: string;
  grade2Vi: string;
  grade3Vi: string;
  grade4Vi: string;
  grade5Vi: string;
  definitionVi: string;
  navigationalNoteVi: string;
};

const EMPTY_FORM: FormState = {
  order: '', socVi: '', termVi: '', grade1Vi: '', grade2Vi: '', grade3Vi: '', grade4Vi: '', grade5Vi: '',
  definitionVi: '', navigationalNoteVi: '',
};

function formFrom(item: CtcaeItem): FormState {
  return {
    order: item.order !== null ? String(item.order) : '',
    socVi: item.socVi || '',
    termVi: item.termVi || '',
    grade1Vi: item.grade1Vi || '',
    grade2Vi: item.grade2Vi || '',
    grade3Vi: item.grade3Vi || '',
    grade4Vi: item.grade4Vi || '',
    grade5Vi: item.grade5Vi || '',
    definitionVi: item.definitionVi || '',
    navigationalNoteVi: item.navigationalNoteVi || '',
  };
}

// Các tên cột chấp nhận trong file Excel (không phân biệt hoa/thường, khoảng trắng thừa)
const COLUMN_ALIASES: Record<string, string> = {
  'thứ tự': 'order',
  'phân loại cơ quan - hệ thống soc': 'socVi',
  'phân loại cơ quan – hệ thống soc': 'socVi',
  'hệ thống soc': 'socVi',
  'soc': 'socVi',
  'thuật ngữ': 'termVi',
  'độ 1': 'grade1Vi',
  'độ 2': 'grade2Vi',
  'độ 3': 'grade3Vi',
  'độ 4': 'grade4Vi',
  'độ 5': 'grade5Vi',
  'định nghĩa': 'definitionVi',
  'ghi chú điều hướng': 'navigationalNoteVi',
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function CtcaeCatalogTab() {
  const toast = useToast();
  const confirmFn = useConfirm();
  const [items, setItems] = useState<CtcaeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [soc, setSoc] = useState('');
  const [socOptions, setSocOptions] = useState<{ soc: string | null; socVi: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [importRows, setImportRows] = useState<Record<string, unknown>[] | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load(p = page, qq = q, ssoc = soc) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (qq.trim()) params.set('q', qq.trim());
    if (ssoc) params.set('soc', ssoc);
    const res = await fetch('/api/admin/catalog/ctcae?' + params.toString());
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setSocOptions(data.socOptions || []);
    setLoading(false);
  }

  useEffect(() => {
    load(1, q, soc);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, soc]);

  useEffect(() => {
    load(page, q, soc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalMode('create');
  }

  function openEdit(item: CtcaeItem) {
    setForm(formFrom(item));
    setEditingId(item.id);
    setFormError(null);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
  }

  async function save() {
    if (!form.socVi.trim() || !form.termVi.trim()) {
      setFormError('Vui lòng nhập Nhóm SOC và Thuật ngữ.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const body = {
      order: form.order.trim() ? Number(form.order) : undefined,
      socVi: form.socVi.trim(),
      termVi: form.termVi.trim(),
      grade1Vi: form.grade1Vi.trim() || undefined,
      grade2Vi: form.grade2Vi.trim() || undefined,
      grade3Vi: form.grade3Vi.trim() || undefined,
      grade4Vi: form.grade4Vi.trim() || undefined,
      grade5Vi: form.grade5Vi.trim() || undefined,
      definitionVi: form.definitionVi.trim() || undefined,
      navigationalNoteVi: form.navigationalNoteVi.trim() || undefined,
    };
    const res = modalMode === 'create'
      ? await fetch('/api/admin/catalog/ctcae', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch(`/api/admin/catalog/ctcae/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFormError(data.error || 'Không lưu được.');
      return;
    }
    toast.success(modalMode === 'create' ? 'Đã thêm thuật ngữ mới.' : 'Đã lưu thay đổi.');
    closeModal();
    load(modalMode === 'create' ? 1 : page, q, soc);
    if (modalMode === 'create') setPage(1);
  }

  async function removeItem(item: CtcaeItem) {
    const ok = await confirmFn(`Xoá thuật ngữ "${item.termVi || item.id}"?`, 'Hành động này không thể hoàn tác.');
    if (!ok) return;
    await fetch(`/api/admin/catalog/ctcae/${item.id}`, { method: 'DELETE' });
    toast.success('Đã xoá thuật ngữ.');
    load(page, q, soc);
  }

  async function clearAll() {
    const ok1 = await confirmFn(
      `Xoá TOÀN BỘ ${total} thuật ngữ trong danh mục Triệu chứng?`,
      'Hành động này không thể hoàn tác và sẽ xoá luôn các hướng dẫn xử trí liên kết.'
    );
    if (!ok1) return;
    const ok2 = await confirmFn('Xác nhận lần nữa: xoá sạch toàn bộ danh mục CTCAE?');
    if (!ok2) return;
    setClearing(true);
    await fetch('/api/admin/catalog/ctcae', { method: 'DELETE' });
    setClearing(false);
    setPage(1);
    toast.success('Đã xoá toàn bộ danh mục.');
    load(1, q, soc);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportResult(null);
    setImportFileName(file.name);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const rows = raw.map((r) => {
        const mapped: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(r)) {
          const field = COLUMN_ALIASES[normalizeHeader(key)];
          if (field) mapped[field] = typeof value === 'string' ? value.trim() : value;
        }
        if (mapped.order !== undefined && mapped.order !== '') {
          mapped.order = Number(mapped.order);
          if (Number.isNaN(mapped.order)) delete mapped.order;
        } else {
          delete mapped.order;
        }
        for (const f of ['socVi', 'termVi', 'grade1Vi', 'grade2Vi', 'grade3Vi', 'grade4Vi', 'grade5Vi', 'definitionVi', 'navigationalNoteVi']) {
          if (mapped[f] === '') delete mapped[f];
        }
        return mapped;
      }).filter((r) => r.socVi && r.termVi);

      if (rows.length === 0) {
        setImportError('Không tìm thấy dòng hợp lệ. Kiểm tra tên cột: Thứ tự, Phân loại cơ quan - Hệ thống SOC, Thuật ngữ, Độ 1..5, Định nghĩa, Ghi chú điều hướng.');
        setImportRows(null);
        return;
      }
      setImportRows(rows);
    } catch {
      setImportError('Không đọc được file Excel. Kiểm tra định dạng .xlsx.');
      setImportRows(null);
    }
  }

  async function runImport() {
    if (!importRows || importRows.length === 0) return;
    setImporting(true);
    setImportError(null);
    const res = await fetch('/api/admin/catalog/ctcae/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: importRows }),
    });
    const data = await res.json().catch(() => ({}));
    setImporting(false);
    if (!res.ok) {
      setImportError(data.error || 'Import thất bại.');
      return;
    }
    setImportResult(`Đã import ${data.imported} dòng.`);
    toast.success(`Đã import ${data.imported} dòng.`);
    setImportRows(null);
    setImportFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPage(1);
    load(1, q, soc);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className='sec-card'>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Nhập từ Excel</h2>
        </div>
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            Chấp nhận file .xlsx với các cột: Thứ tự, Phân loại cơ quan - Hệ thống SOC, Thuật ngữ, Độ 1, Độ 2, Độ 3, Độ 4, Độ 5, Định nghĩa, Ghi chú điều hướng.
          </div>
          <input ref={fileInputRef} type='file' accept='.xlsx,.xls' onChange={handleFile} />
          {importFileName && !importError && importRows && (
            <div style={{ fontSize: 12.5, color: 'var(--teal-deep)' }}>{importFileName}: tìm thấy {importRows.length} dòng hợp lệ, sẵn sàng import.</div>
          )}
          {importError && <div style={{ color: 'var(--red)', fontSize: 13 }}>{importError}</div>}
          {importResult && <div style={{ color: 'var(--teal-deep)', fontSize: 13 }}>{importResult}</div>}
          <div>
            <button type='button' className='addbtn' disabled={!importRows || importing} onClick={runImport}>
              {importing ? 'Đang import...' : `Import${importRows ? ' ' + importRows.length + ' dòng' : ''}`}
            </button>
          </div>
        </div>
      </section>

      <section className='sec-card' style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Danh sách ({total.toLocaleString('vi-VN')})</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Tìm theo tên thuật ngữ...' style={{ ...fieldStyle, width: 200 }} />
            <select value={soc} onChange={(e) => setSoc(e.target.value)} style={{ ...fieldStyle, width: 200 }}>
              <option value=''>Tất cả nhóm SOC ({socOptions.length})</option>
              {socOptions.filter((s) => s.socVi).map((s) => (
                <option key={s.socVi} value={s.socVi!}>{s.socVi}</option>
              ))}
            </select>
            <button type='button' className='ghostbtn' style={{ color: 'var(--red)' }} disabled={clearing || total === 0} onClick={clearAll}>
              {clearing ? 'Đang xoá...' : 'Xoá toàn bộ'}
            </button>
            <button type='button' className='addbtn' onClick={openCreate}>Thêm thuật ngữ</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr auto', gap: 12, padding: '12px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--ink-soft)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
          <div>Thứ tự</div>
          <div>Thuật ngữ</div>
          <div>Nhóm SOC</div>
          <div>Hành động</div>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Đang tải...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Chưa có thuật ngữ nào. Nhập từ Excel hoặc bấm &quot;Thêm thuật ngữ&quot;.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr auto', gap: 12, alignItems: 'center', padding: '12px 20px', fontSize: 13.5, borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ color: 'var(--ink-soft)' }}>{item.order ?? '—'}</div>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.termVi || <em style={{ color: 'var(--amber)' }}>Chưa đặt tên</em>}
              </div>
              <div style={{ color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.socVi || '—'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type='button' className='ghostbtn' onClick={() => openEdit(item)}>Sửa</button>
                <button type='button' className='ghostbtn' style={{ color: 'var(--red)' }} onClick={() => removeItem(item)}>Xóa</button>
              </div>
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

      {modalMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 20 }}>
          <div className='sec-card' style={{ width: 640, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 0 }}>{modalMode === 'create' ? 'Thêm thuật ngữ' : 'Sửa thông tin'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 12 }}>
              <div>
                <label className='field-label'>Thứ tự</label>
                <input value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} placeholder='1' style={fieldStyle} />
              </div>
              <div>
                <label className='field-label'>Phân loại cơ quan - Hệ thống SOC</label>
                <input value={form.socVi} onChange={(e) => setForm({ ...form, socVi: e.target.value })} style={fieldStyle} />
              </div>
              <div>
                <label className='field-label'>Thuật ngữ</label>
                <input value={form.termVi} onChange={(e) => setForm({ ...form, termVi: e.target.value })} style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 12 }}>
              {(['grade1Vi', 'grade2Vi', 'grade3Vi', 'grade4Vi', 'grade5Vi'] as const).map((key, i) => (
                <div key={key}>
                  <label className='field-label'>Độ {i + 1}</label>
                  <textarea rows={3} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ ...fieldStyle, resize: 'vertical' }} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <label className='field-label'>Định nghĩa</label>
              <textarea rows={2} value={form.definitionVi} onChange={(e) => setForm({ ...form, definitionVi: e.target.value })} style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label className='field-label'>Ghi chú điều hướng</label>
              <textarea rows={2} value={form.navigationalNoteVi} onChange={(e) => setForm({ ...form, navigationalNoteVi: e.target.value })} style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>

            {formError && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{formError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button type='button' className='ghostbtn' onClick={closeModal}>Hủy</button>
              <button type='button' className='addbtn' onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
