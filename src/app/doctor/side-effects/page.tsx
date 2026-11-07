'use client';

import { useEffect, useMemo, useState } from 'react';
import { gradeStyle, gradeLabel } from '@/lib/ctcaeGrade';
import { useToast } from '@/components/UIFeedback';

const GRADES = [1, 2, 3, 4, 5];
const DECISIONS = [
  { value: 'NO_CHANGE', label: 'Không thay đổi' },
  { value: 'HOLD', label: 'Hoãn chu kỳ' },
  { value: 'REDUCE', label: 'Giảm liều' },
];

type Sheet = { managementNote: string; outcome: string; regimenDecision: string; decisionReason: string };

const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', padding: '10px 14px', borderBottom: '1px solid var(--line)',
};

const fieldStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', background: '#fff',
};

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');

function severityStyle(severity?: string | null): React.CSSProperties {
  if (severity === 'Nặng') return { background: 'var(--red-tint)', color: 'var(--red)' };
  if (severity === 'Trung bình') return { background: 'var(--amber-tint)', color: 'var(--amber)' };
  return { background: 'var(--bg)', color: 'var(--ink-soft)' };
}

function sheetFrom(r: any): Sheet {
  return {
    managementNote: r.managementNote || '',
    outcome: r.outcome || '',
    regimenDecision: r.regimenDecision || 'NO_CHANGE',
    decisionReason: r.decisionReason || '',
  };
}

function CtcaeCatalogSearch() {
  const [q, setQ] = useState('');
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function search(query: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    const res = await fetch('/api/doctor/ctcae?' + params.toString());
    const data = await res.json();
    setTerms(data.terms || []);
    setLoading(false);
  }

  return (
    <section className='sec-card'>
      <div className='sec-head' style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Danh mục tác dụng phụ (CTCAE)</h2>
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Tra cứu phân độ theo thuật ngữ</span>
      </div>
      <div style={{ padding: '14px 22px' }}>
        <input
          type='text'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(q); }}
          placeholder='Nhập tên triệu chứng (VD: buồn nôn, viêm da, sốt...) rồi Enter'
          style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }}
        />
      </div>
      {loading && <div style={{ padding: '0 22px 16px', color: 'var(--ink-soft)', fontSize: 13 }}>Đang tìm...</div>}
      {!loading && terms.length > 0 && (
        <div style={{ padding: '0 22px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {terms.map((t) => (
            <div key={t.id} style={{ border: '1px solid var(--line-soft)', borderRadius: 10, padding: '10px 14px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setOpenId(openId === t.id ? null : t.id)}
              >
                <div>
                  <strong style={{ fontSize: 13.5 }}>{t.termVi || t.term}</strong>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginLeft: 8 }}>{t.socVi || t.soc}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--teal)' }}>{openId === t.id ? 'Thu gọn' : 'Xem độ 1-5'}</span>
              </div>
              {openId === t.id && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((g) => {
                    const text = (t as any)[`grade${g}Vi`] || (t as any)[`grade${g}`];
                    if (!text) return null;
                    return (
                      <div key={g} style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
                        <span className='pill' style={{ ...gradeStyle(g), flexShrink: 0, height: 'fit-content' }}>Độ {g}</span>
                        <span style={{ color: 'var(--ink-soft)' }}>{text}</span>
                      </div>
                    );
                  })}
                  {t.definitionVi && (
                    <div style={{ fontSize: 12.5, marginTop: 4, fontStyle: 'italic', color: 'var(--ink-soft)' }}>{t.definitionVi}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && q && terms.length === 0 && (
        <div style={{ padding: '0 22px 18px', color: 'var(--ink-soft)', fontSize: 13 }}>Không tìm thấy thuật ngữ phù hợp.</div>
      )}
    </section>
  );
}

const ALERT_SEVERITY_STYLE: Record<string, React.CSSProperties> = {
  HIGH: { background: 'var(--red-tint)', color: 'var(--red)' },
  MEDIUM: { background: 'var(--amber-tint)', color: 'var(--amber)' },
  LOW: { background: 'var(--bg)', color: 'var(--ink-soft)' },
};
const ALERT_SEVERITY_LABEL: Record<string, string> = { HIGH: 'Mức cao', MEDIUM: 'Mức trung bình', LOW: 'Mức thấp' };

function AiAlertsPanel() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/doctor/alerts', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    setAlerts((data.alerts || []).filter((a: any) => a.status === 'PENDING'));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(alertId: string, status: 'CONFIRMED' | 'DISMISSED') {
    setError(null);
    setBusyId(alertId);
    const res = await fetch('/api/doctor/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, status, note: noteDrafts[alertId]?.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setError(data.error || 'Không xử lý được cảnh báo.');
      toast.error(data.error || 'Không xử lý được cảnh báo.');
      return;
    }
    toast.success(status === 'CONFIRMED' ? 'Đã xác nhận cảnh báo.' : 'Đã bỏ qua cảnh báo.');
    await load();
  }

  return (
    <section className='sec-card'>
      <div className='sec-head' style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Cảnh báo AI</h2>
        <span className='pill' style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}>Gợi ý, chờ BS xác nhận</span>
      </div>
      {loading ? (
        <div style={{ padding: '16px 22px', fontSize: 14, color: 'var(--ink-soft)' }}>Đang tải...</div>
      ) : alerts.length === 0 ? (
        <div style={{ padding: '16px 22px', fontSize: 14, color: 'var(--ink-soft)' }}>
          Chưa có cảnh báo nào. Khi có xu hướng bất thường, gợi ý sẽ hiển thị tại đây để bác sĩ xác nhận.
        </div>
      ) : (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((a) => (
            <div key={a.id} style={{ border: '1px solid var(--red)', borderRadius: 10, padding: 14, background: '#fff5f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <strong style={{ fontSize: 14 }}>{a.patient?.user?.name || 'Bệnh nhân'}</strong>
                <span className='pill' style={ALERT_SEVERITY_STYLE[a.severity] || {}}>{ALERT_SEVERITY_LABEL[a.severity] || a.severity}</span>
              </div>
              <div style={{ fontSize: 13.5, marginTop: 6 }}>{a.message}</div>
              <input
                type='text'
                value={noteDrafts[a.id] || ''}
                onChange={(e) => setNoteDrafts((m) => ({ ...m, [a.id]: e.target.value }))}
                placeholder='Ghi chú khi xác nhận/bỏ qua (tuỳ chọn)'
                style={{ width: '100%', marginTop: 8, border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type='button' className='addbtn' style={{ fontSize: 12, padding: '6px 12px' }} disabled={busyId === a.id} onClick={() => decide(a.id, 'CONFIRMED')}>
                  Xác nhận
                </button>
                <button type='button' className='ghostbtn' style={{ fontSize: 12, padding: '6px 12px' }} disabled={busyId === a.id} onClick={() => decide(a.id, 'DISMISSED')}>
                  Bỏ qua
                </button>
              </div>
            </div>
          ))}
          {error && <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}
        </div>
      )}
    </section>
  );
}

function GuidelinePanel({ symptom, grade }: { symptom: string; grade: number | null }) {
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symptom) return;
    setLoading(true);
    const params = new URLSearchParams({ symptom });
    if (grade) params.set('grade', String(grade));
    fetch('/api/doctor/guidelines?' + params.toString())
      .then((r) => r.json())
      .then((data) => {
        const all = (data.terms || []).flatMap((t: any) => t.guidelines.map((g: any) => ({ ...g, termName: t.termVi || t.term, soc: t.socVi || t.soc })));
        setGuidelines(all);
      })
      .finally(() => setLoading(false));
  }, [symptom, grade]);

  if (loading) return <div style={{ fontSize: 13, color: 'var(--ink-soft)', padding: 8 }}>Đang tra cứu hướng dẫn...</div>;
  if (guidelines.length === 0) return <div style={{ fontSize: 13, color: 'var(--ink-soft)', padding: 8 }}>Chưa có hướng dẫn xử trí cho triệu chứng này.</div>;

  const modalityLabel: Record<string, string> = { CHEMO: 'Hóa trị', RADIATION: 'Xạ trị', TARGETED: 'Đích', IMMUNOTHERAPY: 'Miễn dịch', HORMONAL: 'Nội tiết', ALL: 'Chung' };
  const actionColor: Record<string, React.CSSProperties> = {
    CONTINUE: { background: 'var(--teal-tint)', color: 'var(--teal-deep)' },
    MONITOR: { background: 'var(--amber-tint)', color: 'var(--amber)' },
    HOLD: { background: 'var(--red-tint)', color: 'var(--red)' },
    REDUCE: { background: 'var(--purple-tint)', color: 'var(--purple)' },
    STOP: { background: '#fde8e8', color: '#991b1b' },
  };
  const actionLabel: Record<string, string> = { CONTINUE: 'Tiếp tục', MONITOR: 'Theo dõi', HOLD: 'Hoãn', REDUCE: 'Giảm liều', STOP: 'Ngưng' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {guidelines.map((g, i) => (
        <div key={i} style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className='pill' style={gradeStyle(g.grade)}>Độ {g.grade}</span>
            <span className='pill' style={{ background: '#e8f4f8', color: '#1a5276' }}>{modalityLabel[g.modality] || g.modality}</span>
            {g.regimenAction && <span className='pill' style={actionColor[g.regimenAction] || {}}>{actionLabel[g.regimenAction] || g.regimenAction}</span>}
          </div>
          <div style={{ marginBottom: 4 }}><strong>Đánh giá:</strong> {g.assessment}</div>
          <div style={{ marginBottom: 4 }}><strong>Xử trí:</strong> {g.management}</div>
          {g.medication && <div style={{ marginBottom: 4 }}><strong>Thuốc:</strong> {g.medication}</div>}
          {g.referral && <div style={{ marginBottom: 4 }}><strong>Chuyển khoa:</strong> {g.referral}</div>}
          {g.patientAdvice && <div style={{ color: 'var(--teal-deep)', fontStyle: 'italic' }}>Lời khuyên BN: {g.patientAdvice}</div>}
        </div>
      ))}
    </div>
  );
}

export default function DoctorSideEffectsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSheets, setOpenSheets] = useState<Record<string, boolean>>({});
  const [sheets, setSheets] = useState<Record<string, Sheet>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showGuide, setShowGuide] = useState<Record<string, boolean>>({});
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
  const [termByName, setTermByName] = useState<Record<string, any>>({});
  const [visibleCount, setVisibleCount] = useState(20);

  async function toggleDetails(r: any) {
    const next = !detailsOpen[r.id];
    setDetailsOpen((o) => ({ ...o, [r.id]: next }));
    if (next && r.symptom && !termByName[r.symptom]) {
      const res = await fetch('/api/doctor/ctcae?q=' + encodeURIComponent(r.symptom));
      const data = await res.json().catch(() => ({ terms: [] }));
      const match = (data.terms || []).find((t: any) => t.termVi === r.symptom) || (data.terms || [])[0];
      if (match) setTermByName((m) => ({ ...m, [r.symptom]: match }));
    }
  }

  async function loadReports() {
    setLoading(true);
    const res = await fetch('/api/doctor/side-effects', { cache: 'no-store' });
    const data = await res.json();
    const list: any[] = data.reports || [];
    setReports(list);
    setSheets(Object.fromEntries(list.map((r) => [r.id, sheetFrom(r)])));
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function patch(reportId: string, body: Record<string, unknown>) {
    setErrors((e) => ({ ...e, [reportId]: '' }));
    const res = await fetch('/api/doctor/side-effects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors((e) => ({ ...e, [reportId]: data.error || 'Không lưu được.' }));
      return false;
    }
    await loadReports();
    return true;
  }

  async function saveSheet(r: any) {
    const s = sheets[r.id];
    if (!s) return;
    if (s.regimenDecision !== 'NO_CHANGE' && !s.decisionReason.trim()) {
      setErrors((e) => ({ ...e, [r.id]: 'Vui lòng nhập lý do khi hoãn chu kỳ hoặc giảm liều.' }));
      return;
    }
    const ok = await patch(r.id, { sheet: s });
    if (ok) {
      setOpenSheets((o) => ({ ...o, [r.id]: false }));
      toast.success('Đã lưu phiếu xử trí.');
    }
  }

  // Nhóm báo cáo theo bệnh nhân để hiển thị ô theo dõi.
  const monitors = useMemo(() => {
    const byPatient = new Map<string, { name: string; pending: number; severe: number; monitorMore: number; latest: string }>();
    for (const r of reports) {
      const key = r.patient?.id || r.id;
      const cur = byPatient.get(key) || {
        name: r.patient?.user?.name || 'Bệnh nhân',
        pending: 0,
        severe: 0,
        monitorMore: 0,
        latest: r.symptom,
      };
      if (r.status === 'PENDING') cur.pending++;
      if ((r.ctcaeGrade ?? 0) >= 3 || r.severity === 'Nặng') cur.severe++;
      if (r.monitorMore) cur.monitorMore++;
      byPatient.set(key, cur);
    }
    return Array.from(byPatient.values());
  }, [reports]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Theo dõi tác dụng phụ</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Phân độ CTCAE, lập phiếu xử trí, quyết định hoãn/giảm liều.
        </div>
      </div>

      <AiAlertsPanel />

      <CtcaeCatalogSearch />

      {/* Ô giám sát theo bệnh nhân */}
      <section>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Bệnh nhân đang giám sát tác dụng phụ</div>
        {monitors.length === 0 ? (
          <div className='sec-card' style={{ padding: 22, color: 'var(--ink-soft)' }}>
            {loading ? 'Đang tải...' : 'Chưa có bệnh nhân nào báo cáo tác dụng phụ.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {monitors.map((m) => (
              <div key={m.name + m.latest} className='sec-card' style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Gần nhất: {m.latest}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className='pill' style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}>Chờ xử trí {m.pending}</span>
                  <span className='pill' style={{ background: 'var(--red-tint)', color: 'var(--red)' }}>Mức nặng {m.severe}</span>
                  {m.monitorMore > 0 && (
                    <span className='pill' style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}>Theo dõi thêm {m.monitorMore}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Báo cáo triệu chứng */}
      <section className='sec-card'>
        <div className='sec-head' style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Báo cáo triệu chứng</h2>
          <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{reports.length} báo cáo</span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--ink-soft)', padding: 22 }}>Đang tải...</div>
        ) : reports.length === 0 ? (
          <div style={{ color: 'var(--ink-soft)', padding: 22 }}>Hiện không có báo cáo tác dụng phụ nào.</div>
        ) : (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reports.slice(0, visibleCount).map((r) => {
              const resolved = r.status === 'RESOLVED';
              const open = !!openSheets[r.id];
              const s = sheets[r.id] || sheetFrom(r);
              const isOpen = !!detailsOpen[r.id];
              const term = r.symptom ? termByName[r.symptom] : null;
              return (
                <div key={r.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
                  <div
                    onClick={() => toggleDetails(r)}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <strong style={{ fontSize: 15 }}>{r.patient?.user?.name || 'Bệnh nhân'}</strong>
                      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3, fontFamily: 'ui-monospace, monospace' }}>
                        {fmtDate(r.createdAt)} · {r.symptom}
                        {r.photoSignedUrl && <span title='Có ảnh đính kèm'> · 📷</span>}
                      </div>
                      {r.site && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{r.site}</div>}
                      {r.note && <div style={{ fontSize: 13, marginTop: 4 }}>&quot;{r.note}&quot;</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {r.ctcaeGrade ? (
                        <span className='pill' style={gradeStyle(r.ctcaeGrade)}>{gradeLabel(r.ctcaeGrade)}</span>
                      ) : (
                        <span className='pill' style={severityStyle(r.severity)}>{r.severity || 'Nhẹ'} (tự đánh giá)</span>
                      )}
                      <span
                        className='pill'
                        style={resolved ? { background: 'var(--teal-tint)', color: 'var(--teal-deep)' } : { background: 'var(--amber-tint)', color: 'var(--amber)' }}
                      >
                        {resolved ? 'Đã xử trí' : 'Chờ xử trí'}
                      </span>
                      {r.monitorMore && <span className='pill' style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}>Theo dõi thêm</span>}
                      <span style={{ fontSize: 16, color: 'var(--ink-soft)' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {r.photoSignedUrl && (
                        <a href={r.photoSignedUrl} target='_blank' rel='noreferrer' style={{ display: 'inline-block' }}>
                          <img src={r.photoSignedUrl} alt='Ảnh tác dụng phụ' style={{ maxWidth: 260, maxHeight: 200, borderRadius: 8, border: '1px solid var(--line)', objectFit: 'cover' }} />
                        </a>
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Phân độ CTCAE</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {GRADES.map((g) => {
                            const defText = term ? term[`grade${g}Vi`] : null;
                            const selected = r.ctcaeGrade === g;
                            return (
                              <label
                                key={g}
                                style={{
                                  display: 'flex', gap: 8, alignItems: 'flex-start', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, cursor: 'pointer',
                                  border: selected ? `2px solid ${gradeStyle(g).color as string}` : '1px solid var(--line)',
                                  background: selected ? (gradeStyle(g).background as string) : '#fff',
                                }}
                              >
                                <input
                                  type='radio'
                                  name={`grade-${r.id}`}
                                  checked={selected}
                                  onChange={() => patch(r.id, { status: r.status, ctcaeGrade: g })}
                                  style={{ marginTop: 2 }}
                                />
                                <span>
                                  <strong>Độ {g}</strong>
                                  {defText && <span style={{ color: 'var(--ink-soft)' }}> — {defText}</span>}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type='button'
                        className='ghostbtn'
                        style={{
                          fontSize: 12, padding: '7px 14px',
                          color: r.monitorMore ? 'var(--purple)' : 'var(--ink-soft)',
                          borderColor: r.monitorMore ? 'var(--purple)' : 'var(--line)',
                        }}
                        onClick={() => patch(r.id, { monitorMore: !r.monitorMore })}
                      >
                        {r.monitorMore ? 'Đang theo dõi thêm' : 'Theo dõi thêm'}
                      </button>
                      <button
                        type='button'
                        className={open ? 'ghostbtn' : 'addbtn'}
                        style={{ fontSize: 12, padding: '7px 14px' }}
                        onClick={() => setOpenSheets((o) => ({ ...o, [r.id]: !open }))}
                      >
                        {open ? 'Thu gọn phiếu' : resolved ? 'Xem phiếu xử trí' : 'Lập phiếu xử trí'}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Phiếu xử trí tác dụng phụ</div>
                        <button
                          type='button'
                          className='ghostbtn'
                          style={{ fontSize: 12, padding: '5px 12px', color: 'var(--teal)', borderColor: 'var(--teal)' }}
                          onClick={() => setShowGuide((g) => ({ ...g, [r.id]: !g[r.id] }))}
                        >
                          {showGuide[r.id] ? 'Ẩn hướng dẫn' : '📋 Tra cứu hướng dẫn xử trí'}
                        </button>
                      </div>
                      {showGuide[r.id] && (
                        <div style={{ border: '1px solid var(--teal)', borderRadius: 12, padding: 14, background: '#f0faf8' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--teal-deep)' }}>
                            Hướng dẫn xử trí — {r.symptom} {r.ctcaeGrade ? `(${gradeLabel(r.ctcaeGrade)})` : ''}
                          </div>
                          <GuidelinePanel symptom={r.symptom} grade={r.ctcaeGrade} />
                        </div>
                      )}
                      <div>
                        <label className='field-label'>Biện pháp xử trí, can thiệp</label>
                        <textarea
                          rows={2}
                          value={s.managementNote}
                          onChange={(e) => setSheets((m) => ({ ...m, [r.id]: { ...s, managementNote: e.target.value } }))}
                          placeholder='VD: Hạ sốt bằng Paracetamol, bù dịch, theo dõi sát'
                          style={{ ...fieldStyle, resize: 'vertical' }}
                        />
                      </div>
                      <div>
                        <label className='field-label'>Kết quả sau can thiệp</label>
                        <textarea
                          rows={2}
                          value={s.outcome}
                          onChange={(e) => setSheets((m) => ({ ...m, [r.id]: { ...s, outcome: e.target.value } }))}
                          placeholder='VD: Hết sốt sau 6 giờ, bệnh nhân ổn định'
                          style={{ ...fieldStyle, resize: 'vertical' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        <div>
                          <label className='field-label'>Quyết định phác đồ</label>
                          <select
                            value={s.regimenDecision}
                            onChange={(e) => setSheets((m) => ({ ...m, [r.id]: { ...s, regimenDecision: e.target.value } }))}
                            style={fieldStyle}
                          >
                            {DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className='field-label'>Lý do (bắt buộc nếu hoãn chu kỳ / giảm liều)</label>
                          <input
                            type='text'
                            value={s.decisionReason}
                            onChange={(e) => setSheets((m) => ({ ...m, [r.id]: { ...s, decisionReason: e.target.value } }))}
                            placeholder='VD: Giảm bạch cầu độ 3'
                            style={fieldStyle}
                          />
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: 'var(--ink-soft)' }}>
                        Chọn &quot;Hoãn chu kỳ&quot; hoặc &quot;Giảm liều&quot; sẽ ghi nhận quyết định vào phiếu này. Việc cập nhật phác đồ và thông báo cho bệnh nhân chưa được tự động hoá.
                      </div>
                      {errors[r.id] && <div style={{ color: 'var(--red)', fontSize: 13 }}>{errors[r.id]}</div>}
                      <div>
                        <button type='button' className='addbtn' onClick={() => saveSheet(r)}>Lưu phiếu xử trí</button>
                      </div>
                    </div>
                  )}
                  {!open && errors[r.id] && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{errors[r.id]}</div>}
                </div>
              );
            })}
            {visibleCount < reports.length && (
              <div style={{ textAlign: 'center' }}>
                <button type='button' className='ghostbtn' onClick={() => setVisibleCount((n) => n + 20)}>
                  Tải thêm ({reports.length - visibleCount} báo cáo còn lại)
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
