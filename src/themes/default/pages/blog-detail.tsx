import Script from 'next/script';
import { Post as PostType } from '@/shared/types/blocks/blog';
import { BlogDetail } from '@/themes/default/blocks';
import { generateTechArticleSchema } from '@/shared/lib/json-ld';

export default async function BlogDetailPage({
  locale,
  post,
}: {
  locale?: string;
  post: PostType;
}) {
  // Generate TechArticle JSON-LD for blog posts
  const techArticleSchema = generateTechArticleSchema(post, locale || 'en');

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <Script
        id={`json-ld-tech-article-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }}
      />
      <BlogDetail post={post} />
    </>
  );
}
