import type { ImageMetadata } from 'astro';

import bottleVetiver from '../assets/images/bottle-vetiver.jpg';
import bottleIris from '../assets/images/bottle-iris.jpg';
import bottleFig from '../assets/images/bottle-fig.jpg';
import bottleSel from '../assets/images/bottle-sel.jpg';
import bottleOud from '../assets/images/bottle-oud.jpg';
import bottleAmbrette from '../assets/images/bottle-ambrette.jpg';
import macroVetiver from '../assets/images/macro-vetiver.jpg';
import macroIris from '../assets/images/macro-iris.jpg';
import macroFig from '../assets/images/macro-fig.jpg';
import macroSel from '../assets/images/macro-sel.jpg';
import macroOud from '../assets/images/macro-oud.jpg';
import macroAmbrette from '../assets/images/macro-ambrette.jpg';
import atelier from '../assets/images/atelier.jpg';
import perfumer from '../assets/images/perfumer.jpg';
import maceration from '../assets/images/maceration.jpg';
import corridor from '../assets/images/corridor.jpg';
import discoverySet from '../assets/images/discovery-set.jpg';
import atelierDoor from '../assets/images/atelier-door.jpg';

export const images: Record<string, ImageMetadata> = {
  bottleVetiver,
  bottleIris,
  bottleFig,
  bottleSel,
  bottleOud,
  bottleAmbrette,
  macroVetiver,
  macroIris,
  macroFig,
  macroSel,
  macroOud,
  macroAmbrette,
  atelier,
  perfumer,
  maceration,
  corridor,
  discoverySet,
  atelierDoor,
};

const assetMap: Record<string, ImageMetadata> = {
  '/src/assets/images/bottle-vetiver.jpg': bottleVetiver,
  '/images/bottle-vetiver.jpg': bottleVetiver,
  '/src/assets/images/bottle-iris.jpg': bottleIris,
  '/images/bottle-iris.jpg': bottleIris,
  '/src/assets/images/bottle-fig.jpg': bottleFig,
  '/images/bottle-fig.jpg': bottleFig,
  '/src/assets/images/bottle-sel.jpg': bottleSel,
  '/images/bottle-sel.jpg': bottleSel,
  '/src/assets/images/bottle-oud.jpg': bottleOud,
  '/images/bottle-oud.jpg': bottleOud,
  '/src/assets/images/bottle-ambrette.jpg': bottleAmbrette,
  '/images/bottle-ambrette.jpg': bottleAmbrette,
  '/src/assets/images/macro-vetiver.jpg': macroVetiver,
  '/images/macro-vetiver.jpg': macroVetiver,
  '/src/assets/images/macro-iris.jpg': macroIris,
  '/images/macro-iris.jpg': macroIris,
  '/src/assets/images/macro-fig.jpg': macroFig,
  '/images/macro-fig.jpg': macroFig,
  '/src/assets/images/macro-sel.jpg': macroSel,
  '/images/macro-sel.jpg': macroSel,
  '/src/assets/images/macro-oud.jpg': macroOud,
  '/images/macro-oud.jpg': macroOud,
  '/src/assets/images/macro-ambrette.jpg': macroAmbrette,
  '/images/macro-ambrette.jpg': macroAmbrette,
  '/src/assets/images/atelier.jpg': atelier,
  '/images/atelier.jpg': atelier,
  '/src/assets/images/perfumer.jpg': perfumer,
  '/images/perfumer.jpg': perfumer,
  '/src/assets/images/maceration.jpg': maceration,
  '/images/maceration.jpg': maceration,
  '/src/assets/images/corridor.jpg': corridor,
  '/images/corridor.jpg': corridor,
  '/src/assets/images/discovery-set.jpg': discoverySet,
  '/images/discovery-set.jpg': discoverySet,
  '/src/assets/images/atelier-door.jpg': atelierDoor,
  '/images/atelier-door.jpg': atelierDoor,
};

/** Resolve legacy /src/assets/images/... or /images/... paths to optimized Astro ImageMetadata when available. */
export function resolveImage(src: ImageMetadata | string | undefined | null, fallback: ImageMetadata = bottleVetiver): ImageMetadata | string {
  if (!src) return fallback;
  if (typeof src !== 'string') return src;
  return assetMap[src] || src.replace(/^\/src\/assets\/images\//, '/images/');
}

/** Normalize image URLs for client-side <img> elements so legacy paths, filenames, or ImageMetadata never 404. */
const legacyImageMap: Record<string, string> = {
  '/images/bottle-vetiver.jpg': '/images/products/emerald-lifestyle.webp',
  '/images/bottle-iris.jpg': '/images/products/youth-lumina-mood.webp',
  '/images/bottle-fig.jpg': '/images/products/emerald-studio.webp',
  '/images/bottle-sel.jpg': '/images/products/golden-de-brume-mood.webp',
  '/images/bottle-oud.jpg': '/images/products/rare-mood.webp',
  '/images/bottle-ambrette.jpg': '/images/products/golden-de-brume-studio.webp',
  '/images/macro-vetiver.jpg': '/images/products/emerald-box.webp',
  '/images/macro-iris.jpg': '/images/products/youth-lumina-box.webp',
  '/images/macro-fig.jpg': '/images/products/emerald-box.webp',
  '/images/macro-sel.jpg': '/images/products/golden-de-brume-box.webp',
  '/images/macro-oud.jpg': '/images/products/rare-box.webp',
  '/images/macro-ambrette.jpg': '/images/products/trio-editorial.webp',
};

export function resolvePublicImageUrl(src: any, fallback = '/images/products/emerald-lifestyle.webp'): string {
  if (!src) return fallback;
  if (typeof src === 'object' && typeof src.src === 'string') {
    return src.src;
  }
  const str = String(src).trim();
  if (!str) return fallback;
  if (legacyImageMap[str]) return legacyImageMap[str];
  if (
    str.startsWith('data:') ||
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('/_astro/') ||
    str.startsWith('/images/')
  ) {
    return str;
  }
  if (str.startsWith('/src/assets/images/')) {
    const normalized = str.replace(/^\/src\/assets\/images\//, '/images/');
    return legacyImageMap[normalized] || normalized;
  }
  if (str.startsWith('src/assets/images/')) {
    const normalized = str.replace(/^src\/assets\/images\//, '/images/');
    return legacyImageMap[normalized] || normalized;
  }
  if (str.startsWith('images/')) {
    return legacyImageMap[`/${str}`] || `/${str}`;
  }
  if (!str.includes('/')) {
    return legacyImageMap[`/images/${str}`] || `/images/${str}`;
  }
  return str;
}

export const alts: Record<string, string> = {
  bottleVetiver: 'Botol kaca gelap Vetiver Obscura dengan akar vetiver kering di atas batu hitam.',
  bottleIris: 'Botol kaca Iris Cendre bersama bunga iris pucat dan rimpang kering.',
  bottleFig: 'Sehelai daun ara hijau dalam wadah kaca di samping botol parfum.',
  bottleSel: 'Botol kaca bening Sel Marin dengan kristal garam laut dan kayu apung.',
  bottleOud: 'Botol kaca amber Oud Intime bersama kayu gaharu dan mawar kering.',
  bottleAmbrette: 'Botol kaca pucat Ambrette 12 di atas kain linen.',
  macroVetiver: 'Rumput dan akar vetiver kering dalam wadah pucat.',
  macroIris: 'Detail kelopak iris pucat dan rimpang di atas batu.',
  macroFig: 'Detail daun ara hijau segar terkena cahaya jendela.',
  macroSel: 'Botol parfum bertutup kristal di atas batu abu-abu.',
  macroOud: 'Botol amber gelap dengan mawar kering di atas kayu.',
  macroAmbrette: 'Botol kaca pucat di atas linen gading.',
  atelier: 'Wadah kaca dan botol hijau di meja peracikan studio OMOO.',
  perfumer: 'Peracik parfum berdiri di meja kerja studio OMOO.',
  maceration: 'Deretan botol kaca hijau di rak kayu ruang pematangan.',
  corridor: 'Koridor tenang dengan jendela tinggi dan pintu hijau tua.',
  discoverySet: 'Enam vial parfum 2 ml tertata dalam kotak linen hijau.',
  atelierDoor: 'Koridor tenang dengan jendela tinggi menuju ruang konsultasi OMOO.',
};
