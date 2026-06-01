import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Users, Eye, EyeOff, X, ArrowLeft, Trash2, Edit, Save } from "lucide-react";

export default function UsersList() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [passwordPromptUserId, setPasswordPromptUserId] = useState(null);
  const [secretPasswordInput, setSecretPasswordInput] = useState("");
  
  const [deleteId, setDeleteId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [errorModal, setErrorModal] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setErrorModal("Foydalanuvchilarni yuklashda xatolik yuz berdi");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      showToast("Foydalanuvchi o'chirildi", "success");
      fetchUsers();
    } catch (err) {
      setErrorModal(err.response?.data?.message || "O'chirishda xatolik");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editUser.id}`, {
        username: editUser.username,
        role: editUser.role,
        password: editUser.password // Allows changing password
      });
      showToast("Foydalanuvchi yangilandi", "success");
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setErrorModal(err.response?.data?.message || "Yangilashda xatolik");
    }
  };

  const inputStyle =
    "w-full px-3 py-2 bg-blue-950/60 border border-blue-800/50 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:bg-blue-900/80 text-sm font-medium transition-all outline-none";

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0b1736] flex flex-col font-sans pb-20 relative overflow-hidden">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 w-full pt-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center text-blue-400 hover:text-white transition-colors mb-2 text-sm font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Admin Panelga Qaytish
            </button>
            <h1 className="text-3xl font-black text-white flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-500" /> 
              Tizimdagi Foydalanuvchilar
            </h1>
          </div>
        </div>

        <div className="bg-blue-900/20 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-500/20 p-6">
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="bg-blue-950/50 p-5 rounded-2xl border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-blue-900/40">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xl font-black mr-4 shadow-inner">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{u.username}</div>
                    <div className="text-blue-300 text-xs font-mono mt-1">Role: {u.role || 'USER'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-blue-900/40 px-4 py-2 rounded-xl border border-blue-800/40 min-w-[140px] justify-between">
                    <span className="text-blue-200 font-mono text-sm font-bold truncate max-w-[100px]">
                      {revealedPasswords[u.id] ? (u.password || 'Topilmadi') : '••••••••'}
                    </span>
                    <button
                      onClick={() => {
                        if (revealedPasswords[u.id]) {
                          setRevealedPasswords({ ...revealedPasswords, [u.id]: false });
                        } else {
                          setPasswordPromptUserId(u.id);
                          setSecretPasswordInput("");
                        }
                      }}
                      className="text-blue-400 hover:text-white transition-colors ml-2"
                    >
                      {revealedPasswords[u.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setEditUser({ ...u, password: '' })}
                    className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-600/30"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setDeleteId(u.id)}
                    className="p-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/30"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="text-center text-blue-300 py-8 font-bold">Foydalanuvchilar topilmadi</div>}
          </div>
        </div>
      </div>

      {/* Secret Password Prompt */}
      {passwordPromptUserId && (
        <div className="fixed inset-0 bg-[#0b1736]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-200">
          <div className="bg-blue-900/30 border border-blue-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h4 className="text-2xl font-black text-white mb-2 text-center">Maxfiy Parol</h4>
            <p className="text-sm text-blue-300 mb-6 text-center font-bold">Ruxsat kodini kiriting (Masalan: 123456)</p>
            <input
              type="password"
              value={secretPasswordInput}
              onChange={(e) => setSecretPasswordInput(e.target.value)}
              placeholder="••••••"
              className="w-full text-center tracking-widest text-xl px-4 py-4 bg-blue-950 border border-blue-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 mb-6 outline-none shadow-inner"
            />
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setPasswordPromptUserId(null)}
                className="flex-1 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 font-bold py-3 rounded-xl transition-all"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  if (secretPasswordInput === "12345" || secretPasswordInput === "123456") {
                    setRevealedPasswords({ ...revealedPasswords, [passwordPromptUserId]: true });
                    setPasswordPromptUserId(null);
                  } else {
                    setErrorModal("Maxfiy parol noto'g'ri!");
                    setSecretPasswordInput("");
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0b1736] border border-blue-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Tahrirlash</h3>
              <button onClick={() => setEditUser(null)} className="text-blue-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editUser.username}
                  onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Yangi Parol (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Yangi parol..."
                  value={editUser.password}
                  onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Roli (Role)</label>
                <select
                  value={editUser.role || 'USER'}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                  className={inputStyle}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center mt-4">
                <Save className="w-5 h-5 mr-2" /> Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0b1736]/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-[#0b1736] mb-2">Xatolik!</h3>
            <p className="text-sm font-bold text-slate-500 mb-6">{errorModal}</p>
            <button onClick={() => setErrorModal(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all">
              Tushunarli
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="O'chirish"
        message="Rostdan ham foydalanuvchini o'chirib tashlamoqchimisiz?"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
