import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://pousadararazul.com';

interface PageMeta {
  title: string;
  description: string;
}

const defaultMeta: PageMeta = {
  title: 'Pousada Arara Azul | Ecolodge na Amazônia – Manacapuru, AM',
  description: 'Reserve sua experiência única na Pousada Arara Azul. Bangalôs sustentáveis em Manacapuru, Amazonas. Imersão na floresta amazônica com conforto e natureza.',
};

export const usePageMeta = (meta?: Partial<PageMeta>) => {
  const location = useLocation();

  useEffect(() => {
    const title = meta?.title || defaultMeta.title;
    const description = meta?.description || defaultMeta.description;
    const canonicalUrl = `${BASE_URL}${location.pathname}`;

    // Update document title
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);

    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', description);

    // Cleanup - restore defaults on unmount
    return () => {
      document.title = defaultMeta.title;
      if (metaDescription) metaDescription.setAttribute('content', defaultMeta.description);
      const cl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (cl) cl.setAttribute('href', BASE_URL);
      if (ogUrl) ogUrl.setAttribute('content', BASE_URL);
    };
  }, [meta?.title, meta?.description, location.pathname]);
};

export default usePageMeta;
