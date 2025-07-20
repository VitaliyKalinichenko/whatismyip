'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function DebugPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Direct backend call
      logger.debug('Testing direct backend call');
      const directResponse = await fetch('http://localhost:8000/api/v1/ip-info');
      testResults.direct = {
        status: directResponse.status,
        ok: directResponse.ok,
        data: directResponse.ok ? await directResponse.json() : await directResponse.text()
      };
    } catch (error) {
      testResults.direct = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test 2: Proxy call
      logger.debug('Testing proxy call');
      const proxyResponse = await fetch('/api/v1/ip-info');
      testResults.proxy = {
        status: proxyResponse.status,
        ok: proxyResponse.ok,
        data: proxyResponse.ok ? await proxyResponse.json() : await proxyResponse.text()
      };
    } catch (error) {
      testResults.proxy = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test 3: Health check
      logger.debug('Testing health check');
      const healthResponse = await fetch('http://localhost:8000/health');
      testResults.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: healthResponse.ok ? await healthResponse.json() : await healthResponse.text()
      };
    } catch (error) {
      testResults.health = { error: error instanceof Error ? error.message : String(error) };
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <button 
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Direct Backend Call (http://localhost:8000/api/v1/ip-info)</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(results.direct, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Proxy Call (/api/v1/ip-info)</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(results.proxy, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Health Check (http://localhost:8000/health)</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(results.health, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 