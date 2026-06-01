import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ServerApp from './ServerApp.tsx';
import './index.css';

const isServerRoute = window.location.pathname.startsWith('/server');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isServerRoute ? <ServerApp /> : <App />}
  </StrictMode>,
);
