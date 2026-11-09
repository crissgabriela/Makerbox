'use client';

import React from 'react';
import { WorkshopShell } from '@/components/WorkshopShell';
import { BadgesSection } from '@/components/BadgesSection';

export default function ChapitasPage() {
  return (
    <WorkshopShell
      activeBadgeText="🏅 Taller 4: Co-creación de Chapitas Híbridas (Láser + 3D)"
      showHomeButton={true}
    >
      <BadgesSection />
    </WorkshopShell>
  );
}
