'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, ShoppingCart, User, Crown, Filter, X, Package, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// IMPORTAMOS EL ARCHIVO MAESTRO
import { PRODUCT_CATEGORIES } from './constants';

export default function EliteMarketplace() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2 || searchTerm.length === 0) {
        fetchProducts();
    }
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (searchTerm.length > 2) {
        query = query.ilike('title', `%${searchTerm}%`);
    }
    
    if (selectedCategory) {
        query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleCategoryClick = (category: string | null) => {
      setSelectedCategory(category);
      // No hacemos scroll top abrupto, dejamos que fluya
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
        const scrollAmount = 300;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      
      {/* NAVBAR */}
      <nav className="border-b border-white/10 bg-[#111]/90 backdrop-blur-md fixed w-full z-50 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO */}
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="bg-white/10 p-2 rounded-xl group-hover:bg-emerald-500/20 transition-all">
                    <Crown className="w-6 h-6 text-emerald-500" />
                  </div>
                  <span className="font-black text-2xl tracking-tight">3D<span className="text-emerald-400">Elite</span></span>
                </Link>
            </div>

            {/* BUSCADOR (ESCRITORIO) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input 
                type="text"
                placeholder="Buscar íconos, setups, anime..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-600"
              />
            </div>

            {/* BOTONES DERECHA */}
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/vendedor" className="hidden md:flex items-center gap-2 bg-emerald-600/10 text-emerald-400 px-4 py-2 rounded-full font-bold text-sm hover:bg-emerald-600/20 transition-all border border-emerald-500/20">
                  <Package className="w-4 h-4"/> Panel Vendedor
                </Link>
              ) : (
                <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })} className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-400 hover:text-black transition-all">
                  <User className="w-4 h-4" /> Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        
        {/* ================================================================================== */}
        {/* NUEVO CARRUSEL HORIZONTAL TIPO "RULETA" */}
        {/* ================================================================================== */}
        <div className="relative mb-10 group">
            {/* Botones de scroll para desktop */}
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 p-2 rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block hover:bg-emerald-500 hover:border-emerald-500"><ChevronLeft/></button>
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 p-2 rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block hover:bg-emerald-500 hover:border-emerald-500"><ChevronRight/></button>

            <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-3 py-4 scrollbar-hide snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
                {/* Botón "Ver Todo" */}
                <button 
                    onClick={() => handleCategoryClick(null)} 
                    className={`snap-start shrink-0 px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border-2 ${selectedCategory === null ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#111] text-gray-400 border-white/10 hover:border-white hover:text-white'}`}
                >
                    <Sparkles className="w-4 h-4"/> Ver Todo
                </button>

                {/* Opciones de Categoría */}
                {PRODUCT_CATEGORIES.map((group, idx) => (
                    <React.Fragment key={idx}>
                        {group.options.map((option, optIdx) => {
                            // Extraemos el icono y el texto
                            const [icon, ...textParts] = option.split(' ');
                            const text = textParts.join(' ');
                            const isActive = selectedCategory === option;

                            return (
                                <button 
                                    key={`${idx}-${optIdx}`}
                                    onClick={() => handleCategoryClick(option)}
                                    className={`snap-start shrink-0 px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 border-2 ${isActive ? `bg-[#111] text-white ${group.colorClass.replace('text', 'border')} shadow-[0_0_15px_rgba(var(--shadow-color),0.2)]` : `bg-[#111] text-gray-400 border-white/10 hover:border-white/30 hover:text-white`}`}
                                    // Truco para usar el color del grupo en la sombra dinámica
                                    style={isActive ? { '--shadow-color': group.colorClass.includes('emerald') ? '16, 185, 129' : group.colorClass.includes('purple') ? '168, 85, 247' : group.colorClass.includes('blue') ? '59, 130, 246' : '236, 72, 153' } as React.CSSProperties : {}}
                                >
                                    <span className="text-lg">{icon}</span>
                                    <span className="whitespace-nowrap">{text}</span>
                                </button>
                            );
                        })}
                        {/* Separador visual entre grupos */}
                        {idx < PRODUCT_CATEGORIES.length - 1 && <div className="shrink-0 w-px bg-white/10 h-8 self-center mx-2"></div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
        {/* ================================================================================== */}


        {/* GRID DE PRODUCTOS */}
        <main>
            {/* Buscador móvil */}
            <div className="md:hidden mb-6 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm text-white"/>
            </div>

            {selectedCategory && (
                <div className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Filtrando por:</p>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            {selectedCategory.split(' ')[0]} 
                            <span className={PRODUCT_CATEGORIES.find(g => g.options.includes(selectedCategory))?.colorClass}>{selectedCategory.split(' ').slice(1).join(' ')}</span>
                        </h2>
                    </div>
                    <button onClick={() => handleCategoryClick(null)} className="bg-white/10 p-2 px-4 rounded-full hover:bg-white hover:text-black transition-all font-bold text-sm flex items-center gap-2">
                        <X className="w-4 h-4"/> Borrar Filtro
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
                    {[...Array(6)].map((_,i) => <div key={i} className="aspect-[4/5] bg-white/5 rounded-2xl"/>)}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-[#111] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <Package className="w-12 h-12 opacity-50"/>
                    <p className="text-lg font-bold">No hay productos en esta categoría... todavía.</p>
                    {selectedCategory && <button onClick={() => handleCategoryClick(null)} className="text-emerald-400 font-bold text-sm hover:underline">Ver todo</button>}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <Link href={`/product/${product.id}`} key={product.id} className="group block bg-[#111] rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/20 relative">
                            <div className="aspect-[4/5] bg-gray-900 relative overflow-hidden">
                                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <p className="text-emerald-400 font-bold text-xs tracking-wider uppercase mb-1">{product.country}</p>
                                    <h3 className="font-bold text-lg text-white leading-tight truncate">{product.title}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-white font-black text-xl">${product.price}</span>
                                        {product.category && <span className="text-xs text-gray-400 bg-black/50 px-2 py-1 rounded-full backdrop-blur-md truncate">{product.category.split(' ')[1]}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <ShoppingCart className="w-4 h-4 text-white"/>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>

      </div>
    </div>
  );
}
