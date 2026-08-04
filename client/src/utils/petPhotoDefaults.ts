import type { AnimalType } from '../types';

// Pleasant free-stock defaults (Unsplash, free to use/hotlink) shown in the hero
// when the user hasn't uploaded their own photo. If they fail to load (offline,
// blocked), the UI falls back to the local self-contained SVG illustrations below.
export const DEFAULT_PET_PHOTO_URL: Record<AnimalType, string> = {
  dog: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?auto=format&fit=crop&w=1200&q=80',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80',
  rabbit:
    'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=1200&q=80',
  guinea_pig:
    'https://images.unsplash.com/photo-1612267168669-679c961c5b31?auto=format&fit=crop&w=1200&q=80',
  hamster:
    'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=1200&q=80',
  rat: 'https://images.unsplash.com/photo-1625371031276-5f99d3c4094f?auto=format&fit=crop&w=1200&q=80',
  mouse:
    'https://images.unsplash.com/photo-1584553421349-3557471bed79?auto=format&fit=crop&w=1200&q=80',
  gerbil:
    'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=1200&q=80',
  ferret:
    'https://images.unsplash.com/photo-1612106943002-41469c4c9c70?auto=format&fit=crop&w=1200&q=80',
  chinchilla:
    'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=1200&q=80',
  hedgehog:
    'https://images.unsplash.com/photo-1598875706250-21faaf804361?auto=format&fit=crop&w=1200&q=80',
  parrot:
    'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=1200&q=80',
  budgerigar:
    'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1200&q=80',
  cockatiel:
    'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=1200&q=80',
  canary:
    'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1200&q=80',
  finch:
    'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1200&q=80',
  chicken:
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=80',
  duck: 'https://images.unsplash.com/photo-1563409236302-8442b5e644df?auto=format&fit=crop&w=1200&q=80',
  pigeon:
    'https://images.unsplash.com/photo-1540927752452-89d86da3fa0a?auto=format&fit=crop&w=1200&q=80',
  turtle:
    'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=1200&q=80',
  tortoise:
    'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=1200&q=80',
  snake:
    'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=1200&q=80',
  lizard:
    'https://images.unsplash.com/photo-1528158222524-d4d912d2e208?auto=format&fit=crop&w=1200&q=80',
  gecko:
    'https://images.unsplash.com/photo-1528158222524-d4d912d2e208?auto=format&fit=crop&w=1200&q=80',
  bearded_dragon:
    'https://images.unsplash.com/photo-1528158222524-d4d912d2e208?auto=format&fit=crop&w=1200&q=80',
  chameleon:
    'https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&w=1200&q=80',
  frog: 'https://images.unsplash.com/photo-1526237565185-3c1b7358f5d8?auto=format&fit=crop&w=1200&q=80',
  axolotl:
    'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80',
  fish: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80',
  horse:
    'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80',
  pony: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80',
  goat: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=1200&q=80',
  sheep:
    'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=1200&q=80',
  pig: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80',
  other:
    'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?auto=format&fit=crop&w=1200&q=80',
};

export const DEFAULT_PET_PHOTO_SVG: Record<AnimalType, string> = {
  dog: '/pets/dog.svg',
  cat: '/pets/cat.svg',
  rabbit: '/pets/other.svg',
  guinea_pig: '/pets/other.svg',
  hamster: '/pets/other.svg',
  rat: '/pets/other.svg',
  mouse: '/pets/other.svg',
  gerbil: '/pets/other.svg',
  ferret: '/pets/other.svg',
  chinchilla: '/pets/other.svg',
  hedgehog: '/pets/other.svg',
  parrot: '/pets/other.svg',
  budgerigar: '/pets/other.svg',
  cockatiel: '/pets/other.svg',
  canary: '/pets/other.svg',
  finch: '/pets/other.svg',
  chicken: '/pets/other.svg',
  duck: '/pets/other.svg',
  pigeon: '/pets/other.svg',
  turtle: '/pets/other.svg',
  tortoise: '/pets/other.svg',
  snake: '/pets/other.svg',
  lizard: '/pets/other.svg',
  gecko: '/pets/other.svg',
  bearded_dragon: '/pets/other.svg',
  chameleon: '/pets/other.svg',
  frog: '/pets/other.svg',
  axolotl: '/pets/other.svg',
  fish: '/pets/other.svg',
  horse: '/pets/other.svg',
  pony: '/pets/other.svg',
  goat: '/pets/other.svg',
  sheep: '/pets/other.svg',
  pig: '/pets/other.svg',
  other: '/pets/other.svg',
};

export const petPhotoSvg = (animalType: AnimalType): string =>
  DEFAULT_PET_PHOTO_SVG[animalType] ?? DEFAULT_PET_PHOTO_SVG.other;

export const petPhotoStock = (animalType: AnimalType): string =>
  DEFAULT_PET_PHOTO_URL[animalType] ?? DEFAULT_PET_PHOTO_URL.other;
