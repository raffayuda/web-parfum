import type { ImageMetadata } from 'astro';
import { images, alts } from './images';

export interface JournalBlock {
  type: 'p' | 'h2' | 'quote';
  text: string;
  attribution?: string;
}

export interface JournalPost {
  slug: string;
  title: string;
  deck: string;
  category: string;
  date: string;
  displayDate: string;
  readingTime: string;
  image: ImageMetadata;
  imageAlt: string;
  body: JournalBlock[];
}

export const journal: JournalPost[] = [
  {
    slug: 'the-case-for-wearing-scent-alone',
    title: 'The case for wearing scent alone',
    deck: 'A perfume does not need an audience to do its work.',
    category: 'Essay',
    date: '2026-05-12',
    displayDate: 'May 2026',
    readingTime: '4 min read',
    image: images.corridor,
    imageAlt: alts.corridor,
    body: [
      {
        type: 'p',
        text: 'There is a particular pleasure in wearing perfume with no plan. No dinner, no meeting, no one to lean in. You spray it on a Tuesday morning, put on a sweater, and go about the day with a private atmosphere trailing behind you.',
      },
      {
        type: 'p',
        text: 'Most fragrance advice assumes an audience. Wear this to work. Wear that in the evening. Choose something he will like. The logic is practical, and it quietly turns a scent into a costume. The perfume becomes a message sent to other people, with your skin as the envelope.',
      },
      { type: 'h2', text: 'A private architecture' },
      {
        type: 'p',
        text: 'A perfume worn alone does something different. It becomes a room inside the day. You notice it when you turn your head, when you pull a sleeve over your wrist, when the air moves through an open window. The wearer is the only member of the audience, and the performance is allowed to be incomplete.',
      },
      {
        type: 'p',
        text: 'This is why we make extraits rather than colognes. The concentration is higher, the opening is slower, and the drydown takes its time. None of that is useful in a photograph. All of it is useful in a life.',
      },
      {
        type: 'quote',
        text: 'A scent worn alone is not unfinished. It is simply unshared.',
      },
      { type: 'h2', text: 'What changes' },
      {
        type: 'p',
        text: 'When there is no one to impress, you choose differently. You stop reaching for the perfume that reads well from across a room and start reaching for the one that reads well at the collar. You may find that your taste is quieter than you thought, or stranger, or more specific.',
      },
      {
        type: 'p',
        text: 'The next time you test a fragrance, try it on a day with nothing in it. Do not ask the person beside you what they think. Wait an hour. Then decide.',
      },
    ],
  },
  {
    slug: 'inside-the-maceration-room',
    title: 'Inside the maceration room',
    deck: 'Why a perfume is left to rest before it is bottled.',
    category: 'Atelier',
    date: '2026-02-03',
    displayDate: 'February 2026',
    readingTime: '5 min read',
    image: images.maceration,
    imageAlt: alts.maceration,
    body: [
      {
        type: 'p',
        text: 'The maceration room is the least dramatic part of the atelier. There are no flowers on the table, no glass beakers catching the light. There are shelves, bottles, a thermometer, and a great deal of waiting.',
      },
      {
        type: 'p',
        text: 'After a formula is composed and diluted, it is not finished. The mixture needs time for the materials to settle into one another. Sharp edges round off. The alcohol stops announcing itself. What smelled like a list of ingredients begins to smell like a single thing.',
      },
      { type: 'h2', text: 'Steel, then glass' },
      {
        type: 'p',
        text: 'The concentrate rests in stainless steel first, protected from light. After that it is transferred to glass, where it stays for several more weeks. We taste nothing and measure almost nothing. The only useful instrument is a blotter and a clean nose, preferably early in the morning.',
      },
      {
        type: 'p',
        text: 'Each composition asks for a different amount of time. A citrus-heavy formula can settle faster than a resinous one. An iris needs patience. Oud Intime rests for eight weeks, not because the calendar says so, but because at week six it is still arguing with itself.',
      },
      {
        type: 'quote',
        text: 'Time is the only ingredient we cannot buy twice.',
        attribution: 'Camille Aumont, perfumer',
      },
      { type: 'h2', text: 'The quiet part' },
      {
        type: 'p',
        text: 'There is no way to photograph this work convincingly. A shelf of dark bottles in a cool room looks like a shelf of dark bottles in a cool room. The change happens at a scale too small to see, and all at once, and then the perfume is ready.',
      },
      {
        type: 'p',
        text: 'We bottle in small batches because the room only holds so much. It is not a marketing constraint. It is the size of the room.',
      },
    ],
  },
  {
    slug: 'iris-after-the-frost',
    title: 'Iris, after the frost',
    deck: 'A root that asks for years, not weeks.',
    category: 'Material',
    date: '2025-11-18',
    displayDate: 'November 2025',
    readingTime: '3 min read',
    image: images.macroIris,
    imageAlt: alts.macroIris,
    body: [
      {
        type: 'p',
        text: 'Iris is not expensive because it is rare. It is expensive because it is slow. The rhizomes are lifted from the ground, cleaned, and left to dry for years. During that time the starch inside them changes, and a molecule called iron develops. Only then can the material be distilled into something that smells like cold powder and clean skin.',
      },
      {
        type: 'p',
        text: 'The flower itself is almost irrelevant. It is beautiful for a week, then gone. The root is where the perfume lives.',
      },
      { type: 'h2', text: 'A material of restraint' },
      {
        type: 'p',
        text: 'Iris does not bloom on the skin the way jasmine or rose does. It sits close and stays quiet. In Iris Cendre we give it violet leaf for a green edge and suede for warmth, but the root remains the centre of the composition. Everything else is there to keep it from disappearing.',
      },
      {
        type: 'quote',
        text: 'The powder is what remains after the flower has stopped performing.',
      },
      {
        type: 'p',
        text: 'Some materials reward attention. Iris rewards patience. On a warm wrist it takes twenty minutes before it begins to speak. After that it stays for hours, closer than most people expect.',
      },
    ],
  },
];

