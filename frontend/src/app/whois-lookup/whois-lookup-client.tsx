"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Network, Loader2, Calendar, Globe, AlertCircle } from "lucide-react";

interface WhoisInfo {
  domain: string;
  registrar: string;
  creation_date: string;
  expiration_date: string;
  updated_date: string;
  status: string[];
  name_servers: string[];
  registrant_org?: string;
  registrant_country?: string;
  admin_email?: string;
  raw_data?: string;
}

export default function WhoisLookupClient() {
  const [domain, setDomain] = useState("");
  const [whoisInfo, setWhoisInfo] = useState<WhoisInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookupWhois = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    try {
      setLoading(true);
      setError("");
      setWhoisInfo(null);

      const response = await fetch(`/api/v1/whois?domain=${encodeURIComponent(domain.trim())}`);
      if (!response.ok) {
        throw new Error('Failed to lookup WHOIS information');
      }

      const data = await response.json();
      setWhoisInfo(data);
    } catch (err) {
      setError("Failed to lookup WHOIS information. Please check the domain name and try again.");
      console.error("WHOIS lookup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* WHOIS Lookup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5 text-blue-600" />
            <span>WHOIS Lookup</span>
          </CardTitle>
          <CardDescription>
            Enter a domain name to lookup WHOIS information including registrar, creation date, expiration date, and name servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={lookupWhois} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !domain.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up WHOIS...
                </>
              ) : (
                <>
                  <Network className="mr-2 h-4 w-4" />
                  Lookup WHOIS
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WHOIS Results */}
      {whoisInfo && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-600" />
                <span>WHOIS Information for {whoisInfo.domain}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registrar</Label>
                  <p className="text-sm text-muted-foreground">{whoisInfo.registrar || 'Not available'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registrant Organization</Label>
                  <p className="text-sm text-muted-foreground">{whoisInfo.registrant_org || 'Not available'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Creation Date</Label>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {whoisInfo.creation_date ? formatDate(whoisInfo.creation_date) : 'Not available'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expiration Date</Label>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {whoisInfo.expiration_date ? formatDate(whoisInfo.expiration_date) : 'Not available'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Updated Date</Label>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {whoisInfo.updated_date ? formatDate(whoisInfo.updated_date) : 'Not available'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registrant Country</Label>
                  <p className="text-sm text-muted-foreground">{whoisInfo.registrant_country || 'Not available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain Status */}
          {whoisInfo.status && whoisInfo.status.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Domain Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {whoisInfo.status.map((status, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm dark:bg-blue-900 dark:text-blue-200"
                    >
                      {status}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Name Servers */}
          {whoisInfo.name_servers && whoisInfo.name_servers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Name Servers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {whoisInfo.name_servers.map((ns, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Network className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-mono">{ns}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 