'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type ToastKind = 'success' | 'error';
type ToastItem = { id: number; kind: ToastKind; message: string };
type ConfirmState = { message: string; detail?: string; resolve: (ok: boolean) => void } | null;

type Ctx = {
  showToast: (kind: ToastKind, message: string) => void;
  confirm: (message: string, detail?: string) => Promise<boolean>;
};

const FeedbackContext = createContext<Ctx | null>(null);

/** Hiện thông báo nổi (toast) góc màn hình thay cho chữ tĩnh dễ bị bỏ sót. */
export function useToast() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useToast phải được dùng bên trong UIFeedbackProvider');
  return { success: (msg: string) => ctx.showToast('success', msg), error: (msg: string) => ctx.showToast('error', msg) };
}

/** Hộp thoại xác nhận đồng bộ phong cách, thay cho window.confirm(). */
export function useConfirm() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useConfirm phải được dùng bên trong UIFeedbackProvider');
  return ctx.confirm;
}

let idCounter = 0;

export function UIFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    const id = ++idCounter;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const confirm = useCallback((message: string, detail?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ message, detail, resolve });
    });
  }, []);

  function handle(ok: boolean) {
    confirmState?.resolve(ok);
    setConfirmState(null);
  }

  return (
    <FeedbackContext.Provider value={{ showToast, confirm }}>
      {children}

      <div style={{ position: 'fixed', bottom: 22, right: 22, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1000, maxWidth: 360 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '13px 18px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 600,
              color: '#fff',
              background: t.kind === 'success' ? 'var(--teal-deep)' : 'var(--red)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {confirmState && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div className='sec-card' style={{ width: 400, maxWidth: '100%', padding: 24 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: confirmState.detail ? 8 : 18 }}>{confirmState.message}</div>
            {confirmState.detail && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 18 }}>{confirmState.detail}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type='button' className='ghostbtn' onClick={() => handle(false)}>Hủy</button>
              <button type='button' className='addbtn' style={{ background: 'var(--red)' }} onClick={() => handle(true)}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
