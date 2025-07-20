import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Book, ExternalLink, Copy } from "lucide-react";
import Link from "next/link";

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.api);

export default function APIPage() {
  const apiSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "name": "WhatIsMyIP API Documentation",
    "description": "RESTful API documentation for IP lookup, DNS lookup, port checking, whois lookup, and blacklist checking",
    "url": "https://whatismyip.com/api",
    "author": {
      "@type": "Organization",
      "name": "WhatIsMyIP"
    },
    "about": {
      "@type": "SoftwareApplication",
      "name": "WhatIsMyIP API",
      "applicationCategory": "NetworkingApplication"
    }
  };

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/ip-info",
      description: "Get detailed IP address information including geolocation and ISP details",
      parameters: [
        { name: "ip", type: "string", required: false, description: "IP address to lookup (optional, defaults to client IP)" }
      ],
      example: `curl "http://localhost:8000/api/v1/ip-info?ip=8.8.8.8"`
    },
    {
      method: "POST",
      path: "/api/v1/port-check",
      description: "Check if specific ports are open on a host",
      requestBody: {
        host: "string (required)",
        ports: "array of integers (required)"
      },
      example: `curl -X POST "http://localhost:8000/api/v1/port-check" \\
  -H "Content-Type: application/json" \\
  -d '{"host": "google.com", "ports": [80, 443]}'`
    },
    {
      method: "GET",
      path: "/api/v1/dns-lookup",
      description: "Query DNS records for a domain",
      parameters: [
        { name: "domain", type: "string", required: true, description: "Domain name to lookup" },
        { name: "type", type: "string", required: false, description: "DNS record type (A, AAAA, MX, NS, TXT, SOA)" }
      ],
      example: `curl "http://localhost:8000/api/v1/dns-lookup?domain=google.com&type=A"`
    },
    {
      method: "GET",
      path: "/api/v1/whois-lookup",
      description: "Get WHOIS information for a domain",
      parameters: [
        { name: "domain", type: "string", required: true, description: "Domain name to lookup" }
      ],
      example: `curl "http://localhost:8000/api/v1/whois-lookup?domain=google.com"`
    },
    {
      method: "GET",
      path: "/api/v1/blacklist-check",
      description: "Check if an IP address is listed on security blacklists",
      parameters: [
        { name: "ip", type: "string", required: true, description: "IP address to check" }
      ],
      example: `curl "http://localhost:8000/api/v1/blacklist-check?ip=8.8.8.8"`
    },
    {
      method: "POST",
      path: "/api/v1/speed-test",
      description: "Run an internet speed test",
      requestBody: "No request body required",
      example: `curl -X POST "http://localhost:8000/api/v1/speed-test"`
    },
    {
      method: "POST",
      path: "/api/v1/ping-test",
      description: "Run a ping test to check network connectivity",
      requestBody: {
        host: "string (required)",
        count: "integer (optional, default: 4)"
      },
      example: `curl -X POST "http://localhost:8000/api/v1/ping-test" \\
  -H "Content-Type: application/json" \\
  -d '{"host": "google.com", "count": 4}'`
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-100 text-green-800";
      case "POST": return "bg-blue-100 text-blue-800";
      case "PUT": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(apiSchema),
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            {/* SEO H1 Tag */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{pageMetadata.api.h1}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              RESTful API for networking tools and IP address utilities. 
              All endpoints return JSON responses.
            </p>
          </div>

          {/* API Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Book className="h-5 w-5 text-blue-600" />
                  <span>Base URL</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="bg-muted p-2 rounded block">
                  http://localhost:8000
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  All API endpoints are prefixed with <code>/api/v1</code>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5 text-green-600" />
                  <span>Interactive Docs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href="http://localhost:8000/docs" 
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 w-full"
                >
                  Open Swagger UI
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
                <p className="text-sm text-muted-foreground mt-2">
                  Try out the API interactively with Swagger UI
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Endpoints */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">API Endpoints</h2>
            
            {endpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Parameters */}
                  {endpoint.parameters && (
                    <div>
                      <h4 className="font-semibold mb-2">Parameters</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Name</th>
                              <th className="text-left p-2">Type</th>
                              <th className="text-left p-2">Required</th>
                              <th className="text-left p-2">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.parameters.map((param, paramIndex) => (
                              <tr key={paramIndex} className="border-b">
                                <td className="p-2 font-mono">{param.name}</td>
                                <td className="p-2">{param.type}</td>
                                <td className="p-2">
                                  <Badge variant={param.required ? "destructive" : "secondary"}>
                                    {param.required ? "Required" : "Optional"}
                                  </Badge>
                                </td>
                                <td className="p-2">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {endpoint.requestBody && typeof endpoint.requestBody === 'object' && (
                    <div>
                      <h4 className="font-semibold mb-2">Request Body</h4>
                      <div className="bg-muted p-3 rounded">
                        <pre className="text-sm">
                          {JSON.stringify(endpoint.requestBody, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Example */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Example</h4>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <pre className="text-sm overflow-x-auto">
                        <code>{endpoint.example}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rate Limiting and Authentication */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Currently no rate limiting is enforced. Please use the API responsibly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No authentication required. All endpoints are publicly accessible.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Error Responses */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Error Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">All errors return JSON responses with the following structure:</p>
                <div className="bg-muted p-3 rounded">
                  <pre className="text-sm">
{`{
  "detail": "Error message description",
  "status_code": 400
}`}
                  </pre>
                </div>
                <div className="mt-4">
                  <h5 className="font-semibold mb-2">Common HTTP Status Codes:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>200</strong> - Success</li>
                    <li><strong>400</strong> - Bad Request (invalid parameters)</li>
                    <li><strong>404</strong> - Not Found</li>
                    <li><strong>422</strong> - Validation Error</li>
                    <li><strong>500</strong> - Internal Server Error</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
} 