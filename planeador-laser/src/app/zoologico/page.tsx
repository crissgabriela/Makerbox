'use client';

import React from 'react';
import { WorkshopShell } from '@/components/WorkshopShell';
import { ZooSection } from '@/components/ZooSection';

export default function ZoologicoPage() {
  return (
    <WorkshopShell
      activeBadgeText="🧩 Taller 1: Fusión IA + Rompecabezas Láser"
      showHomeButton={true}
    >
      <ZooSection />
    </WorkshopShell>
  );
}
