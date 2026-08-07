const SITE_URL = 'https://matusms.matubyte.com';

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function landingJsonLd(faqs: { question: string; answer: string }[]) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'MatuSMS',
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      email: 'contacto@matubyte.com',
      parentOrganization: {
        '@type': 'Organization',
        name: 'MatuByte S.A.S.',
        url: 'https://matubyte.com',
      },
      sameAs: ['https://matubyte.com'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MatuSMS',
      url: SITE_URL,
      inLanguage: 'es',
      description:
        'Pasarela SMS con Android gateway, API REST, webhooks firmados y panel en español.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'MatuSMS',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android',
      url: SITE_URL,
      description:
        'Pasarela SMS SaaS que convierte un Android con SIM en gateway. API REST, webhooks HMAC, dual SIM y panel en español.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Prueba gratuita sin tarjeta de crédito',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Pasarela SMS MatuSMS',
      serviceType: 'SMS Gateway',
      provider: { '@type': 'Organization', name: 'MatuSMS' },
      areaServed: 'Worldwide',
      description:
        'Envío y recepción de SMS mediante gateway Android, API REST y webhooks firmados.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: SITE_URL,
        },
      ],
    },
  ];
}
