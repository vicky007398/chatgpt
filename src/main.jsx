import React from 'react';
import {createRoot} from 'react-dom/client';
import Live from './Live.jsx';
import './style.css';
createRoot(document.getElementById('root')).render(<Live/>);

if('serviceWorker' in navigator && import.meta.env.PROD){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>console.warn('PWA registration unavailable'))})}
