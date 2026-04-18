<<<<<<< HEAD
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ILES from './ILES.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ILES />
    </BrowserRouter>
  </StrictMode>
)
=======
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import ILES from './ILES';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ILES />
  </React.StrictMode>
);
>>>>>>> f2cc4a6c18ababc03fd7be5297fac41245ad1e24
