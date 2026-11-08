'use client';

import { useEffect, useState } from 'react';

const fieldStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', background: '#fff',
};

export type CancerTypeOption = { id: string; name: string; stage: string | null };

/** Chọn chính xác một mục trong danh mục Loại ung thư (lưu cancerTypeId để thống kê/báo cáo theo đúng danh mục chuẩn). */
export function CancerTypePicker({ label, value, onSelect }: { label: string; value: CancerTypeOption | null; onSelect: (v: CancerTypeOption | null) => void }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<CancerTypeOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value || query.trim().length < 1) {
      setOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch('/api/doctor/cancer-types/search?q=' + encodeURIComponent(query.trim()));
      const data = await res.json().catch(() => ({ cancerTypes: [] }));
      setOptions(data.cancerTypes || []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, value]);

  if (value) {
    return (
      <div>
        <label className="field-label">{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px', background: 'var(--teal-tint)' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--teal-deep)', flex: 1 }}>
            {value.name}{value.stage ? ` · ${value.stage}` : ''}
          </span>
          <button type="button" onClick={() => { onSelect(null); setQuery(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 14 }}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <label className="field-label">{label}</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => options.length > 0 && setOpen(true)}
        placeholder="Tìm trong danh mục Loại ung thư..."
        style={fieldStyle}
      />
      {open && options.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 20, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--line)', borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
          {options.map((o) => (
            <div
              key={o.id}
              onClick={() => { onSelect(o); setOpen(false); }}
              onMouseDown={(e) => e.preventDefault()}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
            >
              <strong>{o.name}</strong>
              {o.stage && <span style={{ color: 'var(--ink-soft)', marginLeft: 6 }}>· {o.stage}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ô nhập "Phác đồ" có gợi ý từ danh mục chuẩn — vẫn lưu dạng text (không đổi cấu trúc dữ liệu JSON hiện có) nhưng khuyến khích đặt đúng tên trong danh mục để số liệu thống kê nhất quán. */
export function RegimenSuggestInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [options, setOptions] = useState<{ id: string; name: string; primarySite: string | null }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      setOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch('/api/doctor/regimens/search?q=' + encodeURIComponent(value.trim()));
      const data = await res.json().catch(() => ({ regimens: [] }));
      setOptions(data.regimens || []);
    }, 250);
    return () => clearTimeout(handle);
  }, [value]);

  return (
    <div style={{ position: 'relative' }}>
      <label className="field-label">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Nhập tên phác đồ, ví dụ FOLFOX..."
      />
      {open && options.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 20, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--line)', borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
          {options.map((o) => (
            <div
              key={o.id}
              onClick={() => { onChange(o.name); setOpen(false); }}
              onMouseDown={(e) => e.preventDefault()}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
            >
              <strong>{o.name}</strong>
              {o.primarySite && <span style={{ color: 'var(--ink-soft)', marginLeft: 6 }}>· {o.primarySite}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ô nhập tên thuốc có gợi ý từ danh mục Thuốc (admin) — vẫn lưu dạng text tự do, chỉ gợi ý để dùng đúng tên chuẩn. Không có label riêng, dùng để chèn thẳng vào lưới đơn thuốc hiện có. */
export function DrugNameSuggestInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [options, setOptions] = useState<{ id: string; name: string; group: string | null }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      setOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch('/api/doctor/medications/search?q=' + encodeURIComponent(value.trim()));
      const data = await res.json().catch(() => ({ drugs: [] }));
      setOptions(data.drugs || []);
    }, 250);
    return () => clearTimeout(handle);
  }, [value]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || 'Tên thuốc'}
      />
      {open && options.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 20, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--line)', borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
          {options.map((o) => (
            <div
              key={o.id}
              onClick={() => { onChange(o.name); setOpen(false); }}
              onMouseDown={(e) => e.preventDefault()}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
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
