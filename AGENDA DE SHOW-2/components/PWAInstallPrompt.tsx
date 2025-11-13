

import React, { useState, useEffect } from 'react';
// import Toast from './modals/Toast'; // Toast import removed

interface PWAInstallPromptProps {
    installPromptEvent: BeforeInstallPromptEvent | null;
    onDismiss: () => void;
    onInstallSuccess: () => void;
    // setToast: (toast: { message: string; type: 'success' | 'error' | 'info' } | null) => void; // setToast prop removed
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ installPromptEvent, onDismiss, onInstallSuccess /*, setToast*/ }) => {
    const [isVisible, setIsVisible] = useState(false);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;

    useEffect(() => {
        if (installPromptEvent) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [installPromptEvent]);

    const handleInstallClick = async () => {
        if (!installPromptEvent) {
            // setToast({ message: 'Ocorreu um erro ao tentar instalar. Tente novamente.', type: 'error' }); // setToast call removed
            console.error('No install prompt event available.');
            return;
        }
        
        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;

        if (outcome === 'accepted') {
            // setToast({ message: 'Instalando Agenda de Shows...', type: 'info' }); // setToast call removed
            onInstallSuccess();
        } else {
            // setToast({ message: 'Instalação cancelada.', type: 'info' }); // setToast call removed
            onDismiss();
        }
        setIsVisible(false); // Hide prompt after interaction
    };

    const handleClose = () => {
        setIsVisible(false);
        onDismiss();
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div 
            className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 text-center shadow-lg animate-slideUp z-50"
            role="alert"
            aria-live="polite"
        >
            <button
                onClick={handleClose}
                className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-full focus:outline-none"
                aria-label="Fechar"
            >
                <i className="fas fa-times"></i>
            </button>
            
            {isIOS || isSafari ? (
                <>
                    <p className="text-sm mb-2 text-gray-300">
                        Para instalar este aplicativo no seu iPhone/iPad, toque no botão <i className="fas fa-share-square mx-1"></i> (Compartilhar) e depois em "Adicionar à Tela de Início".
                    </p>
                </>
            ) : (
                <>
                    <p className="text-lg font-semibold mb-3">Instale o Agenda de Shows!</p>
                    <button
                        onClick={handleInstallClick}
                        className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center mx-auto"
                        aria-label="Instalar aplicativo"
                    >
                        <i className="fas fa-download mr-2"></i> Instalar Aplicativo
                    </button>
                </>
            )}
        </div>
    );
};

export default PWAInstallPrompt;