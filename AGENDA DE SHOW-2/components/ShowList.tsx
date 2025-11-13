import React, { useState, useMemo } from 'react';
import { Show } from '../types';
import { formatCurrency, formatDuration, getShowStatusInfo } from '../utils/helpers';

interface ShowListProps {
    shows: Show[];
    onEdit: (show: Show) => void;
    onDelete: (show: Show) => void;
}

interface ShowItemProps {
    show: Show;
    onEdit: (show: Show) => void;
    onDelete: (show: Show) => void;
}

const ShowItem: React.FC<ShowItemProps> = ({ show, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);

    const statusInfo = getShowStatusInfo(show);

    const timeText = show.duration > 0 ? `das ${show.startTime} às ${show.endTime}` : `a partir das ${show.startTime}`;
    const balance = show.fee - show.advance;

    const formattedDate = useMemo(() => {
        if (!show.date) return 'Data não informada'; // Fallback if date is empty/null
        const dateObj = new Date(show.date + 'T00:00:00');
        return isNaN(dateObj.getTime()) ? 'Data inválida' : dateObj.toLocaleDateString('pt-BR');
    }, [show.date]);
    
    return (
        <div className={`border rounded-lg ${statusInfo.bgColorClass} ${statusInfo.borderColorClass}`}>
            <div className="p-4 cursor-pointer flex justify-between items-center" onClick={() => setIsOpen(!isOpen)}>
                <div>
                    <p className="font-bold">Local: <span className="text-purple-400">{show.location}</span></p>
                    <p className="text-sm text-gray-400">
                        Data: <span className="font-semibold text-purple-400">{formattedDate}</span> ||
                        Hora: <span className="font-semibold text-purple-400">{show.startTime}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className={`font-bold ${statusInfo.textColor}`}><i className={`fas ${statusInfo.icon} mr-2`}></i>{statusInfo.text}</p>
                    <i className={`fas fa-chevron-down text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                </div>
            </div>
            {isOpen && (
                <div className="p-4 border-t border-gray-700">
                    <div className="space-y-3 text-sm">
                        <p><strong>Horário do show:</strong> {timeText}</p>
                        <p><strong>Duração de Show:</strong> {formatDuration(show.duration)}</p>
                        <p><strong>Cachê:</strong> {formatCurrency(show.fee)}</p>
                        <p><strong>Adiantamento:</strong> {formatCurrency(show.advance)}</p>
                        <p><strong>Saldo a Receber:</strong> {formatCurrency(balance)}</p>
                        <p><strong>Status do Contrato:</strong> {show.status}</p>
                        {show.notes && <p className="whitespace-pre-wrap"><strong>Observações:</strong> {show.notes}</p>}
                    </div>
                    
                    <div className="mt-4 flex gap-4 justify-end">
                        <button className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors" onClick={() => onEdit(show)}>Editar</button>
                        <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors" onClick={() => onDelete(show)}>Excluir</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FilterInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string}> = ({label, children, ...props}) => (
    <div className="flex-1 min-w-[120px]">
        <label htmlFor={props.id} className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <select {...props} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 text-sm h-10">
            {children}
        </select>
    </div>
);


const ShowFilters: React.FC<{
    filters: { period: string; location: string; status: string };
    setFilters: React.Dispatch<React.SetStateAction<{ period: string; location: string; status: string }>>;
    locations: string[];
}> = ({ filters, setFilters, locations }) => {
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const resetFilters = () => {
        setFilters({ period: 'all', location: 'all', status: 'all' });
    }

    const statuses = ['Agendado', 'Confirmado', 'Cancelado', 'Concluído', 'Em Andamento'];

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
                <FilterInput label="Período" id="period" name="period" value={filters.period} onChange={handleFilterChange}>
                    <option value="all">Todos</option>
                    <option value="upcoming">Próximos</option>
                    <option value="past">Passados</option>
                </FilterInput>
                <FilterInput label="Local" id="location" name="location" value={filters.location} onChange={handleFilterChange}>
                    <option value="all">Todos os Locais</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </FilterInput>
                 <FilterInput label="Status" id="status" name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="all">Todos os Status</option>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </FilterInput>
                <button onClick={resetFilters} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors h-10 text-sm">
                    Limpar
                </button>
            </div>
        </div>
    )
}

const ShowList: React.FC<ShowListProps> = ({ shows, onEdit, onDelete }) => {
    const [filters, setFilters] = useState({
        period: 'all',
        location: 'all',
        status: 'all'
    });

    const uniqueLocations = useMemo(() => {
        return [...new Set(shows.map(s => s.location))].sort();
    }, [shows]);

    const filteredShows = useMemo(() => {
        const now = new Date();
        return shows.filter(show => {
            const locationMatch = filters.location === 'all' || show.location === filters.location;
            const statusMatch = filters.status === 'all' || getShowStatusInfo(show).text === filters.status;
            
            const showDate = new Date(`${show.date}T${show.startTime || '23:59'}`);
            const periodMatch = filters.period === 'all'
                || (filters.period === 'upcoming' && showDate >= now)
                || (filters.period === 'past' && showDate < now);

            return locationMatch && statusMatch && periodMatch;
        });
    }, [shows, filters]);
    
    if (shows.length === 0) {
        return <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">Nenhum show agendado ainda.</div>;
    }
    
    return (
        <section className="space-y-4">
            <ShowFilters filters={filters} setFilters={setFilters} locations={uniqueLocations} />
            {filteredShows.length > 0 ? (
                 filteredShows.map(show => (
                    <ShowItem key={show.id} show={show} onEdit={onEdit} onDelete={onDelete} />
                ))
            ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">Nenhum show encontrado com os filtros selecionados.</div>
            )}
        </section>
    );
};

export default ShowList;