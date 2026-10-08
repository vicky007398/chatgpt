import React from 'react';
import {createRoot} from 'react-dom/client';
import Live from './Live.jsx';
import AppUpdate from './AppUpdate.jsx';
import './style.css';
function WelcomeSplash(){
 const [show,setShow]=React.useState(()=>!sessionStorage.getItem('kosrent-welcome-shown'));
 React.useEffect(()=>{if(!show)return;const timer=setTimeout(()=>{sessionStorage.setItem('kosrent-welcome-shown','1');setShow(false)},5000);return()=>clearTimeout(timer)},[show]);
 if(!show)return null;
 return <section className="welcome-splash" aria-label="Welcome to Kosamba">
  <div className="welcome-mark"><span>K</span></div>
  <p>Welcome to</p>
  <h1>Kosamba</h1>
  <strong>KosRent</strong>
  <div className="welcome-loader" aria-hidden="true"><span/></div>
 </section>;
}
createRoot(document.getElementById('root')).render(<><Live/><AppUpdate/><WelcomeSplash/></>);
