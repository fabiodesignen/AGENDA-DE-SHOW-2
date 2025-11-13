
import React from 'react';
import ModalWrapper from './ModalWrapper';

interface ConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ConflictModal: React.FC<ConflictModalProps> = ({ isOpen, onClose }) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="text-center">
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">Atenção!</h3>
                <p className="mb-6">Conflito de horário detectado. É necessário um intervalo de pelo menos 30 minutos entre os shows.</p>
                <button onClick={onClose} className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md transition-colors">Entendi</button>
            </div>
        </ModalWrapper>
    );
};

export default ConflictModal;
