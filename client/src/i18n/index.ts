import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import skCommon from '../locales/sk/common.json';
import skAnalyze from '../locales/sk/analyze.json';
import skHealthPassport from '../locales/sk/healthPassport.json';
import skEpisodes from '../locales/sk/episodes.json';
import skVetCard from '../locales/sk/vetCard.json';
import skAuth from '../locales/sk/auth.json';
import skLanding from '../locales/sk/landing.json';
import skInstall from '../locales/sk/install.json';
import skGuides from '../locales/sk/guides.json';

import enCommon from '../locales/en/common.json';
import enAnalyze from '../locales/en/analyze.json';
import enHealthPassport from '../locales/en/healthPassport.json';
import enEpisodes from '../locales/en/episodes.json';
import enVetCard from '../locales/en/vetCard.json';
import enAuth from '../locales/en/auth.json';
import enLanding from '../locales/en/landing.json';
import enInstall from '../locales/en/install.json';
import enGuides from '../locales/en/guides.json';

const isBrowser = typeof window !== 'undefined';

export const namespaces = [
  'common',
  'analyze',
  'healthPassport',
  'episodes',
  'vetCard',
  'auth',
  'landing',
  'install',
  'guides',
];

export const resources = {
  sk: {
    common: skCommon,
    analyze: skAnalyze,
    healthPassport: skHealthPassport,
    episodes: skEpisodes,
    vetCard: skVetCard,
    auth: skAuth,
    landing: skLanding,
    install: skInstall,
    guides: skGuides,
  },
  en: {
    common: enCommon,
    analyze: enAnalyze,
    healthPassport: enHealthPassport,
    episodes: enEpisodes,
    vetCard: enVetCard,
    auth: enAuth,
    landing: enLanding,
    install: enInstall,
    guides: enGuides,
  },
};

// LanguageDetector číta navigator/localStorage — v Node (build-time prerender)
// by hodil. V SSR fixujeme jazyk na 'sk'; v prehliadači beží detekcia normálne.
if (isBrowser) {
  i18n.use(LanguageDetector);
}

i18n.use(initReactI18next).init({
  fallbackLng: 'sk',
  lng: isBrowser ? undefined : 'sk',
  supportedLngs: ['sk', 'en'],
  defaultNS: 'common',
  ns: namespaces,
  detection: {
    order: ['localStorage', 'navigator'],
    lookupLocalStorage: 'granule-check-language',
    caches: ['localStorage'],
  },
  resources,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
