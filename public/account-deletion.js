const language=(()=>{try{const saved=localStorage.getItem('kosrent-language');return ['en','hi','gu'].includes(saved)?saved:'en'}catch{return 'en'}})();
const messages={
  en:{
    title:'Delete your account — KosRent',heading:'Delete your KosRent account',
    intro:'You can delete your account here, including without the Android app installed. Sign in with the Google account you use for KosRent.',
    data:'This permanently removes your account, listings, uploaded photos, saved homes, reports, payment-reference records, and conversations involving you, including messages sent by either participant. Other users\' accounts and unrelated listings are kept. It does not delete your Google account.',
    backupsBefore:'Copies already saved by others cannot be recalled. Hosting backups may retain copies until they are rotated; they are not removed by this action. Contact the operator using the contact on our ',
    privacy:'Privacy Notice',backupsAfter:' for backup, access or other data requests.',
    developerContact:'Developer contact:',checking:'Checking your sign-in…',
    signIn:'Continue with Google, then return to this page',
    confirm:'I understand this permanently deletes my KosRent account and data.',
    delete:'Delete my account permanently',keep:'Keep my account and return home',
    signInRequired:'Please sign in to confirm you own this account.',
    accountUnavailable:'This account is unavailable.',confirmRequired:'Confirm account deletion first.',
    checkFailed:'Unable to check sign-in. Please reload and try again.',
    signedInAs:email=>`Signed in as ${email}`,deleting:'Deleting your account…',
    deletionFailed:'Deletion failed. Please try again.',
    deleted:'Your KosRent account and data have been deleted.'
  },
  hi:{
    title:'अपना खाता हटाएँ — KosRent',heading:'अपना KosRent खाता हटाएँ',
    intro:'Android ऐप इंस्टॉल न हो, तब भी आप यहाँ अपना खाता हटा सकते हैं। KosRent में इस्तेमाल किए गए Google खाते से साइन इन करें।',
    data:'इससे आपका खाता, किराये के विज्ञापन, अपलोड की गई तस्वीरें, सहेजे गए घर, रिपोर्ट, भुगतान संदर्भ रिकॉर्ड और आपसे जुड़ी बातचीत स्थायी रूप से हट जाएगी, जिसमें दोनों प्रतिभागियों के भेजे संदेश शामिल हैं। अन्य उपयोगकर्ताओं के खाते और असंबंधित विज्ञापन बने रहेंगे। इससे आपका Google खाता नहीं हटता।',
    backupsBefore:'दूसरों द्वारा पहले से सहेजी गई प्रतियाँ वापस नहीं ली जा सकतीं। होस्टिंग बैकअप में प्रतियाँ उनके नियमित हटाए जाने तक रह सकती हैं; इस कार्रवाई से वे नहीं हटेंगी। बैकअप, पहुँच या अन्य डेटा अनुरोधों के लिए हमारी ',
    privacy:'गोपनीयता सूचना',backupsAfter:' में दिए गए संपर्क से संचालक को लिखें।',
    developerContact:'डेवलपर से संपर्क:',checking:'आपके साइन इन की जाँच हो रही है…',
    signIn:'Google से साइन इन करें, फिर इस पेज पर लौटें',
    confirm:'मैं समझता/समझती हूँ कि इससे मेरा KosRent खाता और डेटा स्थायी रूप से हट जाएगा।',
    delete:'मेरा खाता स्थायी रूप से हटाएँ',keep:'मेरा खाता रखें और होम पर लौटें',
    signInRequired:'खाते के स्वामित्व की पुष्टि के लिए कृपया साइन इन करें।',
    accountUnavailable:'यह खाता उपलब्ध नहीं है।',confirmRequired:'पहले खाता हटाने की पुष्टि करें।',
    checkFailed:'साइन इन की जाँच नहीं हो सकी। पेज फिर से लोड करके दोबारा कोशिश करें।',
    signedInAs:email=>`${email} से साइन इन हैं`,deleting:'आपका खाता हटाया जा रहा है…',
    deletionFailed:'खाता नहीं हट सका। कृपया दोबारा कोशिश करें।',
    deleted:'आपका KosRent खाता और डेटा हटा दिया गया है।'
  },
  gu:{
    title:'તમારું ખાતું કાઢી નાખો — KosRent',heading:'તમારું KosRent ખાતું કાઢી નાખો',
    intro:'Android ઍપ ઇન્સ્ટોલ ન હોય તો પણ તમે અહીંથી તમારું ખાતું કાઢી શકો છો. KosRent માટે વાપરતા Google ખાતાથી સાઇન ઇન કરો.',
    data:'આ પગલાંથી તમારું ખાતું, ભાડાની જાહેરાતો, અપલોડ કરેલા ફોટા, સાચવેલા ઘરો, અહેવાલો, ચુકવણી સંદર્ભના રેકોર્ડ અને તમારી સાથેની વાતચીત કાયમી ધોરણે કાઢી નાખવામાં આવશે, જેમાં બંને સહભાગીઓના સંદેશા સામેલ છે. અન્ય વપરાશકર્તાઓનાં ખાતાં અને અસંબંધિત જાહેરાતો યથાવત્ રહેશે. તમારું Google ખાતું કાઢવામાં આવતું નથી.',
    backupsBefore:'બીજાઓએ અગાઉ સાચવેલી નકલો પાછી લઈ શકાતી નથી. હોસ્ટિંગ બેકઅપમાં નકલો નિયમિત રીતે દૂર ન થાય ત્યાં સુધી રહી શકે છે; આ પગલાંથી તે દૂર થતી નથી. બેકઅપ, ઍક્સેસ અથવા અન્ય ડેટા વિનંતી માટે અમારી ',
    privacy:'ગોપનીયતા સૂચના',backupsAfter:' પર આપેલા સંપર્ક દ્વારા સંચાલકને લખો.',
    developerContact:'ડેવલપરનો સંપર્ક:',checking:'તમારું સાઇન ઇન તપાસી રહ્યા છીએ…',
    signIn:'Google વડે સાઇન ઇન કરો, પછી આ પેજ પર પાછા આવો',
    confirm:'હું સમજું છું કે આથી મારું KosRent ખાતું અને ડેટા કાયમી ધોરણે કાઢી નાખવામાં આવશે.',
    delete:'મારું ખાતું કાયમી ધોરણે કાઢી નાખો',keep:'મારું ખાતું રાખો અને હોમ પર પાછા જાઓ',
    signInRequired:'આ ખાતું તમારું છે તેની ખાતરી કરવા માટે કૃપા કરીને સાઇન ઇન કરો.',
    accountUnavailable:'આ ખાતું ઉપલબ્ધ નથી.',confirmRequired:'પહેલા ખાતું કાઢવાની પુષ્ટિ કરો.',
    checkFailed:'સાઇન ઇન તપાસી શકાયું નથી. પેજ ફરી લોડ કરીને ફરી પ્રયાસ કરો.',
    signedInAs:email=>`${email} તરીકે સાઇન ઇન થયેલ છે`,deleting:'તમારું ખાતું કાઢી રહ્યા છીએ…',
    deletionFailed:'ખાતું કાઢી શકાયું નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
    deleted:'તમારું KosRent ખાતું અને ડેટા કાઢી નાખવામાં આવ્યા છે.'
  }
};
const copy=messages[language];
document.documentElement.lang=language;
const main=document.querySelector('main');
const status=document.getElementById('status');
const form=document.getElementById('deletion');
const signin=document.getElementById('signin');

if(language!=='en'){
  document.title=copy.title;
  main.querySelector('h1').textContent=copy.heading;
  const paragraphs=main.querySelectorAll(':scope > p');
  paragraphs[0].textContent=copy.intro;
  paragraphs[1].textContent=copy.data;
  const privacyLink=paragraphs[2].querySelector('a');
  privacyLink.textContent=copy.privacy;
  paragraphs[2].replaceChildren(document.createTextNode(copy.backupsBefore),privacyLink,document.createTextNode(copy.backupsAfter));
  const emailLink=paragraphs[3].querySelector('a');
  paragraphs[3].replaceChildren(document.createTextNode(`${copy.developerContact} `),emailLink);
  signin.textContent=copy.signIn;
  const checkbox=document.getElementById('confirm');
  checkbox.closest('label').replaceChildren(checkbox,document.createTextNode(` ${copy.confirm}`));
  form.querySelector('button').textContent=copy.delete;
  main.lastElementChild.textContent=copy.keep;
  status.textContent=copy.checking;
}

fetch('/api/account',{credentials:'same-origin'}).then(async response=>{
  if(response.status===401){status.textContent=copy.signInRequired;signin.hidden=false;return}
  if(!response.ok)throw Error(copy.checkFailed);
  const {user}=await response.json();
  if(user){status.textContent=copy.signedInAs(user.email);form.hidden=false}
  else{status.textContent=copy.signInRequired;signin.hidden=false}
}).catch(error=>{status.textContent=error.message});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!document.getElementById('confirm').checked)return;
  const button=form.querySelector('button');button.disabled=true;
  status.textContent=copy.deleting;
  try{
    const response=await fetch('/api/account',{method:'DELETE',credentials:'same-origin',headers:{'Content-Type':'application/json','X-KosRent-Request':'1'},body:JSON.stringify({confirmation:'DELETE'})});
    const result=await response.json();
    if(!response.ok)throw Error(result.error||copy.deletionFailed);
    try{localStorage.removeItem('lv-live-saved');sessionStorage.removeItem('kosrent-welcome-shown')}catch{}
    form.hidden=true;status.textContent=copy.deleted;
  }catch(error){const known={'Sign in with Google first':copy.signInRequired,'Account unavailable':copy.accountUnavailable,'Confirm account deletion first':copy.confirmRequired};status.textContent=known[error.message]||error.message;button.disabled=false}
});
