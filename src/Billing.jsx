import React,{useState,useEffect} from 'react';
import {api} from './Live.jsx';
import {useI18n} from './i18n.jsx';
import {DEVELOPER_EMAIL} from '../shared/contact.js';

const localeFor=language=>language==='hi'?'hi-IN':language==='gu'?'gu-IN':'en-IN';
const renewalStatuses={pending:'Pending',verified:'Verified',rejected:'Rejected'};

export function PolicyLinks(){
 const {language,t}=useI18n();
 return <div className="policy-links">
  <a href="/legal/terms" target="_blank" rel="noopener">{t('Terms')}</a>
  <a href="/legal/privacy" target="_blank" rel="noopener">{t('Privacy')}</a>
  <a href="/legal/refunds" target="_blank" rel="noopener">{t('Refunds')}</a>
  {language!=='en'&&<small className="legal-language-note">{t('Legal documents are currently available in English.')}</small>}
  <span className="developer-contact">{t('Developer contact')}: <a href={`mailto:${DEVELOPER_EMAIL}`}>{DEVELOPER_EMAIL}</a></span>
 </div>;
}

export function ListingPeriod({listing}){
 const {language,t}=useI18n();
 if(!listing.expiresAt)return <p className="period-note">{t('Your free 30 days start on first approval.')}</p>;
 const remaining=Math.ceil((new Date(listing.expiresAt)-Date.now())/86400000);
 return <p className={'period-note '+(remaining<=7?'due':'')}>
  {listing.expired?t('Expired — hidden from new searches'):`${t('Visible until')} ${new Date(listing.expiresAt).toLocaleString(localeFor(language))}`}
  {remaining>0&&remaining<=7&&<strong> · {remaining} {t('days left — renew soon')}</strong>}<br/>
  {t('₹100 / 30 days after your free period. No automatic debit.')}
 </p>;
}

export function BillingPanel({listings,admin,onChange}){
 const {language,t}=useI18n();
 const[c,C]=useState(null),[rows,R]=useState([]),[error,E]=useState(''),[busy,B]=useState(false);
 const endpoint=admin?'/admin/renewals':'/renewals';
 async function load(){try{C(await api('/billing/config'));R(await api(endpoint))}catch(e){E(e.message)}}
 useEffect(()=>{load();const timer=setInterval(load,10000);return()=>clearInterval(timer)},[admin]);
 async function action(fn){B(true);E('');try{await fn();await load();await onChange()}catch(e){E(e.message)}finally{B(false)}}
 return <section id="renewals" className="billing-panel">
  <h2>{admin?t('Payment verification'):t('Listing renewals')}</h2>
  <p>{t('First 30 days free from approval. ₹100 per listing for each additional 30 days. No automatic debit.')}</p>
  {!c?.enabled&&<p className="setup-note">{t('Payment collection is disabled. Do not send money. Support and payment details must be configured first.')}</p>}
  {c?.enabled&&!admin&&<>
   <p>{t('UPI ID')}: <strong>{c.upi}</strong><br/>{t('Payee')}: <strong>{c.payee}</strong><br/>{t('Amount: ₹100 · Verify the payee before paying.')}</p>
   <p>{t('Pay in your UPI app, then submit the transaction reference below. An ad is renewed only after receipt is verified, normally within two business days.')}</p>
   <form className="listing-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.target);action(()=>api(`/listings/${f.get('listing')}/renewals`,{method:'POST',body:JSON.stringify({reference:f.get('reference'),accepted:true,policyVersion:c.policyVersion})}))}}>
    <label>{t('Listing')}<select required name="listing"><option value="">{t('Select your approved listing')}</option>{listings.filter(l=>l.status==='approved').map(l=><option value={l.id} key={l.id}>{l.title}</option>)}</select></label>
    <label>{t('12-digit UPI transaction reference')}<input name="reference" pattern="[0-9]{12}" inputMode="numeric" required/></label>
    <label className="checkbox"><input type="checkbox" required/>{t('I paid ₹100 to this payee and accept the renewal Terms and Refund Policy. This submission does not prove receipt.')}</label>
    <PolicyLinks/><button className="primary" disabled={busy}>{t('Submit for verification')}</button>
   </form>
  </>}
  {rows.map(r=><div className="payment-row" key={r.id}>
   <strong>{r.title||listings.find(l=>l.id===r.listing)?.title||t('Listing renewal')}</strong>
   <p>₹{r.amount} · {t('Reference')} {r.reference} · {renewalStatuses[r.status]?t(renewalStatuses[r.status]):r.status}<br/>{new Date(r.created).toLocaleString(localeFor(language))}{r.note&&<><br/>{r.note}</>}</p>
   {admin&&r.status==='pending'&&<form className="listing-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.target);action(()=>api(`/admin/renewals/${r.id}`,{method:'POST',body:JSON.stringify({status:'verified',note:f.get('note')})}))}}>
    <label className="checkbox"><input type="checkbox" required/>{t('I checked the bank/UPI record and received ₹100 for this reference. A screenshot alone is insufficient.')}</label>
    <label>{t('Verification note')}<input name="note" maxLength={500}/></label>
    <div className="manage-actions"><button className="primary" disabled={busy}>{t('Verify and extend 30 days')}</button><button type="button" disabled={busy} onClick={()=>{const note=prompt(t('Reason for rejection (visible to owner)'));if(note)action(()=>api(`/admin/renewals/${r.id}`,{method:'POST',body:JSON.stringify({status:'rejected',note})}))}}>{t('Reject')}</button></div>
   </form>}
  </div>)}
  {error&&<p role="alert" className="error">{t(error)}</p>}
  <PolicyLinks/>
 </section>;
}
