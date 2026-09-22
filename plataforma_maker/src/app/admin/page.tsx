'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header variant="management" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
