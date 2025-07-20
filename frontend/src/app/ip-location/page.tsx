import { generateMetadata, pageMetadata } from "@/lib/metadata";
import { IPLocationClient } from "./ip-location-client";

export const metadata = generateMetadata(pageMetadata.ipLocation);

export default function IPLocationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{pageMetadata.ipLocation.h1}</h1>
          <p className="text-xl text-muted-foreground">
            Lookup the geographic location of your IP address. Find city, region, country, timezone.
          </p>
        </div>
        <IPLocationClient />
      </div>
    </div>
  );
} 