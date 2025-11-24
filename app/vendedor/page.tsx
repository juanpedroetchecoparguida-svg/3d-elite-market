'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Upload, ArrowLeft, Loader2, Image as ImageIcon, Package, Truck, CheckCircle, X, Users, Calendar, Crown, DollarSign, History, FileCode, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
// IMPORTAMOS EL ARCHIVO MAESTRO
import { PRODUCT_CATEGORIES } from '../constants';

export default function SellerDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedSubscriberData, setSelectedSubscriberData] = useState<{userId: string, productId: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        router.push('/'); 
        return;
    }

    const { data: myProducts } = await supabase.from('products').select('id').eq('owner_id', session.user.id);
    
    if (myProducts && myProducts.length > 0) {
        const productIds = myProducts.map(p => p.id);
        
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*, products(*)')
          .in('product_id', productIds)
          .order('created_at', { ascending: false });

        if (allOrders) {
            setSales(allOrders.filter(o => o.type !== 'subscription'));
            setSubscribers(allOrders.filter(o => o.type === 'subscription'));
        }

        const { data: allShipments } = await supabase
            .from('shipments')
            .select('*')
            .in('product_id', productIds);
            
        if (allShipments) setShipments(allShipments);
    }
    setLoading(false);
  };

  const confirmShipping = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from('orders').update({ 
        status: 'shipped',
        shipping_company: e.target.company.value,
        tracking_code: e.target.code.value
    }).eq('id', selectedOrder);

    if (!error) {
        loadData();
        setShowTrackingModal(false);
    }
  };

  const confirmMonthlyShipment = async (e: any) => {
    e.preventDefault();
    if (!selectedSubscriberData) return;

    const { error } = await supabase.from('shipments').insert({
        subscriber_id: selectedSubscriberData.userId,
        product_id: selectedSubscriberData.productId,
        month: e.target.month.value,
        content: e.target.content.value,
        shipping_company: e.target.company.value,
        tracking_code: e.target.code.value
    });

    if (!error) {
        alert('¡Envío registrado! El cliente lo verá en su perfil.');
        setShowShipmentModal(false);
        loadData(); 
    } else {
        alert('Error: ' + error.message);
    }
  };

  const handlePublish = async (e: any) => {
    e.preventDefault();
    if (galleryFiles.length === 0) return alert('Sube al menos una imagen.');
    setUploading(true);
    const form = e.target;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const galleryUrls: string[] = [];

        for (const file of galleryFiles) {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
            galleryUrls.push(publicUrl);
        }

        const mainImage = galleryUrls[0];

        await supabase.from('products').insert({
            title: form.title.value,
            description: form.description.value,
            price: parseFloat(form.price.value),
            category: form.category.value,
            country: form.country.value,
            image_url: mainImage,     
            gallery: galleryUrls,     
            owner_id: session?.user.id
        });

        alert('¡Producto Publicado!');
        setGalleryFiles([]); 
        form.reset();
        loadData();
        setActiveTab('sales');
    } catch (error: any) {
        alert('Error: ' + error.message);
    } finally {
        setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          setGalleryFiles(prev => [...prev, ...newFiles].slice(0, 5));
      }
  };

  const removeFile = (index: number) => {
      setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getShipmentStatus = (userId: string, productId: string) => {
      return shipments.find(s => s.subscriber_id === userId && s.product_id === productId);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      
      <div className="border-b border-white/10 bg-[#111] p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/')} className="bg-black p-2 rounded-full hover:bg-white hover:text-black transition-all"><ArrowLeft className="w-5 h-5"/></button>
                <h1 className="font-bold text-xl tracking-tight">Maker<span className="text-emerald-400">Studio</span> <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 ml-2">Vendedor</span></h1>
            </div>
            <div className="flex bg-black rounded-lg p-1 overflow-x-auto">
                <button onClick={() => setActiveTab('sales')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'sales' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>Ventas</button>
                <button onClick={() => setActiveTab('subs')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'subs' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>Suscriptores</button>
                <button onClick={() => setActiveTab('publish')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'publish' ? 'bg-white text-black' : 'text-emerald-400 hover:text-white'}`}>Publicar Nuevo</button>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        
        {activeTab === 'sales' && (
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Package className="text-emerald-400"/> Pedidos Unitarios</h2>
                {loading ? <div className="text-center text-gray-500">Cargando tus ventas...</div> : sales.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-gray-500">No tienes ventas directas aún.</div>
                ) : (
                    <div className="grid gap-4">
                        {sales.map((sale) => (
                            <div key={sale.id} className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <img src={sale.products?.image_url} className="w-20 h-20 rounded-lg object-cover bg-gray-800 border border-white/10" />
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{sale.products?.title}</h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="bg-emerald-900/30 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                <DollarSign className="w-3 h-3"/> 
                                                {sale.type === 'digital' ? (sale.products?.price * 0.4).toFixed(2) : sale.products?.price}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">{sale.type}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Cliente: {sale.user_email}</p>
                                    </div>
                                </div>
                                {sale.status === 'shipped' ? (
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-500/20">
                                        <CheckCircle className="w-5 h-5" /> Enviado
                                    </div>
                                ) : sale.type === 'physical' ? (
                                    <button onClick={() => {setSelectedOrder(sale.id); setShowTrackingModal(true)}} className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2 text-sm">
                                        <Truck className="w-4 h-4" /> Despachar
                                    </button>
                                ) : (
                                    <div className="text-gray-500 text-sm flex items-center gap-2"><FileCode className="w-4 h-4"/> Auto-entregado</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'subs' && (
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users className="text-purple-400"/> Suscriptores Activos</h2>
                {loading ? <div className="text-center text-gray-500">Cargando tus suscriptores...</div> : subscribers.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-gray-500">No tienes suscriptores en tus productos aún.</div>
                ) : (
                    <div className="grid gap-4">
                        {subscribers.map((sub) => {
                            const shipment = getShipmentStatus(sub.user_id, sub.product_id);
                            return (
                                <div key={sub.id} className="bg-[#111] border border-purple-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-purple-900/5 transition-colors">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="relative">
                                            <img src={sub.products?.image_url} className="w-20 h-20 rounded-lg object-cover bg-gray-800 border border-purple-500/30" />
                                            <div className="absolute -top-2 -right-2 bg-purple-600 rounded-full p-1">
                                                <Crown className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{sub.products?.title}</h3>
                                            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mt-1 bg-purple-900/20 px-2 py-0.5 rounded w-fit">
                                                <DollarSign className="w-3 h-3"/> 9.00 / mes
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Suscriptor: {sub.user_email}</p>
                                            
                                            {shipment && (
                                                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-bold border border-emerald-500/30 px-2 py-1 rounded w-fit bg-emerald-900/10">
                                                    <CheckCircle className="w-3 h-3"/>
                                                    {shipment.month}: Enviado
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {shipment ? (
                                        <button disabled className="bg-gray-800 text-gray-500 px-6 py-3 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed border border-white/5">
                                            <History className="w-4 h-4" /> Esperando próximo mes
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setSelectedSubscriberData({userId: sub.user_id, productId: sub.product_id}); 
                                                setShowShipmentModal(true)
                                            }}
                                            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-500 transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20"
                                        >
                                            <Package className="w-4 h-4" /> Enviar Caja del Mes
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'publish' && (
            <div className="max-w-xl mx-auto">
                <form onSubmit={handlePublish} className="space-y-6 bg-[#111] p-8 rounded-2xl border border-white/10">
                    
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Fotos del Producto (Máx 5)</label>
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer relative group bg-black/50">
                            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                    <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-emerald-400"/>
                                </div>
                                <p className="text-sm text-gray-300 font-bold">Arrastra fotos o haz clic</p>
                            </div>
                        </div>
                        {galleryFiles.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {galleryFiles.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/20 group">
                                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                                        {idx === 0 && <div className="absolute bottom-0 left-0 w-full bg-emerald-600 text-[10px] text-center text-white font-bold">PORTADA</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <input name="title" required className="w-full bg-black border-white/20 rounded-lg p-3 text-white font-bold" placeholder="Nombre del Producto" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400">$</span>
                            <input name="price" type="number" step="0.01" required className="w-full bg-black border-white/20 rounded-lg p-3 pl-8 text-white font-bold" placeholder="Precio" />
                        </div>
                        <select name="country" className="w-full bg-black border-white/20 rounded-lg p-3 text-white font-bold">
                            <option value="Argentina">🇦🇷 Argentina</option>
                            <option value="España">🇪🇸 España</option>
                            <option value="Mexico">🇲🇽 Mexico</option>
                            <option value="Colombia">🇨🇴 Colombia</option>
                            <option value="USA">🇺🇸 USA</option>
                        </select>
                    </div>
                    
                    {/* SELECTOR DE CATEGORÍAS DINÁMICO - USA EL ARCHIVO MAESTRO */}
                    <select name="category" required className="w-full bg-black border-white/20 rounded-lg p-3 text-white font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2087.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%20100c3.6-3.6%205.4-7.8%205.4-12.8%200-5-1.8-9.3-5.4-12.9z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px] bg-[right_1rem_center] pr-10">
                        <option value="" disabled selected>Selecciona una Categoría</option>
                        {PRODUCT_CATEGORIES.map((group, idx) => (
                            <optgroup key={idx} label={group.group} className={`${group.colorClass} font-bold`}>
                                {group.options.map((option, optIdx) => (
                                    <option key={optIdx} className="text-white" value={option}>{option}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    
                    <textarea name="description" required className="w-full bg-black border-white/20 rounded-lg p-3 text-white h-32" placeholder="Descripción detallada del producto y qué incluye la suscripción..." />
                    
                    <button type="submit" disabled={uploading || galleryFiles.length === 0} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-500 flex justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploading ? <Loader2 className="animate-spin"/> : <Upload className="w-5 h-5"/>} PUBLICAR PRODUCTO
                    </button>
                </form>
            </div>
        )}

      </div>

      {/* MODALES... (El resto del archivo sigue igual, ya lo has copiado todo) */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#111] border border-white/10 w-full max-w-md p-6 rounded-2xl relative">
                <button onClick={() => setShowTrackingModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                <h3 className="text-xl font-bold text-white mb-4">Despachar Pedido Físico</h3>
                <form onSubmit={confirmShipping} className="space-y-4">
                    <input name="company" required placeholder="Empresa de Transporte (ej: Correo Arg)" className="w-full bg-black border border-white/20 rounded-lg p-3 text-white"/>
                    <input name="code" required placeholder="Código de Seguimiento (Tracking)" className="w-full bg-black border border-white/20 rounded-lg p-3 text-white font-mono"/>
                    <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl mt-2 hover:bg-gray-200 transition-colors">Confirmar Despacho</button>
                </form>
            </div>
        </div>
      )}

      {showShipmentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#111] border border-purple-500/30 w-full max-w-md p-6 rounded-2xl relative shadow-lg shadow-purple-900/20">
                <button onClick={() => setShowShipmentModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Calendar className="text-purple-400"/> Registrar Caja del Mes</h3>
                <form onSubmit={confirmMonthlyShipment} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">MES DEL ENVÍO</label>
                        <select name="month" className="w-full bg-black border border-white/20 rounded-lg p-3 text-white font-bold">
                            {Array.from({ length: 6 }, (_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() + i);
                                return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                            }).map(monthStr => (
                                <option key={monthStr} value={monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}>{monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">CONTENIDO DE LA CAJA</label>
                        <input name="content" required placeholder="Ej: Figura Goku SSJ + Llavero + Stickers" className="w-full bg-black border border-white/20 rounded-lg p-3 text-white"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input name="company" required placeholder="Empresa Transporte" className="w-full bg-black border border-white/20 rounded-lg p-3 text-white"/>
                        <input name="code" required placeholder="Tracking ID" className="w-full bg-black border border-white/20 rounded-lg p-3 text-white font-mono"/>
                    </div>
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl mt-2 transition-colors">Registrar Envío Mensual</button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}