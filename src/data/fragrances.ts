import type { ImageMetadata } from 'astro';
import { images, alts } from './images';

export interface Fragrance {
  slug: string;
  edition: string;
  name: string;
  family: string;
  tagline: string;
  description: string;
  price: number;
  volume: string;
  concentration: string;
  bottle: ImageMetadata;
  bottleAlt: string;
  macro: ImageMetadata;
  macroAlt: string;
  card: ImageMetadata;
  cardAlt: string;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  material: {
    name: string;
    origin: string;
    phrase: string;
  };
  story: string[];
  quote: {
    text: string;
    attribution: string;
  };
  performance: {
    concentration: string;
    maceration: string;
    longevity: string;
    sillage: string;
  };
  related: string[];
}

export const fragrances: Fragrance[] = [
  {
    slug: 'vetiver-obscura',
    edition: 'OM-01',
    name: 'Vetiver Obscura',
    family: 'Woody',
    tagline: 'Vetiver, smoke, cold citrus.',
    description:
      'A root pulled from wet earth, cut with grapefruit peel and left to dry beside cedar.',
    price: 185,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleVetiver,
    bottleAlt: alts.bottleVetiver,
    macro: images.macroVetiver,
    macroAlt: alts.macroVetiver,
    card: images.bottleVetiver,
    cardAlt: alts.bottleVetiver,
    notes: {
      top: ['Grapefruit peel', 'Pink pepper'],
      heart: ['Haitian vetiver', 'Orris root'],
      base: ['Cedar', 'Ambrette', 'Incense'],
    },
    material: {
      name: 'Vetiver',
      origin: 'Haiti',
      phrase: 'Roots, smoke, wet earth.',
    },
    story: [
      'Vetiver is a root, not a wood. It arrives with soil still on it: bitter, green, faintly smoky. We built the composition around that first impression, then let cold citrus cut through it.',
      'The opening is bright and brief. What remains is quieter and more mineral, closer to a stone room after rain than to a conventional cologne. It wears close, then stays.',
    ],
    quote: {
      text: 'I wanted a vetiver that smelled like the field, not the bottle.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Six weeks',
      longevity: '8 to 10 hours',
      sillage: "Arm's length",
    },
    related: ['fig-nocturne', 'oud-intime'],
  },
  {
    slug: 'iris-cendre',
    edition: 'OM-02',
    name: 'Iris Cendre',
    family: 'Floral',
    tagline: 'Iris, cold powder, suede.',
    description: 'Pale iris root, violet leaf and a trace of suede, held together by warm skin.',
    price: 195,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleIris,
    bottleAlt: alts.bottleIris,
    macro: images.macroIris,
    macroAlt: alts.macroIris,
    card: images.bottleIris,
    cardAlt: alts.bottleIris,
    notes: {
      top: ['Bergamot', 'Violet leaf'],
      heart: ['Iris pallida', 'Suede'],
      base: ['Sandalwood', 'Ambrette', 'White musk'],
    },
    material: {
      name: 'Iris',
      origin: 'Tuscany',
      phrase: 'Rhizome, cold powder, suede.',
    },
    story: [
      'Iris takes years. The rhizomes are lifted, dried, and left to rest until the starch turns to that strange, papery powder. There is no way to hurry it.',
      'We kept the flower out of the light. Violet leaf gives the top a cool green edge; suede and ambrette soften the base until it sits like a second skin.',
    ],
    quote: {
      text: 'The powder should feel like cashmere in the dark, not a dressing table.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Four weeks',
      longevity: '6 to 8 hours',
      sillage: 'Close',
    },
    related: ['ambrette-12', 'sel-brut'],
  },
  {
    slug: 'fig-nocturne',
    edition: 'OM-03',
    name: 'Fig Nocturne',
    family: 'Green',
    tagline: 'Fig leaf, black fig, green sap.',
    description: 'A fig tree after dark: green sap, milky fruit, cedar and moss.',
    price: 185,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleFig,
    bottleAlt: alts.bottleFig,
    macro: images.macroFig,
    macroAlt: alts.macroFig,
    card: images.macroFig,
    cardAlt: alts.macroFig,
    notes: {
      top: ['Fig leaf', 'Bitter orange'],
      heart: ['Black fig', 'Galbanum'],
      base: ['Cedar', 'Vetiver', 'Moss'],
    },
    material: {
      name: 'Fig',
      origin: 'Calabria',
      phrase: 'Green sap, milky fruit, leaf.',
    },
    story: [
      'There is a fig tree behind the atelier. In August the fruit ripens faster than anyone can eat it, and the whole courtyard smells of sap and warm leaves.',
      'We wanted the green part, not the jam. Fig leaf and galbanum carry the top. The fruit sits underneath, dark and quiet, with cedar and moss keeping it from turning sweet.',
    ],
    quote: {
      text: 'The tree is louder than the fruit. That is the part I keep returning to.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Five weeks',
      longevity: '7 to 9 hours',
      sillage: "Arm's length",
    },
    related: ['vetiver-obscura', 'sel-brut'],
  },
  {
    slug: 'sel-brut',
    edition: 'OM-04',
    name: 'Sel Brut',
    family: 'Fresh',
    tagline: 'Sea salt, driftwood, wind.',
    description: 'Salt on skin, cold air, driftwood drying in the sun.',
    price: 185,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleSel,
    bottleAlt: alts.bottleSel,
    macro: images.macroSel,
    macroAlt: alts.macroSel,
    card: images.bottleSel,
    cardAlt: alts.bottleSel,
    notes: {
      top: ['Sea salt', 'Yuzu', 'Pink pepper'],
      heart: ['Driftwood', 'Sage'],
      base: ['Ambergris accord', 'White musk', 'Cedar'],
    },
    material: {
      name: 'Sea salt',
      origin: 'Noirmoutier',
      phrase: 'Mineral, air, skin.',
    },
    story: [
      'Sel Brut began on a beach in November, with the wind coming off the water and nothing else around. It is the only composition in the collection that smells explicitly of air.',
      'Sea salt and yuzu make the first minute sharp. Driftwood, sage and an ambergris accord take over slowly, leaving something warm and slightly animal on the skin.',
    ],
    quote: {
      text: 'I wanted the moment after the swim, not the sea itself.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Four weeks',
      longevity: '6 to 8 hours',
      sillage: 'Moderate',
    },
    related: ['fig-nocturne', 'ambrette-12'],
  },
  {
    slug: 'oud-intime',
    edition: 'OM-05',
    name: 'Oud Intime',
    family: 'Oriental',
    tagline: 'Oud, rose, saffron, leather.',
    description: 'Dark oud and rose, kept close. Saffron, leather and a trace of incense.',
    price: 245,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 25%',
    bottle: images.bottleOud,
    bottleAlt: alts.bottleOud,
    macro: images.macroOud,
    macroAlt: alts.macroOud,
    card: images.bottleOud,
    cardAlt: alts.bottleOud,
    notes: {
      top: ['Saffron', 'Rose'],
      heart: ['Oud', 'Leather'],
      base: ['Patchouli', 'Tonka bean', 'Incense'],
    },
    material: {
      name: 'Oud',
      origin: 'Assam',
      phrase: 'Resin, leather, heat.',
    },
    story: [
      'Oud can dominate a room before a person enters it. We wanted the opposite: a dark material held close, revealed only when someone leans in.',
      'Saffron and rose open the composition with a dry, almost metallic warmth. Oud and leather follow, softened by patchouli and tonka. It is not a loud perfume. It is a long one.',
    ],
    quote: {
      text: 'Intimacy is a question of distance. This one answers at close range.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '25%',
      maceration: 'Eight weeks',
      longevity: '10 to 12 hours',
      sillage: 'Close and persistent',
    },
    related: ['vetiver-obscura', 'iris-cendre'],
  },
  {
    slug: 'ambrette-12',
    edition: 'OM-06',
    name: 'Ambrette 12',
    family: 'Musk',
    tagline: 'Ambrette seed, almond, warm linen.',
    description: 'A musk that behaves like skin. Ambrette, almond, hay and cedar.',
    price: 185,
    volume: '50 ml',
    concentration: 'Extrait de parfum, 20%',
    bottle: images.bottleAmbrette,
    bottleAlt: alts.bottleAmbrette,
    macro: images.macroAmbrette,
    macroAlt: alts.macroAmbrette,
    card: images.macroAmbrette,
    cardAlt: alts.macroAmbrette,
    notes: {
      top: ['Almond', 'Hay'],
      heart: ['Ambrette seed', 'Iris'],
      base: ['White musk', 'Vanilla', 'Cedar'],
    },
    material: {
      name: 'Ambrette',
      origin: 'Ecuador',
      phrase: 'Musk, pear skin, linen.',
    },
    story: [
      'Ambrette is a seed that smells like musk, which makes it both a material and an illusion. We built the softest composition in the collection around it.',
      'Almond and hay give the top a dry, nutty warmth. Ambrette and iris hold the middle. The base is barely there: white musk, a little vanilla, cedar. It is the perfume we wear when we do not want to explain ourselves.',
    ],
    quote: {
      text: 'The last thing you notice should be the thing you remember.',
      attribution: 'Camille Aumont, perfumer',
    },
    performance: {
      concentration: '20%',
      maceration: 'Six weeks',
      longevity: '5 to 7 hours',
      sillage: 'Barely there',
    },
    related: ['iris-cendre', 'sel-brut'],
  },
];

export const bySlug = (slug: string) => fragrances.find((fragrance) => fragrance.slug === slug);

export const featured = ['vetiver-obscura', 'fig-nocturne', 'iris-cendre', 'oud-intime'].map(
  (slug) => bySlug(slug)!
);

export const families = ['All', 'Woody', 'Floral', 'Green', 'Fresh', 'Oriental', 'Musk'];

export const materials = fragrances.map((fragrance) => ({
  ...fragrance.material,
  slug: fragrance.slug,
  edition: fragrance.edition,
  image: fragrance.macro,
  alt: fragrance.macroAlt,
}));

export const priceLabel = (value: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
