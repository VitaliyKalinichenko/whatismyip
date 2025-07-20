'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, AlertCircle, Route, Clock } from "lucide-react";

interface TracerouteHop {
  hop: number;
  hostname: string | null;
  ip: string | null;
  rtt1: number | null;
  rtt2: number | null;
  rtt3: number | null;
  avg_rtt: number | null;
}

interface TracerouteResult {
  target: string;
  resolved_ip: string | null;
  hops: TracerouteHop[];
  total_hops: number;
  success: boolean;
  error?: string;
  execution_time: number;
}

export default function TracerouteClient() {
  const [target, setTarget] = useState('');
  const [maxHops, setMaxHops] = useState(30);
  const [timeout, setTimeout] = useState(5);
  const [result, setResult] = useState<TracerouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTraceroute = async () => {
    if (!target.trim()) {
      setError('Please enter a target hostname or IP address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/v1/traceroute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: target.trim(),
          max_hops: maxHops,
          timeout: timeout
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Failed to perform traceroute: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatRTT = (rtt: number | null) => {
    if (rtt === null) return '*';
    return `${rtt.toFixed(2)}ms`;
  };

  const getRTTColor = (rtt: number | null) => {
    if (rtt === null) return 'text-gray-400';
    if (rtt < 50) return 'text-green-600';
    if (rtt < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Traceroute Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Route className="h-5 w-5 text-blue-600" />
            <span>Traceroute</span>
          </CardTitle>
          <CardDescription>
            Trace the network path to a destination and see all intermediate hops
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Host</Label>
                <Input
                  id="target"
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="google.com or 8.8.8.8"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHops">Max Hops</Label>
                <Input
                  id="maxHops"
                  type="number"
                  value={maxHops}
                  onChange={(e) => setMaxHops(parseInt(e.target.value) || 30)}
                  min="1"
                  max="255"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value) || 5)}
                  min="1"
                  max="60"
                  disabled={loading}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleTraceroute} 
              disabled={loading || !target.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running traceroute...
                </>
              ) : (
                <>
                  <Route className="mr-2 h-4 w-4" />
                  Start Traceroute
                </>
              )}
            </Button>
          </div>
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

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-green-600" />
                <span>Traceroute Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Target</Label>
                  <p className="text-lg font-semibold">{result.target}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Resolved IP</Label>
                  <p className="text-lg font-mono">{result.resolved_ip || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Hops</Label>
                  <p className="text-lg font-semibold">{result.total_hops}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Execution Time</Label>
                  <p className="text-lg font-semibold">{result.execution_time.toFixed(2)}s</p>
                </div>
              </div>
              <div className="mt-4">
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? 'Completed' : 'Failed'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Hops Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Network Hops</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Hop</th>
                      <th className="text-left p-2">Hostname</th>
                      <th className="text-left p-2">IP Address</th>
                      <th className="text-left p-2">RTT 1</th>
                      <th className="text-left p-2">RTT 2</th>
                      <th className="text-left p-2">RTT 3</th>
                      <th className="text-left p-2">Avg RTT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.hops.map((hop, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-sm">{hop.hop}</td>
                        <td className="p-2 text-sm">{hop.hostname || '*'}</td>
                        <td className="p-2 font-mono text-sm">{hop.ip || '*'}</td>
                        <td className={`p-2 font-mono text-sm ${getRTTColor(hop.rtt1)}`}>
                          {formatRTT(hop.rtt1)}
                        </td>
                        <td className={`p-2 font-mono text-sm ${getRTTColor(hop.rtt2)}`}>
                          {formatRTT(hop.rtt2)}
                        </td>
                        <td className={`p-2 font-mono text-sm ${getRTTColor(hop.rtt3)}`}>
                          {formatRTT(hop.rtt3)}
                        </td>
                        <td className={`p-2 font-mono text-sm font-semibold ${getRTTColor(hop.avg_rtt)}`}>
                          {formatRTT(hop.avg_rtt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 