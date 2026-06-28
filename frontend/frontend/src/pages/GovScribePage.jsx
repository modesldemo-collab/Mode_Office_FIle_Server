import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Users,
  ZoomIn,
  ZoomOut,
  Printer,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Eye,
  Building,
  ArrowLeft,
  LayoutTemplate,
  Wand2,
  ShieldAlert,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { GovScribeAPI } from "../api";
import OfficialLetter from "../components/OfficialLetter";
import { RichTextToolbar, FloatingSelectionToolbar } from "../components/RichTextToolbar";

// Accent theme presets for the premium official letter preview
const THEMES = [
  {
    id: "navy",
    name: "Classic Navy",
    primary: "border-slate-800 text-slate-800",
    accent: "bg-slate-800",
    bgLight: "bg-slate-50",
    textMuted: "text-slate-600",
    crestColor: "text-amber-600",
    badge: "bg-slate-100 text-slate-800 border-slate-200"
  },
  {
    id: "emerald",
    name: "Emerald Prestige",
    primary: "border-emerald-800 text-emerald-800",
    accent: "bg-emerald-800",
    bgLight: "bg-emerald-50",
    textMuted: "text-emerald-700/80",
    crestColor: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200"
  },
  {
    id: "crimson",
    name: "Crimson Heritage",
    primary: "border-rose-900 text-rose-900",
    accent: "bg-rose-900",
    bgLight: "bg-rose-50",
    textMuted: "text-rose-800/80",
    crestColor: "text-amber-600",
    badge: "bg-rose-100 text-rose-800 border-rose-200"
  },
  {
    id: "amber",
    name: "Imperial Amber",
    primary: "border-amber-900 text-amber-900",
    accent: "bg-amber-950",
    bgLight: "bg-amber-50/50",
    textMuted: "text-amber-900/70",
    crestColor: "text-amber-700",
    badge: "bg-amber-100 text-amber-900 border-amber-200"
  }
];

export function GovScribePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // --- STATE MANAGEMENT ---
  const [currentStep, setCurrentStep] = useState("template-selection");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Metadata state
  const [refNumber, setRefNumber] = useState("");
  const [yourNo, setYourNo] = useState("");
  const [date, setDate] = useState("");

  // Recipient state
  const [recipientDesignation, setRecipientDesignation] = useState("");
  const [recipientCompany, setRecipientCompany] = useState("");

  // Signatories state (Left and Right)
  const [leftSigName, setLeftSigName] = useState("");
  const [leftSigDesignation, setLeftSigDesignation] = useState("");
  const [rightSigName, setRightSigName] = useState("");
  const [rightSigDesignation, setRightSigDesignation] = useState("");

  // Content state
  const [subject, setSubject] = useState("");
  const [bodyContent, setBodyContent] = useState("");

  // Audit state
  const [auditResults, setAuditResults] = useState(null);

  // Layout & UI states
  const [zoomScale, setZoomScale] = useState(0.8);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saving", "saved", "error"
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Rich text editor ref (points to contenteditable in OfficialLetter)
  const editorRef = useRef(null);
  // Preview container ref for floating toolbar scope
  const previewContainerRef = useRef(null);

  // --- LIFECYCLE: LOAD DRAFT ---
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const response = await GovScribeAPI.getDraft();
        if (response.data && response.data.draft) {
          const draft = response.data.draft;
          setRefNumber(draft.ref_no || "");
          setYourNo(draft.your_no || "");
          setDate(draft.date || "");
          setRecipientDesignation(draft.recipient_designation || "");
          setRecipientCompany(draft.recipient_company || "");
          setSubject(draft.subject || "");
          // body_content may be plain text (legacy) or HTML
          setBodyContent(draft.body_content || "");
          setLeftSigName(draft.signatory_left_name || "");
          setLeftSigDesignation(draft.signatory_left_designation || "");
          setRightSigName(draft.signatory_right_name || "");
          setRightSigDesignation(draft.signatory_right_designation || "");

          const savedTheme = THEMES.find(t => t.id === draft.selected_theme) || THEMES[0];
          setSelectedTheme(savedTheme);
          setSelectedTemplateId("official-letter");
          setCurrentStep("editor");
        }
      } catch (err) {
        console.error("Failed to load draft:", err);
      }
    };
    loadDraft();
  }, []);

  // --- LIFECYCLE: DEBOUCED AUTOSAVE ---
  useEffect(() => {
    if (currentStep !== "editor") return;
    setSaveStatus("saving");

    const delayDebounceFn = setTimeout(async () => {
      try {
        await GovScribeAPI.saveDraft({
          refNo: refNumber,
          yourNo,
          date,
          recipientDesignation,
          recipientCompany,
          subject,
          bodyContent,
          signatoryLeftName: leftSigName,
          signatoryLeftDesignation: leftSigDesignation,
          signatoryRightName: rightSigName,
          signatoryRightDesignation: rightSigDesignation,
          selectedTheme: selectedTheme?.id || "navy"
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveStatus("error");
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [
    currentStep, refNumber, yourNo, date, recipientDesignation, recipientCompany,
    subject, bodyContent, leftSigName, leftSigDesignation, rightSigName, rightSigDesignation, selectedTheme
  ]);

  // --- HANDLERS ---
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    setCurrentStep("editor");
  };

  const handleZoom = (direction) => {
    if (direction === "in" && zoomScale < 1.25) {
      setZoomScale((prev) => parseFloat((prev + 0.05).toFixed(2)));
    } else if (direction === "out" && zoomScale > 0.5) {
      setZoomScale((prev) => parseFloat((prev - 0.05).toFixed(2)));
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const getPlainText = () => {
    if (!bodyContent) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = bodyContent;
    return tempDiv.innerText || "";
  };

  // 1. Auto-generate from Subject
  const handleAutoGenerate = async () => {
    if (!subject) {
      setErrorMsg("Please enter a Subject first to auto-generate content.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setAuditResults(null);

    try {
      const response = await GovScribeAPI.generate({
        subject,
        recipientDesignation,
        recipientCompany,
      });

      // Convert plain-text paragraphs → HTML paragraphs
      const raw = response.data.content || "";
      const html = raw.split("\n\n").map(p => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`).join("");
      setBodyContent(html);
      showSuccess("Content generated successfully!");
    } catch (err) {
      console.error("Generation failed:", err);
      const errMsg = err?.response?.data?.error || err.message || "Failed to auto-generate content.";
      setErrorMsg(errMsg);
      const fallbackHtml = `<p>This is an auto-generated fallback response for: ${subject}</p><p>Please verify your API key.</p>`;
      setBodyContent(fallbackHtml);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Improve with AI
  const handleImprove = async () => {
    if (!bodyContent) {
      setErrorMsg("Please enter some content to improve.");
      return;
    }

    setIsImproving(true);
    setErrorMsg(null);
    setAuditResults(null);

    try {
      // Strip HTML to get plain text for the API, then convert result back to HTML
      const plainText = getPlainText();
      const response = await GovScribeAPI.improve({ content: plainText });
      const raw = response.data.content || "";
      const html = raw.split("\n\n").map(p => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`).join("");
      setBodyContent(html);
      showSuccess("Content improved with AI!");
    } catch (err) {
      console.error("Improvement failed:", err);
      const errMsg = err?.response?.data?.error || err.message || "Failed to improve content.";
      setErrorMsg(errMsg);
    } finally {
      setIsImproving(false);
    }
  };

  // 3. Full Document Audit
  const handleAudit = async () => {
    if (!bodyContent) {
      setErrorMsg("Please enter some content to audit.");
      return;
    }

    setIsAuditing(true);
    setErrorMsg(null);
    setAuditResults(null);

    try {
      const plainText = getPlainText();
      const response = await GovScribeAPI.audit({ content: plainText });
      setAuditResults(response.data.errors || []);
      if (response.data.errors && response.data.errors.length === 0) {
        showSuccess("Audit complete: No issues found!");
      }
    } catch (err) {
      console.error("Audit failed:", err);
      const errMsg = err?.response?.data?.error || err.message || "Failed to audit content.";
      setErrorMsg(errMsg);
    } finally {
      setIsAuditing(false);
    }
  };

  const resetForm = () => {
    setRefNumber("");
    setYourNo("");
    setDate("");
    setRecipientDesignation("");
    setRecipientCompany("");
    setLeftSigName("");
    setLeftSigDesignation("");
    setRightSigName("");
    setRightSigDesignation("");
    setSubject("");
    setBodyContent("");
    setAuditResults(null);
    setErrorMsg(null);
  };

  const getPreviewData = () => {
    return {
      subject: subject ? subject.toUpperCase() : "UNTITLED DOCUMENT",
      bodyHtml: bodyContent,
    };
  };

  // Called by OfficialLetter contenteditable onInput
  const handleEditorContentChange = (html) => {
    setBodyContent(html);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    try {
      // Send plain text to PDF export
      const plainText = getPlainText();
      const response = await GovScribeAPI.exportPDF({
        refNo: refNumber,
        yourNo,
        date,
        recipientDesignation,
        recipientCompany,
        subject,
        bodyContent: plainText,
        signatoryLeftName: leftSigName,
        signatoryLeftDesignation: leftSigDesignation,
        signatoryRightName: rightSigName,
        signatoryRightDesignation: rightSigDesignation
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Official_Letter_${refNumber || "Draft"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export failed:", err);
      setErrorMsg("Failed to export A4 PDF document.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- RENDER TEMPLATE SELECTION ---
  if (currentStep === "template-selection") {
    return (
      <div className="w-full flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">
            Select a Document Template
          </h2>
          <p className="text-sm text-[var(--text-soft)] max-w-2xl">
            Choose from our curated collection of official government templates. GovScribe's AI will help you generate formal content tailored to your requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Template Card: Official Letter */}
          <div
            onClick={() => handleTemplateSelect('official-letter')}
            className="group cursor-pointer bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="h-44 bg-[var(--bg-soft)] relative overflow-hidden flex items-center justify-center border-b border-[var(--border-main)]">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <FileText className="h-16 w-16 text-[var(--text-soft)] group-hover:text-cyan-500 transition-colors duration-300" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                  Featured
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 group-hover:text-cyan-400 transition-colors">
                Official Government Letter
              </h3>
              <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                A high-fidelity formal letterhead template designed for inter-departmental communications and official government directives.
              </p>
            </div>
          </div>

          {/* Placeholder for future templates */}
          <div className="bg-[var(--bg-panel)]/50 border border-dashed border-[var(--border-main)] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center min-h-[250px]">
            <LayoutTemplate className="h-10 w-10 text-[var(--text-soft)]/50 mb-3" />
            <h3 className="text-sm font-bold text-[var(--text-soft)] mb-1">
              More Templates Coming Soon
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Cabinet Memorandums, Circulars, and Gazette Notifications are being prepared.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER EDITOR ---
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[calc(100vh-8.5rem)] min-h-[500px]">

      {/* LEFT PANEL: Form Inputs */}
      <aside className="print:hidden w-full lg:w-[40%] xl:w-[35%] flex flex-col bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-lg h-full">

        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-soft)]/20">
          <button
            onClick={() => setCurrentStep("template-selection")}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Templates</span>
          </button>

          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-[10px] text-rose-400 font-semibold">
                Autosave failed
              </span>
            )}
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg text-[var(--text-soft)] hover:text-[var(--text-main)] hover:bg-[var(--bg-soft)] transition-colors cursor-pointer"
              title="Reset Form Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Metadata */}
          <div className="bg-[var(--bg-soft)]/30 p-4 rounded-xl border border-[var(--border-main)] space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2">
              <FileText className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                Letter Metadata
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-soft)] mb-1 uppercase">
                  My Ref No.
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-main)] focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="GS-2026-0001"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-soft)] mb-1 uppercase">
                  Your Ref No.
                </label>
                <input
                  type="text"
                  value={yourNo}
                  onChange={(e) => setYourNo(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-main)] focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="MTHPA/AV/Pro"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-soft)] mb-1 uppercase">
                  Effective Date
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="May 19, 2026"
                />
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div className="bg-[var(--bg-soft)]/30 p-4 rounded-xl border border-[var(--border-main)] space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2">
              <Building className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                Recipient Address Block
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-soft)] mb-1 uppercase">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={recipientDesignation}
                  onChange={(e) => setRecipientDesignation(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="e.g., Chief Executive Officer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-soft)] mb-1 uppercase">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={recipientCompany}
                  onChange={(e) => setRecipientCompany(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="e.g., GovTech Sri Lanka"
                />
              </div>
            </div>
          </div>

          {/* Content Builder */}
          <div className="bg-[var(--bg-soft)]/30 p-4 rounded-xl border border-[var(--border-main)] space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2">
              <FileCheck className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                Document Content Builder
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-soft)] mb-1 uppercase">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] px-3 py-1.5 text-xs font-bold text-[var(--text-main)] focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="Enter the official subject of the letter..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-soft)] mb-1 uppercase flex justify-between">
                  <span>Body Content</span>
                  <span className="text-[var(--text-muted)] normal-case">
                    {bodyContent.replace(/<[^>]+>/g, "").length} chars
                  </span>
                </label>
                <textarea
                  value={bodyContent.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")}
                  onChange={(e) => {
                    // Convert plain text lines → HTML paragraphs and sync to preview
                    const lines = e.target.value.split("\n\n");
                    const html = lines.map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
                    setBodyContent(html);
                  }}
                  rows={7}
                  className="w-full rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] px-3 py-2 text-xs leading-5 text-[var(--text-main)] focus:border-cyan-500 focus:outline-none transition-all resize-y font-sans"
                  placeholder="Type letter body here, or use the AI tools below. You can also click and type directly inside the document preview →"
                />
                {/* Hint about preview toolbar */}
                <p className="text-[9px] text-cyan-500/70 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                  </svg>
                  For <strong className="font-bold">Bold / Italic / Underline</strong> — click inside the preview &amp; use the toolbar, or select text in the preview.
                </p>
              </div>

              {/* AI action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  disabled={isGenerating || isImproving || isAuditing}
                  className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Auto-generate
                </button>
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={isGenerating || isImproving || isAuditing || !bodyContent}
                  className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isImproving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Improve
                </button>
              </div>

              <button
                type="button"
                onClick={handleAudit}
                disabled={isGenerating || isImproving || isAuditing || !bodyContent}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isAuditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                Full Document Audit
              </button>

              {/* Audit Results Panel */}
              {auditResults !== null && (
                <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-main)]">
                  <div className="bg-[var(--bg-soft)]/50 px-3 py-2 flex items-center justify-between border-b border-[var(--border-main)]">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-bold text-[var(--text-main)]">Audit Report</span>
                    </div>
                    <span className="text-[9px] bg-[var(--bg-panel)] px-2 py-0.5 rounded-full font-bold text-[var(--text-soft)]">
                      {auditResults.length} Issues
                    </span>
                  </div>
                  <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                    {auditResults.length === 0 ? (
                      <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Your document looks flawless!
                      </p>
                    ) : (
                      auditResults.map((err, idx) => (
                        <div key={idx} className="bg-amber-500/5 border border-amber-500/20 p-2 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="uppercase text-[8px] font-extrabold text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                              {err.type}
                            </span>
                            <span className="text-[10px] font-semibold text-[var(--text-main)]">
                              {err.issue}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-soft)] pl-1.5 border-l border-amber-500/40 ml-1">
                            Suggestion: <span className="font-medium">{err.suggestion}</span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signatories */}
          <div className="bg-[var(--bg-soft)]/30 p-4 rounded-xl border border-[var(--border-main)] space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2">
              <Users className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                Official Signatories
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2 p-2.5 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg">
                <span className="text-[9px] font-bold text-cyan-400 tracking-wider uppercase block">
                  Left Signatory
                </span>
                <div>
                  <label className="block text-[8px] font-bold text-[var(--text-soft)] mb-0.5">NAME</label>
                  <input
                    type="text"
                    value={leftSigName}
                    onChange={(e) => setLeftSigName(e.target.value)}
                    className="w-full rounded border border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs text-[var(--text-main)] focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-[var(--text-soft)] mb-0.5">DESIGNATION</label>
                  <input
                    type="text"
                    value={leftSigDesignation}
                    onChange={(e) => setLeftSigDesignation(e.target.value)}
                    className="w-full rounded border border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs text-[var(--text-soft)] focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 p-2.5 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg">
                <span className="text-[9px] font-bold text-cyan-400 tracking-wider uppercase block">
                  Right Signatory
                </span>
                <div>
                  <label className="block text-[8px] font-bold text-[var(--text-soft)] mb-0.5">NAME</label>
                  <input
                    type="text"
                    value={rightSigName}
                    onChange={(e) => setRightSigName(e.target.value)}
                    className="w-full rounded border border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs text-[var(--text-main)] focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-[var(--text-soft)] mb-0.5">DESIGNATION</label>
                  <input
                    type="text"
                    value={rightSigDesignation}
                    onChange={(e) => setRightSigDesignation(e.target.value)}
                    className="w-full rounded border border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1 text-xs text-[var(--text-soft)] focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* RIGHT PANEL: Live Preview Canvas */}
      <main className="print:border-none print:shadow-none print:bg-white flex-1 flex flex-col bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-lg h-full relative">

        {/* Canvas Toolbar Header: top row */}
        <header className="print:hidden border-b border-[var(--border-main)] shrink-0">
          {/* Top bar: title + zoom + export */}
          <div className="px-5 py-2 bg-[var(--bg-soft)]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-500 animate-pulse" />
              <h2 className="text-xs font-bold tracking-wider text-[var(--text-soft)] uppercase">
                Live Preview
              </h2>
              <span className="hidden sm:inline text-[9px] text-[var(--text-muted)] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded font-semibold">
                Click in document to edit
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoom("out")}
                disabled={zoomScale <= 0.4}
                className="p-1 rounded bg-[var(--bg-main)] border border-[var(--border-main)] hover:bg-[var(--bg-soft)] text-[var(--text-main)] disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] font-mono font-bold w-10 text-center text-[var(--text-soft)] select-none">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                onClick={() => handleZoom("in")}
                disabled={zoomScale >= 1.25}
                className="p-1 rounded bg-[var(--bg-main)] border border-[var(--border-main)] hover:bg-[var(--bg-soft)] text-[var(--text-main)] disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <span className="h-4 w-[1px] bg-[var(--border-main)] mx-1" />

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-1 py-1 px-2.5 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm shadow-purple-500/20 disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                <span>{isExporting ? "Exporting..." : "Export A4 PDF"}</span>
              </button>
            </div>
          </div>

          {/* Word-like Formatting Toolbar */}
          <RichTextToolbar
            editorRef={editorRef}
            disabled={isGenerating || isImproving || isAuditing}
          />
        </header>

        {/* Floating selection toolbar rendered at document level */}
        <FloatingSelectionToolbar containerRef={previewContainerRef} />

        {/* Centered Document Canvas Viewport */}
        <div ref={previewContainerRef} className="print:p-0 print:bg-white flex-1 overflow-auto flex items-start justify-center p-6 relative bg-[var(--bg-main)]">

          {/* Live Alerts */}
          {successMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce z-20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg shadow-lg flex items-center gap-1.5 z-20">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* A4 Paper Component Wrapper with dynamic scaling */}
          <div
            style={{ transform: `scale(${zoomScale})` }}
            className={`official-letter-print-container transition-all duration-350 origin-top flex items-center justify-center ${(isGenerating || isImproving || isAuditing) ? "animate-pulse ring-4 ring-cyan-500/30 rounded-sm shadow-2xl" : ""
              }`}
          >
            <OfficialLetter
              formData={{
                refNo: refNumber,
                yourNo: yourNo,
                date: date,
                recipientDesignation,
                recipientCompany,
                signatoryLeftName: leftSigName,
                signatoryLeftDesignation: leftSigDesignation,
                signatoryRightName: rightSigName,
                signatoryRightDesignation: rightSigDesignation,
              }}
              aiData={getPreviewData()}
              editorRef={editorRef}
              onContentChange={handleEditorContentChange}
            />
          </div>

        </div>

      </main>

    </div>
  );
}
