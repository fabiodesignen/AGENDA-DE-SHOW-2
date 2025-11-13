
import React from 'react';

interface AdminDashboardProps {
    onLogout: () => void;
    onManageUsers: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onManageUsers }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 w-full max-w-md text-center shadow-lg relative">
                <button
                    onClick={onLogout}
                    className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded-md transition-colors text-sm flex items-center gap-2"
                    aria-label="Sair da conta de administrador"
                >
                    <i className="fas fa-sign-out-alt"></i> Sair
                </button>
                <i className="fas fa-user-shield text-purple-400 text-5xl mb-4"></i>
                <h1 className="text-3xl font-bold tracking-wider uppercase text-white mb-4">Painel do Administrador</h1>
                <p className="text-gray-400 mb-8">Bem-vindo, Administrador! Gerencie os usuários da Agenda de Shows.</p>
                <button
                    onClick={onManageUsers}
                    className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    aria-label="Gerenciar Usuários"
                >
                    <i className="fas fa-users-cog mr-2"></i> Gerenciar Usuários
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
