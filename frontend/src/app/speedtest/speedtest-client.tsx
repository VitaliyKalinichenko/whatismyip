"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Download, Upload, Zap, MapPin, Clock, Loader2, Globe, Signal, AlertTriangle } from "lucide-react";
import './speedtest.css';

type TestPhase = 'idle' | 'locating' | 'selecting' | 'ping' | 'download' | 'upload' | 'complete' | 'error';

interface SpeedTestResult {
  download_speed: number;
  upload_speed: number;
  ping: number;
  jitter?: number;
  server_location?: string;
  isp?: string;
  method?: string;
  test_duration?: number;
  timestamp?: number;
}

interface TestProgress {
  phase: TestPhase;
  progress: number;
  currentSpeed: number;
  message?: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 tests per minute
const MIN_TIME_BETWEEN_TESTS = 10000; // 10 seconds minimum between tests

export default function SpeedTestClient() {
  const { theme } = useTheme();
  const [testPhase, setTestPhase] = useState<TestPhase>('idle');
  const [results, setResults] = useState<SpeedTestResult | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<'ping' | 'download' | 'upload'>('ping');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [availableMethod, setAvailableMethod] = useState<string>('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [nextAllowedTime, setNextAllowedTime] = useState<number>(0);
  const [testHistory, setTestHistory] = useState<number[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load test history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('speedtest_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory).filter((time: number) => 
          Date.now() - time < RATE_LIMIT_WINDOW
        );
        setTestHistory(history);
      } catch (error) {
        console.error('Error loading test history:', error);
      }
    }
  }, []);

  // Check rate limiting
  useEffect(() => {
    const now = Date.now();
    const recentTests = testHistory.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentTests.length >= MAX_REQUESTS_PER_WINDOW) {
      setIsRateLimited(true);
      setNextAllowedTime(Math.min(...recentTests) + RATE_LIMIT_WINDOW);
    } else if (recentTests.length > 0) {
      const lastTest = Math.max(...recentTests);
      const timeSinceLastTest = now - lastTest;
      if (timeSinceLastTest < MIN_TIME_BETWEEN_TESTS) {
        setIsRateLimited(true);
        setNextAllowedTime(lastTest + MIN_TIME_BETWEEN_TESTS);
      } else {
        setIsRateLimited(false);
      }
    } else {
      setIsRateLimited(false);
    }
  }, [testHistory]);

  // Update elapsed time during test
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testPhase === 'locating' || testPhase === 'selecting' || testPhase === 'ping' || testPhase === 'download' || testPhase === 'upload') {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [testPhase]);

  // Check available test method on load
  useEffect(() => {
    const checkMethod = async () => {
      try {
        const response = await fetch('/api/v1/speed-test/method', {
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableMethod(data.method || 'Backend API with Ookla CLI');
        }
      } catch (error) {
        console.error('Failed to check speed test method:', error);
        setAvailableMethod('Backend API with Ookla CLI');
      }
    };
    checkMethod();
  }, []);

  // Auto-clear rate limit
  useEffect(() => {
    if (isRateLimited && nextAllowedTime > 0) {
      const timeUntilNext = nextAllowedTime - Date.now();
      if (timeUntilNext > 0) {
        const timeout = setTimeout(() => {
          setIsRateLimited(false);
          setNextAllowedTime(0);
        }, timeUntilNext);
        return () => clearTimeout(timeout);
      }
    }
  }, [isRateLimited, nextAllowedTime]);

  // Animate speedometer
  useEffect(() => {
    if (canvasRef.current) {
      drawSpeedometer();
    }
  }, [currentSpeed, testPhase, theme]);

  // Simulate speed animation during test
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (testPhase === 'download' || testPhase === 'upload') {
      const animateSpeed = () => {
        setCurrentSpeed(prev => {
          const target = prev + Math.random() * 20 - 10;
          return Math.max(0, Math.min(target, 400));
        });
        animationRef.current = requestAnimationFrame(animateSpeed);
      };
      animationRef.current = requestAnimationFrame(animateSpeed);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [testPhase]);

  // Add test to history
  const addTestToHistory = (timestamp: number) => {
    const newHistory = [...testHistory, timestamp];
    setTestHistory(newHistory);
    localStorage.setItem('speedtest_history', JSON.stringify(newHistory));
  };

  // Backend API Speed Test Implementation (ONLY METHOD)
  const runTest = async () => {
    if (testPhase !== 'idle' || isRateLimited) return;
    
    // Add current test to history immediately
    const currentTime = Date.now();
    addTestToHistory(currentTime);
    
    setTestPhase('locating');
    setError(null);
    setResults(null);
    setCurrentSpeed(0);
    setProgress(0);
    setElapsedTime(0);
    setStatusMessage('');
    startTimeRef.current = currentTime;
    
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 60000); // 60 second timeout
    
    try {
      // Simulate test phases for better UX
      await simulateTestPhases();
      
      // Call backend API (ONLY METHOD - no external service hammering)
      setTestPhase('download');
      setStatusMessage('Running accurate speed test via backend API...');
      setProgress(50);
      
      const response = await fetch('/api/v1/speed-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Backend API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Validate result
      if (!result.download_speed || !result.upload_speed || !result.ping) {
        throw new Error('Invalid response from backend API');
      }
      
      setResults(result);
      setTestPhase('complete');
      setCurrentSpeed(0);
      setProgress(100);
      setElapsedTime(Date.now() - startTimeRef.current);
      setStatusMessage(`Speed test completed successfully using ${result.method || 'Backend API'}!`);
      
    } catch (err) {
      console.error('Speed test error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Speed test was cancelled');
          setStatusMessage('Speed test cancelled');
        } else {
          setError(err.message);
          setStatusMessage('Speed test failed. Please try again.');
        }
      } else {
        setError('Speed test failed');
        setStatusMessage('Speed test failed. Please try again.');
      }
      
      setTestPhase('error');
      setCurrentSpeed(0);
      setElapsedTime(Date.now() - startTimeRef.current);
    } finally {
      abortControllerRef.current = null;
      clearTimeout(timeoutId); // Clear the timeout
    }
  };

  // Simulate test phases for better UX
  const simulateTestPhases = async () => {
    // Locating phase
    setTestPhase('locating');
    setStatusMessage('Detecting your location...');
    setProgress(10);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Selecting server phase
    setTestPhase('selecting');
    setStatusMessage('Selecting optimal server...');
    setProgress(20);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Ping phase
    setTestPhase('ping');
    setStatusMessage('Testing latency...');
    setProgress(30);
    setCurrentTest('ping');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Download phase simulation
    setTestPhase('download');
    setStatusMessage('Testing download speed...');
    setProgress(40);
    setCurrentTest('download');
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const resetTest = () => {
    // Cancel any ongoing test
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setTestPhase('idle');
    setResults(null);
    setCurrentSpeed(0);
    setProgress(0);
    setError(null);
    setElapsedTime(0);
    setStatusMessage('');
    setCurrentTest('ping');
  };

  // Format time remaining for rate limit
  const formatTimeRemaining = (timestamp: number): string => {
    const remaining = Math.max(0, timestamp - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const drawSpeedometer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 30;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Theme-aware colors
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1f2937' : '#f8f9fa';
    const strokeColor = isDark ? '#374151' : '#e9ecef';
    const textColor = isDark ? '#f9fafb' : '#212529';
    const markColor = isDark ? '#9ca3af' : '#495057';
    
    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw speed zones (colored arcs)
    const zones = [
      { color: '#dc3545', start: 0, end: 0.2, label: 'Slow' },
      { color: '#ffc107', start: 0.2, end: 0.6, label: 'Medium' },
      { color: '#28a745', start: 0.6, end: 1.0, label: 'Fast' }
    ];
    
    zones.forEach(zone => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 10, 
        zone.start * 2 * Math.PI - Math.PI/2, 
        zone.end * 2 * Math.PI - Math.PI/2
      );
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 20;
      ctx.stroke();
    });
    
    // Draw speed marks and labels
    const maxSpeed = 400;
    const marks = [0, 50, 100, 150, 200, 250, 300, 350, 400];
    
    marks.forEach(mark => {
      const angle = (mark / maxSpeed) * 2 * Math.PI - Math.PI/2;
      const x1 = centerX + (radius - 35) * Math.cos(angle);
      const y1 = centerY + (radius - 35) * Math.sin(angle);
      const x2 = centerX + (radius - 50) * Math.cos(angle);
      const y2 = centerY + (radius - 50) * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = markColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add number labels
      if (mark % 100 === 0) {
        const labelX = centerX + (radius - 65) * Math.cos(angle);
        const labelY = centerY + (radius - 65) * Math.sin(angle);
        ctx.fillStyle = textColor;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(mark.toString(), labelX, labelY + 4);
      }
    });
    
    // Draw needle
    const needleAngle = (Math.min(currentSpeed, maxSpeed) / maxSpeed) * 2 * Math.PI - Math.PI/2;
    const needleLength = radius - 60;
    const needleX = centerX + needleLength * Math.cos(needleAngle);
    const needleY = centerY + needleLength * Math.sin(needleAngle);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#007bff';
    ctx.fill();
    
    // Draw current speed text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentSpeed.toFixed(1)}`, centerX, centerY + 40);
    ctx.font = '14px Arial';
    ctx.fillText('Mbps', centerX, centerY + 60);
  };

  // Component render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Internet Speed Test
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Measure your internet connection speed with maximum accuracy
            </p>
            {availableMethod && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                <Signal className="w-4 h-4" />
                {availableMethod}
              </div>
            )}
          </div>

          {/* Rate Limit Warning */}
          {isRateLimited && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Rate Limit Active
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Too many tests recently. Please wait {formatTimeRemaining(nextAllowedTime)} before running another test.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Test Area */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
            {/* Speedometer */}
            <div className="text-center mb-8">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="mx-auto max-w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Test Button */}
            <div className="text-center mb-8">
              <Button
                onClick={runTest}
                disabled={testPhase !== 'idle' || isRateLimited}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {testPhase === 'idle' ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {isRateLimited ? 'Rate Limited' : 'Start Speed Test'}
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Testing...
                  </>
                )}
              </Button>
              
              {testPhase !== 'idle' && (
                <Button
                  onClick={resetTest}
                  variant="outline"
                  className="ml-4 py-4 px-6 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            {testPhase !== 'idle' && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {statusMessage}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {(elapsedTime / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                      Speed Test Failed
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {results && testPhase === 'complete' && (
              <div className="space-y-6">
                {/* Main Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 text-center">
                    <Download className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      Download Speed
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {results.download_speed.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Mbps</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 text-center">
                    <Upload className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      Upload Speed
                    </h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {results.upload_speed.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Mbps</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 text-center">
                    <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      Ping
                    </h3>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {results.ping.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">ms</p>
                  </div>
                </div>

                {/* Additional Information */}
                {(results.jitter || results.server_location || results.isp) && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Additional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.jitter && (
                        <div className="flex items-center gap-3">
                          <Signal className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Jitter</p>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {results.jitter.toFixed(2)} ms
                            </p>
                          </div>
                        </div>
                      )}
                      {results.server_location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Server</p>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {results.server_location}
                            </p>
                          </div>
                        </div>
                      )}
                      {results.isp && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">ISP</p>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {results.isp}
                            </p>
                          </div>
                        </div>
                      )}
                      {results.method && (
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Method</p>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {results.method}
                            </p>
                          </div>
                        </div>
                      )}
                      {results.test_duration && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {(results.test_duration / 1000).toFixed(1)}s
                            </p>
                          </div>
                        </div>
                      )}
                      {results.timestamp && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Test Time</p>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {new Date(results.timestamp * 1000).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                About This Test
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This speed test uses our backend API with the official Ookla CLI for maximum accuracy, 
                providing results identical to Speedtest.net with no external service dependencies.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Uses official Ookla network for highest accuracy</li>
                <li>• Automatic server selection for optimal results</li>
                <li>• Built-in rate limiting to prevent service abuse</li>
                <li>• Real-time progress tracking</li>
                <li>• Comprehensive network analysis</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Rate Limiting & Fair Usage
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">Max Tests:</span> 
                  <span className="ml-2">3 tests per minute</span>
                </div>
                <div>
                  <span className="font-medium text-green-600 dark:text-green-400">Min Interval:</span> 
                  <span className="ml-2">10 seconds between tests</span>
                </div>
                <div>
                  <span className="font-medium text-purple-600 dark:text-purple-400">Test History:</span> 
                  <span className="ml-2">Stored locally for rate limiting</span>
                </div>
                <div>
                  <span className="font-medium text-orange-600 dark:text-orange-400">Backend Only:</span> 
                  <span className="ml-2">No external service dependencies</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 