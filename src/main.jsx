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
function DailyScreenBorder(){
 const colors=['#1f5c45','#c08b3e','#2f6f9f','#8b5e9f','#bf6b4a','#587a3f','#286a6f'];
 const day=Math.floor(new Date().setHours(0,0,0,0)/86400000);
 const color=colors[day%colors.length];
 return <div className="daily-screen-border" style={{'--daily-border':color}} aria-hidden="true"/>;
}
createRoot(document.getElementById('root')).render(<><Live/><AppUpdate/><WelcomeSplash/><DailyScreenBorder/></>);
