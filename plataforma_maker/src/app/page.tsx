'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { RequestForm } from '@/components/RequestForm';
import { TrackingView } from '@/components/TrackingView';
import { Heart, Sparkles, Box, Search } from 'lucide-react';

function MainContent() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<'form' | 'tracking'>('form');
  const [initialTrackingCode, setInitialTrackingCode] = useState<string>('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    const code = searchParams.get('code');

    if (tab === 'tracking' || code) {
      setActiveView('tracking');
      if (code) {
        setInitialTrackingCode(code);
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Cabecera institucional pública (sin accesos administrativos) */}
      <Header
        variant="public"
        activeView={activeView}
        onChangeView={setActiveView}
      />

      {/* Contenido principal para el usuario */}
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
      </main>

      {/* Footer público institucional */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-extrabold text-purple-900">MakerBox</span>
            <span>•</span>
            <span>Facultad de Ingeniería</span>
            <span>•</span>
            <span>Universidad de Talca</span>
          </div>

          <div className="text-slate-400">
            Consultas y soporte: <a href="mailto:consultasmakerbox@utalca.cl" className="underline hover:text-purple-700">consultasmakerbox@utalca.cl</a>
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
