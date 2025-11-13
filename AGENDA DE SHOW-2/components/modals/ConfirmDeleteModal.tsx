
import React from 'react';
import ModalWrapper from './ModalWrapper';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, itemName }) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="text-center">
                <h3 className="text-2xl font-bold text-red-500 mb-4">Confirmar Exclusão</h3>
                <p className="mb-6">Você tem certeza que deseja excluir {itemName}? Esta ação não pode ser desfeita.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onConfirm} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors">Sim, Excluir</button>
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">Não, Cancelar</button>
                </div>
            </div>
        </ModalWrapper>
    );
};

export default ConfirmDeleteModal;
