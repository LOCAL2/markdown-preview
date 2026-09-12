"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Play,
  Terminal,
  Search,
  Code2,
  FileCode2,
  Server,
  Key,
  ShieldCheck,
  Layers,
  ChevronRight,
  ExternalLink
} from "lucide-react";

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
        return `curl -X GET "${url}" \\
  -H "Accept: application/json"`;
      case "fetch":
        return `fetch("${url}")
  .then(res => res.json())
  .then(data => console.log(data));`;
      case "python":
        return `import requests

response = requests.get("${url}")
data = response.json()
print(data)`;
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
    <div className="min-h-screen w-full bg-[#090d16] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-y-auto">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Editor
            </Link>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                <FileCode2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white">
                Markdown Studio <span className="text-indigo-400 font-mono text-xs font-normal">API Reference</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v1.0 Public
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Documentation Content (7 cols) */}
        <main className="lg:col-span-7 space-y-10">
          {/* Overview Section */}
          <section id="overview" className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase">
                GETTING STARTED
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                API Reference & Integration
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                The Markdown Studio REST API provides programmatic access to curated Markdown templates, math expressions, and diagram presets. Integrate Markdown templates directly into your VS Code extensions, CLI tools, or external web applications.
              </p>
            </div>

            {/* Base URL Box */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                BASE URL
              </div>
              <div className="flex items-center gap-2 font-mono text-sm text-indigo-300 bg-[#060911] px-3.5 py-2 rounded-lg border border-slate-800">
                <Server className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="select-all">{origin}/api</span>
              </div>
            </div>

            {/* Auth Note */}
            <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Authentication Free:</strong> The template API is public and does not require an API key or bearer tokens. CORS is enabled for browser applications.
              </div>
            </div>
          </section>

          <hr className="border-slate-800/80" />

          {/* Endpoint Specification Section */}
          <section id="templates-endpoint" className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 font-mono text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">
                  GET
                </span>
                <code className="text-xl font-mono font-bold text-white">
                  /api/templates
                </code>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Retrieves a list of pre-configured Markdown templates including syntax examples, KaTeX math formulas, Mermaid.js diagrams, GitHub callouts, and project README templates.
              </p>
            </div>

            {/* Query Parameters Table */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase font-mono tracking-wider text-slate-300">
                QUERY PARAMETERS
              </h2>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                <div className="p-4 border-b border-slate-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-400">search</span>
                    <span className="text-[11px] font-mono text-slate-500">string</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">optional</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Filter templates matching a keyword in title, description, or content (e.g. <code className="text-indigo-300 font-mono">math</code>, <code className="text-indigo-300 font-mono">mermaid</code>, <code className="text-indigo-300 font-mono">readme</code>).
                  </p>
                </div>

                <div className="p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-400">id</span>
                    <span className="text-[11px] font-mono text-slate-500">string</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">optional</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fetch a single specific template by its exact identifier (e.g. <code className="text-indigo-300 font-mono">welcome</code>, <code className="text-indigo-300 font-mono">mermaid</code>, <code className="text-indigo-300 font-mono">math</code>).
                  </p>
                </div>
              </div>
            </div>

            {/* Response Formats */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase font-mono tracking-wider text-slate-300">
                RESPONSE CODES
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    200 OK
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Successfully returned matching template list or single template payload.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 font-mono font-bold text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    404 Not Found
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Returned when a specific template ID query param does not exist.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Right Column: Sticky Interactive Console (5 cols) */}
        <aside className="lg:col-span-5">
          <div className="sticky top-20 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300 font-bold uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-indigo-400" />
                API Testing Console
              </div>

              {/* Code Language Selector */}
              <div className="flex items-center gap-1 bg-[#060911] p-1 rounded-lg border border-slate-800">
                {(["curl", "fetch", "python"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
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

            {/* Test Parameter Controls */}
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase font-semibold">
                REQUEST PARAMETERS
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    search:
                  </label>
                  <input
                    type="text"
                    value={searchParam}
                    onChange={(e) => setSearchParam(e.target.value)}
                    placeholder="e.g. math or mermaid"
                    className="w-full px-3 py-2 bg-[#060911] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    id:
                  </label>
                  <input
                    type="text"
                    value={idParam}
                    onChange={(e) => setIdParam(e.target.value)}
                    placeholder="e.g. welcome"
                    className="w-full px-3 py-2 bg-[#060911] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-md disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {loading ? "Sending Request..." : "Run API Request"}
              </button>
            </div>

            {/* Code Snippet Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>REQUEST CODE</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="bg-[#060911] border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-indigo-300 overflow-x-auto">
                <pre>{getCodeSnippet()}</pre>
              </div>
            </div>

            {/* Response Section */}
            {apiResponse && (
              <div className="space-y-2 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded ${
                        apiResponse.status === 200
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {apiResponse.status} {apiResponse.statusText}
                    </span>
                    <span className="text-slate-500">{apiResponse.timeMs}ms</span>
                  </div>
                  <button
                    onClick={() => setApiResponse(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>

                <div className="bg-[#060911] border border-slate-800 rounded-lg p-3 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-300">
                  <pre>{JSON.stringify(apiResponse.data, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
