import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { StoreProvider } from './state/store';
import './styles.css';

/**
 * Hash routing on purpose: the same build has to serve from a Vercel domain root and
 * from a GitHub Pages project path without a rewrite rule or a 404.html redirect hack.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);
