"use client";

import React, { useEffect, useRef, useState } from "react";

interface MermaidRendererProps {
  chart: string;
}

let mermaidInstance: any = null;

async function getMermaid() {
  if (!mermaidInstance) {
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "inherit",
    });
    mermaidInstance = mermaid;
  }
  return mermaidInstance;
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chart || !containerRef.current) return;
      try {
        const mermaid = await getMermaid();
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);

        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Mermaid Render Error:", err);
          setError(err.message || "Failed to render Mermaid diagram");
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-3 my-2 text-xs font-mono bg-red-950/40 text-red-400 border border-red-800/50 rounded-xl overflow-x-auto">
        <span className="font-bold">Mermaid Diagram Error:</span> {error}
        <pre className="mt-1 text-slate-400 text-[11px]">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram my-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl overflow-x-auto flex justify-center items-center shadow-md"
      dangerouslySetInnerHTML={{ __html: svg || '<div className="text-slate-500 text-xs animate-pulse">Rendering diagram...</div>' }}
    />
  );
}
