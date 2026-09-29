// Single source of truth for business details. Empty values are hidden in the UI.
// Everything marked TODO was not in the portfolio PDF. Fill it in before launch.
export const site = {
  name: 'The Growth Lab',
  short: 'TGL',
  url: import.meta.env.SITE ?? 'https://thegrowthlab.example',
  tagline: 'Data. Strategy. Real growth.',
  description:
    'The Growth Lab is a full-service creative and digital growth agency for e-commerce brands: performance marketing, Shopify and web development, social, content, branding and PR under one team.',
  email: 'hello@thegrowthlab.example', // TODO
  phone: '', // TODO e.g. +92 300 0000000
  whatsapp: '', // TODO digits only, e.g. 923000000000
  address: '', // TODO
  city: '', // TODO
  instagram: '', // TODO full URL
  linkedin: '', // TODO full URL
};

export const nav = [
  { href: '/services/', label: 'Services' },
  { href: '/work/', label: 'Work' },
  { href: '/model/', label: 'The TGL model' },
  { href: '/about/', label: 'About' },
  { href: '/insights/', label: 'Insights' },
];
