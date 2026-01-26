import { MetadataRoute } from 'next';
import { envConfigs } from '@/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = envConfigs.app_url || 'https://www.digitalheirloom.app';
  const locales = ['en', 'zh', 'fr'];
  
  // Core marketing pages
  const routes = [
    '',
    '/pricing',
    '/about',
    '/contact',
    '/blog',
    '/privacy-policy',
    '/terms-of-service',
    '/disclaimer',
  ];

  // Pillar pages (high priority for SEO)
  const pillarPages = [
    '/solutions/crypto-inheritance',
    '/solutions/solo-living-protection',
    '/solutions/family-digital-legacy',
    '/solutions/creator-business-continuity',
  ];

  // Known blog posts (add more as you create them)
  const blogPosts = [
    'how-decryption-works',
    'self-custody-estate-planning-bitcoin-ethereum',
    'beyond-multisig-zero-knowledge-crypto-inheritance-2026',
    '95-billion-ghost-wallet-problem-cold-storage-failure',
    'digital-assets-2026-estate-tax-sunset-probate',
    'nfts-stablecoins-onchain-wealth-succession-checklist',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each locale and route combination
  locales.forEach((locale) => {
    routes.forEach((route) => {
      const url = locale === 'en' 
        ? `${baseUrl}${route}` 
        : `${baseUrl}/${locale}${route}`;
      
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === '/blog' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : route === '/pricing' ? 0.9 : 0.8,
      });
    });

    // Add pillar pages for each locale (high priority)
    pillarPages.forEach((pillarRoute) => {
      const pillarUrl = locale === 'en'
        ? `${baseUrl}${pillarRoute}`
        : `${baseUrl}/${locale}${pillarRoute}`;
      
      sitemapEntries.push({
        url: pillarUrl,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9, // High priority for pillar pages
      });
    });

    // Add blog posts for each locale
    blogPosts.forEach((postSlug) => {
      const blogUrl = locale === 'en'
        ? `${baseUrl}/blog/${postSlug}`
        : `${baseUrl}/${locale}/blog/${postSlug}`;
      
      sitemapEntries.push({
        url: blogUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8, // High priority for blog posts
      });
    });
  });

  // Add ads.txt entry (optional, but helps with some crawlers)
  sitemapEntries.push({
    url: `${baseUrl}/ads.txt`,
    lastModified: new Date(),
    priority: 0.1,
    changeFrequency: 'monthly',
  });

  return sitemapEntries;
}
