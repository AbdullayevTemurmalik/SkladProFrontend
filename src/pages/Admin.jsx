import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PlusCircle, Trash2, LayoutDashboard, Database, Tags, Box, ExternalLink, Edit, X, MapPin, Home as HomeIcon } from 'lucide-react';

export default function Admin() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [products, setProducts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Modallar uchun
  const [deleteId, setDeleteId] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  
  // Viloyat va Ombor filtratsiyasi uchun
  const [formRegion, setFormRegion] = useState('');
  const [editRegion, setEditRegion] = useState('');
  
  // Yangi tovar formasi
  const initialForm = {
    name: '', brand: '', sku: '', stock: 0, year: 2024, image: 'https://picsum.photos/400/400',
    categoryId: '', warehouseId: '', unitId: '', height: 10, width: 10, length: 10
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProducts();
    api.get('/regions').then(res => { setRegions(res.data); if(res.data.length) setFormRegion(res.data[0].id) });
    api.get('/categories').then(res => { setCategories(res.data); if(res.data.length) setFormData(f => ({...f, categoryId: res.data[0].id})) });
    api.get('/warehouses').then(res => { setWarehouses(res.data); });
    api.get('/units').then(res => { setUnits(res.data); if(res.data.length) setFormData(f => ({...f, unitId: res.data[0].id})) });
  }, [isAuthenticated, navigate]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.reverse().slice(0, 50)); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditProduct({ ...editProduct, [e.target.name]: e.target.value });
  };

  const handleFormRegionChange = (e) => {
    setFormRegion(e.target.value);
    setFormData({ ...formData, warehouseId: '' });
  };

  const handleEditRegionChange = (e) => {
    setEditRegion(e.target.value);
    setEditProduct({ ...editProduct, warehouseId: '' });
  };

  const openEditModal = (p) => {
    const w = warehouses.find(wh => wh.id === p.warehouseId);
    if (w) setEditRegion(w.regionId);
    setEditProduct(p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.warehouseId) {
      setErrorModal("Iltimos omborni tanlang!");
      return;
    }
    try {
      const payload = {
        ...formData,
        stock: Number(formData.stock),
        year: Number(formData.year),
        categoryId: Number(formData.categoryId),
        warehouseId: Number(formData.warehouseId),
        unitId: Number(formData.unitId),
        height: Number(formData.height || 10),
        width: Number(formData.width || 10),
        length: Number(formData.length || 10),
      };
      await api.post('/products', payload);
      showToast("Yangi mahsulot muvaffaqiyatli qo'shildi!");
      fetchProducts();
      setFormData({ ...initialForm, categoryId: formData.categoryId, warehouseId: '', unitId: formData.unitId });
    } catch (error) {
      console.error(error);
      setErrorModal(`Xatolik yuz berdi: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editProduct.warehouseId) {
      setErrorModal("Iltimos omborni tanlang!");
      return;
    }
    try {
      const payload = {
        ...editProduct,
        stock: Number(editProduct.stock),
        year: Number(editProduct.year),
        categoryId: Number(editProduct.categoryId),
        warehouseId: Number(editProduct.warehouseId),
        unitId: Number(editProduct.unitId),
        height: Number(editProduct.height || 10),
        width: Number(editProduct.width || 10),
        length: Number(editProduct.length || 10),
      };
      await api.put(`/products/${editProduct.id}`, payload);
      showToast("Mahsulot muvaffaqiyatli yangilandi!");
      fetchProducts();
      setEditProduct(null);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      showToast("Mahsulot tizimdan o'chirildi!");
      fetchProducts();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteId(null);
    }
  };

  if (!isAuthenticated) return null;

  const formWarehouses = warehouses.filter(w => w.regionId.toString() === formRegion.toString());
  const editWarehouses = warehouses.filter(w => w.regionId.toString() === editRegion.toString());

  // Kichik va ixcham qora (To'q ko'k) input stili
  const inputStyle = "w-full px-3 py-1.5 bg-blue-950/60 border border-blue-800/50 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:bg-blue-900/80 text-sm font-medium placeholder-blue-200/40 transition-all shadow-inner outline-none";
  const labelStyle = "block text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1 flex items-center";

  return (
    <div className="min-h-screen bg-[#0b1736] flex flex-col font-sans pb-20 relative overflow-hidden">
      {/* Background nurlari */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-6 w-full flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Chap tomon: Ixcham Qo'shish formasi */}
        <div className="lg:w-1/3">
          <div className="bg-blue-900/20 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-500/20 p-5 sticky top-24">
            
            <h2 className="text-xl font-black text-white flex items-center mb-4">
              <PlusCircle className="w-5 h-5 mr-2 text-blue-400" /> Yangi Mahsulot
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Viloyat va Ombor bitta qatorda */}
              <div className="grid grid-cols-2 gap-3 bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
                <div>
                  <label className={labelStyle}><MapPin className="w-3 h-3 mr-1 text-blue-400" /> Viloyat</label>
                  <select name="region" value={formRegion} onChange={handleFormRegionChange} className={inputStyle}>
                    <option value="" className="text-black">Tanlang</option>
                    {regions.map(r => <option key={r.id} value={r.id} className="text-black">{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}><HomeIcon className="w-3 h-3 mr-1 text-blue-400" /> Ombor</label>
                  <select required name="warehouseId" value={formData.warehouseId} onChange={handleChange} className={inputStyle} disabled={!formRegion}>
                    <option value="" className="text-black">{formRegion ? 'Tanlang' : 'Kutish...'}</option>
                    {formWarehouses.map(w => <option key={w.id} value={w.id} className="text-black">{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelStyle}><Box className="w-3 h-3 mr-1 text-blue-400" /> Nomi</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyle} placeholder="Mahsulot nomi" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}><Tags className="w-3 h-3 mr-1 text-blue-400" /> Brend</label>
                  <input required type="text" name="brand" value={formData.brand} onChange={handleChange} className={inputStyle} placeholder="Brend" />
                </div>
                <div>
                  <label className={labelStyle}>SKU (Artikul)</label>
                  <input required type="text" name="sku" value={formData.sku} onChange={handleChange} className={inputStyle} placeholder="Masalan: IPH-15-PRO" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Kategoriya</label>
                  <select required name="categoryId" value={formData.categoryId} onChange={handleChange} className={inputStyle}>
                    <option value="" className="text-black">Tanlang</option>
                    {categories.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}><ExternalLink className="w-3 h-3 mr-1 text-blue-400" /> Rasm URL</label>
                  <input required type="text" name="image" value={formData.image} onChange={handleChange} className={`${inputStyle} text-blue-400`} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelStyle}>Birlik</label>
                  <select required name="unitId" value={formData.unitId} onChange={handleChange} className={inputStyle}>
                    {units.map(u => <option key={u.id} value={u.id} className="text-black">{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Yili</label>
                  <input required type="number" name="year" value={formData.year} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Qoldiq</label>
                  <input required type="number" name="stock" value={formData.stock} onChange={handleChange} className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelStyle}>Bo'yi (sm)</label>
                  <input required type="number" step="0.1" name="height" value={formData.height} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Eni (sm)</label>
                  <input required type="number" step="0.1" name="width" value={formData.width} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Uzunligi (sm)</label>
                  <input required type="number" step="0.1" name="length" value={formData.length} onChange={handleChange} className={inputStyle} />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2.5 rounded-lg transition-all shadow-md shadow-blue-600/30 mt-2 text-sm border border-blue-400/50">
                Qo'shish
              </button>
            </form>
          </div>
        </div>

        {/* O'ng tomon: Barcha mahsulotlar (To'q ko'k Tema) */}
        <div className="lg:w-2/3">
          <div className="bg-blue-900/20 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-500/20 p-5 sm:p-6">
            <h2 className="text-xl font-black text-white flex items-center mb-5 pb-3 border-b border-blue-800/50">
              <LayoutDashboard className="w-5 h-5 mr-3 text-blue-400" /> Boshqaruv (So'nggi 50 ta)
            </h2>
            
            <div className="overflow-x-auto custom-scrollbar pr-1">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-blue-300/70 text-[10px] uppercase tracking-widest border-b border-blue-800/50">
                    <th className="pb-3 font-bold pl-2">Rasm / ID</th>
                    <th className="pb-3 font-bold">Mahsulot Nomi</th>
                    <th className="pb-3 font-bold text-center">Qoldiq</th>
                    <th className="pb-3 font-bold text-right pr-2">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-800/30">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-blue-800/30 transition-colors group">
                      <td className="py-2.5 pl-2 pr-3 flex items-center gap-3">
                        <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/10 backdrop-blur-sm border border-blue-500/30 p-0.5" />
                        <span className="font-mono text-xs font-bold text-blue-400/70">#{p.id}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="font-bold text-white text-sm mb-0.5">{p.name}</div>
                        <div className="text-[10px] font-bold text-blue-300 bg-blue-900/50 inline-block px-1.5 py-0.5 rounded border border-blue-700/50">{p.brand} • {p.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-green-500/20 text-green-400 px-2.5 py-1 rounded-md text-xs font-black border border-green-500/30">
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(p)} 
                            className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-600/50 rounded-lg transition-all"
                            title="Tahrirlash"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(p.id)} 
                            className="p-1.5 text-blue-300 hover:text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Tahrirlash Modali */}
      {editProduct && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0b1736]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0b1736] text-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-blue-500/30 max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-5 relative z-10">
              <h3 className="text-xl font-black text-white flex items-center drop-shadow-md">
                <Edit className="w-5 h-5 mr-2 text-blue-400" /> Tahrirlash
              </h3>
              <button onClick={() => setEditProduct(null)} className="p-1.5 bg-blue-900/50 hover:bg-blue-800 rounded-full text-blue-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-3 relative z-10">
              <div className="grid grid-cols-2 gap-3 bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
                <div>
                  <label className={labelStyle}><MapPin className="w-3 h-3 mr-1 text-blue-400" /> Viloyat</label>
                  <select name="editRegion" value={editRegion} onChange={handleEditRegionChange} className={inputStyle}>
                    <option value="" className="text-black">Tanlang</option>
                    {regions.map(r => <option key={r.id} value={r.id} className="text-black">{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}><HomeIcon className="w-3 h-3 mr-1 text-blue-400" /> Ombor</label>
                  <select required name="warehouseId" value={editProduct.warehouseId} onChange={handleEditChange} className={inputStyle} disabled={!editRegion}>
                    <option value="" className="text-black">{editRegion ? 'Tanlang' : 'Kutish...'}</option>
                    {editWarehouses.map(w => <option key={w.id} value={w.id} className="text-black">{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Nomi</label>
                <input required type="text" name="name" value={editProduct.name} onChange={handleEditChange} className={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Brend</label>
                  <input required type="text" name="brand" value={editProduct.brand} onChange={handleEditChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>SKU (Artikul)</label>
                  <input required type="text" name="sku" value={editProduct.sku} onChange={handleEditChange} className={inputStyle} placeholder="Masalan: IPH-15-PRO" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Kategoriya</label>
                  <select required name="categoryId" value={editProduct.categoryId} onChange={handleEditChange} className={inputStyle}>
                    <option value="" className="text-black">Tanlang</option>
                    {categories.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}><ExternalLink className="w-3 h-3 mr-1 text-blue-400" /> Rasm URL</label>
                  <input required type="text" name="image" value={editProduct.image} onChange={handleEditChange} className={`${inputStyle} text-blue-400`} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelStyle}>Birlik</label>
                  <select required name="unitId" value={editProduct.unitId} onChange={handleEditChange} className={inputStyle}>
                    {units.map(u => <option key={u.id} value={u.id} className="text-black">{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Yili</label>
                  <input required type="number" name="year" value={editProduct.year} onChange={handleEditChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Qoldiq</label>
                  <input required type="number" name="stock" value={editProduct.stock} onChange={handleEditChange} className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelStyle}>Bo'yi (sm)</label>
                  <input required type="number" step="0.1" name="height" value={editProduct.height} onChange={handleEditChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Eni (sm)</label>
                  <input required type="number" step="0.1" name="width" value={editProduct.width} onChange={handleEditChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Uzunligi (sm)</label>
                  <input required type="number" step="0.1" name="length" value={editProduct.length} onChange={handleEditChange} className={inputStyle} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2.5 rounded-lg transition-all shadow-md mt-2 text-sm border border-blue-400/50">
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Xatolik Modali (Alert o'rniga) */}
      {errorModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0b1736]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.3)] max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden border border-red-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#0b1736] mb-2">Xatolik!</h3>
              <p className="text-sm font-bold text-slate-500 mb-6">{errorModal}</p>
              <button 
                onClick={() => setErrorModal(null)} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* O'chirishni tasdiqlash Modali */}
      <ConfirmModal 
        isOpen={!!deleteId}
        title="O'chirish"
        message="Rostdan ham o'chirib tashlamoqchimisiz?"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
}
