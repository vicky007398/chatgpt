import React,{useEffect,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {api} from './Live.jsx';
import {useI18n} from './i18n.jsx';

const metrics=[['users','Registered users'],['active_today','Active today'],['active_7_days','Active in 7 days'],['active_30_days','Active in 30 days'],['signups_30_days','New sign-ups in 30 days'],['available_listings','Available rentals'],['listings','All listings'],['rented_listings','Marked rented'],['conversations','Conversations'],['messages','Messages']];
const localeFor=language=>language==='hi'?'hi-IN':language==='gu'?'gu-IN':'en-IN';

export default function Analytics(){
 const {language,t}=useI18n();
 const [data,D]=useState(null),[error,E]=useState(''),[busy,B]=useState(false);
 async function load(){B(true);E('');try{D(await api('/admin/analytics'))}catch(e){E(e.message)}finally{B(false)}}
 useEffect(()=>{let alive=true;api('/admin/analytics').then(d=>{if(alive)D(d)}).catch(e=>{if(alive)E(e.message)});return()=>{alive=false}},[]);
 const peak=Math.max(1,...(data?.daily||[]).map(d=>d.active_users));
 const locale=localeFor(language);
 const formatNumber=value=>Number(value).toLocaleString(locale);
 const formatDay=(day,options)=>new Date(`${day}T00:00:00+05:30`).toLocaleDateString(locale,{timeZone:'Asia/Kolkata',...options});
 return <main className="analytics-page">
  <div className="analytics-heading"><div><h2>{t('Usage analytics')}</h2><p>{t('Private dashboard for administrators')}</p></div><button onClick={load} disabled={busy}><RefreshCw size={16}/>{busy?t('Refreshing…'):t('Refresh')}</button></div>
  {error&&<p role="alert" className="error">{t(error)}</p>}
  {!data&&!error?<p>{t('Loading analytics…')}</p>:data&&<>
   <div className="analytics-metrics">{metrics.map(([key,label])=><article key={key}><span>{t(label)}</span><strong>{formatNumber(data.summary[key])}</strong></article>)}</div>
   <section className="analytics-chart"><h3>{t('Daily active users · last 30 days')}</h3><p>{t('A signed-in account using the website or app counts once per day. Days use India time.')}</p>
    <div className="analytics-bars" role="img" aria-label={t('Daily active signed-in users over the last 30 days')}>
     {data.daily.map(d=><div key={d.day} title={`${formatDay(d.day,{day:'numeric',month:'short',year:'numeric'})}: ${formatNumber(d.active_users)} ${t('active users')}`}><span style={{height:Math.max(2,d.active_users/peak*120)}}/><small>{formatDay(d.day,{day:'numeric'})}</small></div>)}
    </div>
   </section>
   <div className="analytics-table"><table><caption>{t('Daily activity · India time')}</caption><thead><tr><th>{t('Date')}</th><th>{t('Active users')}</th><th>{t('Sign-ups')}</th><th>{t('New listings')}</th><th>{t('Messages')}</th></tr></thead><tbody>{[...data.daily].reverse().map(d=><tr key={d.day}><th scope="row">{formatDay(d.day,{day:'numeric',month:'short',year:'numeric'})}</th><td>{formatNumber(d.active_users)}</td><td>{formatNumber(d.signups)}</td><td>{formatNumber(d.listings)}</td><td>{formatNumber(d.messages)}</td></tr>)}</tbody></table></div>
   <p className="analytics-note">{t('Active-user tracking started')} {new Date(data.summary.tracking_started).toLocaleDateString(locale,{timeZone:'Asia/Kolkata'})}. {t('Earlier activity is not available. Guests and downloads are not counted, and website usage is combined with Android app usage. Active-user records are kept for 90 days and removed when an account is deleted. Counts reflect current stored accounts and content.')}</p>
   {data.summary.unknown_registration_dates>0&&<p className="analytics-note">{formatNumber(data.summary.unknown_registration_dates)} {t('existing accounts have no recorded sign-up date and are excluded from sign-up trends.')}</p>}
  </>}
 </main>;
}
