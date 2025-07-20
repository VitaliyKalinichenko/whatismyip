# SEO Fix Template for Remaining Pages

## For each client component page, follow this pattern:

### 1. Convert Client Component to Server Component

```tsx
// BEFORE (❌ Client Component):
"use client";
export default function SomeToolPage() {
  // component code...
}

// AFTER (✅ Server Component):
import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import SomeToolClient from './some-tool-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.TOOL_NAME);

export default function SomeToolPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* SEO H1 Tag */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
        {pageMetadata.TOOL_NAME.h1}
      </h1>
      
      {/* Client-side interactive component */}
      <SomeToolClient />
    </div>
  );
}
```

### 2. Create Client Component for Interactive Parts

```tsx
// Create: some-tool-client.tsx
"use client";

import { useState, useEffect } from "react";
// ... other imports

export default function SomeToolClient() {
  // Move all interactive functionality here
  return (
    <>
      {/* All the original interactive UI */}
    </>
  );
}
```

### 3. Update pageMetadata Mapping

Make sure each page uses the correct metadata key:

```tsx
// For each tool, use the correct key from metadata.ts:
pageMetadata.speedTest     // /speedtest
pageMetadata.whoisLookup   // /whois-lookup  
pageMetadata.traceroute    // /traceroute
pageMetadata.tools         // /tools
pageMetadata.blacklistCheck // /blacklist-check
pageMetadata.pingTest      // /ping-test
pageMetadata.emailBlacklist // /email-blacklist
pageMetadata.dnsLookup     // /dns-lookup
pageMetadata.ipv6Test      // /ipv6-test
```

## Quick Commands to Test SEO

```bash
# 1. Start both servers
powershell -ExecutionPolicy Bypass -File start-backend.ps1
powershell -ExecutionPolicy Bypass -File start-frontend.ps1

# 2. Test metadata in browser dev tools:
# - Check <title> tag
# - Check <meta name="description"> tag  
# - Check OpenGraph tags
# - Check structured data

# 3. Test sitemap
# Visit: http://localhost:3000/sitemap.xml

# 4. Test robots.txt  
# Visit: http://localhost:3000/robots.txt
```

## SEO Validation Tools

Once deployed:
- **Google PageSpeed Insights**: https://pagespeed.web.dev/
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Open Graph Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator 