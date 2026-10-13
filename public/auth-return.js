// Only a short-lived handoff receipt is shared; never Google or session tokens.
const proof=document.getElementById('app-login-receipt');
const result=proof?{state:proof.dataset.state,receipt:proof.dataset.receipt}:'complete';
try {
  const channel=new BroadcastChannel('kosrent-sign-in');
  channel.postMessage(result);
  channel.close();
} catch {}
try {localStorage.setItem('kosrent-sign-in',JSON.stringify(result));} catch {}
window.close();
document.getElementById('return-to-app')?.addEventListener('click',()=>window.close());
