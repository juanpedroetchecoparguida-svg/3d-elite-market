'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Package, FileCode, Crown, ArrowLeft, Truck, CheckCircle, Map, X, Copy, Box } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]); // NUEVO: Envíos mensuales
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  useEffect(() => {
    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setUser(session.user);

      // 1. Cargar Compras Generales
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (ordersData) setOrders(ordersData);

      // 2. Cargar Envíos Mensuales (Suscripciones)
      const { data: shipmentsData } = await supabase
        .from('shipments')
        .select('*')
        .eq('subscriber_id', session.user.id)
        .order('created_at', { ascending: false });

      if (shipmentsData) setShipments(shipmentsData);

      setLoading(false);
    };
    getData();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-4 md:p-12">
      
      {/* Cabecera */}
      <div className="max-w-4xl mx-auto mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="bg-[#111] p-3 rounded-full hover:bg-white hover:text-black transition-all">
                <ArrowLeft className="w-5 h-5"/>
            </button>
            <h1 className="text-3xl font-bold">Mi Cuenta</h1>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-gray-400 text-sm">Usuario</p>
            <p className="font-bold text-emerald-400">{user?.email}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* SECCIÓN 1: ENVÍOS DE SUSCRIPCIÓN (NUEVO) */}
        {shipments.length > 0 && (
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400"><Crown className="w-5 h-5"/> Cajas Mensuales Recibidas</h2>
                <div className="space-y-4">
                    {shipments.map((ship) => (
                        <div key={ship.id} className="bg-[#111] border border-purple-500/20 rounded-xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                                    <Box className="w-6 h-6 text-purple-400"/>
                                </div>
                                <div>
                                    <p className="font-bold text-white">{ship.month}</p>
                                    <p className="text-sm text-gray-400">Contenido: <span className="text-white">{ship.content}</span></p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setTrackingInfo(ship)}
                                className="bg-white/10 hover:bg-white hover:text-black text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                            >
                                <Map className="w-3 h-3"/> Rastrear
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* SECCIÓN 2: HISTORIAL DE COMPRAS */}
        <div>
            <h2 className="text-xl font-bold mb-4 text-white">Historial de Compras</h2>
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Cargando...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl text-gray-500">Sin compras aún.</div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-[#111] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                            <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                                <img src={order.products?.image_url} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-bold text-white">{order.products?.title}</h3>
                                <p className="text-xs text-gray-500 uppercase font-bold mt-1">{order.type}</p>
                            </div>
                            <div className="shrink-0">
                                {order.status === 'shipped' ? (
                                    <button onClick={() => setTrackingInfo(order)} className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-300 flex items-center gap-2">
                                        <Map className="w-3 h-3"/> En camino
                                    </button>
                                ) : order.type === 'digital' ? (
                                    <button className="border border-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-white hover:text-black">Descargar</button>
                                ) : (
                                    <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded">Procesando</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>

      {/* MODAL TRACKING */}
      {trackingInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#111] border border-white/10 w-full max-w-md p-6 rounded-2xl relative">
                <button onClick={() => setTrackingInfo(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">En camino</h3>
                    <p className="text-gray-400 text-sm mt-1">Empresa: <span className="text-white font-bold">{trackingInfo.shipping_company}</span></p>
                </div>

                <div className="bg-black border border-white/20 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Código de Rastreo</p>
                        <p className="text-xl font-mono text-emerald-400 tracking-widest">{trackingInfo.tracking_code}</p>
                    </div>
                    <Copy className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
                </div>
            </div>
        </div>
      )}

    </div>
  );
}