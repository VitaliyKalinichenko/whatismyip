import { generateMetadata, pageMetadata } from "@/lib/metadata";
import EmailBlacklistClient from "./email-blacklist-client";

export const metadata = generateMetadata(pageMetadata.emailBlacklist);

export default function EmailBlacklistPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://whatismyip.com"
      },
      {
        "@type": "ListItem", 
        "position": 2,
        "name": "Tools",
        "item": "https://whatismyip.com/tools"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Email Blacklist Check",
        "item": "https://whatismyip.com/email-blacklist"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {pageMetadata.emailBlacklist.h1}
            </h1>
            <p className="text-xl text-muted-foreground">
              Check if your email domain or IP is blacklisted in spam databases
            </p>
          </div>
          <EmailBlacklistClient />
        </div>
      </div>
    </>
  );
} 