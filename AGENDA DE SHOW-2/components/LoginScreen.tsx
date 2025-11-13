

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../utils/auth';
import { User, UserType } from '../types';
import { formatCpfInput } from '../utils/helpers';

interface LoginScreenProps {
    onLoginSuccess: (user: User, type: UserType) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [cpf, setCpf] = useState('');
    const [yearOfBirth, setYearOfBirth] = useState('');
    const [error, setError] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [isAdminLoginMode, setIsAdminLoginMode] = useState(false);

    const [cpfError, setCpfError] = useState('');
    const [yearOfBirthError, setYearOfBirthError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedAdminExists = !!authService.getStoredAdminUser();
        const storedUserExists = authService.getAllRegisteredRegularUsers().length > 0;

        if (storedAdminExists) {
            // Admin is already registered. If regular users exist, default to regular user login. Otherwise, admin login.
            if (storedUserExists) {
                setIsAdminLoginMode(false); // Regular user login
                setIsRegisterMode(false); // Always login for regular users now
            } else {
                setIsAdminLoginMode(true); // Admin login
                setIsRegisterMode(false); // Admin already registered, so always login
            }
        } else {
            // No admin registered. Admin must register first.
            setIsAdminLoginMode(true); // Admin mode
            setIsRegisterMode(true); // Forced registration for admin
        }
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

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCpf(formatCpfInput(value));
        setError('');
        validateCpf(value);
    };

    const handleYearOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setYearOfBirth(value);
        setError('');
        validateYearOfBirth(value);
    };

    const handleBlurCpf = () => validateCpf(cpf);
    const handleBlurYearOfBirth = () => validateYearOfBirth(yearOfBirth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const isCpfValid = validateCpf(cpf);
        const isYearOfBirthValid = validateYearOfBirth(yearOfBirth);

        if (!isCpfValid || !isYearOfBirthValid) {
            setError('Por favor, corrija os erros nos campos.');
            return;
        }

        setIsLoading(true);

        const cleanedCpf = cpf.replace(/\D/g, '');
        let success = false;
        let loggedInUser: User | null = null;
        let loggedInUserType: UserType | null = null;

        try {
            if (isAdminLoginMode) { // Admin flow
                if (isRegisterMode) {
                    // Admin registration
                    success = authService.registerAdmin(cleanedCpf, yearOfBirth);
                    if (success) {
                        loggedInUser = authService.getStoredAdminUser();
                        loggedInUserType = 'admin';
                    } else {
                        setError('Falha ao registrar administrador. Um administrador já pode estar cadastrado com credenciais diferentes.');
                    }
                } else {
                    // Admin login
                    success = authService.loginAdmin(cleanedCpf, yearOfBirth);
                    if (success) {
                        loggedInUser = authService.getStoredAdminUser();
                        loggedInUserType = 'admin';
                    } else {
                        setError('CPF ou Ano de Nascimento do Administrador incorretos.');
                    }
                }
            } else { // Regular User flow (Login Only)
                // Regular user login
                const loginResult = authService.loginRegularUser(cleanedCpf, yearOfBirth);
                if (loginResult === 'success') {
                    success = true;
                    loggedInUser = authService.getStoredUser(cleanedCpf);
                    loggedInUserType = 'regular';
                } else if (loginResult === 'blocked') {
                    setError('Sua conta está bloqueada. Entre em contato com o administrador.');
                } else { // 'invalid'
                    setError('CPF ou Ano de Nascimento do Usuário incorretos.');
                }
            }

            if (success && loggedInUser && loggedInUserType) {
                onLoginSuccess(loggedInUser, loggedInUserType);
            }
        } catch (opError) {
            console.error("Authentication operation failed:", opError);
            setError("Ocorreu um erro inesperado. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const isFormInvalid = !cpf || !yearOfBirth || !!cpfError || !!yearOfBirthError;

    const toggleMode = (adminMode: boolean) => {
        setIsAdminLoginMode(adminMode);
        // For regular user mode, always force login mode.
        // For admin mode, check if admin is registered to decide between login/register.
        setIsRegisterMode(adminMode ? !authService.getStoredAdminUser() : false);
        setError('');
        setCpf('');
        setYearOfBirth('');
        setCpfError('');
        setYearOfBirthError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 w-full max-w-md text-center shadow-lg">
                <div className="mb-6">
                    <i className="fas fa-music text-purple-400 text-5xl mb-2"></i>
                    <h1 className="text-4xl font-bold tracking-wider uppercase text-white">Agenda de Shows</h1>
                    <p className="text-gray-400 mt-2">Gerencie seus shows e compromissos musicais</p>
                </div>

                <div className="flex justify-center mb-6 rounded-md overflow-hidden border border-gray-600">
                    <button
                        onClick={() => toggleMode(false)}
                        className={`flex-1 py-2 font-semibold transition-colors focus:outline-none 
                            ${!isAdminLoginMode ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        disabled={isLoading}
                    >
                        Usuário
                    </button>
                    <button
                        onClick={() => toggleMode(true)}
                        className={`flex-1 py-2 font-semibold transition-colors focus:outline-none 
                            ${isAdminLoginMode ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        disabled={isLoading}
                    >
                        Administrador
                    </button>
                </div>

                <div className="flex justify-center mb-6">
                    {isAdminLoginMode ? (
                        <>
                            <button
                                onClick={() => { setIsRegisterMode(false); setError(''); setCpf(''); setYearOfBirth(''); setCpfError(''); setYearOfBirthError(''); }}
                                className={`flex-1 py-2 px-6 rounded-l-md font-semibold transition-colors focus:outline-none 
                                    ${!isRegisterMode ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                disabled={isLoading}
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => { setIsRegisterMode(true); setError(''); setCpf(''); setYearOfBirth(''); setCpfError(''); setYearOfBirthError(''); }}
                                className={`flex-1 py-2 px-6 rounded-r-md font-semibold transition-colors focus:outline-none 
                                    ${isRegisterMode ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                disabled={isLoading}
                            >
                                Cadastrar
                            </button>
                        </>
                    ) : (
                        <button
                            className={`w-full py-2 px-6 rounded-md font-semibold transition-colors focus:outline-none bg-purple-700 text-white`}
                            disabled={isLoading}
                        >
                            Entrar
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-700 text-white p-3 rounded-md mb-4 text-sm" role="alert">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="cpf" className="block mb-1 font-medium text-left">CPF</label>
                        <input
                            type="text"
                            id="cpf"
                            value={cpf}
                            onChange={handleCpfChange}
                            onBlur={handleBlurCpf}
                            maxLength={14}
                            required
                            className={`w-full bg-gray-900 border ${cpfError ? 'border-red-500' : 'border-gray-600'} rounded-md p-3 focus:ring-purple-500 focus:border-purple-500 text-white`}
                            aria-label="CPF"
                            placeholder="000.000.000-00"
                            disabled={isLoading}
                        />
                        {cpfError && <p className="text-red-500 text-sm mt-1 text-left">{cpfError}</p>}
                    </div>
                    <div>
                        <label htmlFor="yearOfBirth" className="block mb-1 font-medium text-left">Ano de Nascimento</label>
                        <input
                            type="number"
                            id="yearOfBirth"
                            name="yearOfBirth"
                            value={yearOfBirth}
                            onChange={handleYearOfBirthChange}
                            onBlur={handleBlurYearOfBirth}
                            min="1900"
                            max={new Date().getFullYear()}
                            required
                            className={`w-full bg-gray-900 border ${yearOfBirthError ? 'border-red-500' : 'border-gray-600'} rounded-md p-3 focus:ring-purple-500 focus:border-purple-500 text-white`}
                            aria-label="Ano de Nascimento"
                            placeholder="YYYY"
                            disabled={isLoading}
                        />
                        {yearOfBirthError && <p className="text-red-500 text-sm mt-1 text-left">{yearOfBirthError}</p>}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                        disabled={isFormInvalid || isLoading}
                    >
                        {isLoading && <i className="fas fa-spinner fa-spin"></i>}
                        {isAdminLoginMode ? (isRegisterMode ? (isLoading ? 'Cadastrando...' : 'Cadastrar') : (isLoading ? 'Entrando...' : 'Entrar')) : (isLoading ? 'Entrando...' : 'Entrar')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;