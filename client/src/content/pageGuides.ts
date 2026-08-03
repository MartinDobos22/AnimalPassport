export type PageGuideKey =
  | 'overview'
  | 'checkIn'
  | 'food'
  | 'analyze'
  | 'profiles'
  | 'passport'
  | 'diary'
  | 'vetCard'
  | 'history'
  | 'notifications'
  | 'settings';

export const PAGE_GUIDE_STEP_INDEXES = [0, 1, 2] as const;

export type PageGuideStepIndex = (typeof PAGE_GUIDE_STEP_INDEXES)[number];

interface RouteGuide {
  path: string;
  key: PageGuideKey;
}

// Poradie určuje prioritu — dlhšie prefixy musia byť pred kratšími,
// inak by `/zdravotny-pas/zaznamy` spadlo na všeobecnejší match.
const ROUTE_GUIDES: readonly RouteGuide[] = [
  { path: '/zdravotny-pas', key: 'passport' },
  { path: '/karta-pre-veterinara', key: 'vetCard' },
  { path: '/notifikacie', key: 'notifications' },
  { path: '/nastavenia', key: 'settings' },
  { path: '/check-in', key: 'checkIn' },
  { path: '/prehlad', key: 'overview' },
  { path: '/analyza', key: 'analyze' },
  { path: '/profily', key: 'profiles' },
  { path: '/historia', key: 'history' },
  { path: '/krmivo', key: 'food' },
  { path: '/dennik', key: 'diary' },
];

export function getPageGuideKey(pathname: string): PageGuideKey | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const match = ROUTE_GUIDES.find(
    (route) => normalized === route.path || normalized.startsWith(`${route.path}/`)
  );
  return match?.key ?? null;
}
