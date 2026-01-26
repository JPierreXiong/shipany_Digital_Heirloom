import { envConfigs } from '@/config';
import { type Post as PostType } from '@/shared/types/blocks/blog';

const appUrl = envConfigs.app_url || 'https://www.digitalheirloom.app';

/**
 * Generate SoftwareApplication JSON-LD for pillar pages
 */
export function generateSoftwareApplicationSchema(options: {
  name?: string;
  description?: string;
  url?: string;
  featureList?: string[];
} = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: options.name || 'Afterglow Digital Heirloom Protocol',
    description:
      options.description ||
      'High-security digital asset custody and automated distribution platform. Protect your digital legacy with zero-knowledge encryption, ensuring your loved ones can access your digital assets when they need them most.',
    operatingSystem: 'Web Browser',
    applicationCategory: 'SecurityApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList:
      options.featureList || [
        'Zero-knowledge encryption',
        'Dead man\'s switch',
        'Automated asset distribution',
        'Beneficiary management',
        'End-to-end encryption',
        'GDPR & CCPA compliant',
      ],
    url: options.url || appUrl,
  };
}

/**
 * Generate TechArticle JSON-LD for blog posts
 */
export function generateTechArticleSchema(post: PostType, locale: string = 'en') {
  const canonicalUrl = locale === 'en' 
    ? `${appUrl}/blog/${post.slug}`
    : `${appUrl}/${locale}/blog/${post.slug}`;

  const publishedDate = post.created_at || new Date().toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title || '',
    description: post.description || '',
    image: post.image || `${appUrl}/images/blog/${post.slug}-hero.jpg`,
    author: {
      '@type': 'Organization',
      name: post.author_name || 'Afterglow Tech Team',
      url: appUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Afterglow',
      logo: {
        '@type': 'ImageObject',
        url: `${appUrl}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    datePublished: publishedDate,
    dateModified: post.updated_at || publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    // TechArticle specific fields
    proficiencyLevel: 'Expert',
    dependencies: 'Zero-Knowledge Encryption, Dead Man\'s Switch',
  };
}

/**
 * Generate Article JSON-LD for pillar pages
 */
export function generateArticleSchema(
  post: PostType,
  locale: string = 'en',
  articleType: 'Article' | 'TechArticle' = 'Article'
) {
  const slug = post.slug || '';
  const isEnglish = locale === 'en';
  const canonicalUrl = isEnglish 
    ? `${appUrl}/${slug}`
    : `${appUrl}/${locale}/${slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': articleType,
    headline: post.title || '',
    description: post.description || '',
    author: {
      '@type': 'Organization',
      name: 'Afterglow',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Afterglow',
      logo: {
        '@type': 'ImageObject',
        url: `${appUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };
}

/**
 * Generate Organization JSON-LD for site-wide
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: appUrl,
    logo: `${appUrl}/logo.png`,
    name: 'Afterglow',
    description:
      'Secure Your Legacy with Zero-Knowledge Encryption. Protect and pass on your digital assets—from crypto wallets to personal memories—with our automated, private safety net. Ensure your loved ones have access when they need it most, without compromising your privacy today.',
    sameAs: [
      // Add social media links when available
      // 'https://twitter.com/afterglow_app',
      // 'https://github.com/afterglow-protocol',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@digitalheirloom.app',
    },
  };
}

/**
 * Generate FAQPage JSON-LD
 */
export function generateFAQPageSchema(faqItems: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList JSON-LD
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
