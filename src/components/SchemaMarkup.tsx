import { Helmet } from "react-helmet-async";

interface SchemaProps {
  data: object;
}

export const SchemaMarkup = ({ data }: SchemaProps) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  </Helmet>
);

export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://ponteasaude.com.br/#organization",
  "name": "Pontea Saúde",
  "url": "https://ponteasaude.com.br",
  "logo": {
    "@type": "ImageObject",
    "url": "https://ponteasaude.com.br/logo-pontea.png",
    "width": 600,
    "height": 60
  },
  "description": "A Pontea Saúde é o principal marketplace médico brasileiro que conecta pacientes a especialistas verificados com agendamento direto.",
  "sameAs": [
    "https://www.linkedin.com/company/pontea-saude",
    "https://www.instagram.com/ponteasaude"
  ],
  "knowsAbout": [
    "Saúde",
    "Agendamento Médico",
    "Consultas Online",
    "Marketplace de Saúde"
  ]
});

export const getWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://ponteasaude.com.br/#website",
  "name": "Pontea Saúde",
  "url": "https://ponteasaude.com.br",
  "publisher": {
    "@id": "https://ponteasaude.com.br/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://ponteasaude.com.br/buscar?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": "pt-BR"
});

export const getDoctorSchema = (doctor: any, reviews: any[]) => ({
  "@context": "https://schema.org",
  "@type": "Physician",
  "@id": `https://ponteasaude.com.br/dr/${doctor.slug}#physician`,
  "name": doctor.full_name,
  "image": doctor.avatar_url,
  "description": doctor.bio,
  "medicalSpecialty": doctor.specialty,
  "telephone": doctor.phone,
  "url": `https://ponteasaude.com.br/dr/${doctor.slug}`,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": doctor.city,
    "addressRegion": doctor.state,
    "addressCountry": "BR"
  },
  "aggregateRating": (doctor.avg_rating && doctor.total_reviews) ? {
    "@type": "AggregateRating",
    "ratingValue": doctor.avg_rating,
    "reviewCount": doctor.total_reviews,
    "bestRating": "5"
  } : undefined,
  "review": reviews.map(r => ({
    "@type": "Review",
    "author": { "@type": "Person", "name": r.patient_name },
    "datePublished": r.created_at,
    "reviewBody": r.comment,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": r.rating,
      "bestRating": "5"
    }
  })),
  "isAcceptingNewPatients": true,
  "priceRange": doctor.consultation_price ? `R$ ${doctor.consultation_price / 100}` : undefined
});

export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url.startsWith("http") ? item.url : `https://ponteasaude.com.br${item.url}`
  }))
});

export const getFAQSchema = (faqs: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.a
    }
  }))
});
