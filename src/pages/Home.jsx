import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Search, MapPin, Home as HomeIcon, Package2, Filter, AlertCircle, ChevronDown, Tags, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function CustomSelect({ options, value, onChange, placeholder, icon: Icon, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value.toString() === value.toString());

  return (
    <div className={`relative w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={ref}>
      <div 
        className={`w-full pl-14 pr-12 py-4 bg-blue-950/40 border border-blue-800/50 rounded-2xl focus:ring-2 focus:ring-blue-400 font-medium cursor-pointer transition-all flex items-center justify-between hover:bg-blue-900/40 backdrop-blur-sm text-blue-50 ${disabled ? 'pointer-events-none' : 'shadow-lg'} ${isOpen ? 'ring-2 ring-blue-500 bg-blue-900/60 border-blue-500/50' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="absolute left-5">
          <Icon className={`w-5 h-5 transition-colors ${value ? 'text-blue-300' : 'text-blue-400/70'}`} />
        </div>
        <span className={`truncate text-base ${!value ? 'text-blue-200/70' : 'text-white font-bold'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="absolute right-5 bg-blue-900/50 p-1 rounded-md">
          <ChevronDown className={`w-4 h-4 text-blue-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-200' : ''}`} />
        </div>
      </div>

      <div 
        className={`absolute z-50 w-full mt-3 bg-blue-900 rounded-2xl shadow-2xl border border-blue-700/50 overflow-hidden transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-95 -translate-y-4 pointer-events-none'}`}
      >
        <div className="max-h-72 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
          <div 
            className={`px-5 py-3.5 cursor-pointer transition-colors hover:bg-blue-800 flex items-center ${!value ? 'bg-blue-800/80 font-bold text-white border-l-4 border-blue-400' : 'text-blue-300 border-l-4 border-transparent'}`}
            onClick={() => { onChange(''); setIsOpen(false); }}
          >
            {placeholder}
          </div>
          {options.map(opt => (
            <div 
              key={opt.value}
              className={`px-5 py-3.5 cursor-pointer transition-colors hover:bg-blue-800 flex items-center text-base ${value.toString() === opt.value.toString() ? 'bg-blue-800 font-bold text-white border-l-4 border-blue-400' : 'text-blue-100 border-l-4 border-transparent'}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [regions, setRegions] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProductsCountData, setAllProductsCountData] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const [selectedRegion, setSelectedRegion] = useState(() => sessionStorage.getItem('sklad_region') || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState(() => sessionStorage.getItem('sklad_warehouse') || '');
  const [searchName, setSearchName] = useState(() => sessionStorage.getItem('sklad_search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem('sklad_category') || '');
  
  const [products, setProducts] = useState(() => {
    const saved = sessionStorage.getItem('sklad_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [hasSearched, setHasSearched] = useState(() => sessionStorage.getItem('sklad_hasSearched') === 'true');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('sklad_region', selectedRegion);
    sessionStorage.setItem('sklad_warehouse', selectedWarehouse);
    sessionStorage.setItem('sklad_search', searchName);
    sessionStorage.setItem('sklad_category', selectedCategory);
    sessionStorage.setItem('sklad_hasSearched', hasSearched);
    sessionStorage.setItem('sklad_products', JSON.stringify(products));
  }, [selectedRegion, selectedWarehouse, searchName, selectedCategory, hasSearched, products]);

  useEffect(() => {
    // Hammasini bir marta tortib olamiz
    api.get('/regions').then(res => setRegions(res.data)).catch(console.error);
    api.get('/categories').then(res => setCategories(res.data)).catch(console.error);
    api.get('/warehouses').then(res => setAllWarehouses(res.data)).catch(console.error);
    
    // Mahsulotlar sonini hisoblash uchun faqat ID va warehouseId ni olsak ham bo'ladi, lekin /products hammasini qaytaradi
    api.get('/products').then(res => {
      setAllProductsCountData(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      setWarehouses(allWarehouses.filter(w => w.regionId.toString() === selectedRegion.toString()));
    } else {
      setWarehouses([]);
    }
  }, [selectedRegion, allWarehouses]);

  // Filtrlar (Viloyat, Sklad, Kategoriya) o'zgarganda avtomatik izlash!
  useEffect(() => {
    if (selectedRegion || selectedWarehouse || selectedCategory || hasSearched) {
      executeSearch();
    }
  }, [selectedRegion, selectedWarehouse, selectedCategory]);

  // Ism orqali qidirganda ham avtomatik izlash (Yozishni to'xtatgandan 500ms o'tib)
  useEffect(() => {
    if (hasSearched || searchName) {
      const delay = setTimeout(() => {
        executeSearch();
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [searchName]);

  const handleRegionChange = (val) => {
    setSelectedRegion(val);
    setSelectedWarehouse('');
  };

  const handleSearch = (e) => {
    if(e) e.preventDefault();
    executeSearch();
  };

  const executeSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      let query = '';
      if (selectedRegion) query += `regionId=${selectedRegion}&`;
      if (selectedWarehouse) query += `warehouseId=${selectedWarehouse}&`;
      if (searchName) query += `name=${searchName}&`;
      // Note: Backendda category filter yozilmagan bo'lsa frontendda filter qilamiz
      
      const res = await api.get(`/products/search?${query}`);
      let finalData = res.data;
      
      // Frontend Kategoriya filtri (orqada categoryId bo'lsa uni filter qilamiz)
      if (selectedCategory) {
        finalData = finalData.filter(p => p.categoryId.toString() === selectedCategory.toString());
      }
      
      setProducts(finalData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRegionCount = (regionId) => {
    // Shu viloyatga tegishli barcha skladlar ID sini topamiz
    const regionWarehouseIds = allWarehouses.filter(w => w.regionId === regionId).map(w => w.id);
    return allProductsCountData.filter(p => regionWarehouseIds.includes(p.warehouseId)).length;
  };

  const getWarehouseCount = (warehouseId) => {
    return allProductsCountData.filter(p => p.warehouseId === warehouseId).length;
  };

  const regionOptions = regions.map(r => ({ 
    value: r.id, 
    label: `${r.name} (${getRegionCount(r.id)})` 
  }));
  
  const warehouseOptions = warehouses.map(w => ({ 
    value: w.id, 
    label: `🏢 ${w.name} (${getWarehouseCount(w.id)})` 
  }));

  const highlightMatch = (text, query) => {
    if (!query) return text;
    // Maxsus belgilarni qochirish
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) 
        ? <span key={i} className="text-green-500 font-black">{part}</span> 
        : <span key={i} className="text-[#0b1736]">{part}</span>
    );
  };

  // Autocomplete uchun mahalliy filter
  const autocompleteResults = searchName.trim().length > 0 
    ? allProductsCountData.filter(p => p.name.toLowerCase().includes(searchName.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-blue-50/50 flex flex-col font-sans">
      <Navbar />
      
      {/* Header & Qidiruv Qismi (To'q ko'k va Och ko'k aralash) */}
      <div className="bg-[#0b1736] text-white pt-16 pb-36 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Orqa fon effektlari */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5 text-white drop-shadow-sm">
              Skladlardagi barcha <br/><span className="text-blue-400">tovarlar bazasi</span>
            </h1>
            <p className="text-blue-200/80 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              Viloyat va omboringizni tanlang. Minglab tovarlar orasidan eng keraklisini tezda toping.
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-blue-900/30 p-6 rounded-[2rem] shadow-2xl border border-blue-500/20 backdrop-blur-xl max-w-4xl mx-auto">
            
            {/* 1-Qator: Viloyat va Sklad yonma-yon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <CustomSelect 
                options={regionOptions}
                value={selectedRegion}
                onChange={handleRegionChange}
                placeholder="Barcha Viloyatlar"
                icon={MapPin}
              />
              <CustomSelect 
                options={warehouseOptions}
                value={selectedWarehouse}
                onChange={(val) => setSelectedWarehouse(val)}
                placeholder={selectedRegion ? `Barcha omborlar` : 'Oldin viloyat tanlang'}
                icon={HomeIcon}
                disabled={!selectedRegion}
              />
            </div>

            {/* 2-Qator: Qidiruv va Tugma */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative flex items-center w-full">
                <Search className="absolute left-5 text-blue-400/70 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Mahsulot nomini yozing (masalan, iPhone)..."
                  className="w-full pl-14 pr-4 py-4 bg-blue-950/40 border border-blue-800/50 rounded-2xl text-white focus:ring-2 focus:ring-blue-400 focus:bg-blue-900/60 font-medium placeholder-blue-200/50 transition-all shadow-lg outline-none"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                />
                
                {/* Autocomplete Dropdown */}
                {showSearchDropdown && searchName.trim().length > 0 && (
                  <div className="absolute top-full mt-3 w-full bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-blue-100 overflow-hidden z-50">
                    {autocompleteResults.length > 0 ? (
                      autocompleteResults.map(p => (
                        <div 
                          key={p.id}
                          className="px-5 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                          onClick={() => navigate(`/product/${p.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <img src={p.image} className="w-10 h-10 object-contain rounded-lg bg-white border border-blue-50 p-1" alt="" />
                            <div className="text-base font-bold">
                              {highlightMatch(p.name, searchName)}
                            </div>
                          </div>
                          <div className="text-[10px] text-blue-500 font-bold bg-blue-50 border border-blue-100 px-2 py-1 rounded-md uppercase tracking-wider hidden sm:block">
                            {p.sku}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-5 text-slate-400 text-center font-bold">Hech narsa topilmadi</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Kategoriyalar (Teglar) */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-blue-800/50 pt-5">
              <span className="text-blue-300 text-sm font-semibold flex items-center mr-2">
                <Tags className="w-4 h-4 mr-1.5" /> Kategoriyalar:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${!selectedCategory ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-950/50 text-blue-300 hover:bg-blue-800 border border-blue-800/50'}`}
              >
                Barchasi
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id.toString())}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${selectedCategory === c.id.toString() ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-950/50 text-blue-300 hover:bg-blue-800 border border-blue-800/50'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>

          </form>
        </div>
      </div>

      {/* Natijalar Qismi (Och ko'k) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-24 w-full">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100 p-6 sm:p-8 min-h-[500px]">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-blue-50">
            <h2 className="text-2xl font-black text-[#0b1736] flex items-center">
              <Package2 className="w-7 h-7 mr-3 text-blue-600" />
              Topilgan Mahsulotlar
            </h2>
            {hasSearched && !loading && (
              <div className="bg-blue-50 text-blue-700 py-2.5 px-6 rounded-2xl text-sm font-bold border border-blue-100 flex items-center shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2.5 animate-pulse"></span>
                Jami topildi: {products.length} ta
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-72">
              <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-5 text-blue-500 font-bold animate-pulse text-lg">Qidirilmoqda...</p>
            </div>
          ) : !hasSearched ? (
             <div className="flex flex-col items-center justify-center h-72 text-blue-300">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-5">
                <Filter className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-xl font-bold text-blue-400">Filtrlar orqali kerakli tovarni izlang</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 text-slate-500">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-5">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-xl font-bold text-[#0b1736]">Hech qanday tovar topilmadi</p>
              <p className="text-blue-400 mt-2">Boshqa viloyat yoki nom kiritib ko'ring</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p, idx) => (
                <div key={p.id} className="bg-white rounded-3xl overflow-hidden border-2 border-transparent hover:border-blue-100 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] transition-all duration-300 group flex flex-col animate-in fade-in slide-in-from-bottom-8 bg-blue-50/30" style={{animationDelay: `${(idx % 10) * 50}ms`}}>
                  <div 
                    className="aspect-[4/3] bg-white relative overflow-hidden p-5 flex items-center justify-center cursor-pointer"
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition duration-700 drop-shadow-xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-200">Rasm yo'q</div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black text-[#0b1736] shadow-sm border border-blue-50">
                      Yil: {p.year}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col bg-white">
                    <div className="text-[11px] font-black text-blue-600 mb-2 tracking-widest uppercase bg-blue-50 inline-block px-2 py-1 rounded-md w-fit">{p.brand}</div>
                    <h3 className="text-xl font-black text-[#0b1736] mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{p.name}</h3>
                    <div className="flex items-center text-sm text-blue-500 mb-5 mt-auto">
                      <span className="bg-blue-50 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 border border-blue-100 flex items-center">
                        SKU: {p.sku}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-t border-blue-50 pt-5 mt-auto">
                      <div>
                        <div className="text-[11px] uppercase font-bold text-blue-400 mb-1 tracking-wider">Ombor qoldig'i</div>
                        <div className="text-3xl font-black text-[#0b1736] leading-none">{p.stock} <span className="text-sm font-bold text-blue-400 uppercase">ta</span></div>
                      </div>
                      <button 
                        onClick={() => navigate(`/product/${p.id}`)}
                        className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> Batafsil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
