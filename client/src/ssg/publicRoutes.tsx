import { createElement, type ReactElement } from 'react';
import InfoPublicPage, { seo as infoSeo } from '../pages/public/InfoPublicPage';
import ContactPublicPage, { seo as contactSeo } from '../pages/public/ContactPublicPage';
import LandingPage, { seo as landingSeo } from '../pages/LandingPage';
import PrivacyPolicyRoute, { seo as privacySeo } from '../pages/PrivacyPolicyRoute';
import TermsRoute, { seo as termsSeo } from '../pages/TermsRoute';
import PoradnaIndexPage, { seo as poradnaSeo } from '../pages/public/PoradnaIndexPage';
import PoradnaArticlePage, { articleSeo } from '../pages/public/PoradnaArticlePage';
import { articles } from '../content/poradna/articles';

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  jsonLd?: object;
}

export interface SsgRoute {
  element: ReactElement;
  seo: PageSeo;
}

const props = { darkMode: false, onToggleTheme: () => {} };

export const publicRoutes: SsgRoute[] = [
  { element: createElement(LandingPage, props), seo: landingSeo },
  { element: createElement(PrivacyPolicyRoute, props), seo: privacySeo },
  { element: createElement(TermsRoute, props), seo: termsSeo },
  { element: createElement(InfoPublicPage, props), seo: infoSeo },
  { element: createElement(ContactPublicPage, props), seo: contactSeo },
  { element: createElement(PoradnaIndexPage, props), seo: poradnaSeo },
  ...articles.map((article) => ({
    element: createElement(PoradnaArticlePage, { ...props, slug: article.slug }),
    seo: articleSeo(article),
  })),
];
