import React from 'react';
import {createRoot} from 'react-dom/client';
import Live from './Live.jsx';
import AppUpdate from './AppUpdate.jsx';
import './style.css';
createRoot(document.getElementById('root')).render(<><Live/><AppUpdate/></>);
