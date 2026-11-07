'use client';

import { useEffect, useRef, useState } from 'react';

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
  width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px',
  fontSize: 13, fontFamily: 'inherit', background: '#fff', resize: 'vertical',
};

type Draft = Pick<
  CtcaeItem,
  'order' | 'termVi' | 'socVi' | 'grade1Vi' | 'grade2Vi' | 'grade3Vi' | 'grade4Vi' | 'grade5Vi' | 'definitionVi' | 'navigationalNoteVi' | 'changeNoteVi'
>;

function draftFrom(item: CtcaeItem): Draft {
  return {
    order: item.order,
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

const EMPTY_MANUAL = {
  order: '', socVi: '', termVi: '', grade1Vi: '', grade2Vi: '', grade3Vi: '', grade4Vi: '', grade5Vi: '',
  definitionVi: '', navigationalNoteVi: '',
};

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
  const [items, setItems] = useState<CtcaeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [soc, setSoc] = useState('');
  const [socOptions, setSocOptions] = useState<{ soc: string | null; socVi: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSaving, setManualSaving] = useState(false);

  const [importRows, setImportRows] = useState<Record<string, unknown>[] | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clearing, setClearing] = useState(false);

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
    setSocOptions(data.socOptions || []);
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

  async function removeItem(id: string, label: string) {
    if (!confirm(`Xoá thuật ngữ "${label}"? Hành động này không thể hoàn tác.`)) return;
    await fetch(`/api/admin/catalog/ctcae/${id}`, { method: 'DELETE' });
    load();
  }

  async function clearAll() {
    if (!confirm(`Xoá TOÀN BỘ ${total} thuật ngữ trong danh mục Triệu chứng? Hành động này không thể hoàn tác và sẽ xoá luôn các hướng dẫn xử trí liên kết.`)) return;
    if (!confirm('Xác nhận lần nữa: xoá sạch toàn bộ danh mục CTCAE?')) return;
    setClearing(true);
    await fetch('/api/admin/catalog/ctcae', { method: 'DELETE' });
    setClearing(false);
    setPage(1);
    load();
  }

  async function addManual() {
    setManualError(null);
    if (!manual.socVi.trim() || !manual.termVi.trim()) {
      setManualError('Vui lòng nhập Nhóm SOC và Thuật ngữ.');
      return;
    }
    setManualSaving(true);
    const body = {
      order: manual.order.trim() ? Number(manual.order) : undefined,
      socVi: manual.socVi.trim(),
      termVi: manual.termVi.trim(),
      grade1Vi: manual.grade1Vi.trim() || undefined,
      grade2Vi: manual.grade2Vi.trim() || undefined,
      grade3Vi: manual.grade3Vi.trim() || undefined,
      grade4Vi: manual.grade4Vi.trim() || undefined,
      grade5Vi: manual.grade5Vi.trim() || undefined,
      definitionVi: manual.definitionVi.trim() || undefined,
      navigationalNoteVi: manual.navigationalNoteVi.trim() || undefined,
    };
    const res = await fetch('/api/admin/catalog/ctcae', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setManualSaving(false);
    if (!res.ok) {
      setManualError(data.error || 'Không thêm được.');
      return;
    }
    setManual(EMPTY_MANUAL);
    setPage(1);
    load();
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
    setImportRows(null);
    setImportFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPage(1);
    load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className='sec-card'>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tác dụng phụ (CTCAE)</h2>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
              {total} thuật ngữ trong danh mục.
            </div>
          </div>
          <button type='button' className='ghostbtn' style={{ color: 'var(--red)' }} disabled={clearing || total === 0} onClick={clearAll}>
            {clearing ? 'Đang xoá...' : 'Xoá toàn bộ danh mục'}
          </button>
        </div>
        <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr 260px auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label className='field-label'>Tìm kiếm</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
              placeholder='Tên thuật ngữ...'
            />
          </div>
          <div>
            <label className='field-label'>Nhóm SOC</label>
            <select value={soc} onChange={(e) => { setSoc(e.target.value); setPage(1); }} style={fieldStyle}>
              <option value=''>Tất cả ({socOptions.length} nhóm)</option>
              {socOptions.filter((s) => s.socVi).map((s) => (
                <option key={s.socVi} value={s.socVi!}>{s.socVi}</option>
              ))}
            </select>
          </div>
          <button type='button' className='addbtn' style={{ height: 38 }} onClick={search}>
            Tìm
          </button>
        </div>
      </section>

      <section className='sec-card'>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Nhập từ Excel</h2>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
            File .xlsx với các cột: Thứ tự, Phân loại cơ quan - Hệ thống SOC, Thuật ngữ, Độ 1, Độ 2, Độ 3, Độ 4, Độ 5, Định nghĩa, Ghi chú điều hướng.
          </div>
        </div>
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input ref={fileInputRef} type='file' accept='.xlsx,.xls' onChange={handleFile} />
          {importFileName && !importError && importRows && (
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              {importFileName}: tìm thấy {importRows.length} dòng hợp lệ, sẵn sàng import.
            </div>
          )}
          {importError && <div style={{ color: 'var(--red)', fontSize: 13 }}>{importError}</div>}
          {importResult && <div style={{ color: 'var(--teal-deep)', fontSize: 13 }}>{importResult}</div>}
          <div>
            <button type='button' className='addbtn' disabled={!importRows || importing} onClick={runImport}>
              {importing ? 'Đang import...' : `Import ${importRows ? importRows.length + ' dòng' : ''}`}
            </button>
          </div>
        </div>
      </section>

      <section className='sec-card'>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Nhập thủ công</h2>
        </div>
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 12 }}>
            <div>
              <label className='field-label'>Thứ tự</label>
              <input value={manual.order} onChange={(e) => setManual({ ...manual, order: e.target.value })} placeholder='1' />
            </div>
            <div>
              <label className='field-label'>Phân loại cơ quan - Hệ thống SOC</label>
              <input value={manual.socVi} onChange={(e) => setManual({ ...manual, socVi: e.target.value })} />
            </div>
            <div>
              <label className='field-label'>Thuật ngữ</label>
              <input value={manual.termVi} onChange={(e) => setManual({ ...manual, termVi: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {(['grade1Vi', 'grade2Vi', 'grade3Vi', 'grade4Vi', 'grade5Vi'] as const).map((key, i) => (
              <div key={key}>
                <label className='field-label'>Độ {i + 1}</label>
                <textarea rows={2} value={manual[key]} onChange={(e) => setManual({ ...manual, [key]: e.target.value })} style={fieldStyle} />
              </div>
            ))}
          </div>
          <div>
            <label className='field-label'>Định nghĩa</label>
            <textarea rows={2} value={manual.definitionVi} onChange={(e) => setManual({ ...manual, definitionVi: e.target.value })} style={fieldStyle} />
          </div>
          <div>
            <label className='field-label'>Ghi chú điều hướng</label>
            <textarea rows={2} value={manual.navigationalNoteVi} onChange={(e) => setManual({ ...manual, navigationalNoteVi: e.target.value })} style={fieldStyle} />
          </div>
          {manualError && <div style={{ color: 'var(--red)', fontSize: 13 }}>{manualError}</div>}
          <div>
            <button type='button' className='addbtn' disabled={manualSaving} onClick={addManual}>
              {manualSaving ? 'Đang thêm...' : 'Thêm thuật ngữ'}
            </button>
          </div>
        </div>
      </section>

      <section className='sec-card' style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid', gridTemplateColumns: '70px 1fr 1fr auto', gap: 12, padding: '12px 20px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--ink-soft)',
            textTransform: 'uppercase', borderBottom: '1px solid var(--line)',
          }}
        >
          <div>Thứ tự</div>
          <div>Thuật ngữ</div>
          <div>Nhóm SOC</div>
          <div>Hành động</div>
        </div>

        {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Đang tải...</div>}
        {!loading && items.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>Chưa có thuật ngữ nào trong danh mục. Nhập từ Excel hoặc thêm thủ công ở trên.</div>
        )}

        {!loading && items.map((item) => (
          <div key={item.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr auto', gap: 12, alignItems: 'center', padding: '12px 20px', fontSize: 13.5 }}>
              <div style={{ color: 'var(--ink-soft)' }}>{item.order ?? '—'}</div>
              <div style={{ fontWeight: 600 }}>{item.termVi || <em style={{ color: 'var(--amber)' }}>Chưa đặt tên</em>}</div>
              <div style={{ color: 'var(--ink-soft)' }}>{item.socVi || '—'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type='button' className='ghostbtn' onClick={() => (openId === item.id ? setOpenId(null) : openEdit(item))}>
                  {openId === item.id ? 'Đóng' : 'Sửa'}
                </button>
                <button type='button' className='ghostbtn' style={{ color: 'var(--red)' }} onClick={() => removeItem(item.id, item.termVi || item.id)}>
                  Xoá
                </button>
              </div>
            </div>

            {openId === item.id && draft && (
              <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className='field-label'>Thứ tự</label>
                    <input
                      value={draft.order ?? ''}
                      onChange={(e) => setDraft({ ...draft, order: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <label className='field-label'>Thuật ngữ</label>
                    <input value={draft.termVi || ''} onChange={(e) => setDraft({ ...draft, termVi: e.target.value })} />
                  </div>
                  <div>
                    <label className='field-label'>Nhóm SOC</label>
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
                <div>
                  <label className='field-label'>Ghi chú điều hướng</label>
                  <textarea rows={2} value={draft.navigationalNoteVi || ''} onChange={(e) => setDraft({ ...draft, navigationalNoteVi: e.target.value })} style={fieldStyle} />
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
