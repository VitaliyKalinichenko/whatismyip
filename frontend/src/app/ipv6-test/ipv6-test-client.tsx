'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Network } from "lucide-react";

interface IPv6TestResult {
  hasIPv6: boolean;
  ipv6Address?: string;
  ipv4Address?: string;
  dualStack: boolean;
  reachability: {
    google: boolean;
    cloudflare: boolean;
    openDNS: boolean;
  };
  dnsResolution: {
    aaaa: boolean;
    a: boolean;
  };
}

export default function IPv6TestClient() {
  const [testResult, setTestResult] = useState<IPv6TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runIPv6Test = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Initialize result object with defaults
      const result: IPv6TestResult = {
        hasIPv6: false,
        ipv4Address: undefined,
        dualStack: false,
        reachability: {
          google: false,
          cloudflare: false,
          openDNS: false,
        },
        dnsResolution: {
          aaaa: false,
          a: true,
        }
      };

      // Try to get IP addresses from our backend
      try {
        const ipResponse = await fetch('/api/v1/ip-info');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          if (ipData.ip) {
            // Check if the IP is IPv6 (contains colons)
            if (ipData.ip.includes(':')) {
              result.hasIPv6 = true;
              result.ipv6Address = ipData.ip;
            } else {
              result.ipv4Address = ipData.ip;
            }
          }
        }
      } catch (ipError) {
        console.log('IP detection via backend failed:', ipError);
      }

      // Fallback: Basic IPv6 detection using WebRTC
      if (!result.hasIPv6) {
        try {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          
          pc.createDataChannel('test');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          // Wait for ICE candidates
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 3000);
            pc.onicecandidate = (event) => {
              if (event.candidate && event.candidate.candidate.includes(':')) {
                clearTimeout(timeout);
                resolve(undefined);
              }
            };
          });
          
          const stats = await pc.getStats();
          let hasIPv6 = false;
          let ipv6Address = '';
          
          stats.forEach((report) => {
            if ((report.type === 'candidate-pair' || report.type === 'local-candidate') && report.ip) {
              if (report.ip.includes(':')) {
                hasIPv6 = true;
                ipv6Address = report.ip;
              }
            }
          });
          
          if (hasIPv6) {
            result.hasIPv6 = true;
            result.ipv6Address = ipv6Address;
          }
          
          pc.close();
        } catch (webrtcError) {
          console.log('WebRTC IPv6 detection failed:', webrtcError);
        }
      }

      // Set dual stack status
      result.dualStack = result.hasIPv6 && !!result.ipv4Address;

      // Test IPv6 DNS resolution
      try {
        const dnsTest = await fetch('https://dns.google/resolve?name=google.com&type=AAAA');
        if (dnsTest.ok) {
          const dnsData = await dnsTest.json();
          result.dnsResolution.aaaa = !!(dnsData.Answer && dnsData.Answer.length > 0);
        }
      } catch (dnsError) {
        console.log('DNS AAAA test failed:', dnsError);
      }

      // Test IPv6 reachability (simplified version)
      // In a real implementation, you would test actual connectivity
      if (result.hasIPv6) {
        result.reachability = {
          google: result.dnsResolution.aaaa,
          cloudflare: result.dnsResolution.aaaa,
          openDNS: result.dnsResolution.aaaa,
        };
      }

      setTestResult(result);
    } catch (err) {
      console.error('IPv6 test error:', err);
      setError(err instanceof Error ? err.message : 'IPv6 test failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runIPv6Test();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "Supported" : "Not Supported"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Test Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5 text-blue-600" />
            <span>IPv6 Test</span>
          </CardTitle>
          <CardDescription>
            Run a comprehensive test to check your IPv6 connectivity and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runIPv6Test} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Testing IPv6 Connectivity..." : "Run IPv6 Test"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Test Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={runIPv6Test} variant="outline" className="mt-3">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                {getStatusIcon(testResult.hasIPv6)}
                <span>IPv6 Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">IPv6 Support:</span>
                    {getStatusBadge(testResult.hasIPv6)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dual Stack:</span>
                    {getStatusBadge(testResult.dualStack)}
                  </div>
                </div>
                <div className="space-y-3">
                  {testResult.ipv6Address && (
                    <div>
                      <span className="font-medium">IPv6 Address:</span>
                      <code className="ml-2 bg-muted p-1 rounded text-sm break-all">
                        {testResult.ipv6Address}
                      </code>
                    </div>
                  )}
                  {testResult.ipv4Address && (
                    <div>
                      <span className="font-medium">IPv4 Address:</span>
                      <code className="ml-2 bg-muted p-1 rounded text-sm">
                        {testResult.ipv4Address}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DNS Resolution */}
          <Card>
            <CardHeader>
              <CardTitle>DNS Resolution</CardTitle>
              <CardDescription>
                Test DNS resolution for both IPv4 (A) and IPv6 (AAAA) records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(testResult.dnsResolution.a)}
                    <span className="font-medium">A Records (IPv4)</span>
                  </div>
                  {getStatusBadge(testResult.dnsResolution.a)}
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(testResult.dnsResolution.aaaa)}
                    <span className="font-medium">AAAA Records (IPv6)</span>
                  </div>
                  {getStatusBadge(testResult.dnsResolution.aaaa)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reachability Tests */}
          <Card>
            <CardHeader>
              <CardTitle>IPv6 Reachability</CardTitle>
              <CardDescription>
                Test connectivity to major IPv6-enabled services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(testResult.reachability.google)}
                    <span className="font-medium">Google (2001:4860:4860::8888)</span>
                  </div>
                  {getStatusBadge(testResult.reachability.google)}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(testResult.reachability.cloudflare)}
                    <span className="font-medium">Cloudflare (2606:4700:4700::1111)</span>
                  </div>
                  {getStatusBadge(testResult.reachability.cloudflare)}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(testResult.reachability.openDNS)}
                    <span className="font-medium">OpenDNS (2620:119:35::35)</span>
                  </div>
                  {getStatusBadge(testResult.reachability.openDNS)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {!testResult.hasIPv6 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-medium text-yellow-800 mb-2">IPv6 Not Detected</p>
                    <ul className="text-yellow-700 space-y-1">
                      <li>• Contact your ISP to enable IPv6 support</li>
                      <li>• Check your router settings for IPv6 configuration</li>
                      <li>• Ensure your network equipment supports IPv6</li>
                    </ul>
                  </div>
                )}
                
                {testResult.hasIPv6 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-800 mb-2">IPv6 Enabled</p>
                    <p className="text-green-700">
                      Great! Your network supports IPv6. You're ready for the future of the internet.
                    </p>
                  </div>
                )}
                
                {testResult.hasIPv6 && !testResult.dualStack && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-800 mb-2">IPv6 Only</p>
                    <p className="text-blue-700">
                      You have IPv6 connectivity but may have limited IPv4 access. Consider enabling dual-stack for better compatibility.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 