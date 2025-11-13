
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Show, ArtistInfo, Location, User, UserType, AuthState } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import Stats from './components/Stats';
import Tabs from './components/Tabs';
import AddShowForm from './components/AddShowForm';
import ShowList from './components/ShowList';
import CalendarView from './components/CalendarView';
import MonthView from './components/MonthView';
import ShareView from './components/ShareView';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import ManageLocationsModal from './components/modals/ManageLocations/ManageLocationsModal';
import ManageUsersModal from './components/modals/ManageUsersModal';
import ConfirmDeleteModal from './components/modals/ConfirmDeleteModal';
import ConflictModal from './components/modals/ConflictModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { hasTimeConflict } from './utils/helpers';
import { authService } from './utils/auth';

// Declare BeforeInstallPromptEvent globally if it's not recognized by TypeScript
declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}

function App() {
  const [shows, setShows] = useLocalStorage<Show[]>('shows', []);
  const [artistInfo, setArtistInfo] = useLocalStorage<ArtistInfo>('artistInfo', {
    name: 'Seu Nome de Artista',
    contact: '',
    instagram: '',
    logo: '',
  });
  const [locations, setLocations] = useLocalStorage<Location[]>('locations', [
    { id: 1, name: 'Bar do Zé' },
    { id: 2, name: 'Casa de Show XYZ' },
  ]);

  const [activeTab, setActiveTab] = useState('showList');
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showManageLocationsModal, setShowManageLocationsModal] = useState(false);
  const [showManageUsersModal, setShowManageUsersModal] = useState(false); // State for ManageUsersModal
  const [showToDelete, setShowToDelete] = useState<Show | null>(null);

  const [authState, setAuthState] = useLocalStorage<AuthState>('authState', {
    isAuthenticated: false,
    user: null,
    type: null,
  });

  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is running in standalone mode (PWA installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    // Event listener for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    // Event listener for appinstalled
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPromptEvent(null); // Clear the prompt event after installation
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    // Check for expired subscriptions and block users on app load
    if (authState.isAuthenticated && authState.type === 'admin') {
      authService.checkAndBlockExpiredSubscriptions();
    }
    // Also, if a regular user is logged in, re-check their subscription status
    if (authState.isAuthenticated && authState.type === 'regular' && authState.user) {
      const storedUser = authService.getStoredUser(authState.user.cpf);
      if (storedUser) {
        const subscriptionStatus = authService.checkAndBlockUserSubscription(storedUser);
        if (subscriptionStatus === 'blocked') {
          handleLogout(); // Log out if their subscription expired or they were blocked
        }
      }
    }
  }, [authState.isAuthenticated, authState.type, authState.user]); // Run when auth state changes

  const handleLoginSuccess = useCallback((user: User, type: UserType) => {
    setAuthState({ isAuthenticated: true, user, type });
  }, [setAuthState]);

  const handleLogout = useCallback(() => {
    if (authState.type === 'admin') {
      authService.logoutAdmin();
    } else if (authState.type === 'regular') {
      authService.logoutRegularUser();
    }
    setAuthState({ isAuthenticated: false, user: null, type: null });
    setActiveTab('showList'); // Redirect to show list after logout
    setEditingShow(null); // Clear any editing state
    setShowManageUsersModal(false); // Close manage users modal
  }, [authState.type, setAuthState]);


  const handleSaveShow = useCallback((show: Show) => {
    // Check for time conflicts before saving
    if (hasTimeConflict(show, shows)) {
      setShowConflictModal(true);
      return;
    }

    if (editingShow) {
      setShows(shows.map(s => (s.id === show.id ? show : s)));
      setEditingShow(null);
    } else {
      setShows([...shows, show]);
    }
    setActiveTab('showList');
  }, [editingShow, shows, setShows]);

  const handleDeleteShow = useCallback((show: Show) => {
    setShowToDelete(show);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (showToDelete) {
      setShows(shows.filter(s => s.id !== showToDelete.id));
      setShowDeleteConfirm(false);
      setShowToDelete(null);
    }
  }, [shows, setShows, showToDelete]);

  const currentYearShows = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return shows.filter(show => new Date(show.date).getFullYear() === currentYear);
  }, [shows]);

  const Content = useMemo(() => {
    if (!authState.isAuthenticated) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    if (authState.type === 'admin') {
      return (
        <AdminDashboard
          onLogout={handleLogout}
          onManageUsers={() => setShowManageUsersModal(true)} // AdminDashboard opens ManageUsersModal
        />
      );
    }

    // Regular user content
    switch (activeTab) {
      case 'addShow':
        return (
          <AddShowForm
            onSave={handleSaveShow}
            onCancel={() => {
              setEditingShow(null);
              setActiveTab('showList');
            }}
            existingShow={editingShow}
            locations={locations}
            onManageLocations={() => setShowManageLocationsModal(true)}
          />
        );
      case 'showList':
        return (
          <ShowList
            shows={shows}
            onEdit={(show) => {
              setEditingShow(show);
              setActiveTab('addShow');
            }}
            onDelete={handleDeleteShow}
          />
        );
      case 'calendar':
        return <CalendarView shows={shows} />;
      case 'share':
        return <ShareView shows={shows} artistInfo={artistInfo} />;
      default:
        return <ShowList shows={shows} onEdit={() => {}} onDelete={() => {}} />;
    }
  }, [
    authState,
    activeTab,
    handleSaveShow,
    editingShow,
    shows,
    handleDeleteShow,
    locations,
    artistInfo,
    handleLoginSuccess,
    handleLogout,
  ]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center">
      <div className="container mx-auto p-4 max-w-2xl">
        {authState.isAuthenticated && authState.type !== 'admin' && (
          <Header artistInfo={artistInfo} setArtistInfo={setArtistInfo} onLogout={handleLogout} authStatus={authState} />
        )}

        {authState.isAuthenticated && authState.type !== 'admin' && (
          <Stats shows={currentYearShows} />
        )}

        {authState.isAuthenticated && authState.type !== 'admin' && (
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {Content}

        <ManageLocationsModal
          isOpen={showManageLocationsModal}
          onClose={() => setShowManageLocationsModal(false)}
          locations={locations}
          setLocations={setLocations}
        />
        <ManageUsersModal
          isOpen={showManageUsersModal}
          onClose={() => setShowManageUsersModal(false)}
        />
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          itemName={`o show em "${showToDelete?.location}" em ${new Date(showToDelete?.date || '').toLocaleDateString('pt-BR')}`}
        />
        <ConflictModal isOpen={showConflictModal} onClose={() => setShowConflictModal(false)} />
        
        <PWAInstallPrompt
          installPromptEvent={installPromptEvent}
          onDismiss={() => setInstallPromptEvent(null)}
          onInstallSuccess={() => {
            setIsAppInstalled(true);
            setInstallPromptEvent(null);
          }}
          // setToast is no longer passed as toast state is removed
        />
      </div>
    </div>
  );
}

export default App;
