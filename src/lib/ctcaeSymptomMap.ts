/**
 * Ánh xạ tên triệu chứng tiếng Việt (dropdown bệnh nhân) sang thuật ngữ CTCAE
 * tiếng Anh lưu trong CtcaeTerm.term, để tra cứu hướng dẫn xử trí khớp đúng.
 *
 * CtcaeTerm hiện lưu tiếng Anh (import từ NCI CTCAE v6.0); bệnh nhân chọn
 * triệu chứng bằng tiếng Việt nên tìm theo `contains` trực tiếp sẽ không khớp.
 * TODO: thay bằng cột CtcaeTerm.termVi khi import bản dịch CTCAE_v6.0_Tieng_Viet.
 */
export const VI_TO_EN_SYMPTOM: Record<string, string> = {
  'Buồn nôn': 'Nausea',
  'Sốt': 'Fever',
  'Mệt mỏi': 'Fatigue',
  'Tiêu chảy': 'Diarrhea',
  'Táo bón': 'Constipation',
  'Đau': 'Pain',
  'Ho': 'Cough',
  'Viêm da': 'Dermatitis radiation',
  'Chán ăn': 'Anorexia',
};

/** Trả về từ khoá tiếng Anh để tra CtcaeTerm, hoặc nguyên văn nếu không có ánh xạ. */
export function toCtcaeSearchTerm(symptomVi: string): string {
  return VI_TO_EN_SYMPTOM[symptomVi.trim()] || symptomVi;
}
