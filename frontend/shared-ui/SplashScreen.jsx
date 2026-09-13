import { useEffect } from 'react';
import { Loader2, Shield } from 'lucide-react';
import RotatingText from './RotatingText';

export function SplashScreen({ onComplete }) {
  useEffect(() => { const timer = window.setTimeout(onComplete, 2500); return () => window.clearTimeout(timer); }, []);
  return <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white overflow-hidden">
    <div className="absolute inset-0 splash-grid" />
    <div className="relative z-10 flex flex-col items-center px-4">
      <Shield className="w-24 h-24 text-emerald-500 mb-10 animate-pulse opacity-70" />
      <div className="loading-wordmark"><RotatingText texts={['ALLERSAFE', 'LOADING..']} rotationInterval={1450} loop={false} /></div>
      <div className="mt-12 text-slate-400 flex items-center gap-3 text-sm tracking-widest font-bold uppercase"><Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> Initializing Workspace...</div>
    </div>
  </div>;
}
