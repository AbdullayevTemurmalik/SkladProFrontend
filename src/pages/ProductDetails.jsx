import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Box, CheckCircle, Ruler, Tags, MapPin, Building2, Calendar, AlertCircle } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Nomi chiqishi uchun barchasini tortib olamiz
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, unitRes, wareRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories'),
          api.get('/units'),
          api.get('/warehouses')
        ]);
        
        setProduct(prodRes.data);
        setCategories(catRes.data);
        setUnits(unitRes.data);
        setWarehouses(wareRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50/50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-5 text-blue-500 font-bold animate-pulse text-xl">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-blue-50/50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <AlertCircle className="w-20 h-20 mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-[#0b1736]">Mahsulot topilmadi</h2>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline font-semibold">Orqaga qaytish</button>
        </div>
      </div>
    );
  }

  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Noma\'lum';
  const unitName = units.find(u => u.id === product.unitId)?.name || 'dona';
  const warehouseName = warehouses.find(w => w.id === product.warehouseId)?.name || 'Noma\'lum ombor';

  return (
    <div className="min-h-screen bg-blue-50/50 flex flex-col font-sans pb-20">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        {/* Orqaga tugmasi */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 font-bold transition-colors mb-8 bg-blue-100/50 hover:bg-blue-100 px-4 py-2 rounded-xl w-fit"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Orqaga
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(37,99,235,0.15)] border border-blue-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Chap Tomon: Rasm */}
          <div className="md:w-5/12 bg-blue-50/50 p-8 flex items-center justify-center relative border-r border-blue-50">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-auto object-contain max-h-[500px] drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center text-blue-200">Rasm yo'q</div>
            )}
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-sm font-black text-blue-600 shadow-sm border border-blue-100 flex items-center uppercase tracking-widest">
              <Tags className="w-4 h-4 mr-2" /> {product.brand}
            </div>
          </div>

          {/* O'ng Tomon: Ma'lumotlar */}
          <div className="md:w-7/12 p-8 lg:p-12">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl lg:text-5xl font-black text-[#0b1736] mb-4 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 text-sm font-bold text-slate-500 mb-8">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">SKU: {product.sku}</span>
                  <span className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Bazada mavjud
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-10">
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center"><Box className="w-4 h-4 mr-1" /> Kategoriya</div>
                <div className="text-lg font-bold text-[#0b1736]">{categoryName}</div>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center"><Calendar className="w-4 h-4 mr-1" /> Ishlab Chiqarilgan Yili</div>
                <div className="text-lg font-bold text-[#0b1736]">{product.year}-yil</div>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center"><Building2 className="w-4 h-4 mr-1" /> Ombor Joylashuvi</div>
                <div className="text-lg font-bold text-[#0b1736]">{warehouseName}</div>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center"><MapPin className="w-4 h-4 mr-1" /> O'lchov Birligi</div>
                <div className="text-lg font-bold text-[#0b1736]">{unitName}</div>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-lg font-bold text-[#0b1736] mb-4 flex items-center">
                <Ruler className="w-5 h-5 mr-2 text-blue-500" /> Gabarit O'lchamlari
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-blue-100 p-4 rounded-2xl text-center shadow-sm">
                  <div className="text-slate-400 font-bold text-xs uppercase mb-1">Bo'yi</div>
                  <div className="text-xl font-black text-blue-600">{product.height} <span className="text-sm">sm</span></div>
                </div>
                <div className="bg-white border border-blue-100 p-4 rounded-2xl text-center shadow-sm">
                  <div className="text-slate-400 font-bold text-xs uppercase mb-1">Eni</div>
                  <div className="text-xl font-black text-blue-600">{product.width} <span className="text-sm">sm</span></div>
                </div>
                <div className="bg-white border border-blue-100 p-4 rounded-2xl text-center shadow-sm">
                  <div className="text-slate-400 font-bold text-xs uppercase mb-1">Balandligi</div>
                  <div className="text-xl font-black text-blue-600">{product.length} <span className="text-sm">sm</span></div>
                </div>
              </div>
            </div>

            <div className="border-t border-blue-100 pt-8 mt-auto">
              <div className="text-slate-400 font-bold text-xs uppercase mb-2 tracking-widest">Jami Qoldiq</div>
              <div className="text-5xl font-black text-[#0b1736] flex items-baseline">
                {product.stock}
                <span className="text-xl font-bold text-slate-500 ml-2">{unitName}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
