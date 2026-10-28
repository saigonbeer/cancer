'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Trạng thái form lượt khám
  const [visitType, setVisitType] = useState<'FIRST' | 'FOLLOWUP'>('FIRST');
  const [diagnosis, setDiagnosis] = useState('');
  const [history, setHistory] = useState('');
  const [illness, setIllness] = useState('');
  const [examination, setExamination] = useState('');
  const [labResults, setLabResults] = useState('');
  const [progress, setProgress] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [chemoOn, setChemoOn] = useState(false);
  const [surgeryOn, setSurgeryOn] = useState(false);
  const [radioOn, setRadioOn] = useState(false);

  // Trạng thái form đơn thuốc
  const [currentVisitId, setCurrentVisitId] = useState('');
  const [drugName, setDrugName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState('2 lần/ngày');
  const [duration, setDuration] = useState('7 ngày');
  const [items, setItems] = useState<any[]>([]);
  const [interactionWarnings, setInteractionWarnings] = useState<any[]>([]);

  // Trạng thái tìm kiếm và form bệnh nhân
  const [query, setQuery] = useState('');
  const [patientModal, setPatientModal] = useState<'create' | 'edit' | null>(null);
  const emptyPatientForm = { name: '', dob: '', email: '', phone: '', username: '', password: '', address: '', emergencyContactName: '', emergencyContactPhone: '' };
  const [patientForm, setPatientForm] = useState<any>(emptyPatientForm);
  const [patientError, setPatientError] = useState<string | null>(null);

  const filteredPatients = patients.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [p.patientCode, p.user?.name, p.user?.phone, p.user?.email].some((v) => (v || '').toLowerCase().includes(q));
  });

  function openCreatePatient() {
    setPatientForm(emptyPatientForm);
    setPatientError(null);
    setPatientModal('create');
  }

  function openEditPatient() {
    setPatientForm({
      name: selectedPatient.user?.name || '',
      dob: selectedPatient.user?.dob || '',
      email: selectedPatient.user?.email || '',
      phone: selectedPatient.user?.phone || '',
      username: selectedPatient.user?.username || '',
      password: '',
      address: selectedPatient.address || '',
      emergencyContactName: selectedPatient.emergencyContactName || '',
      emergencyContactPhone: selectedPatient.emergencyContactPhone || '',
    });
    setPatientError(null);
    setPatientModal('edit');
  }

  async function savePatient() {
    setPatientError(null);
    const f = patientForm;
    const payload: any = {
      name: f.name, dob: f.dob, email: f.email, phone: f.phone,
      address: f.address, emergencyContactName: f.emergencyContactName, emergencyContactPhone: f.emergencyContactPhone,
    };
    let res: Response;
    if (patientModal === 'create') {
      res = await fetch('/api/doctor/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, username: f.username, password: f.password }),
      });
    } else {
      res = await fetch('/api/doctor/patients/' + selectedPatient.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPatientError(data.error || 'Không lưu được. Vui lòng thử lại.');
      return;
    }
    const mode = patientModal;
    setPatientModal(null);
    const list = await loadPatients();
    if (mode === 'edit') {
      const updated = list.find((p: any) => p.id === selectedPatient.id);
      if (updated) viewPatientDetails(updated);
    }
  }

  async function deletePatient() {
    if (!selectedPatient) return;
    if (!window.confirm('Xóa bệnh nhân ' + selectedPatient.user?.name + '? Toàn bộ hồ sơ sẽ bị xóa.')) return;
    const res = await fetch('/api/doctor/patients/' + selectedPatient.id, { method: 'DELETE' });
    if (res.ok) {
      setSelectedPatient(null);
      setVisits([]);
      loadPatients();
    }
  }

  async function loadPatients() {
    setLoading(true);
    const res = await fetch('/api/doctor/patients');
    const data = await res.json();
    setPatients(data.patients || []);
    setLoading(false);
    return (data.patients || []) as any[];
  }

  async function viewPatientDetails(p: any) {
    setSelectedPatient(p);
    const res = await fetch('/api/doctor/visits?patientId=' + p.id);
    const data = await res.json();
    setVisits(data.visits || []);
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleCreateVisit() {
    if (!selectedPatient) return;
    const res = await fetch('/api/doctor/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        type: visitType,
        diagnosis,
        history,
        illness,
        examination,
        labResults,
        progress,
        nextPlan,
        treatmentPlan: {
          surgeryOn,
          radioOn,
          chemoOn
        }
      })
    });
    if (res.ok) {
      setShowVisitModal(false);
      viewPatientDetails(selectedPatient);
    }
  }

  function addItemToPrescription() {
    if (!drugName) return;
    setItems([...items, { drugName, dose, unit, frequency, duration }]);
    setDrugName('');
    setDose('');
  }

  async function handleSavePrescription() {
    if (!currentVisitId || items.length === 0) return;
    const res = await fetch('/api/doctor/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId: currentVisitId,
        items
      })
    });
    const data = await res.json();
    if (res.ok) {
      if (data.interactions && data.interactions.length > 0) {
        setInteractionWarnings(data.interactions);
      } else {
        setShowPrescriptionModal(false);
        setItems([]);
        viewPatientDetails(selectedPatient);
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Danh sách Bệnh nhân Phụ trách</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            Quản lý hồ sơ bệnh án, lịch sử khám và phác đồ điều trị
          </div>
        </div>
        <Link href='/doctor/patients/new' className='addbtn'>+ Tạo bệnh nhân</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '1fr 1.6fr' : '1fr', gap: 20 }}>
        <div className='sec-card' style={{ padding: 16 }}>
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Tìm theo mã BN, họ tên, SĐT hoặc email...'
            style={{ width: '100%', marginBottom: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
          />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bệnh nhân điều trị ({filteredPatients.length})</div>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--ink-soft)' }}>Đang tải...</div>
          ) : patients.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--ink-soft)' }}>Chưa có bệnh nhân nào được giao.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => viewPatientDetails(p)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: selectedPatient?.id === p.id ? 'var(--teal-tint)' : '#fff',
                    border: '1px solid var(--line)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.user?.name}</div>
                    <span className='pill' style={{ background: '#e9eeec', color: 'var(--ink-soft)' }}>
                      {p.patientCode}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                    SĐT: {p.user?.phone || 'Chưa cập nhật'} | Ngày sinh: {p.user?.dob || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPatient && (
          <div className='sec-card' style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedPatient.user?.name}</h2>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  Mã BN: {selectedPatient.patientCode} • SĐT: {selectedPatient.user?.phone}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type='button' className='ghostbtn' style={{ fontSize: 13 }} onClick={openEditPatient}>Sửa hồ sơ</button>
                <button type='button' className='ghostbtn' style={{ fontSize: 13, color: 'var(--red)' }} onClick={deletePatient}>Xóa</button>
                <button
                  type='button'
                  className='addbtn'
                  style={{ fontSize: 13 }}
                  onClick={() => setShowVisitModal(true)}
                >
                  + Tạo Lượt Khám Mới
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Lịch sử lượt khám & Điều trị ({visits.length})</div>
              {visits.length === 0 ? (
                <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Chưa có lượt khám nào.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {visits.map((v) => (
                    <div key={v.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                          {v.type === 'FIRST' ? 'Khám Lần Đầu' : 'Tái Khám'}
                        </span>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                          {new Date(v.visitDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>

                      <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                        <strong>Chẩn đoán:</strong> {v.diagnosis || 'Chưa ghi'}<br />
                        <strong>Bệnh sử / Diễn biến:</strong> {v.illness || v.progress || 'Không có'}<br />
                        <strong>Kế hoạch tiếp theo:</strong> {v.nextPlan || 'Tiếp tục theo dõi'}
                      </div>

                      {v.treatmentPlans && v.treatmentPlans.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {v.treatmentPlans[0].chemoOn && (
                            <span className='pill' style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}>Hóa trị</span>
                          )}
                          {v.treatmentPlans[0].surgeryOn && (
                            <span className='pill' style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}>Phẫu thuật</span>
                          )}
                          {v.treatmentPlans[0].radioOn && (
                            <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>Xạ trị</span>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type='button'
                          className='ghostbtn'
                          style={{ fontSize: 12 }}
                          onClick={() => {
                            setCurrentVisitId(v.id);
                            setShowPrescriptionModal(true);
                          }}
                        >
                          + Kê thuốc cho lượt khám này
                        </button>
                      </div>

                      {v.prescriptions && v.prescriptions.length > 0 && (
                        <div style={{ marginTop: 10, background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Đơn thuốc đã kê:</div>
                          {v.prescriptions.map((pr: any) => (
                            <div key={pr.id} style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                              • {pr.items.map((it: any) => it.drugName + ' (' + (it.dose || '') + (it.unit || '') + ' - ' + (it.frequency || '') + ')').join(', ')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {patientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className='sec-card' style={{ width: 620, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>
              {patientModal === 'create' ? 'Tạo Bệnh Nhân Mới' : 'Sửa Hồ Sơ Bệnh Nhân'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['name', 'Họ và tên *', 'Nguyễn Văn A'],
                ['dob', 'Năm sinh', '1978'],
                ['phone', 'Số điện thoại', '090...'],
                ['email', 'Email', 'email@domain.com'],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <label className='field-label'>{label}</label>
                  <input type='text' value={patientForm[key]} placeholder={ph} onChange={(e) => setPatientForm({ ...patientForm, [key]: e.target.value })} />
                </div>
              ))}
              {patientModal === 'create' && (
                <>
                  <div>
                    <label className='field-label'>Username *</label>
                    <input type='text' value={patientForm.username} placeholder='username' onChange={(e) => setPatientForm({ ...patientForm, username: e.target.value })} />
                  </div>
                  <div>
                    <label className='field-label'>Mật khẩu *</label>
                    <input type='password' value={patientForm.password} placeholder='Tối thiểu 6 ký tự' onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })} />
                  </div>
                </>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <label className='field-label'>Địa chỉ</label>
                <input type='text' value={patientForm.address} onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })} />
              </div>
              <div>
                <label className='field-label'>Người liên hệ khẩn cấp</label>
                <input type='text' value={patientForm.emergencyContactName} onChange={(e) => setPatientForm({ ...patientForm, emergencyContactName: e.target.value })} />
              </div>
              <div>
                <label className='field-label'>SĐT người liên hệ khẩn cấp</label>
                <input type='text' value={patientForm.emergencyContactPhone} onChange={(e) => setPatientForm({ ...patientForm, emergencyContactPhone: e.target.value })} />
              </div>
            </div>
            {patientError && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{patientError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type='button' className='ghostbtn' onClick={() => setPatientModal(null)}>Hủy</button>
              <button type='button' className='addbtn' onClick={savePatient}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {showVisitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className='sec-card' style={{ width: 600, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>Tạo Lượt Khám Mới</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className='field-label'>Loại khám</label>
                <select
                  value={visitType}
                  onChange={(e: any) => setVisitType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
                >
                  <option value='FIRST'>Khám lần đầu</option>
                  <option value='FOLLOWUP'>Tái khám</option>
                </select>
              </div>

              <div>
                <label className='field-label'>Chẩn đoán xác định</label>
                <input type='text' value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder='VD: Ung thư vú giai đoạn IIA' />
              </div>

              <div>
                <label className='field-label'>Tiền sử bản thân & Dị ứng</label>
                <textarea rows={2} value={history} onChange={(e) => setHistory(e.target.value)} placeholder='Tiền sử bản thân, gia đình, dị ứng...' />
              </div>

              <div>
                <label className='field-label'>Bệnh sử & Diễn biến</label>
                <textarea rows={2} value={illness} onChange={(e) => setIllness(e.target.value)} placeholder='Quá trình khởi phát, triệu chứng...' />
              </div>

              <div>
                <label className='field-label'>Kết quả lâm sàng & Xét nghiệm</label>
                <textarea rows={2} value={labResults} onChange={(e) => setLabResults(e.target.value)} placeholder='Kết quả máu, CT/MRI, giải phẫu bệnh...' />
              </div>

              <div>
                <label className='field-label'>Hướng điều trị tiếp theo</label>
                <textarea rows={2} value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} placeholder='Kế hoạch chu kỳ hóa trị, hẹn khám...' />
              </div>

              <div>
                <label className='field-label'>Phương pháp áp dụng</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label><input type='checkbox' checked={chemoOn} onChange={(e) => setChemoOn(e.target.checked)} /> Hóa trị</label>
                  <label><input type='checkbox' checked={surgeryOn} onChange={(e) => setSurgeryOn(e.target.checked)} /> Phẫu thuật</label>
                  <label><input type='checkbox' checked={radioOn} onChange={(e) => setRadioOn(e.target.checked)} /> Xạ trị</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type='button' className='ghostbtn' onClick={() => setShowVisitModal(false)}>Hủy</button>
                <button type='button' className='addbtn' onClick={handleCreateVisit}>Lưu Lượt Khám</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrescriptionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className='sec-card' style={{ width: 650, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>Kê Đơn Thuốc & Kiểm Tra Tương Tác</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label className='field-label'>Tên thuốc (Biệt dược / Hoạt chất)</label>
                  <input type='text' value={drugName} onChange={(e) => setDrugName(e.target.value)} placeholder='VD: Cisplatin, Paclitaxel' />
                </div>
                <div>
                  <label className='field-label'>Liều lượng</label>
                  <input type='text' value={dose} onChange={(e) => setDose(e.target.value)} placeholder='VD: 50' />
                </div>
                <div>
                  <label className='field-label'>Đơn vị</label>
                  <input type='text' value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className='field-label'>Tần suất</label>
                  <input type='text' value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                </div>
                <div>
                  <label className='field-label'>Thời gian dùng</label>
                  <input type='text' value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
              </div>

              <button type='button' className='ghostbtn' style={{ alignSelf: 'flex-start' }} onClick={addItemToPrescription}>
                + Thêm thuốc vào đơn
              </button>

              {items.length > 0 && (
                <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Danh mục thuốc trong đơn ({items.length}):</div>
                  {items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>{it.drugName} - {it.dose}{it.unit} ({it.frequency}, {it.duration})</span>
                      <button
                        type='button'
                        style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer' }}
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {interactionWarnings.length > 0 && (
                <div style={{ background: 'var(--red-tint)', border: '1px solid var(--red)', borderRadius: 8, padding: 12 }}>
                  <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: 13 }}>⚠ Cảnh báo tương tác thuốc phát hiện!</div>
                  {interactionWarnings.map((w, idx) => (
                    <div key={idx} style={{ fontSize: 12.5, marginTop: 4 }}>
                      • <strong>{w.drugA?.name}</strong> tương tác với <strong>{w.drugB?.name}</strong>: {w.description} (Mức độ: {w.severity})
                    </div>
                  ))}
                  <div style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                    Vui lòng điều chỉnh đơn thuốc hoặc xác nhận bỏ qua cảnh báo nếu có chỉ định đặc biệt.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type='button' className='ghostbtn' onClick={() => { setShowPrescriptionModal(false); setInteractionWarnings([]); }}>Hủy</button>
                <button type='button' className='addbtn' onClick={handleSavePrescription}>Lưu Đơn Thuốc</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
