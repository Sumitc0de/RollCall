export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rollcall.app";

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rollcall",
    alternateName: ["Rollcall App", "Rollcall Attendance Tracker"],
    url: baseUrl,
    description:
      "Simple, offline-first student attendance tracker and attendance percentage calculator for college and university students.",
    publisher: {
      "@type": "Person",
      name: "sumitc0de",
      url: "https://sumitxdev.online",
    },
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Rollcall",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Android",
    downloadUrl: `${baseUrl}/download`,
    softwareVersion: "1.0.0",
    description:
      "Free offline-first student attendance tracking mobile app. Track lectures, calculate attendance percentage, monitor safe skips, and stay on top of target requirements.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "sumitc0de",
      url: "https://sumitxdev.online",
      sameAs: [
        "https://github.com/sumitc0de",
        "https://sumitxdev.online",
      ],
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Rollcall?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Rollcall is a free, offline-first mobile app that helps students track class attendance, monitor subject percentages, and calculate how many lectures they can safely skip or need to attend to hit their targets.",
        },
      },
      {
        "@type": "Question",
        name: "How does Rollcall calculate attendance percentage?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Rollcall calculates your attendance percentage using the formula: (Present Lectures / Total Lectures) * 100. It also uses your target percentage to determine safe skips and recovery class counts.",
        },
      },
      {
        "@type": "Question",
        name: "Is Rollcall free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Rollcall is 100% free and open-source under the MIT License with no ads, subscriptions, or hidden charges.",
        },
      },
      {
        "@type": "Question",
        name: "Does Rollcall work offline?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Rollcall uses an embedded SQLite database on your device. It works completely offline without needing an internet connection or sign-up.",
        },
      },
      {
        "@type": "Question",
        name: "Is Rollcall available on Android?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Rollcall is available for Android devices via direct APK download from the official Rollcall website.",
        },
      },
      {
        "@type": "Question",
        name: "Who developed Rollcall?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Rollcall was developed by sumitc0de. You can explore more projects and portfolio details at sumitxdev.online.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
