import Script from 'next/script';
import { CalendarIcon, TimerIcon } from 'lucide-react';

import { MarkdownPreview } from '@/shared/blocks/common';
import { type Post as PostType } from '@/shared/types/blocks/blog';
import {
  generateArticleSchema,
  generateSoftwareApplicationSchema,
  generateFAQPageSchema,
} from '@/shared/lib/json-ld';
import { envConfigs } from '@/config';

import '@/config/style/docs.css';

/**
 * Parse FAQ items from MDX content
 * Looks for FAQ section with format:
 * ## FAQ: Title
 * ### Question
 * Answer text...
 */
function parseFAQFromContent(content: string): Array<{ question: string; answer: string }> {
  const faqItems: Array<{ question: string; answer: string }> = [];
  
  // Check if content contains FAQ section
  // Use [\s\S] instead of . with s flag for ES2017 compatibility
  const faqMatch = content.match(/##\s*FAQ[:\s]?.*?\n([\s\S]*?)(?=##|$)/i);
  if (!faqMatch) {
    return faqItems;
  }

  const faqSection = faqMatch[1];
  
  // Match questions (### Question text) and answers (following paragraphs)
  // Use [\s\S] instead of . with s flag for ES2017 compatibility
  const questionRegex = /###\s+(.+?)\n\n([\s\S]*?)(?=\n###|\n##|$)/g;
  let match;
  
  while ((match = questionRegex.exec(faqSection)) !== null) {
    const question = match[1].trim();
    let answer = match[2].trim();
    
    // Clean up markdown formatting from answer
    answer = answer
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    if (question && answer) {
      faqItems.push({ question, answer });
    }
  }
  
  return faqItems;
}

export async function PageDetail({
  post,
  locale = 'en',
}: {
  post: PostType;
  locale?: string;
}) {
  // Generate JSON-LD for pillar pages
  const isPillarPage = post.slug?.startsWith('solutions/');
  
  // SoftwareApplication schema for pillar pages
  const softwareSchema = isPillarPage
    ? generateSoftwareApplicationSchema({
        name: 'Afterglow Digital Heirloom Protocol',
        description: post.description,
        url: `${envConfigs.app_url || 'https://www.digitalheirloom.app'}/${post.slug}`,
      })
    : null;

  // Article schema for all pages
  const articleSchema = generateArticleSchema(post, locale, 'TechArticle');

  // Parse FAQ from content for FAQPage JSON-LD
  // Ensure content is a string for parsing
  const contentToParse = typeof post.content === 'string' 
    ? post.content 
    : typeof post.body === 'string' 
    ? post.body 
    : String(post.content || post.body || '');
  const faqItems = parseFAQFromContent(contentToParse);
  const faqSchema = faqItems.length > 0 ? generateFAQPageSchema(faqItems) : null;

  return (
    <section id={post.id}>
      {/* JSON-LD structured data for SEO */}
      {softwareSchema && (
        <Script
          id={`json-ld-software-${post.slug}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      )}
      <Script
        id={`json-ld-article-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* FAQPage JSON-LD for SEO - Rich Snippets */}
      {faqSchema && (
        <Script
          id={`json-ld-faq-${post.slug}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div className="py-24 md:py-32">
        <div className="mx-auto w-full max-w-4xl px-6 md:px-8">
          <div className="mt-16 text-center">
            <h1 className="text-foreground mx-auto mb-4 w-full text-xl font-bold md:max-w-4xl md:text-4xl">
              {post.title}
            </h1>
            <div className="text-muted-foreground text-md mb-8 flex items-center justify-center gap-4">
              {post.description}
            </div>
            {post.created_at && (
              <div className="text-muted-foreground text-md mb-8 flex items-center justify-center gap-2">
                <CalendarIcon className="size-4" /> {post.created_at}
              </div>
            )}
          </div>

          <div className="ring-foreground/5 relative mt-8 rounded-3xl border border-transparent px-4 shadow ring-1 md:px-8">
            <div>
              {post.body ? (
                <div className="docs text-foreground text-md my-8 space-y-4 font-normal *:leading-relaxed">
                  {post.body}
                </div>
              ) : (
                <>
                  {post.content && (
                    <div className="text-muted-foreground my-8 space-y-4 text-lg *:leading-relaxed">
                      <MarkdownPreview content={post.content} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
