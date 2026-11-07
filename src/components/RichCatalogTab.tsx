'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast, useConfirm } from '@/components/UIFeedback';

export interface RichFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

type Item = { id: string; [key: string]: unknown };

const fieldStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', background: '#fff',
};

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function RichCatalogTab({
  apiBase,
  addLabel,
  fields,
  listColumns,
  searchPlaceholder,
  importColumnAliases,
  importHint,
}: {
  apiBase: string;
  addLabel: string;
  /** Toàn bộ trường hiển thị trong modal Thêm/Sửa. */
  fields: RichFieldDef[];
  /** Tập con hiển thị làm cột trong bảng danh sách (nên để 2-3 trường). */
  listColumns: RichFieldDef[];
  searchPlaceholder: string;
  /** Map tiêu đề cột Excel (đã chuẩn hoá chữ thường) -> field key, dùng khi import. */
  importColumnAliases?: Record<string, string>;
  importHint?: string;
}) {
  const toast = useToast();
  const confirmFn = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [importRows, setImportRows] = useState<Record<string, unknown>[] | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function load(p = page, q = search) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`${apiBase}?${params.toString()}`);
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

  function openCreate() {
    setDraft({});
    setFormError(null);
    setModalMode('create');
  }

  function openEdit(it: Item) {
    setDraft(Object.fromEntries(fields.map((f) => [f.key, (it[f.key] as string) || ''])));
    setEditingId(it.id);
    setFormError(null);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
  }

  async function save() {
    if (!draft.name?.trim()) {
      setFormError('Vui lòng nhập tên.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const res = modalMode === 'create'
      ? await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      : await fetch(`${apiBase}/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFormError(data.error || 'Không lưu được.');
      return;
    }
    toast.success(modalMode === 'create' ? 'Đã thêm mục mới.' : 'Đã lưu thay đổi.');
    closeModal();
    load(modalMode === 'create' ? 1 : page, search);
    if (modalMode === 'create') setPage(1);
  }

  async function remove(it: Item) {
    const ok = await confirmFn(`Xoá "${it.name as string}"?`, 'Hành động này không thể hoàn tác.');
    if (!ok) return;
    const res = await fetch(`${apiBase}/${it.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Không xoá được.');
      return;
    }
    toast.success('Đã xoá.');
    load(page, search);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !importColumnAliases) return;
    setImportError(null);
    setImportResult(null);
    setImportFileName(file.name);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const rows = raw
        .map((r) => {
          const mapped: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(r)) {
            const field = importColumnAliases![normalizeHeader(key)];
            if (field) mapped[field] = typeof value === 'string' ? value.trim() : value;
          }
          for (const f of fields) {
            if (mapped[f.key] === '') delete mapped[f.key];
          }
          return mapped;
        })
        .filter((r) => r.name);

      if (rows.length === 0) {
        setImportError('Không tìm thấy dòng hợp lệ nào (cần ít nhất cột Tên).');
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
    const res = await fetch(`${apiBase}/import`, {
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
    setImportResult(`Đã import ${data.imported} dòng mới${data.skipped ? ` (bỏ qua ${data.skipped} dòng trùng tên)` : ''}.`);
    toast.success(`Đã import ${data.imported} dòng.`);
    setImportRows(null);
    setImportFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPage(1);
    load(1, search);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {importColumnAliases && (
        <section className='sec-card'>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Nhập từ Excel</h2>
          </div>
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {importHint && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{importHint}</div>}
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
      )}

      <section className='sec-card' style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Danh sách ({total.toLocaleString('vi-VN')})</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} style={{ ...fieldStyle, width: 220 }} />
            <button type='button' className='addbtn' onClick={openCreate}>{addLabel}</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${listColumns.length}, minmax(0,1fr)) auto`, gap: 12, padding: '12px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--ink-soft)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
          {listColumns.map((c) => <div key={c.key}>{c.label}</div>)}
          <div>Hành động</div>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Đang tải...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Chưa có mục nào.</div>
        ) : (
          items.map((it) => (
            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: `repeat(${listColumns.length}, minmax(0,1fr)) auto`, gap: 12, alignItems: 'center', padding: '12px 20px', fontSize: 13.5, borderBottom: '1px solid var(--line-soft)' }}>
              {listColumns.map((c, i) => (
                <div key={c.key} style={{ fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'var(--ink)' : 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(it[c.key] as string) || '—'}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type='button' className='ghostbtn' onClick={() => openEdit(it)}>Sửa</button>
                <button type='button' className='ghostbtn' style={{ color: 'var(--red)' }} onClick={() => remove(it)}>Xóa</button>
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
          <div className='sec-card' style={{ width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 0 }}>{modalMode === 'create' ? addLabel : 'Sửa thông tin'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fields.map((f) => (
                <div key={f.key} style={f.multiline ? { gridColumn: '1 / -1' } : undefined}>
                  <label className='field-label'>{f.label}</label>
                  {f.multiline ? (
                    <textarea
                      rows={3}
                      value={draft[f.key] || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ ...fieldStyle, resize: 'vertical' }}
                    />
                  ) : (
                    <input
                      value={draft[f.key] || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={fieldStyle}
                    />
                  )}
                </div>
              ))}
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
