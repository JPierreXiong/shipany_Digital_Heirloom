'use client';

import { ArrowRight, Laptop, UserCheck, Users, Wallet } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';

const solutions = [
  {
    title: 'Crypto Investors',
    description:
      'Secure your Bitcoin and Web3 assets with a Zero-Knowledge safety net.',
    href: '/solutions/crypto-inheritance',
    icon: Wallet,
    tag: 'Web3',
  },
  {
    title: 'Solo Living',
    description:
      'Automated check-ins to notify loved ones if you are unresponsive.',
    href: '/solutions/solo-living-protection',
    icon: UserCheck,
    tag: 'Safety',
  },
  {
    title: 'Digital Families',
    description:
      'Ensure your children inherit your photos and 2FA-locked memories.',
    href: '/solutions/family-digital-legacy',
    icon: Users,
    tag: 'Legacy',
  },
  {
    title: 'Content Creators',
    description:
      'Protect your digital business continuity and YouTube revenue.',
    href: '/solutions/creator-business-continuity',
    icon: Laptop,
    tag: 'Business',
  },
];

export function SolutionGrid({ className }: { className?: string }) {
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
              Protect What Matters{' '}
              <span className="text-primary italic font-serif">Most</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Tailored solutions for every digital lifestyle.
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {solutions.map((item, idx) => {
              const Icon = item.icon;
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
                    Learn More <ArrowRight className="h-4 w-4" />
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
