import React,{useEffect,useRef,useState} from 'react';

let sdk;
function loadGoogle(){
  if(window.google?.accounts?.id)return Promise.resolve(window.google.accounts.id);
  if(!sdk)sdk=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://accounts.google.com/gsi/client';script.async=true;
    const failed=()=>{clearTimeout(timer);script.remove();reject(Error('Google sign-in could not load. Check your connection and try again.'));};
    const timer=setTimeout(failed,12000);
    script.onload=()=>{clearTimeout(timer);window.google?.accounts?.id?resolve(window.google.accounts.id):failed();};
    script.onerror=failed;
    document.head.appendChild(script);
  }).catch(e=>{sdk=null;throw e;});
  return sdk;
}

export default function GoogleSignIn({api,onSignedIn,browserSignIn}){
  const container=useRef(null),handlers=useRef({api,onSignedIn});
  handlers.current={api,onSignedIn};
  const [error,E]=useState(''),[busy,B]=useState(false),[loading,L]=useState(true),[retry,R]=useState(0);
  useEffect(()=>{
    let alive=true,submitting=false;
    E('');L(true);
    Promise.allSettled([loadGoogle(),api('/auth/identity/start',{method:'POST'})]).then(results=>{
      for(const result of results)if(result.status==='rejected')throw result.reason;
      const [google,config]=results.map(result=>result.value);
      if(!alive)return;
      google.initialize({client_id:config.clientId,nonce:config.nonce,auto_select:false,
        use_fedcm_for_button:true,use_fedcm_for_prompt:true,ux_mode:'popup',
        callback:async result=>{
          if(!alive||submitting)return;
          submitting=true;B(true);E('');
          try {
            await handlers.current.api('/auth/identity/finish',{method:'POST',body:JSON.stringify({credential:result.credential})});
            await handlers.current.onSignedIn();
          } catch(e){if(alive)E(e.message||'Sign-in failed. Please try again.');}
          finally {submitting=false;if(alive)B(false);}
        }});
      container.current.replaceChildren();
      google.renderButton(container.current,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'rectangular',width:Math.min(320,container.current.clientWidth||320)});
      L(false);
    }).catch(e=>{if(alive){E(e.message);L(false);}});
    return()=>{alive=false;};
  },[retry]);
  return <div className="google-sign-in">
    <div ref={container} aria-label="Google sign-in" inert={busy?true:undefined}/>
    {loading&&<p role="status">Loading Google sign-in…</p>}
    {busy&&<p role="status">Finishing sign-in…</p>}
    {error&&<><p className="error" role="alert">{error}</p><button type="button" onClick={()=>R(v=>v+1)}>Try again</button></>}
    {!loading&&<a className="browser-sign-in" href="/auth/google" onClick={browserSignIn}>Use browser sign-in</a>}
  </div>;
}
