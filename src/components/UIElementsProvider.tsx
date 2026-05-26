'use client';import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';import { usePathname } from 'next/navigation';import { setLanguage, getLanguage, t } from '@/lib/i18n';
interface ElementSetting { isVisible: boolean; customText: string | null; customColor: string | null; position: string }
interface UIElementsContextType { elements: Record<string, ElementSetting>; getSetting: (key: string) => ElementSetting | undefined; isVisible: (key: string) => boolean; settings: Record<string, string>; settingsReady: boolean; lang: string; setLang: (code: string) => void; t: (key: string, params?: Record<string, string>) => string }
const CACHE_VERSION = 3
const defaultContext: UIElementsContextType = {  elements: {},  getSetting: () => undefined,  isVisible: () => true,  settings: {},  settingsReady: false,  lang: 'vi',  setLang: () => {},  t: (key: string) => key}
const UIElementsContext = createContext<UIElementsContextType>(defaultContext);
export function UIElementsProvider({ children }: { children: ReactNode }) {  const [elements, setElements] = useState<Record<string, ElementSetting>>({})
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [settingsReady, setSettingsReady] = useState(false)
  const [lang, setLangState] = useState('vi');
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  useEffect(() => {    try {      const cacheVer = localStorage.getItem('site_cache_version');      if (cacheVer === String(CACHE_VERSION)) {        const e = JSON.parse(localStorage.getItem('site_elements_cache') || '{}');        const s = JSON.parse(localStorage.getItem('site_settings_cache') || '{}');        if (Object.keys(s).length > 0) { setSettings(s); setElements(e); setSettingsReady(true) }      }    } catch {}  }, []);
  const fetchData = useCallback(() => {    const saved = localStorage.getItem('site_lang');
  if (saved) {      setLangState(saved);setLanguage(saved)    }    Promise.all([      fetch('/api/public/ui-elements').then(r => r.json()),      fetch('/api/public/settings').then(r => r.json()),    ]).then(([elementsData, settingsData]) => {      const e = elementsData.elements || {};      const s = settingsData.settings || {};      setElements(e);setSettings(s);setSettingsReady(true);      try { localStorage.setItem('site_cache_version', String(CACHE_VERSION)); localStorage.setItem('site_elements_cache', JSON.stringify(e)); localStorage.setItem('site_settings_cache', JSON.stringify(s)) } catch {}    }).catch(() => {})  }, []);useEffect(() => {    fetchData();
  const onVisibility = () => { if (typeof document !== 'undefined' && document.visibilityState === 'visible') { fetchData(); } }; document.addEventListener('visibilitychange', onVisibility);
return () => document.removeEventListener('visibilitychange', onVisibility)  }, [fetchData]);useEffect(() => {    if (pathname !== prevPath.current) {      prevPath.current = pathname;      fetchData()    }  }, [pathname, fetchData]);
  const setLang = useCallback((code: string) => {    setLangState(code);setLanguage(code)  }, []);
  const getSetting = (key: string) => elements[key];
const isVisible = (key: string) => elements[key]?.isVisible ?? true; return (    <UIElementsContext.Provider value={{ elements, getSetting, isVisible, settings, settingsReady, lang, setLang, t }}>      {children}    </UIElementsContext.Provider>  )}
export function useUIElements() {  return useContext(UIElementsContext)}
