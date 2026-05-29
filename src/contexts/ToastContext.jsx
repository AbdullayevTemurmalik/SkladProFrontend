import { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} message={t.message} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ message }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(newProgress);
      if (newProgress === 0) clearInterval(interval);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  // Rangni progressga qarab o'zgartirish
  let barColor = 'bg-green-500';
  if (progress < 60 && progress > 30) barColor = 'bg-yellow-400';
  else if (progress <= 30) barColor = 'bg-red-500';

  return (
    <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden flex flex-col min-w-[280px] max-w-sm animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto">
      <div className="px-5 py-4 text-[#0b1736] font-black flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
        {message}
      </div>
      <div className="h-1.5 w-full bg-slate-50">
        <div 
          className={`h-full ${barColor} transition-colors duration-200`} 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
