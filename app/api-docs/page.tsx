"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Play,
  Terminal,
  Server,
  Code2,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react";

interface EndpointDoc {
  id: string;
  method: "GET" | "POST";
  path: string;
  summary: string;
  params: { name: string; type: string; required: boolean; description: string }[];
  defaultSearch?: string;
  defaultId?: string;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: "get-templates",
    method: "GET",
    path: "/api/templates",
    summary: "Fetch pre-configured Markdown templates (Welcome, Diagrams, Math, README, Cheatsheet)",
    params: [
      { name: "search", type: "string", required: false, description: "Filter templates by keyword in title/description (e.g. 'math', 'mermaid')" },
      { name: "id", type: "string", required: false, description: "Fetch single template by exact ID (e.g. 'welcome', 'math')" },
    ],
  },
];

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "fetch" | "python">("curl");
  const [searchParam, setSearchParam] = useState("");
  const [idParam, setIdParam] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<{
    status: number;
    statusText: string;
    timeMs: number;
    data: any;
  } | null>(null);

  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    if (idParam.trim()) params.append("id", idParam.trim());
    if (searchParam.trim()) params.append("search", searchParam.trim());
    const queryString = params.toString();
    return `${origin}/api/templates${queryString ? `?${queryString}` : ""}`;
  };

  const getCodeSnippet = () => {
    const url = buildQueryUrl();
    switch (activeTab) {
      case "curl":
        return `curl -X GET "${url}"`;
      case "fetch":
        return `fetch("${url}").then(res => res.json()).then(console.log);`;
      case "python":
        return `import requests\nprint(requests.get("${url}").json())`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendRequest = async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const url = buildQueryUrl();
      const res = await fetch(url);
      const endTime = performance.now();
      const data = await res.json();
      setApiResponse({
        status: res.status,
        statusText: res.statusText || (res.status === 200 ? "OK" : "Error"),
        timeMs: Math.round(endTime - startTime),
        data,
      });
    } catch (err: any) {
      const endTime = performance.now();
      setApiResponse({
        status: 500,
        statusText: "Network Error",
        timeMs: Math.round(endTime - startTime),
        data: { error: err.message || "Failed to fetch API endpoint" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-200 font-sans p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
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
              API Endpoints Catalog
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500">Base URL:</span>
            <span className="text-indigo-300 font-semibold">{origin}/api</span>
          </div>
        </div>

        {/* Endpoint List */}
        <div className="space-y-4">
          {ENDPOINTS.map((endpoint) => (
            <div
              key={endpoint.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg"
            >
              {/* Endpoint Summary Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 font-mono text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">
                    {endpoint.method}
                  </span>
                  <code className="text-base font-mono font-bold text-white">
                    {endpoint.path}
                  </code>
                </div>
                <span className="text-xs text-slate-400">{endpoint.summary}</span>
              </div>

              {/* Endpoint Details & Interactive Tester */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Query Parameters Table */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
                    Query Parameters
                  </div>
                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-[#060911]">
                    {endpoint.params.map((param) => (
                      <div key={param.name} className="p-3 text-xs space-y-1">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-indigo-400">{param.name}</span>
                          <span className="text-[10px] text-slate-500">({param.type})</span>
                          <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded">optional</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-tight">{param.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Live Request Tester */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      Try It Out
                    </div>

                    {/* Language Tabs */}
                    <div className="flex items-center gap-1 bg-[#060911] p-1 rounded-md border border-slate-800 text-[11px] font-mono">
                      {(["curl", "fetch", "python"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            activeTab === tab ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      value={searchParam}
                      onChange={(e) => setSearchParam(e.target.value)}
                      placeholder="search (e.g. math)"
                      className="px-3 py-1.5 bg-[#060911] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={idParam}
                      onChange={(e) => setIdParam(e.target.value)}
                      placeholder="id (e.g. welcome)"
                      className="px-3 py-1.5 bg-[#060911] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Code Snippet Box */}
                  <div className="relative group bg-[#060911] border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-indigo-300 overflow-x-auto">
                    <button
                      onClick={handleCopyCode}
                      className="absolute top-2 right-2 p-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white"
                      title="Copy snippet"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <pre>{getCodeSnippet()}</pre>
                  </div>

                  <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {loading ? "Sending..." : "Execute Request"}
                  </button>

                  {/* API Response JSON */}
                  {apiResponse && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800 animate-in fade-in">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            apiResponse.status === 200
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {apiResponse.status} {apiResponse.statusText} ({apiResponse.timeMs}ms)
                        </span>
                        <button onClick={() => setApiResponse(null)} className="text-slate-500 hover:text-slate-300">
                          Clear
                        </button>
                      </div>
                      <pre className="bg-[#060911] border border-slate-800 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-300">
                        {JSON.stringify(apiResponse.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
