// This signal contains no identity or tokens: the app checks its server session.
try {
  const channel=new BroadcastChannel('kosrent-sign-in');
  channel.postMessage('complete');
  channel.close();
} catch {}
try {localStorage.setItem('kosrent-sign-in',String(Date.now()));} catch {}
window.close();

document.getElementById('return-to-app')?.addEventListener('click',()=>window.close());
