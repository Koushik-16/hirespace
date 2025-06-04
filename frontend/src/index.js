import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import { SocketProvider } from './context/Socket';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 
  
  <BrowserRouter>
  <AuthContextProvider>
    <SocketProvider>
      
     
        <App />
      
      </SocketProvider>
      </AuthContextProvider>
  </BrowserRouter>
  
);

