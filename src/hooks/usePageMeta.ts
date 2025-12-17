import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description: string;
}

const defaultMeta: PageMeta = {
  title: 'Pousada Arara Azul | Ecolodge na Amazônia – Manacapuru, AM',
  description: 'Reserve sua experiência única na Pousada Arara Azul. Bangalôs sustentáveis em Manacapuru, Amazonas. Imersão na floresta amazônica com conforto e natureza.',
};

export const usePageMeta = (meta?: Partial<PageMeta>) => {
  useEffect(() => {
    const title = meta?.title || defaultMeta.title;
    const description = meta?.description || defaultMeta.description;

    // Update document title
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }

    // Cleanup - restore defaults on unmount
    return () => {
      document.title = defaultMeta.title;
      if (metaDescription) {
        metaDescription.setAttribute('content', defaultMeta.description);
      }
    };
  }, [meta?.title, meta?.description]);
};

export default usePageMeta;
