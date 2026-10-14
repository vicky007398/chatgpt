import React from 'react';
import {createRoot} from 'react-dom/client';
import Live from './Live.jsx';
import AppUpdate from './AppUpdate.jsx';
import {I18nProvider,useI18n} from './i18n.jsx';
import './style.css';
import './theme.css';
import './welcome.css';

function WelcomeSplash({onDismiss}){
 const {t}=useI18n();
 const dialogRef=React.useRef(null);
 React.useEffect(()=>{
  dialogRef.current?.focus({preventScroll:true});
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timer=setTimeout(onDismiss,reducedMotion?1800:4600);
  return()=>clearTimeout(timer);
 },[onDismiss]);
 return <section className="welcome-splash" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('Welcome to Kosamba')} onKeyDown={event=>{if(event.key==='Escape')onDismiss()}}>
  <button className="welcome-skip" type="button" onClick={onDismiss}>{t('Skip intro')}</button>
  <div className="welcome-content">
   <div className="welcome-mark" aria-hidden="true"><span>K</span></div>
   <p className="welcome-kicker">KosRent <span aria-hidden="true">·</span> Kosamba</p>
   <h1 className="welcome-title"><span className="welcome-headline">{t('No brokerage.')}</span><span className="welcome-promise">{t('Just your next home in Kosamba.')}</span></h1>
   <p className="welcome-caption">{t('Find a rental and connect directly with the owner.')}</p>
   <div className="welcome-loader" aria-hidden="true"><span/></div>
  </div>
 </section>;
}
function App(){
 const [showIntro,setShowIntro]=React.useState(()=>{try{return !sessionStorage.getItem('kosrent-welcome-shown')}catch{return true}});
 const dismissIntro=React.useCallback(()=>{
  try{sessionStorage.setItem('kosrent-welcome-shown','1')}catch{}
  setShowIntro(false);
  requestAnimationFrame(()=>document.querySelector('.app-header .brand')?.focus({preventScroll:true}));
 },[]);
 return <>
  <div inert={showIntro} aria-hidden={showIntro?'true':undefined}><Live/><AppUpdate/></div>
  {showIntro&&<WelcomeSplash onDismiss={dismissIntro}/>}
  <DailyScreenBorder/>
 </>;
}
function DailyScreenBorder(){
 const colors=['#1f5c45','#c08b3e','#2f6f9f','#8b5e9f','#bf6b4a','#587a3f','#286a6f'];
 const day=Math.floor(new Date().setHours(0,0,0,0)/86400000);
 const color=colors[day%colors.length];
 return <div className="daily-screen-border" style={{'--daily-border':color}} aria-hidden="true"/>;
}
createRoot(document.getElementById('root')).render(<I18nProvider><App/></I18nProvider>);
