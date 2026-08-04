import type skCommon from '../locales/sk/common.json';
import type skAnalyze from '../locales/sk/analyze.json';
import type skHealthPassport from '../locales/sk/healthPassport.json';
import type skEpisodes from '../locales/sk/episodes.json';
import type skVetCard from '../locales/sk/vetCard.json';
import type skAuth from '../locales/sk/auth.json';
import type skLanding from '../locales/sk/landing.json';
import type skInstall from '../locales/sk/install.json';
import type skGuides from '../locales/sk/guides.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof skCommon;
      analyze: typeof skAnalyze;
      healthPassport: typeof skHealthPassport;
      episodes: typeof skEpisodes;
      vetCard: typeof skVetCard;
      auth: typeof skAuth;
      landing: typeof skLanding;
      install: typeof skInstall;
      guides: typeof skGuides;
    };
  }
}
