import { useEffect, useState } from 'react';
import { AlertCircle, Camera, Home, MessageSquare, Settings as SettingsIcon, Shield } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Dashboard } from './components/Dashboard';
import { MenuScanner } from './components/MenuScanner';
import { ResultsUI } from './components/ResultsUI';
import { AIChat } from './components/AIChat';
import { Settings } from './components/Settings';
import { AuthScreen } from './components/AuthScreen';
import { SOSButton } from './components/SOSButton';
import { SidebarDock } from './components/SidebarDock';
import ClickSpark from './components/ClickSpark';
import DotField from './components/DotField';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { speakRiskAlerts } from './utils/speechAlerts';

const labels = { home: 'Workspace Overview', scan: 'Menu Scanner Module', chat: 'AI Chat Interface', results: 'Analysis Results', settings: 'System Settings' };
export default function App() { const [profile, setProfile] = useLocalStorage('allersafe_profile', null); const [onboarded, setOnboarded] = useLocalStorage('allersafe_onboarded', false); const [demoMode, setDemoMode] = useLocalStorage('allersafe_demo', true); const [route, setRoute] = useState('home'); const [results, setResults] = useState(null);
  useEffect(() => { setDemoMode(false); }, []);
  useEffect(() => { if (!profile || !onboarded) return; fetch('/api/auth/me', { credentials: 'include' }).then(response => { if (response.status === 401) { setProfile(null); setOnboarded(false); } }).catch(() => {}); }, []);
  useEffect(() => { if (results) speakRiskAlerts(results); }, [results]);

  const handleSignUp = data => {
    const contacts = (data.contacts && data.contacts.length ? data.contacts : [{ name: '', phone: '', relation: '' }]).filter(contact => contact && (contact.name || contact.phone || contact.relation));
    setProfile({
      ...data,
      allergens: profile?.allergens || [],
      contacts,
      name: data.name?.trim() || profile?.name || 'User'
    });
    setOnboarded(true);
  };

  const handleSignIn = data => {
    setProfile(prev => ({ ...prev, ...data, allergens: prev?.allergens || [] }));
    setOnboarded(true);
  };

  const handleLogout = async () => {
    await fetch('/logout', { method: 'POST', credentials: 'include' });
    setProfile(null);
    setOnboarded(false);
    setRoute('home');
    window.localStorage.removeItem('allersafe_profile');
    window.localStorage.removeItem('allersafe_onboarded');
    window.localStorage.removeItem('allersafe_demo');
  };

  if (!onboarded) return <AuthScreen onSignUp={handleSignUp} onSignIn={handleSignIn} />;
  const links = [{ Icon: Home, label: 'Dashboard', id: 'home' }, { Icon: Camera, label: 'Scan Menu', id: 'scan' }, { Icon: MessageSquare, label: 'AI Assistant', id: 'chat' }, { Icon: SettingsIcon, label: 'Settings', id: 'settings' }]; return <ClickSpark sparkColor="#5eead4" sparkSize={10} sparkRadius={28} sparkCount={12} duration={420} extraScale={1.2}><div className="app-shell"><DotField dotRadius={1.8} dotSpacing={12} cursorRadius={210} cursorForce={0.14} bulgeStrength={90} glowRadius={180} glowColor="#7c3aed" gradientFrom="rgba(168, 85, 247, 0.22)" gradientTo="rgba(59, 130, 246, 0.12)" /><aside className="sidebar"><div className="brand"><Shield /><b>Aller<span>Safe</span></b></div><SidebarDock items={links} activeId={route} onSelect={setRoute} /><div className="profile-chip"><div>{profile?.name?.charAt(0) || 'U'}</div><span><b>{profile?.name}</b><small>{profile?.allergens?.length || 0} active filters</small></span></div></aside><main className="main-area"><header className="topbar"><h2>{labels[route]}</h2><div className="top-actions">{demoMode && <span className="demo-badge"><AlertCircle /> Demo Mode Active</span>}<SOSButton userProfile={profile} /></div></header><div className="work-area"><RouteErrorBoundary><div className="route-content" key={route}>{route === 'home' && <Dashboard userProfile={profile} setRoute={setRoute} />}{route === 'scan' && <MenuScanner userProfile={profile} demoMode={demoMode} onResults={items => { setResults(items); setRoute('results'); }} />}{route === 'results' && results && <ResultsUI results={results} onReset={() => { setResults(null); setRoute('home'); }} />}{route === 'chat' && <AIChat userProfile={profile} demoMode={demoMode} />}{route === 'settings' && <Settings userProfile={profile} onUpdateProfile={setProfile} demoMode={demoMode} setDemoMode={setDemoMode} onLogout={handleLogout} />}</div></RouteErrorBoundary></div></main></div></ClickSpark>; }
