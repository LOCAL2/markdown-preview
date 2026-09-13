"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import MermaidRenderer from "./components/MermaidRenderer";
import LZString from "lz-string";

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
  Upload,
  History,
  Save,
  AlertCircle,
  Info,
  HelpCircle,
  FileCode,
  FileDown,
  Layers,
  Share2
} from "lucide-react";

import { SAMPLE_TEMPLATES } from "./templates";
const CALLOUT_CONFIG: Record<
  string,
  { bg: string; border: string; text: string; title: string }
> = {
  note: {
    bg: "bg-blue-500/10",
    border: "border-blue-500",
    text: "text-blue-200",
    title: "text-blue-400",
  },
  tip: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500",
    text: "text-emerald-200",
    title: "text-emerald-400",
  },
  important: {
    bg: "bg-purple-500/10",
    border: "border-purple-500",
    text: "text-purple-200",
    title: "text-purple-400",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500",
    text: "text-amber-200",
    title: "text-amber-400",
  },
  caution: {
    bg: "bg-rose-500/10",
    border: "border-rose-500",
    text: "text-rose-200",
    title: "text-rose-400",
  },
};

function renderCalloutAlert(alertType: string, content: React.ReactNode) {
  const config = CALLOUT_CONFIG[alertType] || CALLOUT_CONFIG.note;

  return (
    <div
      className={`my-4 p-4 border-l-4 rounded-r-xl shadow-md font-sans text-sm ${config.bg} ${config.border} ${config.text}`}
    >
      <div className={`font-bold text-xs uppercase flex items-center gap-1.5 mb-1.5 ${config.title}`}>
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{alertType}</span>
      </div>
      <div className="font-normal leading-relaxed">{content}</div>
    </div>
  );
}

function processCalloutChildren(children: React.ReactNode): { alertType: string | null; cleanContent: React.ReactNode } {
  let alertType: string | null = null;
  let cleanContent = children;

  const extractString = (node: any): string => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractString).join("");
    if (node && node.props && node.props.children) return extractString(node.props.children);
    return "";
  };

  const fullText = extractString(children).trim();
  const match = fullText.match(/^\[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);

  if (match) {
    alertType = match[1].toLowerCase();

    const stripPrefix = (node: any): any => {
      if (typeof node === "string") {
        return node.replace(/^\[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, "");
      }
      if (Array.isArray(node)) {
        let prefixStripped = false;
        return node.map((child) => {
          if (!prefixStripped) {
            const childStr = extractString(child);
            if (childStr.match(/^\[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i)) {
              prefixStripped = true;
              return stripPrefix(child);
            }
          }
          return child;
        });
      }
      if (node && React.isValidElement(node) && (node.props as any)?.children) {
        return React.cloneElement(node, {
          ...(node.props as any),
          children: stripPrefix((node.props as any).children),
        });
      }
      return node;
    };

    cleanContent = stripPrefix(children);
  }

  return { alertType, cleanContent };
}

type ViewMode = "split" | "editor" | "preview";

interface DraftSnapshot {
  id: string;
  timestamp: string;
  previewText: string;
  fullText: string;
}

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showCalloutDropdown, setShowCalloutDropdown] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSyncScroll, setIsSyncScroll] = useState<boolean>(true);
  const [splitWidth, setSplitWidth] = useState<number>(50); // percentage 20%-80%
  const isResizing = useRef<boolean>(false);
  const calloutRef = useRef<HTMLDivElement>(null);

  // Auto-Save & Draft History state
  const [autoSaveStatus, setAutoSaveStatus] = useState<"Saved" | "Saving..." | "Unsaved">("Saved");
  const [draftHistory, setDraftHistory] = useState<DraftSnapshot[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);

  // Drag & Drop & Toast state
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [hoverTooltip, setHoverTooltip] = useState<{
    url: string;
    alt: string;
    x: number;
    y: number;
  } | null>(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  // HTML Theme Export Modal
  const [showHtmlThemeModal, setShowHtmlThemeModal] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // Synchronized Scrolling Logic
  const isScrollingEditor = useRef(false);
  const isScrollingPreview = useRef(false);

  const handleEditorScroll = () => {
    if (!isSyncScroll || isScrollingPreview.current || !textareaRef.current || !previewContainerRef.current) return;
    isScrollingEditor.current = true;
    const editor = textareaRef.current;
    const preview = previewContainerRef.current;
    const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
  };

  const handlePreviewScroll = () => {
    if (!isSyncScroll || isScrollingEditor.current || !textareaRef.current || !previewContainerRef.current) return;
    isScrollingPreview.current = true;
    const editor = textareaRef.current;
    const preview = previewContainerRef.current;
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    editor.scrollTop = scrollPercentage * (editor.scrollHeight - editor.clientHeight);
  };

  const handleScrollEnd = () => {
    isScrollingEditor.current = false;
    isScrollingPreview.current = false;
  };

  // Initial Load from LocalStorage
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

    // Load saved drafts history
    const savedDrafts = localStorage.getItem("markdown_preview_drafts_history");
    if (savedDrafts) {
      try {
        setDraftHistory(JSON.parse(savedDrafts));
      } catch (e) {
        console.error("Failed to parse draft history:", e);
      }
    }

    let initialText = "";
    if (typeof window !== "undefined" && window.location.hash.includes("doc=")) {
      try {
        const hashStr = window.location.hash;
        const match = hashStr.match(/#?doc=([^&]+)/);
        if (match && match[1]) {
          const rawHash = match[1];
          let decompressed = LZString.decompressFromEncodedURIComponent(rawHash);
          if (!decompressed) {
            decompressed = LZString.decompressFromBase64(rawHash);
          }
          if (!decompressed) {
            try {
              decompressed = decodeURIComponent(atob(rawHash));
            } catch (e) {
              // ignore
            }
          }
          if (decompressed) {
            initialText = decompressed;
          }
        }
      } catch (err) {
        console.error("Failed to decode URL Hash doc:", err);
      }
    }

    if (!initialText) {
      const savedContent = localStorage.getItem("markdown_preview_content");
      if (savedContent !== null) {
        initialText = savedContent;
      } else {
        initialText = SAMPLE_TEMPLATES[0].content;
      }
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

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplatesDropdown(false);
      }
      if (calloutRef.current && !calloutRef.current.contains(event.target as Node)) {
        setShowCalloutDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-Save & LocalStorage Draft History
  useEffect(() => {
    if (!isMounted) return;

    setAutoSaveStatus("Saving...");
    const timer = setTimeout(() => {
      localStorage.setItem("markdown_preview_content", markdown);
      localStorage.setItem("markdown_preview_view_mode", viewMode);
      localStorage.setItem("markdown_preview_split_width", splitWidth.toString());
      setAutoSaveStatus("Saved");

      // Save to Draft History snapshots (if text changed significantly)
      if (markdown.trim().length > 0) {
        setDraftHistory((prev) => {
          if (prev.length > 0 && prev[0].fullText === markdown) return prev;
          const newSnapshot: DraftSnapshot = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            previewText: markdown.trim().substring(0, 70) + (markdown.length > 70 ? "..." : ""),
            fullText: markdown
          };
          const updated = [newSnapshot, ...prev].slice(0, 15);
          localStorage.setItem("markdown_preview_drafts_history", JSON.stringify(updated));
          return updated;
        });
      }
    }, 1500);

    // Undo / Redo history tracking with debounced character grouping
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
    } else {
      if (history.length === 0) {
        setHistory([markdown]);
        setHistoryIndex(0);
      } else if (history[historyIndex] !== markdown) {
        const lastEntry = history[historyIndex] || "";
        const diffLength = Math.abs(markdown.length - lastEntry.length);
        // Push to history on space, newline, or when typing > 5 characters
        const isBoundaryChar = markdown.endsWith(" ") || markdown.endsWith("\n") || markdown.endsWith("\t");
        if (isBoundaryChar || diffLength >= 5 || historyIndex === 0) {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(markdown);
          if (newHistory.length > 200) newHistory.shift();
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      }
    }

    return () => clearTimeout(timer);
  }, [markdown, viewMode, splitWidth]);

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

  // Keyboard Shortcuts (Undo, Redo, Paste Image)
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

  // Pasting Images from Clipboard (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const base64Url = uploadEvent.target?.result as string;
          if (base64Url && textareaRef.current) {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const imageMarkdown = `\n![Pasted Image](${base64Url})\n`;
            const updated = markdown.substring(0, start) + imageMarkdown + markdown.substring(end);
            setMarkdown(updated);
            showToast("Image pasted and converted to Base64!");

            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
            }, 50);
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Drag & Drop File Upload
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith(".md") || name.endsWith(".txt") || name.endsWith(".markdown")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text !== undefined) {
          setMarkdown(text);
          showToast(`Loaded file: ${file.name}`);
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a .md, .txt, or .markdown file");
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types || []);
    if (types.includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only activate file drop overlay if dragging external OS files (not internal text selection)
    const types = Array.from(e.dataTransfer.types || []);
    if (types.includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      if (!isDraggingFile) setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  // Formatting insert helper
  const insertFormat = (prefix: string, suffix: string = "", defaultText: string = "") => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newMarkdown = markdown.substring(0, start) + replacement + markdown.substring(end);
    setMarkdown(newMarkdown);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = draftHistory.filter((d) => d.id !== id);
    setDraftHistory(updated);
    localStorage.setItem("markdown_preview_drafts_history", JSON.stringify(updated));
    showToast("Deleted draft snapshot");
  };

  const handleClearAllDrafts = () => {
    setDraftHistory([]);
    localStorage.removeItem("markdown_preview_drafts_history");
    showToast("Cleared all saved drafts");
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    showToast("Copied Markdown to clipboard!");
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleShareUrl = () => {
    try {
      const compressed = LZString.compressToEncodedURIComponent(markdown);
      const shareUrl = `${window.location.origin}${window.location.pathname}#doc=${compressed}`;
      navigator.clipboard.writeText(shareUrl);
      showToast("Copied compressed shareable URL link to clipboard!");
    } catch (e) {
      console.error("Failed to generate share URL:", e);
      showToast("Failed to generate share URL link");
    }
  };

  const handleCopyHtml = () => {
    if (previewRef.current) {
      navigator.clipboard.writeText(previewRef.current.innerHTML);
      setCopiedHtml(true);
      showToast("Copied HTML to clipboard!");
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const handleDownloadFile = (type: "md" | "html", selectedTheme?: "dark" | "light") => {
    let content = "";
    let filename = "";
    let mimeType = "";

    if (type === "md") {
      content = markdown;
      filename = "document.md";
      mimeType = "text/markdown";
    } else if (type === "html" && previewRef.current) {
      const isDarkHtml = selectedTheme ? selectedTheme === "dark" : isDark;
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Markdown Document</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.7/dist/katex.min.css">
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
    }
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

  // Accurate Multilingual Word Counter (Supports Thai without spaces & Western languages)
  const calculateWords = (text: string): number => {
    const trimmed = text.trim();
    if (!trimmed) return 0;

    // Use Intl.Segmenter if supported by browser for accurate Thai & CJK word segmentation
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      try {
        const segmenter = new (Intl as any).Segmenter(["th", "en"], { granularity: "word" });
        const segments = Array.from(segmenter.segment(trimmed));
        return segments.filter((s: any) => s.isWordLike).length;
      } catch (e) {
        // Fallback if segmenter fails
      }
    }

    // Fallback regex regex word matching
    const thaiWords = trimmed.match(/[\u0e00-\u0e7f]+/g) || [];
    const englishWords = trimmed.replace(/[\u0e00-\u0e7f]+/g, " ").trim().split(/\s+/).filter(Boolean);
    
    // Thai character length approximation (approx 4 chars per Thai word if unsegmented)
    const thaiWordEstimate = thaiWords.join("").length > 0 ? Math.ceil(thaiWords.join("").length / 4) : 0;
    return englishWords.length + thaiWordEstimate;
  };

  // Stats calculations
  const charCount = markdown.length;
  const wordCount = calculateWords(markdown);
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div
      className={`theme-${theme} flex flex-col h-screen overflow-hidden ${
        isDark ? "bg-[#0b0f17] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Modern Glassmorphic Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-6 z-50 px-4 py-3 rounded-2xl bg-[#0f172a]/95 border border-slate-700/70 text-slate-100 font-sans text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 max-w-md">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-slate-200 truncate flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <header
        className={`px-5 py-2.5 border-b flex items-center justify-between z-30 shadow-sm backdrop-blur-md transition-colors duration-300 ${
          isDark
            ? "bg-[#0e1626]/90 border-slate-800/80"
            : "bg-white/90 border-slate-200"
        }`}
      >
        {/* Left Header Branding & Auto-Save Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <h1 className="text-base font-bold tracking-tight hidden sm:block">
              Markdown <span className="text-cyan-500 font-extrabold">Barron</span>
            </h1>
          </div>

          <div className={`h-4 w-px ${isDark ? "bg-slate-800" : "bg-slate-300"} hidden sm:block`} />

          {/* Auto Save Badge */}
          <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/60 text-slate-300">
            <Save className={`w-3.5 h-3.5 ${autoSaveStatus === "Saving..." ? "text-amber-400" : "text-emerald-400"}`} />
            <span className="hidden xs:inline">{autoSaveStatus}</span>
          </div>

          {/* Draft History Button */}
          <button
            onClick={() => setShowDraftsModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              isDark
                ? "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            }`}
            title="View Saved Draft Snapshots"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Drafts ({draftHistory.length})</span>
          </button>
        </div>

        {/* Center: View Switcher */}
        <div
          className={`flex items-center p-0.5 rounded-xl border text-xs font-semibold ${
            isDark
              ? "bg-[#090d16] border-slate-800"
              : "bg-slate-100 border-slate-200"
          }`}
        >
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "split"
                ? "bg-cyan-500 text-white shadow-sm font-bold"
                : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Split View</span>
          </button>

          <button
            onClick={() => setViewMode("editor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "editor"
                ? "bg-cyan-500 text-white shadow-sm font-bold"
                : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Editor Only</span>
          </button>

          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "preview"
                ? "bg-cyan-500 text-white shadow-sm font-bold"
                : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Preview Only</span>
          </button>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          {/* Link to API Docs Page */}
          <Link
            href="/api-docs"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
            title="View API Documentation"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API Docs</span>
          </Link>

          {/* Share URL Link Button */}
          <button
            onClick={handleShareUrl}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
              isDark
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            }`}
            title="Copy shareable URL link with document content encoded"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Share URL</span>
          </button>



          {/* Copy Actions */}
          <button
            onClick={handleCopyMarkdown}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 border ${
              isDark
                ? "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
            }`}
            title="Copy Markdown"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">Copy MD</span>
          </button>

          <button
            onClick={handleCopyHtml}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 border ${
              isDark
                ? "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
            }`}
            title="Copy HTML"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden lg:inline">Copy HTML</span>
          </button>

          {/* Download Dropdown */}
          <div
            className={`flex border rounded-lg overflow-hidden text-xs ${
              isDark ? "bg-slate-800/80 border-slate-700/60" : "bg-white border-slate-300"
            }`}
          >
            <button
              onClick={() => handleDownloadFile("md")}
              className={`flex items-center gap-1 px-2.5 py-1.5 transition-all border-r ${
                isDark
                  ? "hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200"
              }`}
              title="Download .md file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">.MD</span>
            </button>
            <button
              onClick={() => setShowHtmlThemeModal(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 transition-all ${
                isDark
                  ? "hover:bg-slate-700 text-slate-300 hover:text-white"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              }`}
              title="Download .html file"
            >
              <span className="font-semibold text-indigo-400">.HTML</span>
            </button>
          </div>

          {/* Theme & Fullscreen & Clear */}
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
              isDark ? "text-slate-400 hover:text-cyan-400 hover:bg-slate-800" : "text-slate-600 hover:text-cyan-600 hover:bg-slate-200"
            }`}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleClear}
            className={`p-1.5 rounded-lg transition-all ${
              isDark ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10" : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            }`}
            title="Clear text"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Pane: Editor */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div
            style={{
              width: isMounted && viewMode === "split" && window.innerWidth >= 768 ? `${splitWidth}%` : undefined,
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
            className={`flex flex-col border-b md:border-b-0 transition-colors duration-300 relative ${
              viewMode === "split" ? "h-1/2 md:h-full" : "h-full w-full"
            } ${
              isDark ? "bg-[#0b0f17] border-slate-800/80" : "bg-white border-slate-200"
            } select-text`}
          >
            {/* Drag & Drop File Overlay */}
            {isDraggingFile && (
              <div className="absolute inset-0 z-40 bg-indigo-600/30 backdrop-blur-sm border-2 border-dashed border-indigo-400 rounded-xl flex flex-col items-center justify-center text-white gap-2 pointer-events-none animate-in fade-in">
                <Upload className="w-10 h-10 animate-bounce text-indigo-300" />
                <span className="text-base font-bold">Drop Markdown (.md / .txt) file here!</span>
              </div>
            )}

            {/* Pro Formatting Toolbar */}
            <div
              className={`flex items-center justify-between px-5 h-[41px] border-b relative z-20 transition-colors duration-300 ${
                isDark ? "bg-[#0e1626]/90 border-slate-800/70" : "bg-slate-100/90 border-slate-200"
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
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
                </button>

                <div className={`h-4 w-px mx-1.5 ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

                {/* Typography formatting */}
                <button
                  onClick={() => insertFormat("**", "**", "bold text")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("*", "*", "italic text")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("### ", "", "Heading")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Heading"
                >
                  <Heading className="w-4 h-4" />
                </button>

                <div className={`h-4 w-px mx-1.5 ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

                {/* Code, Quote, Callout, Math, Mermaid */}
                <button
                  onClick={() => insertFormat("`", "`", "code")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Inline Code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("> ", "", "Quote")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                {/* Callout / Alert Dropdown */}
                <div className="relative" ref={calloutRef}>
                  <button
                    onClick={() => setShowCalloutDropdown(!showCalloutDropdown)}
                    className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-indigo-400" : "hover:bg-slate-200 text-indigo-600"}`}
                    title="Insert GitHub Callout Alert (NOTE, TIP, IMPORTANT, WARNING, CAUTION)"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>

                  {showCalloutDropdown && (
                    <div
                      className={`absolute left-0 top-full mt-1.5 w-44 rounded-xl border shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs font-mono ${
                        isDark ? "bg-[#0f172a] border-slate-700 text-slate-100 shadow-black/80" : "bg-white border-slate-200 text-slate-900 shadow-slate-400/50"
                      }`}
                    >
                      {[
                        { type: "NOTE", label: "Note", color: "text-blue-400" },
                        { type: "TIP", label: "Tip", color: "text-emerald-400" },
                        { type: "IMPORTANT", label: "Important", color: "text-purple-400" },
                        { type: "WARNING", label: "Warning", color: "text-amber-400" },
                        { type: "CAUTION", label: "Caution", color: "text-rose-400" },
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => {
                            insertFormat(`> [!${item.type}]\n> `, "", `${item.type.toLowerCase()} message`);
                            setShowCalloutDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 font-bold flex items-center justify-between transition-colors ${
                            isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                          } ${item.color}`}
                        >
                          <span>[!{item.type}]</span>
                          <span className="text-[10px] text-slate-400 font-normal font-sans">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => insertFormat("$\n", "\n$", "E = mc^2")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-emerald-400" : "hover:bg-slate-200 text-emerald-600"}`}
                  title="Insert KaTeX Math Formula"
                >
                  <span className="font-mono font-bold text-xs">Fx</span>
                </button>
                <button
                  onClick={() => insertFormat("```mermaid\ngraph TD\n    A[Start] --> B[Finish]\n```\n", "")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-amber-400" : "hover:bg-slate-200 text-amber-600"}`}
                  title="Insert Mermaid Diagram"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("[", "](https://example.com)", "link text")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <div className={`h-4 w-px mx-1.5 ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

                {/* Lists & Tables */}
                <button
                  onClick={() => insertFormat("- ", "", "List item")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Unordered List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormat("1. ", "", "List item")}
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Ordered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    insertFormat("\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n", "")
                  }
                  className={`p-1.5 rounded-md transition-all ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-700"}`}
                  title="Table"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>

              {/* Upload File button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept=".md,.txt,.markdown"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  isDark
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                    : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                }`}
                title="Open / Import local .md or .txt file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Open File</span>
              </button>
            </div>

            {/* Editor Textarea */}
            <div className="flex-1 relative flex flex-col min-h-0">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onScroll={handleEditorScroll}
                onMouseLeave={handleScrollEnd}
                onTouchEnd={handleScrollEnd}
                placeholder="Type your markdown here... (Drag & drop files or Ctrl+V paste images supported)"
                className={`w-full flex-1 p-5 bg-transparent font-mono text-sm resize-none focus:outline-none leading-relaxed tracking-wide overflow-y-scroll ${
                  isDark
                    ? "text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200"
                    : "text-slate-800 selection:bg-cyan-200 selection:text-cyan-900"
                }`}
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Draggable Split Handle Divider */}
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
              <h2 className="flex items-center gap-2 text-xs font-semibold text-cyan-500 m-0 p-0 border-none">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                Live Render Output - Markdown Previewer
              </h2>
            </div>

            <div
              ref={previewContainerRef}
              onScroll={handlePreviewScroll}
              onMouseLeave={handleScrollEnd}
              onTouchEnd={handleScrollEnd}
              className={`flex-1 p-6 md:p-8 overflow-y-scroll ${isDark ? "bg-[#0b0f17]" : "bg-slate-50"}`}
            >
              <div ref={previewRef} className="markdown-body max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeHighlight, rehypeKatex]}
                  components={{
                    img({ node, src, alt, ...props }: any) {
                      const cleanSrc = typeof src === "string" ? src.trim().replace(/\s+/g, "") : "";
                      if (!cleanSrc) return null;
                      return (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={cleanSrc}
                          alt={alt || "Image"}
                          className="max-w-full h-auto rounded-xl shadow-md my-4 inline-block"
                          onError={(e) => {
                            // If base64 or URL fails to render, show placeholder gracefully
                            (e.target as HTMLElement).style.display = "none";
                          }}
                          {...props}
                        />
                      );
                    },
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      if (!inline && match && match[1] === "mermaid") {
                        return <MermaidRenderer chart={String(children).replace(/\n$/, "")} />;
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    blockquote({ children, ...props }: any) {
                      const { alertType, cleanContent } = processCalloutChildren(children);
                      if (alertType) {
                        return renderCalloutAlert(alertType, cleanContent);
                      }
                      return <blockquote {...props}>{children}</blockquote>;
                    },
                  }}
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
          isDark ? "bg-[#0e1626] border-slate-800/80 text-slate-400" : "bg-white border-slate-200 text-slate-600"
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

      {/* Drafts History Modal */}
      {showDraftsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl transition-all ${
              isDark ? "bg-[#0f172a] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">LocalStorage Saved Drafts</h3>
              </div>
              <div className="flex items-center gap-2">
                {draftHistory.length > 0 && (
                  <button
                    onClick={handleClearAllDrafts}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                    title="Clear All Saved Draft Snapshots"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDraftsModal(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {draftHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">No drafts saved yet.</div>
              ) : (
                draftHistory.map((draft) => (
                  <div
                    key={draft.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                      isDark ? "bg-slate-900/80 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-slate-400 mb-1">{draft.timestamp}</div>
                      <div className="font-mono text-slate-300 truncate">{draft.previewText}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setMarkdown(draft.fullText);
                          setShowDraftsModal(false);
                          showToast(`Restored draft from ${draft.timestamp}`);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className={`p-1.5 rounded-lg transition-all border ${
                          isDark
                            ? "border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
                            : "border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        }`}
                        title="Delete this draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
