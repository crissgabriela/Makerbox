'use client';

import React from 'react';
import { WorkshopShell } from '@/components/WorkshopShell';
import { TangramSection } from '@/components/TangramSection';

export default function TangramaPage() {
  return (
    <WorkshopShell
      activeBadgeText="📐 Taller 3: Desafío Tangrama CAD & Manufactura Híbrida"
      showHomeButton={true}
    >
      <TangramSection />
    </WorkshopShell>
  );
}
