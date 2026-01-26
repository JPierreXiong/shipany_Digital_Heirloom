'use client';

import { ArrowRight, Laptop, UserCheck, Users, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';

import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';

const iconMap: Record<string, typeof Wallet> = {
  Wallet,
  UserCheck,
  Users,
  Laptop,
};

export function SolutionGrid({ className }: { className?: string }) {
  const t = useTranslations('landing.solution-grid');
  
  const solutions = t.raw('items') as Array<{
    title: string;
    description: string;
    href: string;
    icon: string;
    tag: string;
  }>;

  const title = t('title');
  const highlightText = t('highlight_text');
  const description = t('description');
  const learnMore = t('learn_more');

  return (
    <section
      id="solutions"
      className={cn(
        'relative overflow-hidden py-16 md:py-24',
        'bg-background',
        className
      )}
    >
      {/* Grid pattern background (subtle) */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="container relative z-10">
        <ScrollAnimation>
          <div className="mx-auto max-w-4xl text-center text-balance mb-12 md:mb-16">
            <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {title}{' '}
              {highlightText && (
                <span className="text-primary italic font-serif">{highlightText}</span>
              )}
            </h2>
            <p className="text-muted-foreground text-lg">
              {description}
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {solutions.map((item, idx) => {
              const Icon = iconMap[item.icon] || Wallet;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
                >
                  <div>
                    <div className="mb-6 inline-flex rounded-xl bg-muted p-3 text-primary shadow-sm transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-tighter text-muted-foreground opacity-50">
                      {item.tag}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-4">
                    {learnMore} <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
