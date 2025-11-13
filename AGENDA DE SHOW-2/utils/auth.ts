import { User, UserType, UserSubscription } from '../types';

const ADMIN_CREDS_KEY = 'agenda_shows_admin_creds';
const REGULAR_USER_CREDS_LIST_KEY = 'agenda_shows_regular_users_list';
const ACTIVE_ADMIN_SESSION_KEY = 'agenda_shows_admin_session_active';
const ACTIVE_REGULAR_USER_SESSION_KEY = 'agenda_shows_active_regular_user_cpf';

/**
 * IMPORTANT SECURITY NOTE:
 * This is a client-side only application. Storing user credentials, even hashed,
 * in localStorage is NOT secure for applications handling sensitive data or
 * requiring robust authentication. This implementation is for demonstration
 * purposes within the scope of a personal PWA where data security relies
 * primarily on device security. For production apps, always use server-side
 * authentication with industry-standard hashing (e.g., bcrypt with salts)
 * and secure session management.
 */

// Utility to format CPF (removes non-digits)
function formatCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function simpleHash(cpf: string, yearOfBirth: string): string {
  // A very simple "hash" for demonstration. In a real app, use a strong KDF like Argon2, scrypt, or bcrypt.
  const combinedString = `${formatCpf(cpf)}:${yearOfBirth}`;
  return btoa(combinedString).split('').reverse().join('');
}

export const authService = {
  // --- Admin Specific Methods ---
  getStoredAdminUser(): User | null {
    try {
      const userString = localStorage.getItem(ADMIN_CREDS_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error("Failed to retrieve admin from localStorage", error);
      return null;
    }
  },

  setStoredAdminUser(user: User): void {
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(user));
  },

  startAdminSession(): void {
    sessionStorage.setItem(ACTIVE_ADMIN_SESSION_KEY, 'true');
  },

  endAdminSession(): void {
    sessionStorage.removeItem(ACTIVE_ADMIN_SESSION_KEY);
  },

  isAdminSessionActive(): boolean {
    return sessionStorage.getItem(ACTIVE_ADMIN_SESSION_KEY) === 'true';
  },

  registerAdmin(cpf: string, yearOfBirth: string): boolean {
    if (!cpf || !yearOfBirth) {
      return false;
    }
    const formattedCpf = formatCpf(cpf);
    const existingAdmin = this.getStoredAdminUser();

    if (existingAdmin) {
      // Admin already registered, treat as login attempt
      return this.loginAdmin(cpf, yearOfBirth);
    }
    
    const hashedYearOfBirth = simpleHash(formattedCpf, yearOfBirth);
    // Admin user doesn't necessarily need a 'name' in this context, or subscription details.
    const newAdmin: User = { 
      id: Date.now(), 
      name: 'Admin', // Default name for admin
      cpf: formattedCpf, 
      yearOfBirth: yearOfBirth, // Store yearOfBirth for display
      hashedYearOfBirth 
    }; 
    this.setStoredAdminUser(newAdmin);
    this.startAdminSession();
    return true;
  },

  loginAdmin(cpf: string, yearOfBirth: string): boolean {
    const formattedCpf = formatCpf(cpf);
    const storedAdmin = this.getStoredAdminUser();
    if (storedAdmin && storedAdmin.cpf === formattedCpf) {
      const hashedYearOfBirth = simpleHash(formattedCpf, yearOfBirth);
      if (storedAdmin.hashedYearOfBirth === hashedYearOfBirth) {
        this.startAdminSession();
        return true;
      }
    }
    return false;
  },

  logoutAdmin(): void {
    this.endAdminSession();
  },

  // --- Regular User Management Methods (by Admin) ---
  getAllRegisteredRegularUsers(): User[] {
    const timestamp = new Date().toISOString();
    try {
      const usersString = localStorage.getItem(REGULAR_USER_CREDS_LIST_KEY);
      console.log(`[authService] [${timestamp}] Lendo usuários do localStorage (key: ${REGULAR_USER_CREDS_LIST_KEY}). String bruta:`, usersString);
      if (!usersString) {
        console.log(`[authService] [${timestamp}] Nenhum dado encontrado para ${REGULAR_USER_CREDS_LIST_KEY}. Retornando array vazio.`);
        return [];
      }
      const users: User[] = JSON.parse(usersString);
      console.log(`[authService] [${timestamp}] Usuários lidos (parsed):`, users);
      // Ensure all users have `name`, `yearOfBirth`, `isBlocked`, `subscription` and `paymentStatus` properties for consistency and backward compatibility
      return users.map(user => ({ 
        ...user, 
        name: user.name ?? `Usuário ${user.cpf}`, // Fallback name
        yearOfBirth: user.yearOfBirth ?? 'N/A', // Fallback year of birth
        isBlocked: user.isBlocked ?? false,
        subscription: user.subscription ? { // Ensure paymentStatus exists in existing subscriptions
          ...user.subscription,
          paymentStatus: user.subscription.paymentStatus ?? 'Pendente' // Default paymentStatus
        } : null,
      }));
    } catch (error) {
      console.error(`[authService] [${timestamp}] ERRO FATAL ao ler/parsear usuários regulares do localStorage para ${REGULAR_USER_CREDS_LIST_KEY}. String que causou erro:`, localStorage.getItem(REGULAR_USER_CREDS_LIST_KEY), "Erro:", error);
      // If parsing fails, it might mean corrupted data, so return empty array to prevent further issues.
      return [];
    }
  },

  setAllRegisteredRegularUsers(users: User[]): void {
    const dataToStore = JSON.parse(JSON.stringify(users)); // Deep copy to prevent unexpected mutations during stringify
    const timestamp = new Date().toISOString();
    console.log(`[authService] [${timestamp}] Tentando salvar ${dataToStore.length} usuários no localStorage (key: ${REGULAR_USER_CREDS_LIST_KEY}). Dados:`, dataToStore);
    try {
      const serializedData = JSON.stringify(dataToStore);
      localStorage.setItem(REGULAR_USER_CREDS_LIST_KEY, serializedData);
      const retrievedData = localStorage.getItem(REGULAR_USER_CREDS_LIST_KEY);
      console.log(`[authService] [${timestamp}] Salvamento concluído para ${REGULAR_USER_CREDS_LIST_KEY}. Tamanho: ${serializedData.length} bytes. Dados recuperados imediatamente:`, retrievedData);
    } catch (error) {
      console.error(`[authService] [${timestamp}] ERRO ao salvar usuários em localStorage para ${REGULAR_USER_CREDS_LIST_KEY}:`, error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error("[authService] QuotaExceededError: O armazenamento local está cheio. Considere limpar os dados do site.");
      }
    }
  },

  addRegularUser(name: string, cpf: string, yearOfBirth: string): boolean {
    if (!name.trim() || !cpf || !yearOfBirth) {
      return false;
    }
    const formattedCpf = formatCpf(cpf);
    const users = this.getAllRegisteredRegularUsers();

    if (users.some(user => user.cpf === formattedCpf)) {
      return false; // User with this CPF already registered
    }

    const hashedYearOfBirth = simpleHash(formattedCpf, yearOfBirth);
    const newUser: User = { 
      id: Date.now(), 
      name: name.trim(), 
      cpf: formattedCpf, 
      yearOfBirth: yearOfBirth, // Store yearOfBirth for display
      hashedYearOfBirth, 
      isBlocked: false, // New users are not blocked by default
      subscription: null, // New users have no subscription by default
    };
    this.setAllRegisteredRegularUsers([...users, newUser]);
    return true;
  },

  deleteRegularUser(cpf: string): void {
    const formattedCpf = formatCpf(cpf);
    const users = this.getAllRegisteredRegularUsers();
    this.setAllRegisteredRegularUsers(users.filter(user => user.cpf !== formattedCpf));
    // If the deleted user was the currently active one, log them out
    if (this.getCurrentlyActiveRegularUserCpf() === formattedCpf) {
      this.logoutRegularUser();
    }
  },

  blockUser(cpf: string): boolean {
    const formattedCpf = formatCpf(cpf);
    const users = this.getAllRegisteredRegularUsers();
    const userIndex = users.findIndex(user => user.cpf === formattedCpf);
    if (userIndex > -1) {
      users[userIndex].isBlocked = true;
      this.setAllRegisteredRegularUsers(users);
      // If the blocked user was the currently active one, log them out
      if (this.getCurrentlyActiveRegularUserCpf() === formattedCpf) {
        this.logoutRegularUser();
      }
      return true;
    }
    return false;
  },

  unblockUser(cpf: string): boolean {
    const formattedCpf = formatCpf(cpf);
    const users = this.getAllRegisteredRegularUsers();
    const userIndex = users.findIndex(user => user.cpf === formattedCpf);
    if (userIndex > -1) {
      users[userIndex].isBlocked = false;
      this.setAllRegisteredRegularUsers(users);
      return true;
    }
    return false;
  },

  // Helper to check and block based on subscription for a single user
  checkAndBlockUserSubscription(user: User): 'success' | 'blocked' {
    if (user.subscription && user.subscription.endDate) {
        const now = new Date();
        const endDate = new Date(user.subscription.endDate);
        now.setHours(0,0,0,0); // Normalize 'now' to start of day for accurate comparison
        endDate.setHours(0,0,0,0); // Normalize 'endDate' to start of day for accurate comparison

        if (now > endDate && !user.isBlocked) { // Only block if not already blocked
            user.isBlocked = true; // Mark as blocked if subscription expired
            // Persist this change immediately
            const users = this.getAllRegisteredRegularUsers();
            const userIndex = users.findIndex(u => u.cpf === user.cpf);
            if (userIndex !== -1) {
                users[userIndex].isBlocked = true;
                this.setAllRegisteredRegularUsers(users);
                // Also log out if they are the active user
                if (this.getCurrentlyActiveRegularUserCpf() === user.cpf) {
                    this.logoutRegularUser();
                }
            }
            return 'blocked';
        }
    }
    return 'success';
  },

  // New method to be called by admin dashboard or on app load
  checkAndBlockExpiredSubscriptions(): void {
    const users = this.getAllRegisteredRegularUsers();
    let updated = false;
    const now = new Date();
    now.setHours(0,0,0,0); // Normalize 'now' to start of day for accurate comparison

    const updatedUsers = users.map(user => {
        if (user.subscription && user.subscription.endDate) {
            const endDate = new Date(user.subscription.endDate);
            endDate.setHours(0,0,0,0); // Normalize 'endDate' to start of day for accurate comparison
            if (now > endDate && !user.isBlocked) { // Only block if not already blocked
                user.isBlocked = true;
                updated = true;
                // If the user's session is active and they are now blocked, log them out
                if (this.getCurrentlyActiveRegularUserCpf() === user.cpf) {
                    this.logoutRegularUser();
                }
            }
        }
        return user;
    });

    if (updated) {
        this.setAllRegisteredRegularUsers(updatedUsers);
    }
  },

  updateUserSubscription(cpf: string, newSubscription: UserSubscription | null): 'success' | 'notFound' {
    const formattedCpf = formatCpf(cpf);
    const users = this.getAllRegisteredRegularUsers();
    const userIndex = users.findIndex(user => user.cpf === formattedCpf);

    if (userIndex > -1) {
        const user = users[userIndex];
        user.subscription = newSubscription;

        // Determine blocking status based on new subscription
        if (newSubscription && new Date(newSubscription.endDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)) {
            user.isBlocked = false; // Unblock if subscription is active
        } else {
            user.isBlocked = true; // Block if no subscription or expired
            // If the user's session is active and they are now blocked, log them out
            if (this.getCurrentlyActiveRegularUserCpf() === user.cpf) {
                this.logoutRegularUser();
            }
        }
        this.setAllRegisteredRegularUsers(users);
        return 'success';
    }
    return 'notFound';
  },

  // --- Regular User Login/Session Methods ---
  getCurrentlyActiveRegularUserCpf(): string | null {
    return sessionStorage.getItem(ACTIVE_REGULAR_USER_SESSION_KEY);
  },

  getStoredUser(cpf: string): User | null {
    const users = this.getAllRegisteredRegularUsers();
    return users.find(user => user.cpf === formatCpf(cpf)) || null;
  },

  startRegularUserSession(cpf: string): void {
    sessionStorage.setItem(ACTIVE_REGULAR_USER_SESSION_KEY, formatCpf(cpf));
  },

  endRegularUserSession(): void {
    sessionStorage.removeItem(ACTIVE_REGULAR_USER_SESSION_KEY);
  },

  isRegularUserSessionActive(): boolean {
    return !!sessionStorage.getItem(ACTIVE_REGULAR_USER_SESSION_KEY);
  },

  registerRegularUser(name: string, cpf: string, yearOfBirth: string): boolean { // Added name parameter
    if (!name.trim() || !cpf || !yearOfBirth) {
      return false;
    }
    const formattedCpf = formatCpf(cpf);
    const users = this.getAllRegisteredRegularUsers();
    
    if (users.some(user => user.cpf === formattedCpf)) {
      // User already registered, treat as login attempt for the user themselves
      return this.loginRegularUser(cpf, yearOfBirth) === 'success'; // Only register if not already logged in
    }
    
    // This path would typically be called by admin, but allowing direct user registration for first-time use
    const hashedYearOfBirth = simpleHash(formattedCpf, yearOfBirth);
    const newUser: User = { 
      id: Date.now(), 
      name: name.trim(), 
      cpf: formattedCpf, 
      yearOfBirth: yearOfBirth, // Store yearOfBirth for display
      hashedYearOfBirth, 
      isBlocked: false, 
      subscription: null 
    };
    this.setAllRegisteredRegularUsers([...users, newUser]);
    this.startRegularUserSession(formattedCpf);
    return true;
  },


  loginRegularUser(cpf: string, yearOfBirth: string): 'success' | 'blocked' | 'invalid' {
    const formattedCpf = formatCpf(cpf);
    const storedUser = this.getStoredUser(formattedCpf);
    if (storedUser && storedUser.cpf === formattedCpf) {
      // First, check subscription status and potentially block
      const subscriptionStatus = this.checkAndBlockUserSubscription(storedUser);
      if (subscriptionStatus === 'blocked') {
          return 'blocked';
      }

      // Now check if manually blocked (after subscription check, as subscription expiry is more dynamic)
      if (storedUser.isBlocked) {
        return 'blocked';
      }
      const hashedYearOfBirth = simpleHash(formattedCpf, yearOfBirth);
      if (storedUser.hashedYearOfBirth === hashedYearOfBirth) {
        this.startRegularUserSession(formattedCpf);
        return 'success';
      }
    }
    return 'invalid';
  },

  logoutRegularUser(): void {
    this.endRegularUserSession();
  },
};