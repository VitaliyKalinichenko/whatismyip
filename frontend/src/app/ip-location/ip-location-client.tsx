"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Search } from "lucide-react";

interface LocationInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  isp: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  flag?: string;
}

export function IPLocationClient() {
  const [ipAddress, setIpAddress] = useState("");
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookupLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress.trim()) {
      setError("Please enter an IP address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/v1/ip-info?ip=${encodeURIComponent(ipAddress.trim())}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.ip) {
        throw new Error("Invalid response from server");
      }
      
      setLocationInfo(data);
    } catch (err) {
      console.error("Location lookup error:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to lookup IP location. Please check the IP address and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const validateIPAddress = (ip: string) => {
    // Basic IP validation regex (both IPv4 and IPv6)
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIpAddress(value);
    
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Lookup IP Location</span>
          </CardTitle>
          <CardDescription>
            Enter an IP address to get its geographic location and ISP information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={lookupLocation} className="space-y-4">
            <div>
              <Label htmlFor="ip-input">IP Address</Label>
              <Input
                id="ip-input"
                type="text"
                placeholder="e.g., 8.8.8.8 or 2001:4860:4860::8888"
                value={ipAddress}
                onChange={handleInputChange}
                className="mt-1"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" disabled={loading || !ipAddress.trim()} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Lookup Location
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {locationInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Location Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">IP Address</Label>
                  <p className="text-lg font-mono">{locationInfo.ip}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-lg">
                    {locationInfo.flag && `${locationInfo.flag} `}
                    {locationInfo.city}
                    {locationInfo.region && `, ${locationInfo.region}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{locationInfo.country}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ISP</Label>
                  <p className="text-lg">{locationInfo.isp || "Unknown"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Country Code</Label>
                  <p className="text-lg">{locationInfo.country_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Timezone</Label>
                  <p className="text-lg">{locationInfo.timezone || "Unknown"}</p>
                </div>
                {locationInfo.latitude && locationInfo.longitude && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Coordinates</Label>
                    <p className="text-lg">{locationInfo.latitude}, {locationInfo.longitude}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
} 