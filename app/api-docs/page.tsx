"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code,
  Globe,
  Terminal,
  Play,
  Copy,
  Check,
  ArrowLeft,
  FileText,
  Layers,
  Sparkles
} from "lucide-react";

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "fetch" | "python">("curl");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const getSnippet = () => {
    const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
    switch (activeTab) {
      case "curl":
        return `curl -X GET "${baseUrl}/api/templates${query}" \\
  -H "Accept: application/json"`;
      case "fetch":
        return `fetch("${baseUrl}/api/templates${query}")
  .then(res => res.json())
  .then(data => console.log(data));`;
      case "python":
        return `import requests

response = requests.get("${baseUrl}/api/templates${query}")
data = response.json()
print(data)`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestApi = async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/templates${query}`);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      {/* Header Navigation */}
      <div className="max-w-5xl mx-auto mb-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markdown Editor
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          API v1.0 Active
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto space-y-10">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-indigo-400 font-mono text-xs mb-3 uppercase tracking-widest font-bold">
              <Sparkles className="w-4 h-4" /> Developer Documentation
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Markdown Previewer <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">REST API</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed">
              Integrate Markdown preview templates into your applications, extensions, CLI scripts, or external services easily.
            </p>
          </div>
        </div>

        {/* API Endpoint Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 font-mono text-xs font-bold bg-emerald-500 text-slate-950 rounded-lg uppercase tracking-wider">
                GET
              </span>
              <code className="text-lg md:text-xl font-mono text-indigo-300 font-semibold">
                /api/templates
              </code>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              CORS Enabled (Public)
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Returns a JSON array of curated Markdown sample templates (Welcome, Diagrams, Math, README, Cheatsheet). Supports filtering by keyword or specific template ID.
            </p>
          </div>

          {/* Query Parameters */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Query Parameters</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-mono">
                    <th className="py-2.5 px-3">Parameter</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Required</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  <tr>
                    <td className="py-3 px-3 text-indigo-400 font-bold">search</td>
                    <td className="py-3 px-3 text-slate-400">string</td>
                    <td className="py-3 px-3 text-slate-500">Optional</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">Filter templates by title, description, or ID keyword (e.g., <code className="text-amber-300">math</code>)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-indigo-400 font-bold">id</td>
                    <td className="py-3 px-3 text-slate-400">string</td>
                    <td className="py-3 px-3 text-slate-500">Optional</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">Get a single template by exact ID (e.g., <code className="text-amber-300">mermaid</code>)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Try It Out & Code Snippets */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Interactive Request Builder</h3>

              {/* Code snippet tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(["curl", "fetch", "python"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                      activeTab === tab
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional search input */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Optional filter search query... (e.g. mermaid)"
                className="flex-1 px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={handleTestApi}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                {loading ? "Testing..." : "Send Request"}
              </button>
            </div>

            {/* Snippet Display */}
            <div className="relative group bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-200 overflow-x-auto">
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all opacity-80 group-hover:opacity-100"
                title="Copy snippet"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="pr-12">{getSnippet()}</pre>
            </div>

            {/* Live API Response Viewer */}
            {apiResponse && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>API Response (200 OK)</span>
                  <button
                    onClick={() => setApiResponse(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    Clear Output
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 max-h-96 overflow-y-auto shadow-inner">
                  {apiResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
