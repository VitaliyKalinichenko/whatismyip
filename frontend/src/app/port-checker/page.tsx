import { generateMetadata, pageMetadata } from "@/lib/metadata";
import PortCheckerClient from "./port-checker-client";

export const metadata = generateMetadata(pageMetadata.portChecker);

export default function PortCheckerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {pageMetadata.portChecker.h1}
            </h1>
            <p className="text-xl text-muted-foreground">
              Check open TCP ports on your public IP or domain. Test port connectivity and identify available services.
            </p>
          </div>
          <PortCheckerClient />
        </div>
      </div>
  );
} 