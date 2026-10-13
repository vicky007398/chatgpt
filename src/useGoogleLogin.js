import {useEffect,useRef} from 'react';

// Keep the installed app window on its current screen during Google OAuth.
// Google may sever window.opener, so refresh the server session on return too.
export default function useGoogleLogin(refreshSession) {
  const refresh=useRef(refreshSession), pending=useRef(false);
  refresh.current=refreshSession;
  useEffect(()=>{
    let busy=false,alive=true;
    const check=async()=>{
      if(!pending.current||busy||document.hidden)return;
      busy=true;
      try {if(await refresh.current()&&alive)pending.current=false;} catch {} finally {busy=false;}
    };
    const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('kosrent-sign-in'):null;
    if(channel)channel.onmessage=check;
    const storage=e=>{if(e.key==='kosrent-sign-in')check();};
    window.addEventListener('storage',storage);
    window.addEventListener('focus',check);
    document.addEventListener('visibilitychange',check);
    const timer=setInterval(check,2000);
    return()=>{alive=false;clearInterval(timer);channel?.close();window.removeEventListener('storage',storage);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
  },[]);
  return event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    pending.current=true;
    const popup=window.open('/auth/google?popup=1','kosrent-google-sign-in','popup,width=480,height=720');
    if(popup)event.preventDefault();
  };
}
