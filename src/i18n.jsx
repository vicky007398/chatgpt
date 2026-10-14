import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {CORE_TRANSLATIONS} from './core-translations.js';
import {CHAT_TRANSLATIONS} from './chat-translations.js';
import {SUPPORT_TRANSLATIONS} from './support-translations.js';
import {ERROR_TRANSLATIONS} from './error-translations.js';

export const LANGUAGE_KEY='kosrent-language';
export const LANGUAGES=[{code:'en',label:'English'},{code:'hi',label:'हिन्दी'},{code:'gu',label:'ગુજરાતી'}];
export const dateLocale={en:'en-IN',hi:'hi-IN',gu:'gu-IN'};
const translations={
 hi:{...CORE_TRANSLATIONS.hi,...CHAT_TRANSLATIONS.hi,...SUPPORT_TRANSLATIONS.hi,...ERROR_TRANSLATIONS.hi},
 gu:{...CORE_TRANSLATIONS.gu,...CHAT_TRANSLATIONS.gu,...SUPPORT_TRANSLATIONS.gu,...ERROR_TRANSLATIONS.gu},
};
const LanguageContext=createContext(null);

export function normaliseLanguage(value){return LANGUAGES.some(item=>item.code===value)?value:'en'}
export function translate(language,english){return translations[language]?.[english]||english}

function savedLanguage(){
 try{return normaliseLanguage(localStorage.getItem(LANGUAGE_KEY))}catch{return 'en'}
}

export function I18nProvider({children}){
 const [language,setLanguage]=useState(savedLanguage);
 const chooseLanguage=useCallback(value=>setLanguage(normaliseLanguage(value)),[]);
 const t=useCallback(english=>translate(language,english),[language]);
 useEffect(()=>{
  document.documentElement.lang=language;
  document.title=t('KosRent | Homes for rent in Kosamba');
  try{localStorage.setItem(LANGUAGE_KEY,language)}catch{}
 },[language,t]);
 const value=useMemo(()=>({language,setLanguage:chooseLanguage,t}),[language,chooseLanguage,t]);
 return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(){
 const context=useContext(LanguageContext);
 if(!context)throw Error('useI18n must be used inside I18nProvider');
 return context;
}
