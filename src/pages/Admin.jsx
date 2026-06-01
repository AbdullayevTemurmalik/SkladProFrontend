import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  PlusCircle,
  Trash2,
  LayoutDashboard,
  Database,
  Tags,
  Box,
  ExternalLink,
  Edit,
  X,
  MapPin,
  Home as HomeIcon,
  Users,
  Eye,
  EyeOff
} from "lucide-react";

export default function Admin() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  // Oflayn sinxronizatsiya uchun
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState(() =>
    JSON.parse(localStorage.getItem("offline_queue") || "[]"),
  );

  // --- Bulk Upload States ---
  const [bulkRegion, setBulkRegion] = useState("");
  const [bulkWarehouseId, setBulkWarehouseId] = useState("");
  const [bulkFormWarehouses, setBulkFormWarehouses] = useState([]);

  // Yangi tovar formasi
  const initialForm = {
    name: "",
    brand: "",
    sku: "",
    stock: 0,
    year: 2024,
    image: "https://picsum.photos/400/400",
    categoryId: "",
    warehouseId: "",
    unitId: "",
    height: 10,
    width: 10,
    length: 10,
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (navigator.onLine) {
      syncOfflineData();
    }
    fetchProducts();
    api.get("/regions").then((res) => {
      setRegions(res.data);
      localStorage.setItem("cached_regions", JSON.stringify(res.data));
      if (res.data.length) setFormRegion(res.data[0].id);
    }).catch(() => {
      const cached = JSON.parse(localStorage.getItem("cached_regions") || "[]");
      setRegions(cached);
      if (cached.length) setFormRegion(cached[0].id);
    });

    api.get("/categories").then((res) => {
      setCategories(res.data);
      localStorage.setItem("cached_categories", JSON.stringify(res.data));
      if (res.data.length) setFormData((f) => ({ ...f, categoryId: res.data[0].id }));
    }).catch(() => {
      const cached = JSON.parse(localStorage.getItem("cached_categories") || "[]");
      setCategories(cached);
      if (cached.length) setFormData((f) => ({ ...f, categoryId: cached[0].id }));
    });

    api.get("/warehouses").then((res) => {
      setWarehouses(res.data);
      localStorage.setItem("cached_warehouses", JSON.stringify(res.data));
    }).catch(() => {
      setWarehouses(JSON.parse(localStorage.getItem("cached_warehouses") || "[]"));
    });

    api.get("/units").then((res) => {
      setUnits(res.data);
      localStorage.setItem("cached_units", JSON.stringify(res.data));
      if (res.data.length) setFormData((f) => ({ ...f, unitId: res.data[0].id }));
    }).catch(() => {
      const cached = JSON.parse(localStorage.getItem("cached_units") || "[]");
      setUnits(cached);
      if (cached.length) setFormData((f) => ({ ...f, unitId: cached[0].id }));
    });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [offlineQueue]);

  const handleBulkRegionChange = (e) => {
    const rId = e.target.value;
    setBulkRegion(rId);
    setBulkWarehouseId("");
    if (rId) {
      setBulkFormWarehouses(warehouses.filter((w) => w.regionId == rId));
    } else {
      setBulkFormWarehouses([]);
    }
  };

  const syncOfflineData = async () => {
    const queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
    if (queue.length === 0) return;

    showToast(`${queue.length} ta oflayn mahsulot bazaga yuborilmoqda...`);
    let successCount = 0;
    let failedQueue = [];
    
    for (let p of queue) {
      try {
        if (p.type === 'bulk') {
          await api.post('/products/bulk-upload', { csvData: p.csvData, warehouseId: p.warehouseId });
        } else {
          await api.post("/products", p);
        }
        successCount++;
      } catch (error) {
        console.error(error);
        if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
          failedQueue.push(p);
        }
      }
    }
    
    if (failedQueue.length > 0) {
      localStorage.setItem("offline_queue", JSON.stringify(failedQueue));
      setOfflineQueue(failedQueue);
      showToast(`Qisman tarmoq xatosi: ${failedQueue.length} tasi oflayn qoldi.`);
    } else {
      localStorage.removeItem("offline_queue");
      setOfflineQueue([]);
    }
    fetchProducts();
    if (successCount > 0)
      showToast(`${successCount} ta mahsulot muvaffaqiyatli sinxronlandi!`);
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      const fetchedData = res.data.reverse().slice(0, 50);
      setProducts(fetchedData);
      localStorage.setItem("cached_products", JSON.stringify(fetchedData));
    } catch (error) {
      console.error(error);
      const cached = JSON.parse(localStorage.getItem("cached_products") || "[]");
      setProducts(cached);
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
    setFormData({ ...formData, warehouseId: "" });
  };

  const handleEditRegionChange = (e) => {
    setEditRegion(e.target.value);
    setEditProduct({ ...editProduct, warehouseId: "" });
  };

  const openEditModal = (p) => {
    const w = warehouses.find((wh) => wh.id === p.warehouseId);
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

      if (!isOnline) {
        const newQueue = [...offlineQueue, payload];
        setOfflineQueue(newQueue);
        localStorage.setItem("offline_queue", JSON.stringify(newQueue));
        
        const fakeProduct = { ...payload, id: `offline-${Date.now()}` };
        const newProducts = [fakeProduct, ...products].slice(0, 50);
        setProducts(newProducts);
        localStorage.setItem("cached_products", JSON.stringify(newProducts));

        showToast(
          "Internet yo'q! Mahsulot oflayn saqlandi, UI da ko'rinadi va internet kelganda bazaga yuboriladi.",
        );
        setFormData({
          ...initialForm,
          categoryId: formData.categoryId,
          warehouseId: "",
          unitId: formData.unitId,
        });
      } else {
        try {
          await api.post("/products", payload);
          showToast("Yangi mahsulot muvaffaqiyatli qo'shildi!");
          fetchProducts();
          setFormData({
            ...initialForm,
            categoryId: formData.categoryId,
            warehouseId: "",
            unitId: formData.unitId,
          });
        } catch (error) {
          if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
            const newQueue = [...offlineQueue, payload];
            setOfflineQueue(newQueue);
            localStorage.setItem("offline_queue", JSON.stringify(newQueue));
            showToast("Tarmoq xatosi! Mahsulot oflayn saqlandi, ulanish tiklanganda yuboriladi.");
            setFormData({ ...initialForm, categoryId: formData.categoryId, warehouseId: "", unitId: formData.unitId });
          } else {
            console.error(error);
            setErrorModal(`Xatolik yuz berdi: ${error.response?.data?.error || error.message}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
      setErrorModal(
        `Formani yuklashda xatolik yuz berdi: ${error.message}`,
      );
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!bulkWarehouseId) {
      setErrorModal("Iltimos, Excel yuklashdan oldin Ombor (Sklad)ni tanlang!");
      e.target.value = "";
      return;
    }

    showToast("Fayl o'qilmoqda...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      let text = event.target.result;

      try {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          if (!window.XLSX) {
            showToast("Excel moduli yuklanmoqda... (Kutib turing)");
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
              script.onload = () => resolve();
              script.onerror = () => reject(new Error("XLSX modulini yuklashda xatolik"));
              document.head.appendChild(script);
            });
          }
          const workbook = window.XLSX.read(text, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          text = window.XLSX.utils.sheet_to_csv(worksheet);
        }

        if (!isOnline) {
          const newQueue = [...offlineQueue, { type: 'bulk', csvData: text, warehouseId: bulkWarehouseId }];
          setOfflineQueue(newQueue);
          localStorage.setItem("offline_queue", JSON.stringify(newQueue));
          showToast("Internet yo'q! Fayl oflayn xotiraga saqlandi. Internet yonganda bazaga yuboriladi.");
        } else {
          showToast("Fayl serverga yuborilmoqda...");
          const res = await api.post('/products/bulk-upload', { csvData: text, warehouseId: bulkWarehouseId });
          fetchProducts();
          showToast(res.data.message || "Barcha mahsulotlar bazaga muvaffaqiyatli qo'shildi!");
        }
      } catch (err) {
        if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          const newQueue = [...offlineQueue, { type: 'bulk', csvData: text, warehouseId: bulkWarehouseId }];
          setOfflineQueue(newQueue);
          localStorage.setItem("offline_queue", JSON.stringify(newQueue));
          showToast("Tarmoq xatosi! Fayl oflayn saqlandi, ulanish tiklanganda yuboriladi.");
        } else {
          console.error(err);
          setErrorModal(err.response?.data?.error || err.message || "Faylni yuklashda xatolik yuz berdi");
        }
      }
    };
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
    
    e.target.value = ""; // inputni tozalash
  };

  if (!isAuthenticated) return null;

  const formWarehouses = warehouses.filter(
    (w) => w.regionId.toString() === formRegion.toString(),
  );
  const editWarehouses = warehouses.filter(
    (w) => w.regionId.toString() === editRegion.toString(),
  );

  // Kichik va ixcham qora (To'q ko'k) input stili
  const inputStyle =
    "w-full px-3 py-1.5 bg-blue-950/60 border border-blue-800/50 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:bg-blue-900/80 text-sm font-medium placeholder-blue-200/40 transition-all shadow-inner outline-none";
  const labelStyle =
    "block text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1 flex items-center";

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-blue-400" /> Yangi
                Mahsulot
              </h2>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => navigate('/users')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center"
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Foydalanuvchilarni ko'rish
                </button>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center ${isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                >
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </span>
                {offlineQueue.length > 0 && (
                  <span className="text-[9px] text-yellow-400 font-bold mt-1">
                    Kutmoqda: {offlineQueue.length} ta
                  </span>
                )}
              </div>
            </div>



            <form onSubmit={handleSubmit} className="space-y-3 mb-6">
              {/* Viloyat va Ombor bitta qatorda */}
              <div className="grid grid-cols-2 gap-3 bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
                <div>
                  <label className={labelStyle}>
                    <MapPin className="w-3 h-3 mr-1 text-blue-400" /> Viloyat
                  </label>
                  <select
                    name="region"
                    value={formRegion}
                    onChange={handleFormRegionChange}
                    className={inputStyle}
                  >
                    <option value="" className="text-black">
                      Tanlang
                    </option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id} className="text-black">
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>
                    <HomeIcon className="w-3 h-3 mr-1 text-blue-400" /> Ombor
                  </label>
                  <select
                    required
                    name="warehouseId"
                    value={formData.warehouseId}
                    onChange={handleChange}
                    className={inputStyle}
                    disabled={!formRegion}
                  >
                    <option value="" className="text-black">
                      {formRegion ? "Tanlang" : "Kutish..."}
                    </option>
                    {formWarehouses.map((w) => (
                      <option key={w.id} value={w.id} className="text-black">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelStyle}>
                  <Box className="w-3 h-3 mr-1 text-blue-400" /> Nomi
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="Mahsulot nomi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>
                    <Tags className="w-3 h-3 mr-1 text-blue-400" /> Brend
                  </label>
                  <input
                    required
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="Brend"
                  />
                </div>
                <div>
                  <label className={labelStyle}>SKU (Artikul)</label>
                  <input
                    required
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="Masalan: IPH-15-PRO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Kategoriya</label>
                  <select
                    required
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="" className="text-black">
                      Tanlang
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="text-black">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>
                    <ExternalLink className="w-3 h-3 mr-1 text-blue-400" /> Rasm
                    URL
                  </label>
                  <input
                    required
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className={`${inputStyle} text-blue-400`}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelStyle}>Birlik</label>
                  <select
                    required
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id} className="text-black">
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Yili</label>
                  <input
                    required
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Qoldiq</label>
                  <input
                    required
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelStyle}>Bo'yi (sm)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Eni (sm)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Uzunligi (sm)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2.5 rounded-lg transition-all shadow-md shadow-blue-600/30 mt-2 text-sm border border-blue-400/50"
              >
                Qo'shish
              </button>
            </form>

            {/* Alohida Excel Yuklash qismi */}
            <div className="bg-blue-950/40 p-4 rounded-xl border border-blue-500/30 mt-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                <Database className="w-4 h-4 mr-2 text-blue-400" />
                Ommaviy yuklash (Excel)
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelStyle}>Viloyatni tanlang</label>
                  <select
                    value={bulkRegion}
                    onChange={handleBulkRegionChange}
                    className={inputStyle}
                  >
                    <option value="" className="text-black">Tanlang</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id} className="text-black">{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Omborni tanlang</label>
                  <select
                    value={bulkWarehouseId}
                    onChange={(e) => setBulkWarehouseId(e.target.value)}
                    className={inputStyle}
                    disabled={!bulkRegion}
                  >
                    <option value="" className="text-black">{bulkRegion ? "Tanlang" : "Kutish..."}</option>
                    {bulkFormWarehouses.map((w) => (
                      <option key={w.id} value={w.id} className="text-black">{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <input
                type="file"
                onChange={handleFileUpload}
                disabled={!bulkWarehouseId}
                className={`w-full text-xs text-blue-200 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white ${!bulkWarehouseId ? 'opacity-50 cursor-not-allowed' : 'hover:file:bg-blue-500 cursor-pointer'}`}
              />
              <p className="text-[10px] text-slate-400 mt-2">
                <b>1.</b> Skladni tanlang. <b>2.</b> Excel ma'lumotlarini yuklang. Sarlavhalar (Header) bo'lmasa ham dastur aqlli o'qib, o'sha skladga saqlaydi! Rasmlar local nomlari bilan (masalan: 1.jpg) yozilsa chiqadi.
              </p>
            </div>
          </div>
        </div>

        {/* O'ng tomon: Barcha mahsulotlar (To'q ko'k Tema) */}
        <div className="lg:w-2/3">
          <div className="bg-blue-900/20 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-500/20 p-5 sm:p-6">
            <h2 className="text-xl font-black text-white flex items-center mb-5 pb-3 border-b border-blue-800/50">
              <LayoutDashboard className="w-5 h-5 mr-3 text-blue-400" />{" "}
              Boshqaruv (So'nggi 50 ta)
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
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-800/30 transition-colors group"
                    >
                      <td className="py-2.5 pl-2 pr-3 flex items-center gap-3">
                        <img
                          src={
                            p.image?.startsWith("http") || p.image?.startsWith("data:")
                              ? p.image
                              : `${api.defaults.baseURL.replace('/api', '')}/uploads/${p.image}`
                          }
                          alt=""
                          className="w-10 h-10 rounded-lg object-contain bg-white/10 backdrop-blur-sm border border-blue-500/30 p-0.5"
                        />
                        <span className="font-mono text-xs font-bold text-blue-400/70">
                          #{p.id}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="font-bold text-white text-sm mb-0.5">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-bold text-blue-300 bg-blue-900/50 inline-block px-1.5 py-0.5 rounded border border-blue-700/50">
                          {p.brand} • {p.sku}
                        </div>
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
              <button
                onClick={() => setEditProduct(null)}
                className="p-1.5 bg-blue-900/50 hover:bg-blue-800 rounded-full text-blue-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 relative z-10">
              <div className="grid grid-cols-2 gap-3 bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
                <div>
                  <label className={labelStyle}>
                    <MapPin className="w-3 h-3 mr-1 text-blue-400" /> Viloyat
                  </label>
                  <select
                    name="editRegion"
                    value={editRegion}
                    onChange={handleEditRegionChange}
                    className={inputStyle}
                  >
                    <option value="" className="text-black">
                      Tanlang
                    </option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id} className="text-black">
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>
                    <HomeIcon className="w-3 h-3 mr-1 text-blue-400" /> Ombor
                  </label>
                  <select
                    required
                    name="warehouseId"
                    value={editProduct.warehouseId}
                    onChange={handleEditChange}
                    className={inputStyle}
                    disabled={!editRegion}
                  >
                    <option value="" className="text-black">
                      {editRegion ? "Tanlang" : "Kutish..."}
                    </option>
                    {editWarehouses.map((w) => (
                      <option key={w.id} value={w.id} className="text-black">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Nomi</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={editProduct.name}
                  onChange={handleEditChange}
                  className={inputStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Brend</label>
                  <input
                    required
                    type="text"
                    name="brand"
                    value={editProduct.brand}
                    onChange={handleEditChange}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>SKU (Artikul)</label>
                  <input
                    required
                    type="text"
                    name="sku"
                    value={editProduct.sku}
                    onChange={handleEditChange}
                    className={inputStyle}
                    placeholder="Masalan: IPH-15-PRO"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Kategoriya</label>
                  <select
                    required
                    name="categoryId"
                    value={editProduct.categoryId}
                    onChange={handleEditChange}
                    className={inputStyle}
                  >
                    <option value="" className="text-black">
                      Tanlang
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="text-black">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>
                    <ExternalLink className="w-3 h-3 mr-1 text-blue-400" /> Rasm
                    URL
                  </label>
                  <input
                    required
                    type="text"
                    name="image"
                    value={editProduct.image}
                    onChange={handleEditChange}
                    className={`${inputStyle} text-blue-400`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelStyle}>Birlik</label>
                  <select
                    required
                    name="unitId"
                    value={editProduct.unitId}
                    onChange={handleEditChange}
                    className={inputStyle}
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id} className="text-black">
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Yili</label>
                  <input
                    required
                    type="number"
                    name="year"
                    value={editProduct.year}
                    onChange={handleEditChange}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Qoldiq</label>
                  <input
                    required
                    type="number"
                    name="stock"
                    value={editProduct.stock}
                    onChange={handleEditChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelStyle}>Bo'yi (sm)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="height"
                    value={editProduct.height}
                    onChange={handleEditChange}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Eni (sm)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="width"
                    value={editProduct.width}
                    onChange={handleEditChange}
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Uzunligi (sm)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="length"
                    value={editProduct.length}
                    onChange={handleEditChange}
                    className={inputStyle}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2.5 rounded-lg transition-all shadow-md mt-2 text-sm border border-blue-400/50"
              >
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
              <h3 className="text-xl font-black text-[#0b1736] mb-2">
                Xatolik!
              </h3>
              <p className="text-sm font-bold text-slate-500 mb-6">
                {errorModal}
              </p>
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
