export interface ModuleDef {
  id: string;
  label: string;
}

export const MODULES: ModuleDef[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "record", label: "Hồ sơ bệnh án" },
  { id: "medications", label: "Thuốc" },
  { id: "sideeffects", label: "Tác dụng phụ" },
  { id: "appointments", label: "Lịch hẹn" },
  { id: "messages", label: "Liên lạc" },
  { id: "reports", label: "Báo cáo" },
  { id: "education", label: "Thông tin giáo dục" },
  { id: "accounts", label: "Quản lý tài khoản" },
  { id: "catalog", label: "Danh mục" },
  { id: "permissions", label: "Ma trận phân quyền" },
];

export const DEFAULT_PERMISSIONS: Record<string, { ADMIN: boolean; DOCTOR: boolean; PATIENT: boolean }> = {
  dashboard: { ADMIN: true, DOCTOR: true, PATIENT: true },
  record: { ADMIN: true, DOCTOR: true, PATIENT: true },
  medications: { ADMIN: true, DOCTOR: true, PATIENT: true },
  sideeffects: { ADMIN: true, DOCTOR: true, PATIENT: true },
  appointments: { ADMIN: true, DOCTOR: true, PATIENT: true },
  messages: { ADMIN: false, DOCTOR: true, PATIENT: true },
  reports: { ADMIN: true, DOCTOR: true, PATIENT: false },
  education: { ADMIN: true, DOCTOR: false, PATIENT: true },
  accounts: { ADMIN: true, DOCTOR: false, PATIENT: false },
  catalog: { ADMIN: true, DOCTOR: false, PATIENT: false },
  permissions: { ADMIN: true, DOCTOR: false, PATIENT: false },
};
