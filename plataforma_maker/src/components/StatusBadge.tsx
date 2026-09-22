import React from 'react';
import { EstadoSolicitud } from '@/types';
import { Clock, Eye, CheckCircle2, Play, PackageCheck, Check, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  estado: EstadoSolicitud;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  }[size];

  switch (estado) {
    case 'pendiente':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Pendiente de Revisión</span>
        </span>
      );
    case 'en_evaluacion':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-sky-100 text-sky-900 border border-sky-200 ${sizeClasses}`}>
          <Eye className="w-3.5 h-3.5 text-sky-600" />
          <span>En Evaluación / Slicer</span>
        </span>
      );
    case 'aprobada':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-purple-100 text-purple-900 border border-purple-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
          <span>Aprobada / En Cola</span>
        </span>
      );
    case 'en_impresion':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-orange-100 text-orange-900 border border-orange-200 ${sizeClasses}`}>
          <Play className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
          <span>Imprimiendo en 3D</span>
        </span>
      );
    case 'lista_retiro':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs ${sizeClasses}`}>
          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>¡Lista para Retiro!</span>
        </span>
      );
    case 'entregada':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <Check className="w-3.5 h-3.5 text-slate-500" />
          <span>Entregada</span>
        </span>
      );
    case 'rechazada':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-rose-100 text-rose-900 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Ajuste Requerido</span>
        </span>
      );
    default:
      return null;
  }
};
