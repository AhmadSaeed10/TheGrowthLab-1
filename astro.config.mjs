import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: replace with the real production domain before launch.
const SITE = process.env.SITE_URL || 'https://thegrowthlab.example';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  integrations: [sitemap()],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
