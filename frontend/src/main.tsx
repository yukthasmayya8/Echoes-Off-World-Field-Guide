import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './features/global-module-styles.css';
import './features/enhancements.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root is missing from index.html');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
