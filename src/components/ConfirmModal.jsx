import { AlertTriangle, LogOut, HelpCircle } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) {
  if (!isOpen) return null;

  const Icon = type === 'danger' ? AlertTriangle : (type === 'logout' ? LogOut : HelpCircle);
  const colorClass = type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500';
  const btnClass = type === 'danger' 
    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0b1736]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${colorClass}`}>
          <Icon className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-center text-[#0b1736] mb-3">{title}</h3>
        <p className="text-center text-slate-500 font-medium mb-8 leading-relaxed">{message}</p>
        
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
          >
            Yo'q
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3.5 px-4 text-white font-bold rounded-2xl transition-all shadow-lg ${btnClass}`}
          >
            Ha
          </button>
        </div>
      </div>
    </div>
  );
}
