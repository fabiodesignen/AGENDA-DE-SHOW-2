
import React, { useState } from 'react';
import ModalWrapper from '../ModalWrapper';
import { Location } from '../../types';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

interface ManageLocationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    locations: Location[];
    setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
}

const ManageLocationsModal: React.FC<ManageLocationsModalProps> = ({ isOpen, onClose, locations, setLocations }) => {
    const [newLocation, setNewLocation] = useState('');
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
    const [error, setError] = useState('');

    const handleAddLocation = () => {
        setError('');
        if (!newLocation.trim()) {
            setError('O nome do local não pode estar vazio.');
            return;
        }
        if (locations.some(loc => loc.name.toLowerCase() === newLocation.trim().toLowerCase())) {
            setError('Este local já existe.');
            return;
        }
        setLocations(prev => [...prev, { id: Date.now(), name: newLocation.trim() }]);
        setNewLocation('');
    };

    const handleSaveEdit = () => {
        if (!editingLocation || !editingLocation.name.trim()) {
            setError('O nome do local não pode estar vazio.');
            return;
        }
        if (locations.some(loc => loc.id !== editingLocation.id && loc.name.toLowerCase() === editingLocation.name.trim().toLowerCase())) {
            setError('Este nome de local já existe.');
            return;
        }
        setLocations(prev => prev.map(loc => loc.id === editingLocation.id ? editingLocation : loc));
        setEditingLocation(null);
        setError('');
    };

    const confirmDelete = () => {
        if(locationToDelete) {
            setLocations(prev => prev.filter(loc => loc.id !== locationToDelete.id));
            setLocationToDelete(null);
        }
    }

    return (
        <>
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <h3 className="text-2xl font-bold text-white mb-4">Gerenciar Locais</h3>
            <div className="mb-4">
                <label htmlFor="newLocationInput" className="block mb-1 font-medium">Adicionar Novo Local</label>
                <div className="flex gap-2">
                    <input type="text" id="newLocationInput" value={newLocation} onChange={e => setNewLocation(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2" placeholder="Nome do Local" />
                    <button onClick={handleAddLocation} className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md transition-colors">Adicionar</button>
                </div>
                {error && !editingLocation && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <h4 className="font-bold mb-2">Locais Salvos</h4>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {locations.length > 0 ? locations.map(loc => (
                    <li key={loc.id} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                        {editingLocation?.id === loc.id ? (
                            <div className="w-full">
                                <input 
                                    type="text" 
                                    value={editingLocation.name}
                                    onChange={e => setEditingLocation({...editingLocation, name: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-500 rounded-md p-1"
                                />
                                {error && editingLocation && <p className="text-red-500 text-sm mt-1">{error}</p>}
                            </div>
                        ) : (
                            <span className="truncate">{loc.name}</span>
                        )}
                        <div className="flex gap-2 flex-shrink-0 ml-2">
                            {editingLocation?.id === loc.id ? (
                                <>
                                    <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300"><i className="fas fa-check"></i></button>
                                    <button onClick={() => { setEditingLocation(null); setError(''); }} className="text-gray-400 hover:text-gray-300"><i className="fas fa-times"></i></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { setEditingLocation(loc); setError(''); }} className="text-blue-400 hover:text-blue-300"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => setLocationToDelete(loc)} className="text-red-500 hover:text-red-400"><i className="fas fa-trash"></i></button>
                                </>
                            )}
                        </div>
                    </li>
                )) : (
                    <li className="text-gray-400 p-2">Nenhum local salvo.</li>
                )}
            </ul>
            <div className="mt-6 text-right">
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">Fechar</button>
            </div>
        </ModalWrapper>
        <ConfirmDeleteModal
            isOpen={!!locationToDelete}
            onClose={() => setLocationToDelete(null)}
            onConfirm={confirmDelete}
            itemName={`o local "${locationToDelete?.name}"`}
        />
        </>
    );
};

export default ManageLocationsModal;