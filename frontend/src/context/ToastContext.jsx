import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const remove = id => setToasts(p => p.filter(t => t.id !== id));

  const icons = { success: CheckCircle, error: XCircle, info: Info };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => {
          const Icon = icons[t.type] || Info;
          const color = t.type === 'success' ? '#4ade80' : t.type === 'error' ? '#fca5a5' : '#a08fff';
          return (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <Icon size={16} color={color} />
              <span style={{ flex: 1 }}>{t.msg}</span>
              <button onClick={() => remove(t.id)} className="btn-icon" style={{ padding: 4, background: 'none' }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
