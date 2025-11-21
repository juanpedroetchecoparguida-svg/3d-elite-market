'use client';

import React, { useState, useEffect, use } from 'react'; // <--- AÑADIDO 'use'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Package, FileCode, Crown, Loader2, ArrowLeft, ShieldCheck, CheckCircle, Truck, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

// CAMBIO AQUÍ: params ahora es una Promesa
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // DESEMPAQUETAR EL ID (Esto arregla el error rojo)
  const { id } = use(params);
  
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  
  const [activeImage, setActiveImage] = useState<string>('');
  const [allImages, setAllImages] = useState<string[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);

      // 1. Cargar EL producto principal usando el 'id' desempaquetado
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id) // <--- Usamos 'id' en vez de 'params.id'
        .single();

      if (data) {
          setProduct(data);
          const gallery = data.gallery || [];
          const images = [data.image_url, ...gallery].filter(Boolean);
          setAllImages(images);
          setActiveImage(images[0]);

          // 2. Cargar Productos SIMILARES
          const { data: related } = await supabase
            .from('products')
            .select('*')
            .neq('id', id)
            .eq('country', data.country)
            .limit(3);
            
          if (related) setRelatedProducts(related);
      }
      setLoading(false);
    };
    getData();
  }, [id, supabase]); // Dependencia actualizada a 'id'

  const handleCheckout = async (type: 'physical' | 'digital' | 'subscription') => {
    if (!user) {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/auth/callback` },
        });
        return;
    }
    setProcessing(type);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          title: product.title,
          price: product.price, 
          type: type,
          user_email: user.email
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else alert('Error: Faltan claves de Stripe');
    } catch (e) { alert('Error conexión'); } 
    finally { setProcessing(null); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-white"/></div>;
  if (!product) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Producto no encontrado</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      
      <button onClick={() => router.back()} className="fixed top-8 left-8 z-50 bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-full hover:bg-white hover:text-black transition-all group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="max-w-7xl mx-auto p-4 md:p-12 pt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            {/* FOTOS */}
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gray-900 relative shadow-2xl">
                    <img src={activeImage} className="w-full h-full object-cover" />
                </div>
                {allImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {allImages.map((img, idx) => (
                            <button key={idx} onClick={() => setActiveImage(img)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImage === img ? 'border-emerald-500' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex gap-6 text-sm text-gray-500 justify-center border-t border-white/5 pt-6">
                    <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Garantía</span>
                    <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Verificado</span>
                    <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-500"/> Envío Rápido</span>
                </div>
            </div>

            {/* INFO */}
            <div className="flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
                <div className="mb-4">
                    <span className="text-emerald-400 font-bold tracking-widest text-xs uppercase bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">{product.country}</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{product.title}</h1>
                <p className="text-gray-400 text-lg mb-10 leading-relaxed">{product.description}</p>

                <div className="bg-[#111] border border-white/10 rounded-3xl p-8 space-y-6 shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-xl text-white flex items-center gap-2"><Package className="w-5 h-5"/> Figura Física</span>
                            <span className="text-3xl font-bold text-emerald-400">${product.price}</span>
                        </div>
                        <button onClick={() => handleCheckout('physical')} disabled={!!processing} className="w-full bg-white text-black py-4 rounded-xl font-extrabold text-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 uppercase tracking-wide">
                            {processing === 'physical' ? <Loader2 className="animate-spin"/> : 'Comprar Ahora'}
                        </button>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleCheckout('digital')} className="border border-white/10 hover:border-white/40 bg-black/20 p-4 rounded-2xl text-left transition-all">
                            <div className="flex justify-between mb-2"><FileCode className="text-gray-500"/><span className="font-bold text-gray-300">${(product.price * 0.4).toFixed(0)}</span></div>
                            <div className="text-sm font-bold text-gray-400">STL</div>
                        </button>
                        <button onClick={() => handleCheckout('subscription')} className="border border-purple-500/20 hover:border-purple-500/60 bg-purple-900/10 p-4 rounded-2xl text-left transition-all">
                            <div className="flex justify-between mb-2"><Crown className="text-purple-500"/><span className="font-bold text-purple-300">$9/m</span></div>
                            <div className="text-sm font-bold text-purple-200">Suscripción</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* PRODUCTOS SIMILARES */}
        {relatedProducts.length > 0 && (
            <div className="border-t border-white/10 pt-12">
                <h2 className="text-2xl font-bold mb-8 text-white">También te podría interesar</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {relatedProducts.map((rel) => (
                        <div key={rel.id} onClick={() => router.push(`/product/${rel.id}`)} className="group bg-[#0A0A0A] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 cursor-pointer transition-all">
                            <div className="h-48 bg-gray-900 relative overflow-hidden">
                                <img src={rel.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-white truncate">{rel.title}</h3>
                                <span className="text-emerald-400 font-bold text-sm">${rel.price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}