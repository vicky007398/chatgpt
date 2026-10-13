import {useEffect,useRef} from 'react';

const storageKey='kosrent-pending-login';
export default function useGoogleLogin(refreshSession,api,onError) {
  const handlers=useRef({refreshSession,api,onError}),pending=useRef(null);
  handlers.current={refreshSession,api,onError};
  useEffect(()=>{
    try {pending.current=JSON.parse(sessionStorage.getItem(storageKey)||'null');} catch {}
    let busy=false,alive=true;
    const clear=()=>{pending.current=null;sessionStorage.removeItem(storageKey);};
    const check=async()=>{
      if(!pending.current||busy||document.hidden)return;
      busy=true;
      const attempt=pending.current;
      try {
        const result=await handlers.current.api('/auth/finish',{method:'POST',body:JSON.stringify(attempt)});
        if(!result.pending&&alive&&pending.current===attempt){clear();await handlers.current.refreshSession();}
      } catch(e){if(alive&&pending.current===attempt){clear();handlers.current.onError(e);}} finally {busy=false;}
    };
    const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('kosrent-sign-in'):null;
    if(channel)channel.onmessage=check;
    const storage=e=>{if(e.key==='kosrent-sign-in')check();};
    window.addEventListener('storage',storage);
    window.addEventListener('focus',check);
    document.addEventListener('visibilitychange',check);
    const timer=setInterval(check,2000);
    check();
    return()=>{alive=false;clearInterval(timer);channel?.close();window.removeEventListener('storage',storage);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
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
