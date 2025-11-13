

import React, { useState, useCallback, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { authService } from '../../utils/auth';
import { User, UserSubscription } from '../../types';
import { formatCpfInput, formatCurrency, parseCurrency } from '../../utils/helpers';

interface ManageUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ManageUsersModal: React.FC<ManageUsersModalProps> = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [newUserName, setNewUserName] = useState(''); // Added for compatibility with authService
    const [newCpf, setNewCpf] = useState('');
    const [newYearOfBirth, setNewYearOfBirth] = useState('');
    const [error, setError] = useState('');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToManageSubscription, setUserToManageSubscription] = useState<User | null>(null);

    // Subscription management states
    const [subStartDate, setSubStartDate] = useState('');
    const [subMonthlyValue, setSubMonthlyValue] = useState('');
    const [subEndDate, setSubEndDate] = useState('');
    const [subPaymentStatus, setSubPaymentStatus] = useState<'Pago' | 'Pendente' | 'Atrasado'>('Pendente'); // New state for payment status
    const [subError, setSubError] = useState('');

    // Validation states for new user form
    const [nameError, setNameError] = useState('');
    const [cpfError, setCpfError] = useState('');
    const [yearOfBirthError, setYearOfBirthError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsers(authService.getAllRegisteredRegularUsers());
            // Clear new user form fields
            setNewUserName('');
            setNewCpf('');
            setNewYearOfBirth('');
            setError('');
            setNameError('');
            setCpfError('');
            setYearOfBirthError('');
            // Clear subscription management fields
            setUserToManageSubscription(null);
            setSubStartDate('');
            setSubMonthlyValue('');
            setSubEndDate('');
            setSubPaymentStatus('Pendente'); // Reset payment status
            setSubError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (subStartDate) {
            const startDate = new Date(subStartDate + 'T00:00:00'); // Use T00:00:00 to avoid timezone issues
            if (!isNaN(startDate.getTime())) {
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 30);
                setSubEndDate(endDate.toISOString().split('T')[0]);
            } else {
                setSubEndDate('');
            }
        } else {
            setSubEndDate('');
        }
    }, [subStartDate]);

    // Validation functions
    const validateName = useCallback((currentName: string) => {
        if (currentName.trim().length === 0) {
            setNameError('O nome é obrigatório.');
            return false;
        }
        setNameError('');
        return true;
    }, []);

    const validateCpf = useCallback((currentCpf: string) => {
        const cleanedCpf = currentCpf.replace(/\D/g, '');
        if (cleanedCpf.length === 0) {
            setCpfError('O CPF é obrigatório.');
            return false;
        }
        if (cleanedCpf.length !== 11) {
            setCpfError('CPF inválido. Deve conter 11 dígitos.');
            return false;
        }
        setCpfError('');
        return true;
    }, []);

    const validateYearOfBirth = useCallback((currentYear: string) => {
        if (currentYear.length === 0) {
            setYearOfBirthError('O Ano de Nascimento é obrigatório.');
            return false;
        }
        const year = parseInt(currentYear, 10);
        const currentYearFull = new Date().getFullYear();

        if (isNaN(year) || currentYear.length !== 4) {
            setYearOfBirthError('Ano inválido. Digite 4 dígitos.');
            return false;
        }
        if (year > currentYearFull) {
            setYearOfBirthError('O Ano de Nascimento não pode ser futuro.');
            return false;
        }
        if (year < 1900) {
            setYearOfBirthError('Ano muito antigo. Digite um ano válido.');
            return false;
        }
        setYearOfBirthError('');
        return true;
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewUserName(value);
        setError('');
        validateName(value);
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewCpf(formatCpfInput(value));
        setError('');
        validateCpf(value);
    };

    const handleYearOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewYearOfBirth(value);
        setError('');
        validateYearOfBirth(value);
    };

    const handleAddUser = () => {
        setError('');
        const isNameValid = validateName(newUserName);
        const isCpfValid = validateCpf(newCpf);
        const isYearOfBirthValid = validateYearOfBirth(newYearOfBirth);

        if (!isNameValid || !isCpfValid || !isYearOfBirthValid) {
            setError('Por favor, corrija os erros nos campos.');
            return;
        }

        const cleanedCpf = newCpf.replace(/\D/g, '');
        if (authService.addRegularUser(newUserName, cleanedCpf, newYearOfBirth)) {
            setUsers(authService.getAllRegisteredRegularUsers());
            setNewUserName('');
            setNewCpf('');
            setNewYearOfBirth('');
            setNameError(''); // Clear errors on success
            setCpfError('');
            setYearOfBirthError('');
        } else {
            setError('Falha ao adicionar usuário. CPF já pode estar registrado.');
        }
    };

    const confirmDeleteUser = () => {
        if (userToDelete) {
            authService.deleteRegularUser(userToDelete.cpf);
            setUsers(authService.getAllRegisteredRegularUsers());
            setUserToDelete(null);
        }
    };

    const handleToggleBlockStatus = (user: User) => {
        let success: boolean;
        if (user.isBlocked) {
            success = authService.unblockUser(user.cpf);
        } else {
            success = authService.blockUser(user.cpf);
        }

        if (success) {
            setUsers(authService.getAllRegisteredRegularUsers());
        } else {
            setError(`Falha ao ${user.isBlocked ? 'desbloquear' : 'bloquear'} usuário.`);
        }
    };

    const handleManageSubscriptionClick = (user: User) => {
        setUserToManageSubscription(user);
        setSubError('');
        if (user.subscription) {
            setSubStartDate(user.subscription.startDate.split('T')[0]);
            setSubMonthlyValue(formatCurrency(user.subscription.monthlyValue).replace('R$', '').trim());
            setSubPaymentStatus(user.subscription.paymentStatus || 'Pendente'); // Set payment status
            // subEndDate will be calculated by useEffect
        } else {
            setSubStartDate(new Date().toISOString().split('T')[0]); // Default to today
            setSubMonthlyValue('');
            setSubPaymentStatus('Pendente'); // Default payment status
            setSubEndDate('');
        }
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const digitsOnly = rawValue.replace(/\D/g, '');
        
        if (digitsOnly === '') {
            setSubMonthlyValue('');
            return;
        }

        const numberValue = parseInt(digitsOnly, 10) / 100;

        const formatted = numberValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        
        setSubMonthlyValue(formatted);
    };

    const handleSaveSubscription = () => {
        if (!userToManageSubscription) return;
        setSubError('');

        if (!subStartDate || !subMonthlyValue) {
            setSubError('Data de início e valor mensal são obrigatórios.');
            return;
        }

        const monthlyValueNum = parseCurrency(subMonthlyValue);
        if (isNaN(monthlyValueNum) || monthlyValueNum <= 0) {
            setSubError('Valor mensal inválido.');
            return;
        }

        const newSubscription: UserSubscription = {
            startDate: new Date(subStartDate + 'T00:00:00').toISOString(),
            endDate: new Date(subEndDate + 'T00:00:00').toISOString(),
            monthlyValue: monthlyValueNum,
            paymentStatus: subPaymentStatus, // Add payment status here
        };

        const result = authService.updateUserSubscription(userToManageSubscription.cpf, newSubscription);
        if (result === 'success') {
            setUsers(authService.getAllRegisteredRegularUsers()); // Refresh user list
            setUserToManageSubscription(null); // Close subscription form
        } else {
            setSubError('Falha ao salvar assinatura. Usuário não encontrado.');
        }
    };

    const handleRemoveSubscription = () => {
        if (!userToManageSubscription) return;
        setSubError('');

        const result = authService.updateUserSubscription(userToManageSubscription.cpf, null);
        if (result === 'success') {
            setUsers(authService.getAllRegisteredRegularUsers()); // Refresh user list
            setUserToManageSubscription(null); // Close subscription form
        } else {
            setSubError('Falha ao remover assinatura. Usuário não encontrado.');
        }
    };

    const getSubscriptionStatusText = (user: User) => {
        if (user.isBlocked) {
            return { text: 'Bloqueado', color: 'text-red-500', icon: 'fa-ban' };
        }
        if (!user.subscription || !user.subscription.endDate) {
            return { text: 'Nenhuma', color: 'text-gray-400', icon: 'fa-minus-circle' };
        }
        const endDate = new Date(user.subscription.endDate);
        const now = new Date();
        now.setHours(0,0,0,0); // Normalize 'now' to start of day for accurate comparison
        endDate.setHours(0,0,0,0); // Normalize 'endDate' to start of day for accurate comparison


        if (endDate >= now) {
            return {
                text: `Ativa até ${new Date(user.subscription.endDate).toLocaleDateString('pt-BR')}`,
                color: 'text-green-500',
                icon: 'fa-check-circle'
            };
        } else {
            return {
                text: `Expirada em ${new Date(user.subscription.endDate).toLocaleDateString('pt-BR')}`,
                color: 'text-yellow-500',
                icon: 'fa-exclamation-triangle'
            };
        }
    };

    const getPaymentStatusInfo = (status: 'Pago' | 'Pendente' | 'Atrasado') => {
        switch (status) {
            case 'Pago':
                return { text: 'Pago', color: 'text-green-500', icon: 'fa-money-bill-alt' };
            case 'Pendente':
                return { text: 'Pendente', color: 'text-yellow-500', icon: 'fa-clock' };
            case 'Atrasado':
                return { text: 'Atrasado', color: 'text-red-500', icon: 'fa-exclamation-circle' };
            default:
                return { text: 'N/A', color: 'text-gray-400', icon: 'fa-question-circle' };
        }
    };

    return (
        <>
            <ModalWrapper isOpen={isOpen} onClose={onClose}>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Gerenciar Usuários</h3>

                {error && (
                    <div className="bg-red-700 text-white p-3 rounded-md mb-4 text-sm text-center" role="alert">
                        {error}
                    </div>
                )}

                <div className="mb-6 space-y-4 border border-gray-700 p-4 rounded-lg bg-gray-900">
                    <h4 className="font-bold text-lg mb-2 text-purple-300">Adicionar Novo Usuário</h4>
                    <div>
                        <label htmlFor="newUserNameInput" className="block mb-1 font-medium text-sm">Nome do Usuário</label>
                        <input
                            type="text"
                            id="newUserNameInput"
                            value={newUserName}
                            onChange={handleNameChange}
                            className={`w-full bg-gray-800 border ${nameError ? 'border-red-500' : 'border-gray-600'} rounded-md p-2`}
                            placeholder="Nome Completo"
                        />
                        {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                    </div>
                    <div>
                        <label htmlFor="newCpfInput" className="block mb-1 font-medium text-sm">CPF</label>
                        <input
                            type="text"
                            id="newCpfInput"
                            value={newCpf}
                            onChange={handleCpfChange}
                            maxLength={14}
                            className={`w-full bg-gray-800 border ${cpfError ? 'border-red-500' : 'border-gray-600'} rounded-md p-2`}
                            placeholder="000.000.000-00"
                        />
                        {cpfError && <p className="text-red-500 text-sm mt-1">{cpfError}</p>}
                    </div>
                    <div>
                        <label htmlFor="newYearOfBirthInput" className="block mb-1 font-medium text-sm">Ano de Nascimento</label>
                        <input
                            type="number"
                            id="newYearOfBirthInput"
                            value={newYearOfBirth}
                            onChange={handleYearOfBirthChange}
                            min="1900"
                            max={new Date().getFullYear()}
                            maxLength={4}
                            className={`w-full bg-gray-800 border ${yearOfBirthError ? 'border-red-500' : 'border-gray-600'} rounded-md p-2`}
                            placeholder="YYYY"
                        />
                        {yearOfBirthError && <p className="text-red-500 text-sm mt-1">{yearOfBirthError}</p>}
                    </div>
                    <button onClick={handleAddUser} className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md transition-colors">Adicionar Usuário</button>
                </div>

                <h4 className="font-bold text-lg mb-2 text-purple-300">Usuários Registrados</h4>
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {users.length > 0 ? users.map(user => {
                        const subStatus = getSubscriptionStatusText(user);
                        return (
                            <li key={user.cpf} className="bg-gray-800 border border-gray-700 rounded p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-white text-lg">{user.name || 'Nome não definido'}</p>
                                        <p className="text-gray-400 text-sm">CPF: {formatCpfInput(user.cpf)}</p>
                                        <p className="text-gray-400 text-sm">Ano Nasc: {user.yearOfBirth || 'N/A'}</p>
                                    </div>
                                    <div className="flex gap-2 items-center flex-shrink-0">
                                        <button
                                            onClick={() => handleToggleBlockStatus(user)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                                ${user.isBlocked ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
                                            title={user.isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                                        >
                                            <i className={`fas ${user.isBlocked ? 'fa-unlock' : 'fa-lock'} text-white text-sm`}></i>
                                        </button>
                                        <button onClick={() => setUserToDelete(user)} className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors" title="Excluir Usuário">
                                            <i className="fas fa-trash text-sm"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <p className={`font-semibold text-sm ${subStatus.color}`}>
                                        <i className={`fas ${subStatus.icon} mr-1`}></i> Assinatura: {subStatus.text}
                                    </p>
                                    {user.subscription && (
                                        <>
                                            <p className="text-gray-400 text-xs">Início: {new Date(user.subscription.startDate).toLocaleDateString('pt-BR')} | Fim: {new Date(user.subscription.endDate).toLocaleDateString('pt-BR')}</p>
                                            <p className="text-gray-400 text-xs">Valor Mensal: {formatCurrency(user.subscription.monthlyValue)}</p>
                                            {user.subscription.paymentStatus && (
                                                <p className={`font-semibold text-xs ${getPaymentStatusInfo(user.subscription.paymentStatus).color}`}>
                                                    <i className={`fas ${getPaymentStatusInfo(user.subscription.paymentStatus).icon} mr-1`}></i> Pagamento: {getPaymentStatusInfo(user.subscription.paymentStatus).text}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <button onClick={() => handleManageSubscriptionClick(user)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2">
                                    <i className="fas fa-money-check-alt"></i> Gerenciar Assinatura
                                </button>

                                {userToManageSubscription?.cpf === user.cpf && (
                                    <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded-md space-y-3 animate-slideIn">
                                        <h5 className="font-bold text-purple-300 text-md text-center">Assinatura de {user.name}</h5>
                                        {subError && (
                                            <div className="bg-red-700 text-white p-2 rounded-md text-sm text-center" role="alert">
                                                {subError}
                                            </div>
                                        )}
                                        <div>
                                            <label htmlFor="subStartDate" className="block mb-1 font-medium text-sm">Data de Início</label>
                                            <input
                                                type="date"
                                                id="subStartDate"
                                                value={subStartDate}
                                                onChange={e => setSubStartDate(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                                                style={{colorScheme: 'dark'}}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="subMonthlyValue" className="block mb-1 font-medium text-sm">Valor Mensal (R$)</label>
                                            <input
                                                type="text"
                                                id="subMonthlyValue"
                                                value={subMonthlyValue}
                                                onChange={handleCurrencyChange}
                                                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                                                placeholder="0,00"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="subPaymentStatus" className="block mb-1 font-medium text-sm">Status do Pagamento</label>
                                            <select
                                                id="subPaymentStatus"
                                                value={subPaymentStatus}
                                                onChange={e => setSubPaymentStatus(e.target.value as 'Pago' | 'Pendente' | 'Atrasado')}
                                                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 text-white h-10"
                                                style={{colorScheme: 'dark'}}
                                            >
                                                <option value="Pendente">Pendente</option>
                                                <option value="Pago">Pago</option>
                                                <option value="Atrasado">Atrasado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="subEndDate" className="block mb-1 font-medium text-sm">Data de Término (Calculado)</label>
                                            <input
                                                type="date"
                                                id="subEndDate"
                                                value={subEndDate}
                                                readOnly
                                                className="w-full bg-gray-800/50 border border-gray-700 rounded-md p-2 text-gray-400 cursor-not-allowed"
                                                style={{colorScheme: 'dark'}}
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-4 justify-end">
                                            <button onClick={handleSaveSubscription} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 rounded-md transition-colors text-sm flex-1">
                                                <i className="fas fa-save mr-1"></i> Salvar
                                            </button>
                                            <button onClick={handleRemoveSubscription} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-md transition-colors text-sm flex-1">
                                                <i className="fas fa-times-circle mr-1"></i> Remover Assinatura
                                            </button>
                                        </div>
                                        <div className="mt-2 text-right">
                                            <button onClick={() => setUserToManageSubscription(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded transition-colors text-sm">
                                                Fechar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    }) : (
                        <li className="text-gray-400 p-2">Nenhum usuário registrado.</li>
                    )}
                </ul>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">Fechar</button>
                </div>
            </ModalWrapper>
            <ConfirmDeleteModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDeleteUser}
                itemName={`o usuário "${userToDelete?.name || formatCpfInput(userToDelete?.cpf || '')}"`}
            />
        </>
    );
};

export default ManageUsersModal;