'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { RequestForm } from '@/components/RequestForm';
import { TrackingView } from '@/components/TrackingView';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Heart, Sparkles, Box, ShieldCheck, Search } from 'lucide-react';

function MainContent() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<'form' | 'tracking' | 'admin'>('form');
  const [initialTrackingCode, setInitialTrackingCode] = useState<string>('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    const code = searchParams.get('code');

    if (tab === 'tracking' || code) {
      setActiveView('tracking');
      if (code) {
        setInitialTrackingCode(code);
      }
    } else if (tab === 'admin') {
      setActiveView('admin');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cabecera institucional con selector de vistas */}
      <Header activeView={activeView} onChangeView={setActiveView} />

      {/* Contenido principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center">
        {activeView === 'form' && (
          <RequestForm
            onSuccessSubmit={(code) => {
              setInitialTrackingCode(code);
            }}
          />
        )}

        {activeView === 'tracking' && (
          <TrackingView initialCode={initialTrackingCode} />
        )}

        {activeView === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer institucional */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span>MakerBox</span>
            <span>•</span>
            <span>Facultad de Ingeniería</span>
            <span>•</span>
            <span>Universidad de Talca</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('admin')}
              className="text-slate-400 hover:text-purple-700 transition flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Acceso Staff</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MainContent />
    </Suspense>
  );
}
