import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { getLocalPage } from '@/shared/models/post';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const t = await getTranslations('common.metadata');

  const { locale, slug } = await params;

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/${slug}`
      : `${envConfigs.app_url}/${slug}`;

  // [slug] route handles single-segment paths
  // Nested paths like "solutions/crypto-inheritance" are handled by solutions/[slug] route
  const page = await getLocalPage({ slug, locale });
  if (!page) {
    return {
      title: `${slug} | ${t('title')}`,
      description: t('description'),
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  return {
    title: `${page.title} | ${t('title')}`,
    description: page.description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Check if slug contains multiple path segments (nested path)
  // If so, this route should not handle it - let solutions/[slug] handle it
  // But Next.js [slug] only captures single segments, so this check is for safety
  if (slug.includes('/')) {
    // This is a nested path, should be handled by solutions/[slug] route
    return notFound();
  }

  // Get the page from pagesSource (single segment only)
  const page = await getLocalPage({ slug, locale });
  if (!page) {
    return notFound();
  }

  const Page = await getThemePage('page-detail');

  return <Page locale={locale} post={page} />;
}
