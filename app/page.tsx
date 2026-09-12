"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Bold,
  Italic,
  Heading,
  Code,
  List,
  ListOrdered,
  Quote,
  Table,
  Link as LinkIcon,
  Copy,
  Check,
  Download,
  Trash2,
  Columns,
  Eye,
  FileEdit,
  BookOpen,
  Clock,
  Hash,
  FileText,
  Undo,
  Redo,
  Sparkles,
  ChevronDown,
  Zap,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ArrowUpDown,
  Image as ImageIcon,
  ExternalLink,
  X,
  Upload
} from "lucide-react";
import { SAMPLE_TEMPLATES } from "./templates";

type ViewMode = "split" | "editor" | "preview";

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSyncScroll, setIsSyncScroll] = useState<boolean>(true);
  const [splitWidth, setSplitWidth] = useState<number>(50); // percentage 20%-80%
  const isResizing = useRef<boolean>(false);

  const [hoverTooltip, setHoverTooltip] = useState<{
    url: string;
    alt: string;
    x: number;
    y: number;
  } | null>(null);

  // Smooth Resize split handler with requestAnimationFrame
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    let animationFrameId: number | null = null;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing.current) return;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        const newWidth = (event.clientX / window.innerWidth) * 100;
        if (newWidth >= 15 && newWidth <= 85) {
          setSplitWidth(newWidth);
        }
      });
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);
  };

  // History stack for Undo / Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeScroll = useRef<"editor" | "preview" | null>(null);

  const handleEditorScroll = () => {
    if (!isSyncScroll || activeScroll.current === "preview") return;
    activeScroll.current = "editor";

    const textarea = textareaRef.current;
    const previewContainer = previewContainerRef.current;

    if (textarea && previewContainer) {
      const scrollPercentage =
        textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
      previewContainer.scrollTop =
        scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
    }
  };

  const handlePreviewScroll = () => {
    if (!isSyncScroll || activeScroll.current === "editor") return;
    activeScroll.current = "preview";

    const textarea = textareaRef.current;
    const previewContainer = previewContainerRef.current;

    if (textarea && previewContainer) {
      const scrollPercentage =
        previewContainer.scrollTop /
        (previewContainer.scrollHeight - previewContainer.clientHeight);
      textarea.scrollTop =
        scrollPercentage * (textarea.scrollHeight - textarea.clientHeight);
    }
  };

  const handleScrollEnd = () => {
    activeScroll.current = null;
  };

  const [isMounted, setIsMounted] = useState(false);

  // Load theme, content, viewMode & splitWidth from localStorage
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("markdown_preview_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedViewMode = localStorage.getItem("markdown_preview_view_mode") as ViewMode | null;
    if (savedViewMode && ["split", "editor", "preview"].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    }

    const savedSplitWidth = localStorage.getItem("markdown_preview_split_width");
    if (savedSplitWidth) {
      const parsed = parseFloat(savedSplitWidth);
      if (!isNaN(parsed) && parsed >= 15 && parsed <= 85) {
        setSplitWidth(parsed);
      }
    }

    const savedContent = localStorage.getItem("markdown_preview_content");
    let initialText = "";
    if (savedContent !== null) {
      initialText = savedContent;
    }
    setMarkdown(initialText);
    setHistory([initialText]);
    setHistoryIndex(0);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("markdown_preview_theme", nextTheme);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplatesDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save content, viewMode, and splitWidth to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("markdown_preview_content", markdown);
      localStorage.setItem("markdown_preview_view_mode", viewMode);
      localStorage.setItem("markdown_preview_split_width", splitWidth.toString());
    }

    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    if (history.length === 0 || history[historyIndex] !== markdown) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(markdown);
      if (newHistory.length > 100) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [markdown]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setMarkdown(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setMarkdown(history[nextIndex]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      if (e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else {
        e.preventDefault();
        handleUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      handleRedo();
    }
  };

  const insertFormat = (prefix: string, suffix: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newMarkdown =
      markdown.substring(0, start) + replacement + markdown.substring(end);

    setMarkdown(newMarkdown);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyHtml = () => {
    if (previewRef.current) {
      navigator.clipboard.writeText(previewRef.current.innerHTML);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const [showHtmlThemeModal, setShowHtmlThemeModal] = useState(false);

  const handleDownloadFile = (type: "md" | "html", htmlTheme: "light" | "dark" = "light") => {
    let content = markdown;
    let filename = "document.md";
    let mimeType = "text/markdown";

    if (type === "html" && previewRef.current) {
      const isDarkHtml = htmlTheme === "dark";
      content = `<!DOCTYPE html>
<html lang="en" class="${isDarkHtml ? "dark" : ""}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Markdown Document</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 2.5rem 1.5rem;
      max-width: 900px;
      margin: 0 auto;
      line-height: 1.75;
      color: ${isDarkHtml ? "#e2e8f0" : "#334155"};
      background-color: ${isDarkHtml ? "#0b0f17" : "#ffffff"};
      transition: all 0.3s ease;
    }
    h1, h2, h3, h4, h5, h6 { 
      color: ${isDarkHtml ? "#ffffff" : "#0f172a"}; 
      font-weight: 700;
      margin-top: 1.5em; 
      margin-bottom: 0.5em; 
    }
    h1 { font-size: 2em; border-bottom: 1px solid ${isDarkHtml ? "rgba(255,255,255,0.1)" : "#e2e8f0"}; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid ${isDarkHtml ? "rgba(255,255,255,0.08)" : "#e2e8f0"}; padding-bottom: 0.3em; }
    a { color: ${isDarkHtml ? "#38bdf8" : "#0284c7"}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
    pre { 
      background: ${isDarkHtml ? "#0d131f" : "#f8fafc"} !important;
      color: ${isDarkHtml ? "#f8fafc" : "#0f172a"} !important;
      padding: 1.25rem;
      border-radius: 10px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      border: 1px solid ${isDarkHtml ? "rgba(255,255,255,0.1)" : "#e2e8f0"};
      box-shadow: 0 4px 12px ${isDarkHtml ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)"};
    }
    pre code { background: transparent !important; color: inherit !important; padding: 0 !important; }
    code:not(pre code) { 
      background: ${isDarkHtml ? "rgba(30, 41, 59, 0.8)" : "#f1f5f9"};
      color: ${isDarkHtml ? "#38bdf8" : "#0284c7"};
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.875em;
      border: 1px solid ${isDarkHtml ? "rgba(255,255,255,0.08)" : "#e2e8f0"};
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    /* Syntax Highlighting */
    .hljs-keyword { color: ${isDarkHtml ? "#bb9af7" : "#7c3aed"}; font-weight: 600; }
    .hljs-title, .hljs-title.class_ { color: ${isDarkHtml ? "#70a5fd" : "#2563eb"}; font-weight: 600; }
    .hljs-title.function_ { color: ${isDarkHtml ? "#7aa2f7" : "#0284c7"}; }
    .hljs-string, .hljs-subst { color: ${isDarkHtml ? "#9ece6a" : "#16a34a"}; }
    .hljs-attr, .hljs-property { color: ${isDarkHtml ? "#7dcfff" : "#0891b2"}; }
    .hljs-number, .hljs-literal { color: ${isDarkHtml ? "#ff9e64" : "#ea580c"}; }
    .hljs-built_in { color: ${isDarkHtml ? "#0db9d7" : "#0284c7"}; }
    .hljs-comment { color: ${isDarkHtml ? "#565f89" : "#94a3b8"}; font-style: italic; }
    .hljs-variable { color: ${isDarkHtml ? "#f7768e" : "#dc2626"}; }
    blockquote { 
      border-left: 4px solid ${isDarkHtml ? "#06b6d4" : "#0284c7"};
      margin: 1.5rem 0;
      padding: 0.6rem 1.25rem;
      color: ${isDarkHtml ? "#94a3b8" : "#475569"};
      background: ${isDarkHtml ? "rgba(6, 182, 212, 0.08)" : "#f0f9ff"};
      border-radius: 0 8px 8px 0;
    }
    table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; border-radius: 8px; overflow: hidden; border: 1px solid ${isDarkHtml ? "rgba(255,255,255,0.1)" : "#e2e8f0"}; }
    th, td { border: 1px solid ${isDarkHtml ? "rgba(255,255,255,0.08)" : "#e2e8f0"}; padding: 0.75rem 1rem; text-align: left; }
    th { background: ${isDarkHtml ? "#161f30" : "#f1f5f9"}; font-weight: 600; color: ${isDarkHtml ? "#f8fafc" : "#0f172a"}; }
    td { background: ${isDarkHtml ? "rgba(15, 23, 42, 0.4)" : "#ffffff"}; color: ${isDarkHtml ? "#cbd5e1" : "#334155"}; }
    tr:nth-child(even) td { background: ${isDarkHtml ? "rgba(15, 23, 42, 0.7)" : "#f8fafc"}; }
  </style>
</head>
<body>
${previewRef.current.innerHTML}
</body>
</html>`;
      filename = "document.html";
      mimeType = "text/html";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowHtmlThemeModal(false);
  };

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith(".md") || name.endsWith(".txt") || name.endsWith(".markdown")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text !== undefined) {
          setMarkdown(text);
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a .md or .txt file");
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleClear = () => {
    setMarkdown("");
    localStorage.removeItem("markdown_preview_content");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Stats calculations
  const charCount = markdown.length;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200);

  const isDark = theme === "dark";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleFileDrop}
      className={`flex flex-col h-screen max-h-screen overflow-hidden font-sans select-none transition-colors duration-300 relative ${
        isDark ? "theme-dark bg-[#090d16] text-slate-100" : "theme-light bg-slate-100 text-slate-900"
      }`}
    >
      {/* Drag and Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cyan-950/80 backdrop-blur-md border-4 border-dashed border-cyan-400 m-4 rounded-3xl animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="p-4 rounded-full bg-cyan-500/20 text-cyan-400 mb-3 animate-bounce">
            <Upload className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-cyan-200">Drop your file here</h2>
          <p className="text-sm text-cyan-400/80 mt-1">Supports .md, .txt, and .markdown files</p>
        </div>
      )}
      {/* Top Header - Glassmorphism Navbar */}
      <header
        className={`flex flex-wrap items-center justify-between px-3 md:px-5 py-2 md:py-2.5 backdrop-blur-md border-b gap-2 md:gap-3 z-30 shadow-xl transition-colors duration-300 ${
          isDark
            ? "bg-[#0e1626]/80 border-slate-800/80"
            : "bg-white/90 border-slate-200"
        }`}
      >
        {/* Brand Header - Minimal & Sleek */}
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              isDark
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-cyan-50 border-cyan-200 text-cyan-600"
            }`}
          >
            <FileText className="w-4 h-4" />
          </div>
          <h1
            className={`font-bold text-xs sm:text-sm tracking-tight ${
              isDark ? "text-slate-100" : "text-slate-800"
            }`}
          >
            Markdown Preview
          </h1>
        </div>

        {/* Action Controls - Responsive Wrapper */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Templates Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm border ${
                isDark
                  ? "bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white border-slate-700/60"
                  : "bg-slate-200/80 hover:bg-slate-300 text-slate-700 hover:text-slate-900 border-slate-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xs:inline sm:inline">Templates</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showTemplatesDropdown && (
              <div
                className={`absolute right-0 mt-2 w-52 sm:w-56 border rounded-xl shadow-2xl py-1.5 z-50 backdrop-blur-xl ${
                  isDark
                    ? "bg-[#111827] border-slate-700/80 text-slate-200"
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <div
                  className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border-b ${
                    isDark ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-100"
                  }`}
                >
                  Preset Templates
                </div>
                {SAMPLE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setMarkdown(tmpl.content);
                      setShowTemplatesDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col gap-0.5 ${
                      isDark
                        ? "hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-200"
                        : "hover:bg-cyan-50 hover:text-cyan-700 text-slate-700"
                    }`}
                  >
                    <span className="font-semibold">{tmpl.name}</span>
                    <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {tmpl.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sync Scroll Toggle */}
          <button
            onClick={() => setIsSyncScroll(!isSyncScroll)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isSyncScroll
                ? isDark
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm"
                  : "bg-cyan-50 text-cyan-700 border-cyan-300 shadow-sm"
                : isDark
                ? "bg-slate-800/40 text-slate-500 border-slate-700/50 hover:text-slate-300"
                : "bg-slate-100 text-slate-400 border-slate-300 hover:text-slate-700"
            }`}
            title={isSyncScroll ? "Sync Scroll Enabled" : "Sync Scroll Disabled"}
          >
            <ArrowUpDown className={`w-3.5 h-3.5 ${isSyncScroll ? "opacity-100" : "opacity-40"}`} />
            <span className="hidden lg:inline">Sync Scroll</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSyncScroll ? "bg-cyan-400 animate-pulse" : "bg-slate-500"
              }`}
            />
          </button>

          <div className={`h-4 w-px mx-0.5 hidden sm:block ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".md,.txt,.markdown"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />

          {/* Import File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 border rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${
              isDark
                ? "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60 hover:border-cyan-500/50"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-cyan-500"
            }`}
            title="Import .md or .txt file"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* View mode toggle */}
          <div
            className={`flex p-0.5 sm:p-1 rounded-xl border ${
              isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-200/60 border-slate-300"
            }`}
          >
            <button
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === "editor"
                  ? isDark
                    ? "bg-slate-800 text-cyan-400 shadow-md border border-slate-700/60"
                    : "bg-white text-cyan-600 shadow border border-slate-200"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Editor View"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Editor</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === "split"
                  ? isDark
                    ? "bg-slate-800 text-cyan-400 shadow-md border border-slate-700/60"
                    : "bg-white text-cyan-600 shadow border border-slate-200"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === "preview"
                  ? isDark
                    ? "bg-slate-800 text-cyan-400 shadow-md border border-slate-700/60"
                    : "bg-white text-cyan-600 shadow border border-slate-200"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Preview View"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Preview</span>
            </button>
          </div>

          <div className={`h-4 w-px mx-0.5 hidden sm:block ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

          {/* Export Options */}
          <button
            onClick={handleCopyMarkdown}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 border rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${
              isDark
                ? "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            }`}
            title="Copy Markdown"
          >
            {copiedMd ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold hidden xs:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 opacity-70" />
                <span className="hidden lg:inline">Copy MD</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyHtml}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 border rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${
              isDark
                ? "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            }`}
            title="Copy rendered HTML"
          >
            {copiedHtml ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold hidden xs:inline">Copied!</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 opacity-70" />
                <span className="hidden lg:inline">Copy HTML</span>
              </>
            )}
          </button>

          {/* Download Dropdown */}
          <div
            className={`flex border rounded-lg overflow-hidden text-xs ${
              isDark ? "bg-slate-800/80 border-slate-700/60" : "bg-white border-slate-300"
            }`}
          >
            <button
              onClick={() => handleDownloadFile("md")}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 transition-all border-r ${
                isDark
                  ? "hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200"
              }`}
              title="Download .md file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span className="font-semibold">.MD</span>
            </button>
            <button
              onClick={() => setShowHtmlThemeModal(true)}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 transition-all ${
                isDark
                  ? "hover:bg-slate-700 text-slate-300 hover:text-white"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              }`}
              title="Download .html file"
            >
              <span className="font-semibold text-indigo-400">.HTML</span>
            </button>
          </div>

          {/* Theme Switcher & Fullscreen */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg transition-all border ${
              isDark
                ? "bg-slate-800/80 text-amber-400 hover:bg-slate-700 border-slate-700/60"
                : "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200"
            }`}
            title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-lg transition-all hidden sm:block ${
              isDark
                ? "text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                : "text-slate-600 hover:text-cyan-600 hover:bg-slate-200"
            }`}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleClear}
            className={`p-1.5 rounded-lg transition-all ${
              isDark
                ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            }`}
            title="Clear text"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace (Responsive Split / Stack View for Mobile) */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Pane: Editor */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div
            style={{
              width: isMounted && viewMode === "split" && window.innerWidth >= 768 ? `${splitWidth}%` : undefined,
            }}
            className={`flex flex-col border-b md:border-b-0 transition-colors duration-300 ${
              viewMode === "split" ? "h-1/2 md:h-full" : "h-full w-full"
            } ${
              isDark ? "bg-[#0b0f17] border-slate-800/80" : "bg-white border-slate-200"
            } select-text`}
          >
            {/* Pro Formatting Toolbar */}
            <div
              className={`flex items-center justify-between px-5 h-[41px] border-b overflow-x-auto transition-colors duration-300 ${
                isDark
                  ? "bg-[#0e1626]/90 border-slate-800/70"
                  : "bg-slate-100/90 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1">
                {/* Undo / Redo */}
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={`p-1.5 rounded-md transition-all ${
                    historyIndex > 0
                      ? isDark
                        ? "hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                        : "hover:bg-slate-200 text-slate-700 hover:text-cyan-600"
                      : "opacity-40 cursor-not-allowed"
                  }`}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className={`p-1.5 rounded-md transition-all ${
                    historyIndex < history.length - 1
                      ? isDark
                        ? "hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                        : "hover:bg-slate-200 text-slate-700 hover:text-cyan-600"
                      : "opacity-40 cursor-not-allowed"
                  }`}
                  title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
                >
                  <Redo className="w-4 h-4" />
                </button>

                <div className={`h-4 w-px mx-1.5 ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

                {/* Typography formatting */}
                <button
                  onClick={() => insertFormat("**", "**", "bold text")}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("*", "*", "italic text")}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("### ", "", "Heading")}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Heading"
                >
                  <Heading className="w-4 h-4" />
                </button>

                <div className={`h-4 w-px mx-1.5 ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

                {/* Code & Quote */}
                <button
                  onClick={() => insertFormat("`", "`", "code")}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Inline Code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("> ", "", "Quote")}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("[", "](https://example.com)", "link text")}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <div className={`h-4 w-px mx-1.5 ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

                {/* Lists & Tables */}
                <button
                  onClick={() => insertFormat("- ", "", "List item")}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Unordered List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("1. ", "", "List item")}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Ordered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    insertFormat(
                      "\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n",
                      ""
                    )
                  }
                  className={`p-1.5 rounded-md transition-all ${
                    isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title="Table"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>


            </div>

            {/* Editor Area with Floating Image Thumbnails */}
            <div className="flex-1 relative flex flex-col min-h-0">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleEditorScroll}
                onMouseLeave={() => {
                  handleScrollEnd();
                }}
                onTouchEnd={handleScrollEnd}
                placeholder="Write your markdown here..."
                className={`w-full flex-1 p-5 bg-transparent font-mono text-sm resize-none focus:outline-none leading-relaxed tracking-wide ${
                  isDark
                    ? "text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200"
                    : "text-slate-800 selection:bg-cyan-200 selection:text-cyan-900"
                }`}
                spellCheck={false}
              />

              {/* Floating Hover Image Popup Tooltip */}
              {hoverTooltip && (
                <div
                  className="fixed z-50 pointer-events-none p-1.5 rounded-xl bg-[#090d16]/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md transition-opacity duration-200 flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95"
                  style={{
                    left: `${Math.min(hoverTooltip.x + 15, window.innerWidth - 220)}px`,
                    top: `${Math.min(hoverTooltip.y + 15, window.innerHeight - 220)}px`,
                  }}
                >
                  <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 max-w-[180px] truncate">
                    <ImageIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{hoverTooltip.alt}</span>
                  </div>
                  <img
                    src={hoverTooltip.url}
                    alt={hoverTooltip.alt}
                    className="w-48 h-32 object-cover rounded-lg border border-slate-800 shadow-md bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop";
                    }}
                  />
                </div>
              )}

              {/* Detected Images Thumbnail Bar (Inside Editor Pane) */}
              {(() => {
                const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
                const matches = Array.from(markdown.matchAll(imgRegex));
                if (matches.length === 0) return null;

                return (
                  <div
                    className={`px-4 py-2 border-t flex items-center gap-3 overflow-x-auto shrink-0 ${
                      isDark
                        ? "bg-[#0e1626]/90 border-slate-800/80"
                        : "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-cyan-500 shrink-0">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Detected Images ({matches.length}):</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-thin">
                      {matches.map((m, idx) => {
                        const altText = m[1] || `Image ${idx + 1}`;
                        const imgUrl = m[2];
                        return (
                          <div
                            key={idx}
                            className={`group relative flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs shrink-0 transition-all cursor-pointer ${
                              isDark
                                ? "bg-slate-800/70 border-slate-700/60 hover:border-cyan-500/80 hover:bg-slate-800"
                                : "bg-white border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/50"
                            }`}
                            onClick={() => {
                              if (textareaRef.current) {
                                const pos = markdown.indexOf(m[0]);
                                if (pos !== -1) {
                                  textareaRef.current.focus();
                                  textareaRef.current.setSelectionRange(pos, pos + m[0].length);
                                }
                              }
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoverTooltip({
                                url: imgUrl,
                                alt: altText,
                                x: rect.left - 35,
                                y: rect.top - 185,
                              });
                            }}
                            onMouseLeave={() => setHoverTooltip(null)}
                            title={`Click to locate in editor: ${altText}`}
                          >
                            <img
                              src={imgUrl}
                              alt={altText}
                              className="w-6 h-6 object-cover rounded border border-slate-700/50 shrink-0 bg-slate-900"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=100&auto=format&fit=crop";
                              }}
                            />
                            <span className={`text-[11px] font-medium max-w-[140px] truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                              {altText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Draggable Split Handle Divider (Desktop Only) */}
        {viewMode === "split" && (
          <div
            onMouseDown={handleMouseDownResize}
            className={`hidden md:flex w-1.5 hover:w-2 hover:bg-cyan-500/80 cursor-col-resize items-center justify-center transition-all z-20 select-none group ${
              isDark ? "bg-slate-800/80" : "bg-slate-300"
            }`}
            title="Drag to resize panes"
          >
            <div className="w-0.5 h-8 rounded-full bg-slate-500/40 group-hover:bg-cyan-200 transition-colors" />
          </div>
        )}

        {/* Right Pane: Live Rendered Preview */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div
            style={{
              width: isMounted && viewMode === "split" && window.innerWidth >= 768 ? `${100 - splitWidth}%` : undefined,
            }}
            className={`flex flex-col ${
              viewMode === "split" ? "h-1/2 md:h-full" : "h-full w-full"
            } ${isDark ? "bg-[#0b0f17]" : "bg-slate-50"} select-text`}
          >
            <div
              className={`px-5 h-[41px] border-b flex items-center justify-between transition-colors duration-300 ${
                isDark ? "bg-[#0e1626]/90 border-slate-800/70" : "bg-slate-100/90 border-slate-200"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-cyan-500">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                Live Render Output
              </span>

            </div>

            <div
              ref={previewContainerRef}
              onScroll={handlePreviewScroll}
              onMouseLeave={handleScrollEnd}
              onTouchEnd={handleScrollEnd}
              className={`flex-1 p-6 md:p-8 overflow-y-auto ${isDark ? "bg-[#0b0f17]" : "bg-slate-50"}`}
            >
              <div ref={previewRef} className="markdown-body max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer & Stats Bar */}
      <footer
        className={`px-5 py-2 border-t text-xs flex items-center justify-between gap-3 z-30 shadow-lg transition-colors duration-300 ${
          isDark
            ? "bg-[#0e1626] border-slate-800/80 text-slate-400"
            : "bg-white border-slate-200 text-slate-600"
        }`}
      >
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 font-medium">
            <Hash className="w-3.5 h-3.5 text-cyan-500" />
            <strong className={isDark ? "text-slate-100" : "text-slate-900"}>{charCount.toLocaleString()}</strong> Characters
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <strong className={isDark ? "text-slate-100" : "text-slate-900"}>{wordCount.toLocaleString()}</strong> Words
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <strong className={isDark ? "text-slate-100" : "text-slate-900"}>{readTime}</strong> min read
          </span>
        </div>
      </footer>

      {/* Centered HTML Export Theme Modal */}
      {showHtmlThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl transition-all scale-100 ${
              isDark
                ? "bg-[#0f172a] border-slate-700 text-slate-100 shadow-cyan-950/30"
                : "bg-white border-slate-200 text-slate-900 shadow-slate-300/50"
            }`}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Select HTML Theme</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Choose a theme for your exported HTML file
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHtmlThemeModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 my-2">
              {/* Light Theme Card */}
              <button
                onClick={() => handleDownloadFile("html", "light")}
                className={`group flex flex-col items-center gap-3 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700 hover:border-amber-500/60 hover:bg-slate-800"
                    : "bg-slate-50 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-amber-500 transition-colors">
                    Light Theme
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Clean White Background
                  </div>
                </div>
              </button>

              {/* Dark Theme Card */}
              <button
                onClick={() => handleDownloadFile("html", "dark")}
                className={`group flex flex-col items-center gap-3 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700 hover:border-indigo-500/60 hover:bg-slate-800"
                    : "bg-slate-50 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-indigo-400 transition-colors">
                    Dark Theme
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Tokyo Night Dark Mode
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
