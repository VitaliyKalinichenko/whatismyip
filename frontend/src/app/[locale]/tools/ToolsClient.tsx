"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin,
  Shield,
  Search,
  Network,
  Wifi,
  Globe,
  Zap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface ToolItem {
  title: string;
  description: string;
  icon: keyof typeof import('lucide-react');
  href: string;
  color: string;
  bgColor: string;
}

interface ToolsClientProps {
  tools: ToolItem[];
  title: string;
  description: string;
}

export default function ToolsClient({ tools, title, description }: ToolsClientProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, i) => {
            const Icon = (import('lucide-react') as any)[tool.icon];
            return (
              <Card key={i} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-sm">{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={tool.href}
                    className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full justify-center"
                  >
                    Use Tool <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span>About These Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Our networking tools are designed to help you troubleshoot network issues, analyze domain configurations, and monitor connectivity. All tools run server-side to provide accurate results.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Real-time data from authoritative sources</li>
                <li>• Professional-grade network diagnostics</li>
                <li>• Privacy-focused with no data retention</li>
                <li>• Free to use for all users</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <span>Professional Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                These tools are used by network administrators, developers, and IT professionals worldwide. They provide the same functionality as expensive commercial tools.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Enterprise-grade accuracy</li>
                <li>• Real-time results</li>
                <li>• No registration required</li>
                <li>• Cross-platform compatibility</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
