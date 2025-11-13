import React, { useState, useEffect, useCallback } from 'react';
import { Show, Location } from '../types';
import { formatCurrency, parseCurrency } from '../utils/helpers';

interface AddShowFormProps {
    onSave: (show: Show) => void;
    onCancel: () => void;
    existingShow: Show | null;
    locations: Location[];
    onManageLocations: () => void;
}

const AddShowForm: React.FC<AddShowFormProps> = ({ onSave, onCancel, existingShow, locations, onManageLocations }) => {
    const getInitialState = useCallback(() => {
        return existingShow || {
            id: Date.now(),
            location: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '',
            endTime: '',
            duration: 0,
            fee: 0,
            advance: 0,
            status: 'Agendado',
            notes: '',
        };
    }, [existingShow]);

    const [show, setShow] = useState<Show>(getInitialState());
    const [durationHours, setDurationHours] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [feeStr, setFeeStr] = useState('');
    const [advanceStr, setAdvanceStr] = useState('');

    useEffect(() => {
        const initialState = getInitialState();
        setShow(initialState);
        if (initialState.duration > 0) {
            const hours = Math.floor(initialState.duration / 60);
            const minutes = initialState.duration % 60;
            setDurationHours(hours > 0 ? String(hours) : '');
            setDurationMinutes(minutes > 0 ? String(minutes) : '');
        } else {
            setDurationHours('');
            setDurationMinutes('');
        }
        setFeeStr(initialState.fee > 0 ? formatCurrency(initialState.fee).replace('R$', '').trim() : '');
        setAdvanceStr(initialState.advance > 0 ? formatCurrency(initialState.advance).replace('R$', '').trim() : '');
    }, [existingShow, getInitialState]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setShow(prev => ({ ...prev, [name]: value }));
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let newShow = { ...show, [name]: value };
        
        if (name === 'startTime' || name === 'endTime') {
            const start = new Date(`1970-01-01T${newShow.startTime || '00:00'}`);
            let end = new Date(`1970-01-01T${newShow.endTime || '00:00'}`);
            if (end < start) { end.setDate(end.getDate() + 1); }

            if (newShow.startTime && newShow.endTime) {
                const diff = (end.getTime() - start.getTime()) / 60000;
                newShow.duration = diff;
                setDurationHours(String(Math.floor(diff / 60)));
                setDurationMinutes(String(diff % 60));
            }
        }
        setShow(newShow);
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if(name === 'durationHours') setDurationHours(value);
        if(name === 'durationMinutes') setDurationMinutes(value);

        const hours = name === 'durationHours' ? parseInt(value) || 0 : parseInt(durationHours) || 0;
        const minutes = name === 'durationMinutes' ? parseInt(value) || 0 : parseInt(durationMinutes) || 0;
        const totalMinutes = (hours * 60) + minutes;

        if (show.startTime) {
            const [startHours, startMinutes] = show.startTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(startHours, startMinutes, 0, 0);
            const endDate = new Date(startDate.getTime() + totalMinutes * 60000);
            const endHours = String(endDate.getHours()).padStart(2, '0');
            const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
            setShow(prev => ({...prev, duration: totalMinutes, endTime: `${endHours}:${endMinutes}`}));
        } else {
            setShow(prev => ({...prev, duration: totalMinutes}));
        }
    };
    
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const rawValue = e.target.value;
        const digitsOnly = rawValue.replace(/\D/g, '');
        
        if (digitsOnly === '') {
            setter('');
            return;
        }

        const numberValue = parseInt(digitsOnly, 10) / 100;

        const formatted = numberValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        
        setter(formatted);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...show,
            fee: parseCurrency(feeStr),
            advance: parseCurrency(advanceStr)
        });
        setShow(getInitialState());
        setDurationHours('');
        setDurationMinutes('');
        setFeeStr('');
        setAdvanceStr('');
    };
    
    const balanceDue = parseCurrency(feeStr) - parseCurrency(advanceStr);

    return (
        <section className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold mb-6 text-center">{existingShow ? 'Editar Show' : 'Detalhes do Show'}</h2>
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="location" className="block mb-1 font-medium">Local do Show</label>
                            <div className="flex items-center gap-2">
                                <input type="text" id="location" name="location" value={show.location} onChange={handleChange} list="location-list" required className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Digite ou selecione um local"/>
                                <datalist id="location-list">
                                    {locations.map(loc => <option key={loc.id} value={loc.name} />)}
                                </datalist>
                                <button type="button" onClick={onManageLocations} className="bg-gray-700 text-white p-2 h-10 w-10 flex-shrink-0 rounded-md hover:bg-gray-600 transition-colors"><i className="fas fa-cog"></i></button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="date" className="block mb-1 font-medium">Data</label>
                            <input type="date" id="date" name="date" value={show.date} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" style={{colorScheme: 'dark'}}/>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="startTime" className="block mb-1 font-medium">Horário do show</label>
                            <input type="time" id="startTime" name="startTime" value={show.startTime} onChange={handleTimeChange} required className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" style={{colorScheme: 'dark'}}/>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">🕒 Duração</label>
                            <div className="flex items-center gap-2">
                                <input type="number" name="durationHours" value={durationHours} onChange={handleDurationChange} min="0" className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Horas"/>
                                <input type="number" name="durationMinutes" value={durationMinutes} onChange={handleDurationChange} min="0" max="59" className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Min"/>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block mb-1 font-medium">🏁 Hora de Término</label>
                            <input type="time" id="endTime" name="endTime" value={show.endTime} onChange={handleTimeChange} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" style={{colorScheme: 'dark'}}/>
                        </div>
                    </div>
                    <fieldset className="border border-gray-700 rounded-lg p-4 pt-2">
                        <legend className="px-2 text-sm text-gray-400">Detalhes Financeiros (Opcional)</legend>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="fee" className="block mb-1 font-medium">Cachê Total (R$)</label>
                                <input type="text" id="fee" name="fee" value={feeStr} onChange={(e) => handleCurrencyChange(e, setFeeStr)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" placeholder="0,00"/>
                            </div>
                            <div>
                                <label htmlFor="advance" className="block mb-1 font-medium">💳 Adiantamento (R$)</label>
                                <input type="text" id="advance" name="advance" value={advanceStr} onChange={(e) => handleCurrencyChange(e, setAdvanceStr)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" placeholder="0,00"/>
                            </div>
                            <div>
                                <label htmlFor="balanceDue" className="block mb-1 font-medium">Saldo a Receber</label>
                                <input type="text" id="balanceDue" readOnly className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2 text-gray-400 cursor-not-allowed" value={formatCurrency(balanceDue)}/>
                            </div>
                        </div>
                    </fieldset>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="status" className="block mb-1 font-medium">Status</label>
                            <select id="status" name="status" value={show.status} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 h-full">
                                <option value="Agendado">Agendado</option>
                                <option value="Confirmado">Confirmado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block mb-1 font-medium">Observações</label>
                            <textarea id="notes" name="notes" rows={3} value={show.notes} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500"></textarea>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex gap-4 justify-center">
                    {existingShow && <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">Cancelar Edição</button>}
                    <button type="submit" className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition-colors w-full md:w-auto">{existingShow ? 'Salvar Alterações' : 'Salvar Show'}</button>
                </div>
            </form>
        </section>
    );
};

export default AddShowForm;