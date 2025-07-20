"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface PortCheckResult {
  host: string;
  port: number;
  is_open: boolean;
  service?: string;
  response_time?: number;
}

export default function PortCheckerClient() {
  const [host, setHost] = useState("");
  const [ports, setPorts] = useState("");
  const [results, setResults] = useState<PortCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkPorts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim() || !ports.trim()) return;

    try {
      setLoading(true);
      setError("");
      setResults([]);

      // Parse ports and validate
      const portList = ports.split(',')
        .map(p => parseInt(p.trim()))
        .filter(p => !isNaN(p) && p > 0 && p <= 65535);

      if (portList.length === 0) {
        setError("Please enter valid port numbers (1-65535)");
        return;
      }

      console.log('Making port check request to: /api/v1/port-checker');
      console.log('Request payload:', { host: host.trim(), ports: portList });
      
      const response = await fetch('/api/v1/port-checker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: host.trim(),
          ports: portList
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Port check failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to check ports: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Port check response:', data);
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check ports. Please verify the hostname/IP and port numbers.");
      console.error("Port check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isOpen: boolean) => {
    return isOpen ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (isOpen: boolean) => {
    return (
      <Badge variant={isOpen ? "default" : "destructive"}>
        {isOpen ? "Open" : "Closed"}
      </Badge>
    );
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Port Connectivity Test</span>
          </CardTitle>
          <CardDescription>
            Enter a hostname or IP address and the ports you want to check
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={checkPorts} className="space-y-4">
            <div>
              <Label htmlFor="host-input">Host / IP Address</Label>
              <Input
                id="host-input"
                type="text"
                placeholder="e.g., google.com or 8.8.8.8"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="ports-input">Ports (comma-separated)</Label>
              <Input
                id="ports-input"
                type="text"
                placeholder="e.g., 80,443,22,3389"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Common ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3389 (RDP), 5432 (PostgreSQL)
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
                  Checking Ports...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Check Ports
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Port Check Results</CardTitle>
            <CardDescription>
              Results for {results[0]?.host}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.is_open)}
                    <div>
                      <p className="font-medium">Port {result.port}</p>
                      {result.service && (
                        <p className="text-sm text-muted-foreground">{result.service}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {result.response_time && (
                      <span className="text-sm text-muted-foreground">
                        {result.response_time}ms
                      </span>
                    )}
                    {getStatusBadge(result.is_open)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
} 