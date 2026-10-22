'use client';

import React from 'react';
import { WorkshopShell } from '@/components/WorkshopShell';
import { GliderSection } from '@/components/GliderSection';

export default function PlaneadorPage() {
  return (
    <WorkshopShell
      activeBadgeText="✈️ Taller 2: Ingeniería de Vuelo (Planeadores)"
      showHomeButton={true}
    >
      <GliderSection />
    </WorkshopShell>
  );
}
