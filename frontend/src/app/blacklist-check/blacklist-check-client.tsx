"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface BlacklistResult {
  ip: string;
  is_blacklisted: boolean;
  total_lists: number;
  blacklisted_on: string[];
  clean_on: string[];
  details: {
    [key: string]: {
      listed: boolean;
      response_time: number;
      error?: string;
    };
  };
}

export default function BlacklistCheckClient() {
  const [ipAddress, setIpAddress] = useState("");
  const [results, setResults] = useState<BlacklistResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress.trim()) return;

    try {
      setLoading(true);
      setError("");
      setResults(null);

      const response = await fetch(`/api/v1/blacklist-check?ip=${encodeURIComponent(ipAddress.trim())}`);
      if (!response.ok) {
        throw new Error('Failed to check blacklist status');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError("Failed to check blacklist status. Please check the IP address and try again.");
      console.error("Blacklist check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isBlacklisted: boolean) => {
    return isBlacklisted ? (
      <XCircle className="h-5 w-5 text-red-600" />
    ) : (
      <CheckCircle className="h-5 w-5 text-green-600" />
    );
  };

  const getStatusBadge = (isBlacklisted: boolean) => {
    return (
      <Badge variant={isBlacklisted ? "destructive" : "default"}>
        {isBlacklisted ? "Blacklisted" : "Clean"}
      </Badge>
    );
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>IP Blacklist Checker</span>
          </CardTitle>
          <CardDescription>
            Enter an IP address to check against multiple security and spam blacklists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={checkBlacklist} className="space-y-4">
            <div>
              <Label htmlFor="ip-input">IP Address</Label>
              <Input
                id="ip-input"
                type="text"
                placeholder="e.g., 8.8.8.8"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only IPv4 addresses are supported
              </p>
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Blacklists...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Check Blacklists
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(!results.is_blacklisted)}
                <span>Overall Status for {results.ip}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{results.total_lists}</p>
                  <p className="text-sm text-muted-foreground">Total Lists Checked</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{results.blacklisted_on.length}</p>
                  <p className="text-sm text-muted-foreground">Blacklisted On</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{results.clean_on.length}</p>
                  <p className="text-sm text-muted-foreground">Clean On</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                {getStatusBadge(results.is_blacklisted)}
              </div>
            </CardContent>
          </Card>

          {/* Blacklisted Lists */}
          {results.blacklisted_on.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Blacklisted On ({results.blacklisted_on.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.blacklisted_on.map((list, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
                    >
                      <span className="font-medium">{list}</span>
                      <Badge variant="destructive">Listed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clean Lists */}
          {results.clean_on.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Clean On ({results.clean_on.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.clean_on.map((list, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50"
                    >
                      <span className="font-medium text-sm">{list}</span>
                      <Badge className="bg-green-100 text-green-800">Clean</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(results.details).map(([list, detail], index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{list}</span>
                      {detail.error && (
                        <p className="text-xs text-red-600 mt-1">{detail.error}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {detail.response_time}ms
                      </span>
                      {detail.listed ? (
                        <Badge variant="destructive">Listed</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Clean</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
} 