/**
 * Replace the placeholder handles and WhatsApp number before publishing.
 * Keeping them here means the footer, contact page and product pages stay in sync.
 */
const whatsappNumber = '6281200000000';

export const site = {
  name: 'OMOO',
  email: 'hello@omoo.studio',
  address: {
    street: 'Jl. Senopati No. 42, Kebayoran Baru',
    city: 'Jakarta Selatan 12190',
    country: 'Indonesia',
  },
  whatsapp: {
    number: whatsappNumber,
    display: '+62 812 0000 0000',
  },
  socials: [
    {
      label: 'Instagram',
      handle: '@omoo.parfums',
      href: 'https://www.instagram.com/omoo.parfums/',
    },
    {
      label: 'TikTok',
      handle: '@omoo.parfums',
      href: 'https://www.tiktok.com/@omoo.parfums',
    },
    {
      label: 'Pinterest',
      handle: 'omoo parfums',
      href: 'https://www.pinterest.com/omoo.parfums/',
    },
  ],
} as const;

export const whatsappHref = (message: string) =>
  `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
