import {useEffect,useRef} from 'react';

const storageKey='kosrent-pending-login';
export default function useGoogleLogin(refreshSession,api,onError) {
  const handlers=useRef({refreshSession,api,onError}),pending=useRef(null);
  handlers.current={refreshSession,api,onError};
  useEffect(()=>{
    try {pending.current=JSON.parse(sessionStorage.getItem(storageKey)||'null');} catch {}
    let busy=false,alive=true;
    const accept=value=>{
      if(value&&pending.current&&value.state===pending.current.state&&typeof value.receipt==='string'){
        pending.current.receipt=value.receipt;
        sessionStorage.setItem(storageKey,JSON.stringify(pending.current));
      }
    };
    const clear=()=>{pending.current=null;sessionStorage.removeItem(storageKey);};
    const check=async()=>{
      if(!pending.current||busy||document.hidden)return;
      try {accept(JSON.parse(localStorage.getItem('kosrent-sign-in')||'null'));} catch {}
      busy=true;
      const attempt=pending.current;
      try {
        // The callback may have already signed in the shared Chrome session.
        if(await handlers.current.refreshSession()){if(alive&&pending.current===attempt)clear();return;}
        const result=await handlers.current.api('/auth/finish',{method:'POST',body:JSON.stringify(attempt)});
        if(!result.pending&&alive&&pending.current===attempt){clear();await handlers.current.refreshSession();}
      } catch(e){if(alive&&pending.current===attempt){let signedIn=false;try {signedIn=await handlers.current.refreshSession();} catch {}clear();if(!signedIn)handlers.current.onError(e);}} finally {busy=false;}
    };
    const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('kosrent-sign-in'):null;
    if(channel)channel.onmessage=e=>{accept(e.data);check();};
    const storage=e=>{if(e.key==='kosrent-sign-in'){try {accept(JSON.parse(e.newValue));} catch {}check();}};
    const restore=()=>{if(pending.current)check();else if(!document.hidden)handlers.current.refreshSession().catch(()=>{});};
    window.addEventListener('storage',storage);
    window.addEventListener('focus',restore);
    document.addEventListener('visibilitychange',restore);
    const timer=setInterval(check,2000);
    check();
    return()=>{alive=false;clearInterval(timer);channel?.close();window.removeEventListener('storage',storage);window.removeEventListener('focus',restore);document.removeEventListener('visibilitychange',restore);};
  },[]);
  return async event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    // Open synchronously from the tap, before any request, to avoid popup blocking.
    const popup=window.open('about:blank','kosrent-google-sign-in','popup,width=480,height=720');
    if(!popup)return; // Existing normal Google navigation remains the fallback.
    event.preventDefault();
    try {
      const attempt=await handlers.current.api('/auth/start',{method:'POST'});
      pending.current={state:attempt.state,claim:attempt.claim};
      sessionStorage.setItem(storageKey,JSON.stringify(pending.current));
      popup.location.replace(attempt.url);
    } catch(e){pending.current=null;sessionStorage.removeItem(storageKey);popup.close();handlers.current.onError(e);}
  };
}
