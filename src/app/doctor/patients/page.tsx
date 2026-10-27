'use client';

import { useEffect, useState } from 'react';

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Visit form state
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

  // Prescription form state
  const [currentVisitId, setCurrentVisitId] = useState('');
  const [drugName, setDrugName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState('2 lÃƒÂ¡Ã‚ÂºÃ‚Â§n/ngÃƒÆ’Ã‚Â y');
  const [duration, setDuration] = useState('7 ngÃƒÆ’Ã‚Â y');
  const [items, setItems] = useState<any[]>([]);
  const [interactionWarnings, setInteractionWarnings] = useState<any[]>([]);

  async function loadPatients() {
    setLoading(true);
    const res = await fetch('/api/doctor/patients');
    const data = await res.json();
    setPatients(data.patients || []);
    setLoading(false);
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
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Danh sÃƒÆ’Ã‚Â¡ch BÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡nh nhÃƒÆ’Ã‚Â¢n PhÃƒÂ¡Ã‚Â»Ã‚Â¥ trÃƒÆ’Ã‚Â¡ch</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            QuÃƒÂ¡Ã‚ÂºÃ‚Â£n lÃƒÆ’Ã‚Â½ hÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ sÃƒâ€ Ã‚Â¡ bÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡nh ÃƒÆ’Ã‚Â¡n, lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­ khÃƒÆ’Ã‚Â¡m vÃƒÆ’Ã‚Â  phÃƒÆ’Ã‚Â¡c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ Ãƒâ€žÃ¢â‚¬ËœiÃƒÂ¡Ã‚Â»Ã‚Âu trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '1fr 1.6fr' : '1fr', gap: 20 }}>
        <div className='sec-card' style={{ padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>BÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡nh nhÃƒÆ’Ã‚Â¢n Ãƒâ€žÃ¢â‚¬ËœiÃƒÂ¡Ã‚Â»Ã‚Âu trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ ({patients.length})</div>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--ink-soft)' }}>Ãƒâ€žÃ‚Âang tÃƒÂ¡Ã‚ÂºÃ‚Â£i...</div>
          ) : patients.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--ink-soft)' }}>ChÃƒâ€ Ã‚Â°a cÃƒÆ’Ã‚Â³ bÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡nh nhÃƒÆ’Ã‚Â¢n nÃƒÆ’Ã‚Â o Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c gÃƒÆ’Ã‚Â¡n.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {patients.map((p) => (
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
                    SÃƒâ€žÃ‚ÂT: {p.user?.phone || 'ChÃƒâ€ Ã‚Â°a cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t'} | NgÃƒÆ’Ã‚Â y sinh: {p.user?.dob || 'N/A'}
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
                  MÃƒÆ’Ã‚Â£ BN: {selectedPatient.patientCode} ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ SÃƒâ€žÃ‚ÂT: {selectedPatient.user?.phone}
                </div>
              </div>
              <button
                type='button'
                className='addbtn'
                style={{ fontSize: 13 }}
                onClick={() => setShowVisitModal(true)}
              >
                + TÃƒÂ¡Ã‚ÂºÃ‚Â¡o LÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t KhÃƒÆ’Ã‚Â¡m MÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>LÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­ LÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t khÃƒÆ’Ã‚Â¡m & Ãƒâ€žÃ‚ÂiÃƒÂ¡Ã‚Â»Ã‚Âu trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ ({visits.length})</div>
              {visits.length === 0 ? (
                <div style={{ color: 'var(--ink-soft)', fontSize: 13 }}>ChÃƒâ€ Ã‚Â°a cÃƒÆ’Ã‚Â³ lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t khÃƒÆ’Ã‚Â¡m nÃƒÆ’Ã‚Â o.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {visits.map((v) => (
                    <div key={v.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                          {v.type === 'FIRST' ? 'KhÃƒÆ’Ã‚Â¡m LÃƒÂ¡Ã‚ÂºÃ‚Â§n Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚ÂºÃ‚Â§u' : 'TÃƒÆ’Ã‚Â¡i KhÃƒÆ’Ã‚Â¡m'}
                        </span>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                          {new Date(v.visitDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>

                      <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                        <strong>ChÃƒÂ¡Ã‚ÂºÃ‚Â©n Ãƒâ€žÃ¢â‚¬ËœoÃƒÆ’Ã‚Â¡n:</strong> {v.diagnosis || 'ChÃƒâ€ Ã‚Â°a ghi'}<br />
                        <strong>BÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡nh sÃƒÂ¡Ã‚Â»Ã‚Â­ / DiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¦n biÃƒÂ¡Ã‚ÂºÃ‚Â¿n:</strong> {v.illness || v.progress || 'KhÃƒÆ’Ã‚Â´ng cÃƒÆ’Ã‚Â³'}<br />
                        <strong>KÃƒÂ¡Ã‚ÂºÃ‚Â¿ hoÃƒÂ¡Ã‚ÂºÃ‚Â¡ch tiÃƒÂ¡Ã‚ÂºÃ‚Â¿p theo:</strong> {v.nextPlan || 'TiÃƒÂ¡Ã‚ÂºÃ‚Â¿p tÃƒÂ¡Ã‚Â»Ã‚Â¥c theo dÃƒÆ’Ã‚Âµi'}
                      </div>

                      {v.treatmentPlans && v.treatmentPlans.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {v.treatmentPlans[0].chemoOn && (
                            <span className='pill' style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}>HÃƒÆ’Ã‚Â³a trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹</span>
                          )}
                          {v.treatmentPlans[0].surgeryOn && (
                            <span className='pill' style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}>PhÃƒÂ¡Ã‚ÂºÃ‚Â«u thuÃƒÂ¡Ã‚ÂºÃ‚Â­t</span>
                          )}
                          {v.treatmentPlans[0].radioOn && (
                            <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>XÃƒÂ¡Ã‚ÂºÃ‚Â¡ trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹</span>
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
                          + KÃƒÆ’Ã‚Âª Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n thuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc cho lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t khÃƒÆ’Ã‚Â¡m nÃƒÆ’Ã‚Â y
                        </button>
                      </div>

                      {v.prescriptions && v.prescriptions.length > 0 && (
                        <div style={{ marginTop: 10, background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Ãƒâ€žÃ‚ÂÃƒâ€ Ã‚Â¡n thuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ kÃƒÆ’Ã‚Âª:</div>
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

      {showVisitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className='sec-card' style={{ width: 600, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>TÃƒÂ¡Ã‚ÂºÃ‚Â¡o LÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t KhÃƒÆ’Ã‚Â¡m MÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className='field-label'>LoÃƒÂ¡Ã‚ÂºÃ‚Â¡i khÃƒÆ’Ã‚Â¡m</label>
                <select
                  value={visitType}
                  onChange={(e: any) => setVisitType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
                >
                  <option value='FIRST'>KhÃƒÆ’Ã‚Â¡m lÃƒÂ¡Ã‚ÂºÃ‚Â§n Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u</option>
                  <option value='FOLLOWUP'>TÃƒÆ’Ã‚Â¡i khÃƒÆ’Ã‚Â¡m</option>
                </select>
              </div>

              <div>
                <label className='field-label'>ChÃƒÂ¡Ã‚ÂºÃ‚Â©n Ãƒâ€žÃ¢â‚¬ËœoÃƒÆ’Ã‚Â¡n xÃƒÆ’Ã‚Â¡c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh</label>
                <input type='text' value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder='VD: Ung thÃƒâ€ Ã‚Â° vÃƒÆ’Ã‚Âº giai Ãƒâ€žÃ¢â‚¬ËœoÃƒÂ¡Ã‚ÂºÃ‚Â¡n IIA' />
              </div>

              <div>
                <label className='field-label'>TiÃƒÂ¡Ã‚Â»Ã‚Ân sÃƒÂ¡Ã‚Â»Ã‚Â­ bÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡nh & DÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ ÃƒÂ¡Ã‚Â»Ã‚Â©ng</label>
                <textarea rows={2} value={history} onChange={(e) => setHistory(e.target.value)} placeholder='TiÃƒÂ¡Ã‚Â»Ã‚Ân sÃƒÂ¡Ã‚Â»Ã‚Â­ bÃƒÂ¡Ã‚ÂºÃ‚Â£n thÃƒÆ’Ã‚Â¢n, gia Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â¬nh, dÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ ÃƒÂ¡Ã‚Â»Ã‚Â©ng...' />
              </div>

              <div>
                <label className='field-label'>BÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡nh sÃƒÂ¡Ã‚Â»Ã‚Â­ & DiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¦n biÃƒÂ¡Ã‚ÂºÃ‚Â¿n</label>
                <textarea rows={2} value={illness} onChange={(e) => setIllness(e.target.value)} placeholder='QuÃƒÆ’Ã‚Â¡ trÃƒÆ’Ã‚Â¬nh khÃƒÂ¡Ã‚Â»Ã…Â¸i phÃƒÆ’Ã‚Â¡t, triÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡u chÃƒÂ¡Ã‚Â»Ã‚Â©ng...' />
              </div>

              <div>
                <label className='field-label'>KÃƒÂ¡Ã‚ÂºÃ‚Â¿t quÃƒÂ¡Ã‚ÂºÃ‚Â£ lÃƒÆ’Ã‚Â¢m sÃƒÆ’Ã‚Â ng & XÃƒÆ’Ã‚Â©t nghiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡m</label>
                <textarea rows={2} value={labResults} onChange={(e) => setLabResults(e.target.value)} placeholder='KÃƒÂ¡Ã‚ÂºÃ‚Â¿t quÃƒÂ¡Ã‚ÂºÃ‚Â£ mÃƒÆ’Ã‚Â¡u, CT/MRI, giÃƒÂ¡Ã‚ÂºÃ‚Â£i phÃƒÂ¡Ã‚ÂºÃ‚Â«u bÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡nh...' />
              </div>

              <div>
                <label className='field-label'>HÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºng Ãƒâ€žÃ¢â‚¬ËœiÃƒÂ¡Ã‚Â»Ã‚Âu trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ tiÃƒÂ¡Ã‚ÂºÃ‚Â¿p theo</label>
                <textarea rows={2} value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} placeholder='KÃƒÂ¡Ã‚ÂºÃ‚Â¿ hoÃƒÂ¡Ã‚ÂºÃ‚Â¡ch chu kÃƒÂ¡Ã‚Â»Ã‚Â³ hÃƒÆ’Ã‚Â³a trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹, hÃƒÂ¡Ã‚ÂºÃ‚Â¹n khÃƒÆ’Ã‚Â¡m...' />
              </div>

              <div>
                <label className='field-label'>PhÃƒâ€ Ã‚Â°Ãƒâ€ Ã‚Â¡ng phÃƒÆ’Ã‚Â¡p phÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœi hÃƒÂ¡Ã‚Â»Ã‚Â£p</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label><input type='checkbox' checked={chemoOn} onChange={(e) => setChemoOn(e.target.checked)} /> HÃƒÆ’Ã‚Â³a trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹</label>
                  <label><input type='checkbox' checked={surgeryOn} onChange={(e) => setSurgeryOn(e.target.checked)} /> PhÃƒÂ¡Ã‚ÂºÃ‚Â«u thuÃƒÂ¡Ã‚ÂºÃ‚Â­t</label>
                  <label><input type='checkbox' checked={radioOn} onChange={(e) => setRadioOn(e.target.checked)} /> XÃƒÂ¡Ã‚ÂºÃ‚Â¡ trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type='button' className='ghostbtn' onClick={() => setShowVisitModal(false)}>HÃƒÂ¡Ã‚Â»Ã‚Â§y</button>
                <button type='button' className='addbtn' onClick={handleCreateVisit}>LÃƒâ€ Ã‚Â°u LÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t KhÃƒÆ’Ã‚Â¡m</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrescriptionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className='sec-card' style={{ width: 650, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>KÃƒÆ’Ã‚Âª Ãƒâ€žÃ‚ÂÃƒâ€ Ã‚Â¡n ThuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc & KiÃƒÂ¡Ã‚Â»Ã†â€™m Tra TÃƒâ€ Ã‚Â°Ãƒâ€ Ã‚Â¡ng TÃƒÆ’Ã‚Â¡c</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label className='field-label'>TÃƒÆ’Ã‚Âªn thuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc (BiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡t dÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c / HoÃƒÂ¡Ã‚ÂºÃ‚Â¡t chÃƒÂ¡Ã‚ÂºÃ‚Â¥t)</label>
                  <input type='text' value={drugName} onChange={(e) => setDrugName(e.target.value)} placeholder='VD: Cisplatin, Paclitaxel' />
                </div>
                <div>
                  <label className='field-label'>LiÃƒÂ¡Ã‚Â»Ã‚Âu lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng</label>
                  <input type='text' value={dose} onChange={(e) => setDose(e.target.value)} placeholder='VD: 50' />
                </div>
                <div>
                  <label className='field-label'>Ãƒâ€žÃ‚ÂÃƒâ€ Ã‚Â¡n vÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹</label>
                  <input type='text' value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className='field-label'>TÃƒÂ¡Ã‚ÂºÃ‚Â§n suÃƒÂ¡Ã‚ÂºÃ‚Â¥t</label>
                  <input type='text' value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                </div>
                <div>
                  <label className='field-label'>ThÃƒÂ¡Ã‚Â»Ã‚Âi gian dÃƒÆ’Ã‚Â¹ng</label>
                  <input type='text' value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
              </div>

              <button type='button' className='ghostbtn' style={{ alignSelf: 'flex-start' }} onClick={addItemToPrescription}>
                + ThÃƒÆ’Ã‚Âªm ThuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc VÃƒÆ’Ã‚Â o Ãƒâ€žÃ‚ÂÃƒâ€ Ã‚Â¡n
              </button>

              {items.length > 0 && (
                <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Danh mÃƒÂ¡Ã‚Â»Ã‚Â¥c thuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc trong Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n ({items.length}):</div>
                  {items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>{it.drugName} - {it.dose}{it.unit} ({it.frequency}, {it.duration})</span>
                      <button
                        type='button'
                        style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer' }}
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        XÃƒÆ’Ã‚Â³a
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {interactionWarnings.length > 0 && (
                <div style={{ background: 'var(--red-tint)', border: '1px solid var(--red)', borderRadius: 8, padding: 12 }}>
                  <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: 13 }}>CÃƒÂ¡Ã‚ÂºÃ‚Â£nh bÃƒÆ’Ã‚Â¡o tÃƒâ€ Ã‚Â°Ãƒâ€ Ã‚Â¡ng tÃƒÆ’Ã‚Â¡c thuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc phÃƒÆ’Ã‚Â¡t hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n!</div>
                  {interactionWarnings.map((w, idx) => (
                    <div key={idx} style={{ fontSize: 12.5, marginTop: 4 }}>
                      ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ <strong>{w.drugA?.name}</strong> tÃƒâ€ Ã‚Â°Ãƒâ€ Ã‚Â¡ng tÃƒÆ’Ã‚Â¡c vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi <strong>{w.drugB?.name}</strong>: {w.description} (MÃƒÂ¡Ã‚Â»Ã‚Â©c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢: {w.severity})
                    </div>
                  ))}
                  <div style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                    Vui lÃƒÆ’Ã‚Â²ng Ãƒâ€žÃ¢â‚¬ËœiÃƒÂ¡Ã‚Â»Ã‚Âu chÃƒÂ¡Ã‚Â»Ã¢â‚¬Â°nh Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n thuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc hoÃƒÂ¡Ã‚ÂºÃ‚Â·c xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n bÃƒÂ¡Ã‚Â»Ã‚Â qua cÃƒÂ¡Ã‚ÂºÃ‚Â£nh bÃƒÆ’Ã‚Â¡o nÃƒÂ¡Ã‚ÂºÃ‚Â¿u cÃƒÆ’Ã‚Â³ chÃƒÂ¡Ã‚Â»Ã¢â‚¬Â° Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·c biÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡t.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type='button' className='ghostbtn' onClick={() => { setShowPrescriptionModal(false); setInteractionWarnings([]); }}>HÃƒÂ¡Ã‚Â»Ã‚Â§y</button>
                <button type='button' className='addbtn' onClick={handleSavePrescription}>LÃƒâ€ Ã‚Â°u Ãƒâ€žÃ‚ÂÃƒâ€ Ã‚Â¡n ThuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœc</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
