
import React, { useRef } from 'react';
import { ArtistInfo, AuthState } from '../types';

interface HeaderProps {
    artistInfo: ArtistInfo;
    setArtistInfo: React.Dispatch<React.SetStateAction<ArtistInfo>>;
    onLogout: () => void;
    authStatus: AuthState; // Changed from isAuthenticated to authStatus
}

const EditableField: React.FC<{ value: string; onSave: (newValue: string) => void; placeholder: string; className?: string }> = ({ value, onSave, placeholder, className }) => {
    return (
        <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onSave(e.currentTarget.textContent || '')}
            className={`outline-none focus:bg-gray-700 focus:ring-2 focus:ring-purple-500 rounded px-1 py-0.5 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 ${className ?? ''}`}
            data-placeholder={placeholder}
            dangerouslySetInnerHTML={{ __html: value }}
        />
    );
};


const Header: React.FC<HeaderProps> = ({ artistInfo, setArtistInfo, onLogout, authStatus }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                setArtistInfo(prev => ({ ...prev, logo: imageUrl }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleInfoSave = (field: keyof Omit<ArtistInfo, 'logo'>) => (newValue: string) => {
        setArtistInfo(prev => ({...prev, [field]: newValue}));
    };

    return (
        <header className="text-center mb-8 relative">
            {authStatus.isAuthenticated && ( // Use authStatus.isAuthenticated
                <button
                    onClick={onLogout}
                    className="absolute top-0 right-0 bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded-md transition-colors text-sm flex items-center gap-2"
                    aria-label="Sair da conta"
                >
                    <i className="fas fa-sign-out-alt"></i> Sair
                </button>
            )}
            <div
                onClick={handleLogoClick}
                className="relative group mx-auto w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600 mb-4 overflow-hidden cursor-pointer"
                aria-label="Upload ou alteração do logo do artista"
                role="button"
                tabIndex={0}
            >
                {artistInfo.logo ? (
                     <img src={artistInfo.logo} alt="Logo do Artista" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-400 text-sm">LOGO</span>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
                    <i className="fas fa-pencil-alt text-white text-lg"></i>
                    <span className="mt-1 text-white text-xs">Alterar Logo</span>
                </div>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
            />
            <h1 className="text-4xl font-bold tracking-wider uppercase text-white">Agenda de Shows</h1>
            <div className="mt-4 text-lg text-gray-300 space-y-2">
                 <p className="font-bold text-2xl">
                    <EditableField value={artistInfo.name} onSave={handleInfoSave('name')} placeholder="Nome do Usuário" />
                </p>
                <p>
                    <i className="fas fa-phone text-purple-400"></i>{' '}
                    <EditableField value={artistInfo.contact} onSave={handleInfoSave('contact')} placeholder="Seu Contato (opcional)" />
                </p>
                <p>
                    <i className="fab fa-instagram text-purple-400"></i>{' '}
                    <EditableField value={artistInfo.instagram} onSave={handleInfoSave('instagram')} placeholder="Seu Instagram (opcional)" />
                </p>
            </div>
        </header>
    );
};

export default Header;