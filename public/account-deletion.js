const status=document.getElementById('status');
const form=document.getElementById('deletion');
const signin=document.getElementById('signin');
fetch('/api/account',{credentials:'same-origin'}).then(async response=>{
  if(response.status===401){status.textContent='Please sign in to confirm you own this account.';signin.hidden=false;return}
  if(!response.ok)throw Error('Unable to check sign-in. Please reload and try again.');
  const {user}=await response.json();
  if(user){status.textContent=`Signed in as ${user.email}`;form.hidden=false}
  else{status.textContent='Please sign in to confirm you own this account.';signin.hidden=false}
}).catch(error=>{status.textContent=error.message});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!document.getElementById('confirm').checked)return;
  const button=form.querySelector('button');button.disabled=true;
  status.textContent='Deleting your account…';
  try{
    const response=await fetch('/api/account',{method:'DELETE',credentials:'same-origin',headers:{'Content-Type':'application/json','X-KosRent-Request':'1'},body:JSON.stringify({confirmation:'DELETE'})});
    const result=await response.json();
    if(!response.ok)throw Error(result.error||'Deletion failed. Please try again.');
    try{localStorage.removeItem('lv-live-saved');sessionStorage.removeItem('kosrent-welcome-shown')}catch{}
    form.hidden=true;status.textContent='Your KosRent account and data have been deleted.';
  }catch(error){status.textContent=error.message;button.disabled=false}
});
