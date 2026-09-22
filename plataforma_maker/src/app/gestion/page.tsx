'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function GestionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Cabecera exclusiva para la gestión del Equipo Makerbox */}
      <Header variant="management" />

      {/* Contenido principal: Panel Administrativo */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminDashboard />
      </main>

      {/* Footer del Panel */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-extrabold text-purple-900">Equipo Makerbox</span>
            <span>•</span>
            <span>Facultad de Ingeniería</span>
            <span>•</span>
            <span>Universidad de Talca</span>
          </div>
          <div className="text-slate-400">
            Contacto: <a href="mailto:consultasmakerbox@utalca.cl" className="underline hover:text-purple-700">consultasmakerbox@utalca.cl</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
