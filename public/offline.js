const language=(()=>{try{const saved=localStorage.getItem('kosrent-language');return ['en','hi','gu'].includes(saved)?saved:'en'}catch{return 'en'}})();
const messages={
  en:{title:'KosRent — Offline',heading:'You’re offline',body:'Connect to the internet to see current rentals and messages.',retry:'Try again'},
  hi:{title:'KosRent — ऑफ़लाइन',heading:'आप ऑफ़लाइन हैं',body:'किराये के उपलब्ध घर और संदेश देखने के लिए इंटरनेट से जुड़ें।',retry:'फिर कोशिश करें'},
  gu:{title:'KosRent — ઑફલાઇન',heading:'તમે ઑફલાઇન છો',body:'હાલમાં ઉપલબ્ધ ભાડાનાં ઘર અને સંદેશા જોવા માટે ઇન્ટરનેટ સાથે જોડાઓ.',retry:'ફરી પ્રયાસ કરો'}
};
const copy=messages[language];
document.documentElement.lang=language;
document.title=copy.title;
document.querySelector('h2').textContent=copy.heading;
document.querySelector('p').textContent=copy.body;
const retry=document.getElementById('retry');
retry.textContent=copy.retry;
retry.addEventListener('click',()=>location.reload());
