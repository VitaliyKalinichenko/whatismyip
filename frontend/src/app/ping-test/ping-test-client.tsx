"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wifi, Loader2, CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react";

interface PingResult {
  host: string;
  target_ip?: string;
  packets_sent: number;
  packets_received: number;
  packet_loss: number;
  min_time: number;
  max_time: number;
  avg_time: number;
  timestamps: string[];
  success: boolean;
}

export default function PingTestClient() {
  const [host, setHost] = useState("");
  const [count, setCount] = useState("4");
  const [results, setResults] = useState<PingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runPingTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim()) {
      setError("Please enter a hostname or IP address");
      return;
    }

    const packetCount = parseInt(count) || 4;
    if (packetCount < 1 || packetCount > 20) {
      setError("Number of packets must be between 1 and 20");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResults(null);

      // Use relative URL - Next.js rewrites will proxy to backend
      const apiUrl = '/api/v1/ping-test';
      console.log('Making ping request to:', apiUrl);
      console.log('Request payload:', { host: host.trim(), count: packetCount });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: host.trim(),
          count: packetCount
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ping test failed: ${response.status} - ${errorText}`);
        
        // Try to parse error as JSON for better error messages
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || errorText);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Ping test response:', data);
      
      // Validate response structure
      if (!data || typeof data.success !== 'boolean') {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response from server");
      }
      
      setResults(data);
    } catch (err) {
      console.error("Ping test error:", err);
      
      // Better error handling
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else {
        setError(
          err instanceof Error 
            ? err.message 
            : "Failed to run ping test. Please check the hostname/IP and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getPacketLossColor = (loss: number) => {
    if (loss === 0) return "text-green-600";
    if (loss < 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-green-600";
    if (latency < 150) return "text-yellow-600";
    return "text-red-600";
  };

  const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHost(e.target.value);
    if (error) {
      setError("");
    }
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCount(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            <span>Network Ping Test</span>
          </CardTitle>
          <CardDescription>
            Enter a hostname or IP address to test network connectivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={runPingTest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host-input">Host / IP Address</Label>
                <Input
                  id="host-input"
                  type="text"
                  placeholder="e.g., google.com or 8.8.8.8"
                  value={host}
                  onChange={handleHostChange}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="count-input">Number of Packets</Label>
                <Input
                  id="count-input"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="4"
                  value={count}
                  onChange={handleCountChange}
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                API URL: /api/v1/ping-test (proxied to backend)
                <br />
                Backend: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </div>
            )}
            
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={loading || !host.trim()} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Ping Test...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Start Ping Test
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {results.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>Ping Results for {results.host}</span>
                {results.target_ip && results.target_ip !== results.host && (
                  <span className="text-sm text-muted-foreground">({results.target_ip})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{results.packets_sent}</p>
                  <p className="text-sm text-muted-foreground">Packets Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{results.packets_received}</p>
                  <p className="text-sm text-muted-foreground">Packets Received</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getPacketLossColor(results.packet_loss)}`}>
                    {results.packet_loss}%
                  </p>
                  <p className="text-sm text-muted-foreground">Packet Loss</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getLatencyColor(results.avg_time)}`}>
                    {results.avg_time.toFixed(1)}ms
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stats */}
          {results.packets_received > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Latency Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Minimum</span>
                    <Badge variant="outline">{results.min_time.toFixed(1)}ms</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Maximum</span>
                    <Badge variant="outline">{results.max_time.toFixed(1)}ms</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Average</span>
                    <Badge variant="outline">{results.avg_time.toFixed(1)}ms</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Ping Results */}
          {results.timestamps && results.timestamps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Individual Ping Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.timestamps.map((time, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 border rounded ${
                        time === 'timeout' || time === 'error' 
                          ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' 
                          : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      }`}
                    >
                      <span>Packet {index + 1}</span>
                      <span className={`font-mono ${
                        time === 'timeout' || time === 'error' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
