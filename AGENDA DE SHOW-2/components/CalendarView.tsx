

import React, { useState, useMemo, useEffect } from 'react';
import { Show } from '../types';
import { formatDuration, getShowStatusInfo } from '../utils/helpers';

interface CalendarViewProps {
    shows: Show[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ shows }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    // Initialize selectedDate to today's date
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    
    const showsByDate = useMemo(() => {
        return shows.reduce((acc, show) => {
            (acc[show.date] = acc[show.date] || []).push(show);
            return acc;
        }, {} as Record<string, Show[]>);
    }, [shows]);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const daysInMonth = [];
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
        daysInMonth.push(<div key={`empty-start-${i}`}></div>);
    }
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        const isToday = new Date().toISOString().split('T')[0] === dateString;
        const hasEvent = showsByDate[dateString];
        const isSelected = selectedDate === dateString;
        
        daysInMonth.push(
            <div 
                key={day} 
                className={`h-12 flex items-center justify-center cursor-pointer rounded-full transition-colors duration-200 
                    ${isToday ? 'border-2 border-purple-500' : ''} 
                    ${hasEvent ? 'bg-purple-700 text-white font-bold' : ''}
                    ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-purple-400 bg-purple-500 !text-white' : ''}
                    ${!isSelected && hasEvent ? 'hover:bg-purple-600' : 'hover:bg-gray-700'}
                `}
                onClick={() => setSelectedDate(dateString)}
            >
                {day}
            </div>
        );
    }
    
    const changeMonth = (amount: number) => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(prev.getMonth() + amount);
          // When month changes, automatically select the first day of the new month
          newDate.setDate(1); 
          setSelectedDate(newDate.toISOString().split('T')[0]);
          return newDate;
      });
    };

    const selectedDayShows = selectedDate ? showsByDate[selectedDate] || [] : [];
    
    return (
        <section className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md h-10 w-10" aria-label="Mês anterior"><i className="fas fa-chevron-left"></i></button>
                <h2 className="text-2xl font-bold text-purple-300 capitalize">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md h-10 w-10" aria-label="Próximo mês"><i className="fas fa-chevron-right"></i></button>
            </div>
            <div className="grid grid-cols-7 text-center text-sm text-gray-400 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <span key={day}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {daysInMonth}
            </div>
            <div className="mt-6">
                <h3 className="text-xl font-bold mb-2 text-purple-300">
                    Eventos do dia {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                </h3>
                <div className="space-y-2">
                    {selectedDayShows.length > 0 ? (
                        selectedDayShows.map(show => {
                            const statusInfo = getShowStatusInfo(show);
                            return (
                                <div key={show.id} className={`border rounded p-3 space-y-1 ${statusInfo.bgColorClass} ${statusInfo.borderColorClass}`}>
                                    <p className={`font-bold ${statusInfo.textColor}`}>{show.location}</p>
                                    <p className="text-sm">Horário: {show.startTime}</p>
                                    <p className="text-sm">🕒 Duração: {formatDuration(show.duration)}</p>
                                    {show.duration > 0 && <p className="text-sm">🏁 Hora de Término: {show.endTime}</p>}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-400">Nenhum evento para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}.</p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CalendarView;