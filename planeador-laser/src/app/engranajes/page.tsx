'use client';

import React from 'react';
import { WorkshopShell } from '@/components/WorkshopShell';
import { GearsSection } from '@/components/GearsSection';

export default function EngranajesPage() {
  return (
    <WorkshopShell
      activeBadgeText="⚙️ Taller 6: Trenes de Engranajes & Tablero Matricial"
      showHomeButton={true}
    >
      <GearsSection />
    </WorkshopShell>
  );
}
