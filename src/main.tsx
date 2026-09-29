import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enregistrement du Service Worker pour fonctionnement 100% autonome et hors-ligne sur téléphone
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration error:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
