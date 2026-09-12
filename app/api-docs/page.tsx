"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Server, ExternalLink, Copy, Check } from "lucide-react";

export default function ApiDocsPage() {
  const [origin, setOrigin] = useState("http://localhost:3000");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const endpoints = [
    {
      method: "GET",
      path: "/api/templates",
      fullUrl: `${origin}/api/templates`,
      summary: "Fetch all preset Markdown templates (Welcome, Diagrams, Math, README, Cheatsheet)",
      exampleUrls: [
        { label: "Fetch All Templates", url: `${origin}/api/templates` },
        { label: "Filter by Keyword", url: `${origin}/api/templates?search=math` },
        { label: "Fetch Single Template by ID", url: `${origin}/api/templates?id=welcome` },
      ],
      params: [
        { name: "search", type: "string", required: "Optional", description: "Filter templates matching keyword in title or description" },
        { name: "id", type: "string", required: "Optional", description: "Fetch a single template by its exact identifier" },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-200 font-sans p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Editor
            </Link>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              API Endpoints
            </h1>
          </div>

          <div className="text-xs font-mono text-slate-400">
            CORS Enabled (Public)
          </div>
        </div>

        {/* Endpoint Catalog List */}
        <div className="space-y-6">
          {endpoints.map((ep, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5 shadow-lg"
            >
              {/* Method & Full URL */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 font-mono text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">
                    {ep.method}
                  </span>
                  <span className="text-xs text-slate-400">{ep.summary}</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 bg-[#060911] border border-slate-800 rounded-lg font-mono text-sm">
                  <span className="text-indigo-300 font-bold break-all">{ep.fullUrl}</span>
                  <button
                    onClick={() => handleCopy(ep.fullUrl)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Copy full URL"
                  >
                    {copiedUrl === ep.fullUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Query Parameters Table */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
                  Query Parameters
                </div>
                <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 bg-[#060911]">
                  {ep.params.map((param) => (
                    <div key={param.name} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-indigo-400">{param.name}</span>
                        <span className="text-[11px] text-slate-500">({param.type})</span>
                        <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded">{param.required}</span>
                      </div>
                      <div className="text-slate-400 text-xs">{param.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example Full URLs */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
                  Example Request URLs
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {ep.exampleUrls.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2.5 bg-[#060911] border border-slate-800/80 rounded-lg">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-500 font-sans text-[11px] shrink-0">{ex.label}:</span>
                        <a
                          href={ex.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline truncate flex items-center gap-1"
                        >
                          {ex.url}
                          <ExternalLink className="w-3 h-3 inline shrink-0" />
                        </a>
                      </div>
                      <button
                        onClick={() => handleCopy(ex.url)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                        title="Copy URL"
                      >
                        {copiedUrl === ex.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
