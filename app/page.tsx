'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MapPin, Package, ShoppingBag, FileCode, Crown, Loader2, Lock, CheckCircle, ArrowRight, PlusCircle, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // Estados
  const [user, setUser] = useState<any>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  
  // Modales
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Datos
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState(['Todas']);

  // INICIALIZACIÓN DEL SISTEMA
  useEffect(() => {
    const initSystem = async () => {
      // 1. Cargar Usuario
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      if (currentUser) setUser(currentUser);

      // 2. Detectar si venimos de un pago exitoso de Stripe
      const query = new URLSearchParams(window.location.search);
      if (query.get('success')) {
        setShowSuccess(true);
        window.history.replaceState({}, document.title, "/"); // Limpiar URL
        
        // --- GUARDAR PEDIDO EN BASE DE DATOS ---
        // Recuperamos qué producto estaba comprando
        const pendingOrder = localStorage.getItem('pendingOrder');
        if (pendingOrder && currentUser) {
            try {
                const orderData = JSON.parse(pendingOrder);
                await supabase.from('orders').insert({
                    user_id: currentUser.id,
                    product_id: orderData.productId,
                    type: orderData.type,
                    status: 'paid' // O 'pending_shipment'
                });
                localStorage.removeItem('pendingOrder'); // Limpiar memoria
            } catch (e) {
                console.error("Error guardando pedido:", e);
            }
        }
        // ---------------------------------------

        // Carga silenciosa (ya sabemos el país, no molestamos)
        checkUserAndLoad(true, currentUser);
        return;
      }

      // 3. Carga normal
      checkUserAndLoad(false, currentUser);
    };

    initSystem();
  }, []);

  const checkUserAndLoad = async (isAfterPurchase: boolean, currentUser: any) => {
    if (currentUser) {
      const { data: profile } = await supabase.from('profiles').select('country').eq('id', currentUser.id).single();
      if (profile?.country) {
        setUserCountry(profile.country);
        updateCategoriesByCountry(profile.country);
        fetchRealProducts(profile.country);
      } else {
        if (!isAfterPurchase) setShowCountryModal(true);
      }
    } else {
      if (!isAfterPurchase) setShowCountryModal(true);
    }
  };

  // Lógica de Categorías
  const updateCategoriesByCountry = (country: string) => {
    // Puedes personalizar esto más si quieres
    if (country === 'Argentina') setActiveCategories(['Dragon Ball 3D', 'Plantas 3D', 'Mascotas 3D']);
    else if (country === 'España') setActiveCategories(['SXTOYS 3D', 'Anime', 'Gadgets']);
    else setActiveCategories(['Anime', 'Gadgets', 'Mascotas']);
  };

  // Traer productos
  const fetchRealProducts = async (country: string) => {
    setLoadingProducts(true);
    const { data } = await supabase.from('products').select('*').eq('country', country);
    if (data) setProducts(data);
    setLoadingProducts(false);
  };

  // Seleccionar País
  const selectCountry = async (country: string) => {
    setUserCountry(country);
    updateCategoriesByCountry(country);
    setShowCountryModal(false);
    fetchRealProducts(country);
    if (user) await supabase.from('profiles').update({ country: country }).eq('id', user.id);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } });
  };

  const goToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  // IR AL PERFIL (NUEVO)
  const goToProfile = () => {
    router.push('/perfil');
  };

  // PROCESO DE PAGO
  const handleCheckout = async (e: any, product: any, type: 'physical' | 'digital' | 'subscription') => {
    e.stopPropagation();
    if (!user) return handleLogin();
    
    setProcessingPayment(product.id + type);

    // Guardamos la intención de compra por si el usuario paga
    localStorage.setItem('pendingOrder', JSON.stringify({ productId: product.id, type: type }));

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, title: product.title, price: product.price, type, user_email: user.email }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else alert('Error: Faltan claves de Stripe en .env.local');
    } catch (error) { alert('Error de conexión.'); } 
    finally { setProcessingPayment(null); }
  };

  // PANTALLA DE ÉXITO
  if (showSuccess) {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="w-full max-w-md p-12 bg-[#0A0A0A] border border-emerald-500/30 rounded-3xl text-center shadow-[0_0_60px_rgba(16,185,129,0.1)]">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                   <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">¡Pago Recibido!</h2>
                <p className="text-gray-400 mb-8">Hemos guardado tu pedido en tu perfil.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => router.push('/perfil')} className="w-full bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors">Ver Mi Pedido</button>
                    <button onClick={() => setShowSuccess(false)} className="text-sm text-gray-500 hover:text-white transition-colors">Seguir Comprando</button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 top-0 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><span className="text-black font-bold text-xl">3D</span></div>
            <span className="font-bold text-xl tracking-tight cursor-pointer" onClick={() => window.location.href='/'}>ELITE MARKET</span>
          </div>
          <div className="flex items-center gap-4">
             
             {/* BOTÓN VENDEDOR */}
             {user && (
                <button onClick={() => router.push('/vendedor')} className="hidden md:flex items-center gap-2 bg-emerald-900/20 text-emerald-400 border border-emerald-500/40 px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all">
                    <PlusCircle className="w-3 h-3" />
                    VENDER
                </button>
             )}

             <button onClick={() => setShowCountryModal(true)} className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white text-xs uppercase tracking-widest transition-colors">
               <MapPin className="w-3 h-3" /> {userCountry || 'UBICACIÓN'}
             </button>
             
             {/* AVATAR CONECTADO AL PERFIL */}
             {user ? (
                <div 
                    onClick={goToProfile} 
                    className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs border border-white cursor-pointer hover:scale-110 hover:ring-2 hover:ring-blue-400 transition-all shadow-lg"
                    title="Ir a mi Perfil"
                >
                    {user.email?.charAt(0).toUpperCase()}
                </div>
             ) : (
                <button onClick={handleLogin} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition">Entrar</button>
             )}
          </div>
        </div>
      </nav>

      <main className="pt-0 pb-12 w-full">
        
        {/* HERO SECTION */}
        <div className="relative h-[500px] flex items-center justify-center border-b border-white/10 mb-12">
            <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1615840287214-7ff58936c4cf?q=80&w=1920" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/40"></div>
            </div>
            <div className="relative z-10 text-center px-4 max-w-3xl mx-auto mt-10">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-white drop-shadow-2xl">
                  Mundo 3D Premium
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Descarga modelos listos para imprimir o recíbelos en tu casa. Calidad de estudio verificada en {userCountry || 'tu región'}.
                </p>
                
                <div className="flex flex-wrap justify-center gap-3">
                    {activeCategories.map(cat => (
                        <button key={cat} className="px-6 py-2 bg-white/10 hover:bg-white hover:text-black backdrop-blur-md border border-white/20 rounded-full text-sm font-bold transition-all uppercase tracking-wider">
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* GRID DE PRODUCTOS */}
        <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-emerald-400"/> Tendencias en {userCountry}</h2>
            
            {loadingProducts ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {products.length > 0 ? products.map((product) => (
                <div 
                    key={product.id} 
                    onClick={() => goToProduct(product.id)}
                    className="group relative bg-[#0A0A0A] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                >
                    <div className="aspect-square overflow-hidden relative bg-gray-900">
                        <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10 text-white">
                            {product.category}
                        </div>
                        {!user && <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center"><Lock className="w-6 h-6 text-white"/></div>}
                    </div>
                    
                    <div className="p-6">
                    <div className="flex justify-between items-baseline mb-4">
                        <h3 className="font-medium text-white text-lg truncate pr-2">{product.title}</h3>
                        <span className="text-white font-bold">${product.price}</span>
                    </div>

                    <div className="space-y-2 opacity-100 transition-opacity">
                        <button 
                        onClick={(e) => handleCheckout(e, product, 'physical')}
                        disabled={!!processingPayment}
                        className="w-full bg-white text-black hover:bg-gray-200 transition-colors py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                        {processingPayment === product.id + 'physical' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Package className="w-3 h-3" />}
                        Pedir Figura
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={(e) => handleCheckout(e, product, 'digital')}
                            disabled={!!processingPayment}
                            className="border border-white/20 hover:border-white text-gray-300 hover:text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                        >
                            <FileCode className="w-3 h-3" /> STL (${(product.price * 0.4).toFixed(0)})
                        </button>

                        <button 
                            onClick={(e) => handleCheckout(e, product, 'subscription')}
                            disabled={!!processingPayment}
                            className="border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                        >
                            <Crown className="w-3 h-3" /> Suscripción
                        </button>
                        </div>
                    </div>
                    </div>
                </div>
                )) : (
                <div className="col-span-3 py-20 text-center border border-white/5 rounded-xl">
                    <p className="text-gray-500 font-light mb-4">Selecciona una región para ver los Makers disponibles.</p>
                    <button onClick={() => setShowCountryModal(true)} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">SELECCIONAR PAÍS</button>
                </div>
                )}
            </div>
            )}
        </div>
      </main>

      {/* MODAL PAÍS */}
      {showCountryModal && !showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-8 tracking-tighter">SELECCIONA REGIÓN</h2>
            <div className="grid grid-cols-1 gap-2">
              {['Argentina', 'España', 'Mexico'].map((c) => (
                <button key={c} onClick={() => selectCountry(c)} className="py-4 border border-white/10 hover:bg-white hover:text-black text-gray-400 transition-all uppercase tracking-widest text-sm font-bold">{c}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}