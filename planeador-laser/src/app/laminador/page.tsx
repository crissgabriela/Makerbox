'use client';

import React from 'react';
import { WorkshopShell } from '@/components/WorkshopShell';
import { Slicer3DSection } from '@/components/Slicer3DSection';

export default function LaminadorPage() {
  return (
    <WorkshopShell
      activeBadgeText="🧊 Taller 5: Laminador 3D a Puzzles MDF 3 mm + PLA"
      showHomeButton={true}
    >
      <Slicer3DSection />
    </WorkshopShell>
  );
}
