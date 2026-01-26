import Image from 'next/image';

import { Link } from '@/core/i18n/navigation';
import { Brand as BrandType } from '@/shared/types/blocks/common';

export function BrandLogo({ brand }: { brand: BrandType }) {
  return (
    <Link
      href={brand.url || '/'}
      target={brand.target || '_self'}
      className={`flex items-center space-x-2 transition-opacity hover:opacity-80 cursor-pointer ${brand.className}`}
      aria-label={`Go to homepage - ${brand.title || 'Home'}`}
    >
      {brand.logo && (
        <Image
          src={brand.logo.src}
          alt={brand.logo.alt || ''}
          width={120}
          height={40}
          className="h-10 w-auto"
          priority
          unoptimized={brand.logo.src.startsWith('/')}
        />
      )}
      {brand.title && (
        <span className="text-lg font-medium">{brand.title}</span>
      )}
    </Link>
  );
}
