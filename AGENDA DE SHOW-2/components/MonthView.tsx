

import React, { useMemo } from 'react';
import { Show } from '../types';
import { formatCurrency, formatDuration, getShowStatusInfo } from '../utils/helpers';

interface MonthViewProps {
    shows: Show[];
}

const MonthView: React.FC<MonthViewProps> = ({ shows }) => {
    const groupedShows = useMemo(() => {
        const groups: { [year: string]: { [month: string]: Show[] } } = {};

        // Sort all shows first by date and then by start time for consistent display
        const sortedAllShows = [...shows].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
            return dateA.getTime() - dateB.getTime();
        });

        sortedAllShows.forEach(show => {
            const showDate = new Date(show.date + 'T00:00:00'); // Use T00:00:00 to avoid timezone issues
            const year = showDate.getFullYear().toString();
            const month = showDate.getMonth().toString(); // Month index (0-11)

            if (!groups[year]) {
                groups[year] = {};
            }
            if (!groups[year][month]) {
                groups[year][month] = [];
            }
            groups[year][month].push(show);
        });

        // Ensure months within each year are also sorted (important for display order)
        const sortedYears: string[] = Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b));
        const sortedGroupedShows: { [year: string]: { [month: string]: Show[] } } = {};

        sortedYears.forEach(year => {
            sortedGroupedShows[year] = {};
            const sortedMonths = Object.keys(groups[year]).sort((a, b) => parseInt(a) - parseInt(b));
            sortedMonths.forEach(month => {
                sortedGroupedShows[year][month] = groups[year][month];
            });
        });

        return sortedGroupedShows;
    }, [shows]);

    if (Object.keys(groupedShows).length === 0) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
                Nenhum show agendado ainda.
            </div>
        );
    }

    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">Visão Mensal dos Shows</h2>
            {Object.keys(groupedShows).map(year => (
                <div key={year} className="space-y-4">
                    <h3 className="text-2xl font-bold text-purple-400 mb-4">{year}</h3>
                    {Object.keys(groupedShows[year]).map(month => {
                        const monthName = new Date(parseInt(year), parseInt(month)).toLocaleDateString('pt-BR', { month: 'long' });
                        const showsInMonth = groupedShows[year][month];

                        return (
                            <div key={`${year}-${month}`} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                <h4 className="text-xl font-semibold text-gray-200 mb-3 capitalize">{monthName}</h4>
                                <div className="space-y-3">
                                    {showsInMonth.map(show => {
                                        const statusInfo = getShowStatusInfo(show);
                                        const formattedDate = new Date(show.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' });
                                        const timeRange = show.startTime && show.endTime && show.duration > 0
                                            ? `${show.startTime} - ${show.endTime}`
                                            : show.startTime || 'Hora não informada';
                                        const balance = show.fee - show.advance;

                                        return (
                                            <div key={show.id} className={`border rounded p-3 text-sm flex flex-col md:flex-row md:justify-between md:items-center ${statusInfo.bgColorClass} ${statusInfo.borderColorClass}`}>
                                                <div className="flex-1 mb-2 md:mb-0">
                                                    <p className={`font-bold ${statusInfo.textColor}`}>{show.location}</p>
                                                    <p className="text-gray-300">{formattedDate} | {timeRange}</p>
                                                    <p className="text-gray-400">Duração: {formatDuration(show.duration)}</p>
                                                </div>
                                                <div className="text-left md:text-right flex-shrink-0">
                                                    <p className={`font-semibold ${statusInfo.textColor}`}><i className={`fas ${statusInfo.icon} mr-1`}></i> {statusInfo.text}</p>
                                                    <p className="text-gray-300">Cachê: {formatCurrency(show.fee)}</p>
                                                    <p className="text-gray-300">Saldo: {formatCurrency(balance)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </section>
    );
};

export default MonthView;