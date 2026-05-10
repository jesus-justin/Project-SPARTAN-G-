import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { FacilitatorAuthProvider } from './context/FacilitatorAuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <FacilitatorAuthProvider>
        <App />
      </FacilitatorAuthProvider>
    </HashRouter>
  </React.StrictMode>
);
