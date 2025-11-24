'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, ShoppingCart, User, Crown, Filter, X, Menu, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// IMPORTAMOS EL ARCHIVO MAESTRO
import { PRODUCT_CATEGORIES } from './constants';

export default function EliteMarketplace() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Nuevo estado para la categoría seleccionada
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
    fetchProducts();
  }, []);

  // Función de búsqueda actualizada para filtrar por texto Y categoría
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
    
    // FILTRADO POR CATEGORÍA
    if (selectedCategory) {
        query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleCategoryClick = (category: string | null) => {
      setSelectedCategory(category);
      setIsMobileMenuOpen(false); // Cerrar menú móvil al seleccionar
      window.scrollTo(0, 0); // Subir arriba
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      
      {/* NAVBAR */}
      <nav className="border-b border-white/10 bg-[#111]/90 backdrop-blur-md fixed w-full z-50 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO Y MENÚ MÓVIL */}
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-white">
                    <Menu className="w-6 h-6"/>
                </button>
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

      {/* LAYOUT PRINCIPAL (SIDEBAR + GRID) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 flex gap-8 relative">
        
        {/* SIDEBAR (ESCRITORIO) - LEYENDO DEL ARCHIVO MAESTRO */}
        <aside className="hidden md:block w-72 shrink-0 sticky top-28 h-fit">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Filter className="w-5 h-5 text-emerald-400"/> Categorías</h3>
                
                {/* Botón "Ver Todo" */}
                <button onClick={() => handleCategoryClick(null)} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm mb-2 transition-all flex items-center justify-between group ${selectedCategory === null ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}>
                    <span>🔥 Ver Todo</span>
                    {selectedCategory === null && <ArrowRight className="w-4 h-4"/>}
                </button>

                <div className="space-y-6 mt-6">
                    {PRODUCT_CATEGORIES.map((group, idx) => (
                        <div key={idx}>
                            <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-3 ${group.colorClass} opacity-80 ml-2`}>{group.group.replace('--- ', '').replace(' ---', '')}</h4>
                            <div className="space-y-1">
                                {group.options.map((option, optIdx) => (
                                    <button 
                                        key={optIdx}
                                        onClick={() => handleCategoryClick(option)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-between group truncate ${selectedCategory === option ? 'bg-white/10 text-white border-l-4 border-emerald-500' : 'hover:bg-white/5 text-gray-400 hover:text-white border-l-4 border-transparent'}`}
                                    >
                                        <span className="truncate">{option}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>

        {/* MENÚ MÓVIL (OVERLAY) */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[100] bg-black/95 md:hidden">
                <div className="p-6 h-full overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="font-bold text-xl">Categorías</h2>
                        <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6"/></button>
                    </div>
                    <button onClick={() => handleCategoryClick(null)} className="w-full text-left px-4 py-4 rounded-xl font-bold bg-emerald-600 mb-4">🔥 Ver Todo</button>
                    <div className="space-y-8">
                        {PRODUCT_CATEGORIES.map((group, idx) => (
                            <div key={idx}>
                                <h4 className={`text-sm font-bold uppercase mb-4 ${group.colorClass}`}>{group.group.replace('--- ', '').replace(' ---', '')}</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {group.options.map((option, optIdx) => (
                                        <button key={optIdx} onClick={() => handleCategoryClick(option)} className="bg-white/10 p-3 rounded-xl text-sm font-medium text-left truncate">{option}</button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* GRID DE PRODUCTOS */}
        <main className="flex-1">
            {/* Buscador móvil */}
            <div className="md:hidden mb-6 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm text-white"/>
            </div>

            {selectedCategory && (
                <div className="mb-6 flex items-center gap-4 bg-[#111] border border-white/10 p-4 rounded-2xl">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Viendo categoría:</p>
                        <h2 className="text-xl font-bold text-white">{selectedCategory}</h2>
                    </div>
                    <button onClick={() => handleCategoryClick(null)} className="ml-auto bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X className="w-5 h-5"/></button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
                    {[...Array(6)].map((_,i) => <div key={i} className="aspect-[4/5] bg-white/5 rounded-2xl"/>)}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-[#111] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <Package className="w-12 h-12 opacity-50"/>
                    <p className="text-lg font-bold">No hay productos aquí... todavía.</p>
                    {selectedCategory && <button onClick={() => handleCategoryClick(null)} className="text-emerald-400 font-bold text-sm hover:underline">Ver todas las categorías</button>}
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