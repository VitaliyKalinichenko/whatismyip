'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BlacklistResult {
  found_in: string[];
  not_found_in: string[];
}

interface EmailBlacklistResult {
  email: string;
  domain: string;
  risk_score: number;
  status: string;
  blacklist_results: BlacklistResult;
  mx_valid: boolean;
  mx_records: string[];
  analysis: {
    reputation: string;
    recommendation: string;
    risk_factors: string[];
  };
  execution_time: number;
}

export default function EmailBlacklistClient() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<EmailBlacklistResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/v1/email-blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during email blacklist check');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'safe': 'default',
      'caution': 'secondary',
      'risky': 'destructive',
      'blocked': 'destructive'
    };
    
    return (
      <Badge variant={variants[status.toLowerCase()] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getReputationBadge = (reputation: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'excellent': 'default',
      'good': 'default',
      'neutral': 'secondary',
      'poor': 'destructive',
      'bad': 'destructive'
    };
    
    return (
      <Badge variant={variants[reputation.toLowerCase()] || 'outline'}>
        {reputation}
      </Badge>
    );
  };

  const getRiskColor = (score: number): string => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskDescription = (score: number): string => {
    if (score <= 25) return 'Low Risk';
    if (score <= 50) return 'Moderate Risk';
    if (score <= 75) return 'High Risk';
    return 'Very High Risk';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Domain Reputation Check</CardTitle>
          <CardDescription>
            Enter an email address to check its domain reputation across multiple blacklists
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleCheck()}
            />
          </div>
          
          <Button 
            onClick={handleCheck} 
            disabled={loading || !email.trim()}
            className="w-full"
          >
            {loading ? 'Checking Email Reputation...' : 'Check Email Reputation'}
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Risk Score Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Risk Assessment</CardTitle>
                {getStatusBadge(result.status)}
              </div>
              <CardDescription>
                Analysis for {result.email} • Domain: {result.domain}
                {result.execution_time && ` • Completed in ${result.execution_time.toFixed(2)}s`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className={`text-sm font-bold ${getRiskColor(result.risk_score)}`}>
                    {result.risk_score}/100 - {getRiskDescription(result.risk_score)}
                  </span>
                </div>
                <Progress 
                  value={result.risk_score} 
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Domain Reputation: </span>
                  {getReputationBadge(result.analysis.reputation)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">MX Valid: </span>
                  <Badge variant={result.mx_valid ? "default" : "destructive"}>
                    {result.mx_valid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Recommendation: </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.analysis.recommendation}
                </p>
              </div>

              {result.analysis.risk_factors.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Risk Factors:</span>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {result.analysis.risk_factors.map((factor, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blacklist Results */}
          <Card>
            <CardHeader>
              <CardTitle>Blacklist Check Results</CardTitle>
              <CardDescription>
                Results from checking {result.blacklist_results.found_in.length + result.blacklist_results.not_found_in.length} blacklist databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Found in blacklists */}
                <div>
                  <h4 className="font-medium text-red-600 mb-3">
                    Found in {result.blacklist_results.found_in.length} blacklist(s)
                  </h4>
                  {result.blacklist_results.found_in.length > 0 ? (
                    <div className="space-y-2">
                      {result.blacklist_results.found_in.map((blacklist, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-mono">{blacklist}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not found in any blacklists</p>
                  )}
                </div>

                {/* Clean results */}
                <div>
                  <h4 className="font-medium text-green-600 mb-3">
                    Clean in {result.blacklist_results.not_found_in.length} database(s)
                  </h4>
                  {result.blacklist_results.not_found_in.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {result.blacklist_results.not_found_in.map((blacklist, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-mono">{blacklist}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No clean results available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MX Records */}
          {result.mx_records && result.mx_records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>MX Records</CardTitle>
                <CardDescription>
                  Mail exchange records for {result.domain}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.mx_records.map((mx, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-mono">{mx}</span>
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