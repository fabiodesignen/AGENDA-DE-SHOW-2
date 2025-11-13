import { Show } from '../types';

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const parseCurrency = (value: string): number => {
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const cleanedValue = value.replace('R$', '').trim();
    return parseFloat(cleanedValue.replace(/\./g, '').replace(',', '.')) || 0;
};

export const formatDuration = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes <= 0) {
    return 'Tempo não Fornecido';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);
  }
  
  return parts.join(' e ');
};

export const hasTimeConflict = (newShow: Show, existingShows: Show[]): boolean => {
    if (!newShow.date || !newShow.startTime || !newShow.endTime) return false;
    
    const newStart = new Date(`${newShow.date}T${newShow.startTime}`).getTime();
    let newEnd = new Date(`${newShow.date}T${newShow.endTime}`).getTime();
    if(newEnd < newStart) newEnd += 24 * 60 * 60 * 1000;

    const conflictMargin = 30 * 60 * 1000; // 30 minutes in milliseconds

    return existingShows.some(existingShow => {
        if (existingShow.id === newShow.id) return false; // Don't compare with itself
        if (existingShow.date !== newShow.date) return false;
        if (!existingShow.startTime || !existingShow.endTime) return false;

        const existingStart = new Date(`${existingShow.date}T${existingShow.startTime}`).getTime();
        let existingEnd = new Date(`${existingShow.date}T${existingShow.endTime}`).getTime();
        if(existingEnd < existingStart) existingEnd += 24 * 60 * 60 * 1000;
        
        return (newStart < (existingEnd + conflictMargin)) && (newEnd > (existingStart - conflictMargin));
    });
};

export const getShowStatusInfo = (show: Show): { text: string, icon: string, textColor: string, bgColorClass: string, borderColorClass: string } => {
    const now = new Date();
    const showStart = new Date(`${show.date}T${show.startTime || '00:00'}`);
    let showEnd = new Date(`${show.date}T${show.endTime || '00:00'}`);
    if (show.endTime && show.startTime && showEnd < showStart) {
        showEnd.setDate(showEnd.getDate() + 1); // Adjust for shows ending on next day
    }

    if (show.status === 'Cancelado') {
        return { text: 'Cancelado', icon: 'fa-times-circle', textColor: 'text-gray-500', bgColorClass: 'bg-gray-700/20', borderColorClass: 'border-gray-600' };
    }
    if (show.endTime && now > showEnd) {
        return { text: 'Concluído', icon: 'fa-check-circle', textColor: 'text-green-500', bgColorClass: 'bg-green-700/20', borderColorClass: 'border-green-600' };
    }
    if (show.startTime && show.endTime && now >= showStart && now <= showEnd) {
        return { text: 'Em Andamento', icon: 'fa-compact-disc animate-spin', textColor: 'text-yellow-400', bgColorClass: 'bg-yellow-700/20', borderColorClass: 'border-yellow-600' };
    }
    if (show.status === 'Confirmado') {
        return { text: 'Confirmado', icon: 'fa-calendar-check', textColor: 'text-blue-400', bgColorClass: 'bg-blue-700/20', borderColorClass: 'border-blue-600' };
    }
    // Default for 'Agendado' or other future statuses
    return { text: 'Agendado', icon: 'fa-calendar-alt', textColor: 'text-purple-400', bgColorClass: 'bg-purple-700/20', borderColorClass: 'border-purple-600' };
};

// Fix: Exported formatCpfInput to be a shared utility
export const formatCpfInput = (value: string): string => {
    // Remove anything that's not a digit
    const digits = value.replace(/\D/g, '');
    // Apply CPF mask: XXX.XXX.XXX-XX
    let formatted = digits;
    if (digits.length > 3) {
        formatted = `${digits.substring(0, 3)}.${digits.substring(3)}`;
    }
    if (digits.length > 6) {
        formatted = `${formatted.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6)}`;
    }
    if (digits.length > 9) {
        formatted = `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
    }
    return formatted.substring(0, 14); // Limit to 14 chars (11 digits + 3 separators)
};