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

export const alts: Record<string, string> = {
  bottleVetiver: 'Smoked glass flacon of vetiver perfume with dried roots on dark stone.',
  bottleIris: 'Frosted flacon of pale iris perfume with an iris flower and rhizome on stone.',
  bottleFig: 'A single green fig leaf in a glass vessel beside a pale bottle.',
  bottleSel: 'Clear flacon of salt perfume with sea salt and driftwood on wet stone.',
  bottleOud: 'Smoked amber flacon of oud perfume with oud wood and a dried rose.',
  bottleAmbrette: 'Ivory flacon of ambrette perfume with seed pods and linen.',
  macroVetiver: 'Dried vetiver grass in a pale vessel, lit from the side.',
  macroIris: 'Close view of a pale iris petal and cut rhizome on cold stone.',
  macroFig: 'Close view of green fig leaves in soft window light.',
  macroSel: 'A crystal-capped flacon on wet grey stone.',
  macroOud: 'A dark amber flacon with a dried rose on wood.',
  macroAmbrette: 'A pale, gourd-shaped flacon on ivory linen.',
  atelier: 'Glass vessels and green bottles on a sunlit sill in the Omoo atelier.',
  perfumer: 'Camille Aumont, perfumer, standing at a worktable in the Omoo atelier.',
  maceration: 'Rows of green glass bottles resting on wooden shelves in the maceration room.',
  corridor: 'A long, dim corridor with tall windows and a single hanging light.',
  discoverySet: 'Six small perfume vials with silver caps arranged in a green linen case.',
  atelierDoor: 'A quiet chalk corridor with tall windows and deep green doors.',
};
