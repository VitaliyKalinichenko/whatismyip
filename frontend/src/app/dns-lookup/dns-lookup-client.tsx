"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Globe, AlertCircle } from "lucide-react";

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
}

interface DNSResult {
  domain: string;
  records: DNSRecord[];
}

export default function DNSLookupClient() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState("A");
  const [results, setResults] = useState<DNSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const recordTypes = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA"];

  const lookupDNS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    try {
      setLoading(true);
      setError("");
      setResults(null);

      console.log(`Making DNS request to: /api/v1/dns-lookup?domain=${encodeURIComponent(domain)}&record_types=${recordType}`);
      const response = await fetch(`/api/v1/dns-lookup?domain=${encodeURIComponent(domain)}&record_types=${recordType}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`DNS lookup failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to lookup DNS records: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('DNS lookup response:', data);
      setResults(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to lookup DNS records. Please check the domain name and try again.";
      setError(errorMessage);
      console.error("DNS lookup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRecordTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'A': 'bg-blue-100 text-blue-800',
      'AAAA': 'bg-purple-100 text-purple-800',
      'CNAME': 'bg-green-100 text-green-800',
      'MX': 'bg-orange-100 text-orange-800',
      'NS': 'bg-yellow-100 text-yellow-800',
      'TXT': 'bg-pink-100 text-pink-800',
      'SOA': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>DNS Record Lookup</span>
          </CardTitle>
          <CardDescription>
            Enter a domain name and select the type of DNS record to query
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={lookupDNS} className="space-y-4">
            <div>
              <Label htmlFor="domain-input">Domain Name</Label>
              <Input
                id="domain-input"
                type="text"
                placeholder="e.g., google.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="record-type">Record Type</Label>
              <select
                id="record-type"
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {recordTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                A: IPv4 address, AAAA: IPv6 address, MX: Mail exchange, NS: Name server, TXT: Text records
              </p>
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up DNS...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Lookup DNS Records
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Records for {results.domain}</CardTitle>
            <CardDescription>
              Found {results.records.length} record(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.records.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No DNS records found for the specified domain and record type.
              </p>
            ) : (
              <div className="space-y-3">
                {results.records.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getRecordTypeColor(record.type)}>
                          {record.type}
                        </Badge>
                        <span className="font-medium">{record.name}</span>
                      </div>
                      <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                        {record.value}
                      </p>
                    </div>
                    {record.ttl && (
                      <div className="ml-4 text-right">
                        <p className="text-xs text-muted-foreground">TTL</p>
                        <p className="text-sm font-medium">{record.ttl}s</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
} 