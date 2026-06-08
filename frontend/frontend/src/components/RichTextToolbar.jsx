import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Toolbar Button ──────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, disabled, title, children, className = "" }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // prevent losing selection
        if (!disabled) onClick(e);
      }}
      disabled={disabled}
      title={title}
      className={`
        inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold transition-all
        ${active
          ? "bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/60"
          : "text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-main)]"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ─── Separator ───────────────────────────────────────────────────────────────
function Sep() {
  return <span className="h-5 w-px bg-[var(--border-main)] mx-0.5 shrink-0" />;
}

// ─── Format State Hook ───────────────────────────────────────────────────────
function useFormatState(editorRef) {
  const [state, setState] = useState({
    bold: false, italic: false, underline: false,
    strikeThrough: false, justifyLeft: false, justifyCenter: false,
    justifyRight: false, justifyFull: false,
    insertUnorderedList: false, insertOrderedList: false,
    fontSize: "3", fontFamily: "Times New Roman",
  });

  const refresh = useCallback(() => {
    try {
      setState({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        fontSize: document.queryCommandValue("fontSize") || "3",
        fontFamily: document.queryCommandValue("fontName") || "Times New Roman",
      });
    } catch (_) {}
  }, []);

  return { state, refresh };
}

// ─── exec helper ─────────────────────────────────────────────────────────────
function exec(cmd, value = null) {
  document.execCommand(cmd, false, value);
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────
export function RichTextToolbar({ editorRef, disabled }) {
  const { state, refresh } = useFormatState(editorRef);

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    return () => document.removeEventListener("selectionchange", refresh);
  }, [refresh]);

  const fontSizes = [
    { label: "8pt", value: "1" }, { label: "10pt", value: "2" },
    { label: "12pt", value: "3" }, { label: "14pt", value: "4" },
    { label: "18pt", value: "5" }, { label: "24pt", value: "6" },
    { label: "36pt", value: "7" },
  ];

  const fontFamilies = [
    "Times New Roman", "Arial", "Georgia", "Calibri",
    "Verdana", "Courier New", "Trebuchet MS",
  ];

  const handleFontSize = (e) => {
    exec("fontSize", e.target.value);
    editorRef.current?.focus();
    refresh();
  };

  const handleFontFamily = (e) => {
    exec("fontName", e.target.value);
    editorRef.current?.focus();
    refresh();
  };

  const handleColor = (e) => {
    exec("foreColor", e.target.value);
    editorRef.current?.focus();
  };

  const handleHighlight = (e) => {
    exec("hiliteColor", e.target.value);
    editorRef.current?.focus();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 bg-[var(--bg-soft)]/30 border-b border-[var(--border-main)] select-none overflow-x-auto"
      style={{ minHeight: "40px" }}
    >
      {/* Font Family */}
      <select
        value={state.fontFamily}
        onChange={handleFontFamily}
        disabled={disabled}
        className="h-6 text-[10px] rounded border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] px-1 cursor-pointer focus:outline-none focus:border-cyan-500 max-w-[110px]"
        title="Font Family"
      >
        {fontFamilies.map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* Font Size */}
      <select
        value={state.fontSize}
        onChange={handleFontSize}
        disabled={disabled}
        className="h-6 text-[10px] rounded border border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] px-1 cursor-pointer focus:outline-none focus:border-cyan-500 w-14"
        title="Font Size"
      >
        {fontSizes.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      <Sep />

      {/* Bold */}
      <ToolBtn onClick={() => exec("bold")} active={state.bold} disabled={disabled} title="Bold (Ctrl+B)">
        <span style={{ fontWeight: 900 }}>B</span>
      </ToolBtn>

      {/* Italic */}
      <ToolBtn onClick={() => exec("italic")} active={state.italic} disabled={disabled} title="Italic (Ctrl+I)">
        <span style={{ fontStyle: "italic" }}>I</span>
      </ToolBtn>

      {/* Underline */}
      <ToolBtn onClick={() => exec("underline")} active={state.underline} disabled={disabled} title="Underline (Ctrl+U)">
        <span style={{ textDecoration: "underline" }}>U</span>
      </ToolBtn>

      {/* Strike */}
      <ToolBtn onClick={() => exec("strikeThrough")} active={state.strikeThrough} disabled={disabled} title="Strikethrough">
        <span style={{ textDecoration: "line-through" }}>S</span>
      </ToolBtn>

      <Sep />

      {/* Text Color */}
      <label title="Text Color" className="relative w-7 h-7 flex items-center justify-center cursor-pointer rounded hover:bg-[var(--bg-soft)] group">
        <span className="text-[10px] font-extrabold text-[var(--text-main)] leading-none">A</span>
        <span className="absolute bottom-[3px] left-1 right-1 h-[3px] rounded-sm bg-yellow-400 group-hover:bg-yellow-300 transition-colors" />
        <input
          type="color"
          defaultValue="#000000"
          onChange={handleColor}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </label>

      {/* Highlight Color */}
      <label title="Highlight Color" className="relative w-7 h-7 flex items-center justify-center cursor-pointer rounded hover:bg-[var(--bg-soft)] group">
        <svg className="w-4 h-4 text-[var(--text-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h6" />
        </svg>
        <input
          type="color"
          defaultValue="#ffff00"
          onChange={handleHighlight}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </label>

      <Sep />

      {/* Alignment */}
      <ToolBtn onClick={() => exec("justifyLeft")} active={state.justifyLeft} disabled={disabled} title="Align Left">
        <AlignLeftIcon />
      </ToolBtn>
      <ToolBtn onClick={() => exec("justifyCenter")} active={state.justifyCenter} disabled={disabled} title="Align Center">
        <AlignCenterIcon />
      </ToolBtn>
      <ToolBtn onClick={() => exec("justifyRight")} active={state.justifyRight} disabled={disabled} title="Align Right">
        <AlignRightIcon />
      </ToolBtn>
      <ToolBtn onClick={() => exec("justifyFull")} active={state.justifyFull} disabled={disabled} title="Justify">
        <AlignJustifyIcon />
      </ToolBtn>

      <Sep />

      {/* Lists */}
      <ToolBtn onClick={() => exec("insertUnorderedList")} active={state.insertUnorderedList} disabled={disabled} title="Bullet List">
        <BulletListIcon />
      </ToolBtn>
      <ToolBtn onClick={() => exec("insertOrderedList")} active={state.insertOrderedList} disabled={disabled} title="Numbered List">
        <NumberedListIcon />
      </ToolBtn>

      <Sep />

      {/* Indent / Outdent */}
      <ToolBtn onClick={() => exec("indent")} disabled={disabled} title="Increase Indent">
        <IndentIcon />
      </ToolBtn>
      <ToolBtn onClick={() => exec("outdent")} disabled={disabled} title="Decrease Indent">
        <OutdentIcon />
      </ToolBtn>

      <Sep />

      {/* Undo / Redo */}
      <ToolBtn onClick={() => exec("undo")} disabled={disabled} title="Undo (Ctrl+Z)">
        <UndoIcon />
      </ToolBtn>
      <ToolBtn onClick={() => exec("redo")} disabled={disabled} title="Redo (Ctrl+Y)">
        <RedoIcon />
      </ToolBtn>

      <Sep />

      {/* Clear Formatting */}
      <ToolBtn onClick={() => exec("removeFormat")} disabled={disabled} title="Clear Formatting">
        <ClearFormatIcon />
      </ToolBtn>
    </div>
  );
}

// ─── Floating Selection Toolbar ────────────────────────────────────────────────
export function FloatingSelectionToolbar({ containerRef }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [state, setState] = useState({ bold: false, italic: false, underline: false });
  const toolbarRef = useRef(null);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setVisible(false);
      return;
    }

    const text = sel.toString().trim();
    if (!text) { setVisible(false); return; }

    // Make sure selection is within the containerRef
    if (containerRef?.current) {
      const anchorNode = sel.anchorNode;
      if (!containerRef.current.contains(anchorNode)) {
        setVisible(false);
        return;
      }
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    const toolbarHeight = 36;
    const toolbarWidth = 280;

    let top = rect.top + scrollTop - toolbarHeight - 8;
    let left = rect.left + scrollLeft + rect.width / 2 - toolbarWidth / 2;

    // Prevent going off-screen left/right
    left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));
    if (top < scrollTop + 8) top = rect.bottom + scrollTop + 8;

    setPos({ top, left });
    setState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
    setVisible(true);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", checkSelection);
    document.addEventListener("mouseup", checkSelection);
    return () => {
      document.removeEventListener("selectionchange", checkSelection);
      document.removeEventListener("mouseup", checkSelection);
    };
  }, [checkSelection]);

  const handleFormat = (cmd) => {
    exec(cmd);
    // Slight delay then re-check state
    setTimeout(() => {
      setState({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    }, 10);
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[9999] flex items-center gap-1 px-2 py-1.5 rounded-lg shadow-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] backdrop-blur-md"
      style={{ top: pos.top, left: pos.left, pointerEvents: "auto" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Triangle pointer */}
      <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[var(--bg-panel)]" />

      <FloatBtn onClick={() => handleFormat("bold")} active={state.bold} title="Bold">
        <span className="font-black text-[11px]">B</span>
      </FloatBtn>
      <FloatBtn onClick={() => handleFormat("italic")} active={state.italic} title="Italic">
        <span className="italic font-bold text-[11px]">I</span>
      </FloatBtn>
      <FloatBtn onClick={() => handleFormat("underline")} active={state.underline} title="Underline">
        <span className="underline font-bold text-[11px]">U</span>
      </FloatBtn>
      <FloatBtn onClick={() => handleFormat("strikeThrough")} title="Strikethrough">
        <span className="line-through font-bold text-[11px]">S</span>
      </FloatBtn>

      <span className="h-4 w-px bg-[var(--border-main)] mx-0.5" />

      <FloatBtn onClick={() => exec("justifyLeft")} title="Align Left"><AlignLeftIcon /></FloatBtn>
      <FloatBtn onClick={() => exec("justifyCenter")} title="Center"><AlignCenterIcon /></FloatBtn>
      <FloatBtn onClick={() => exec("justifyRight")} title="Align Right"><AlignRightIcon /></FloatBtn>

      <span className="h-4 w-px bg-[var(--border-main)] mx-0.5" />

      <FloatBtn onClick={() => exec("removeFormat")} title="Clear Format">
        <ClearFormatIcon />
      </FloatBtn>

      {/* Text color quick picks */}
      <span className="h-4 w-px bg-[var(--border-main)] mx-0.5" />
      {["#000000", "#dc2626", "#2563eb", "#16a34a"].map(color => (
        <button
          key={color}
          onMouseDown={(e) => { e.preventDefault(); exec("foreColor", color); }}
          title={`Color: ${color}`}
          className="w-4 h-4 rounded-full border border-white/20 cursor-pointer hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function FloatBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`
        inline-flex items-center justify-center w-7 h-7 rounded text-[var(--text-soft)]
        hover:bg-[var(--bg-soft)] hover:text-[var(--text-main)] transition-all cursor-pointer
        ${active ? "bg-cyan-500/30 text-cyan-300" : ""}
      `}
    >
      {children}
    </button>
  );
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const AlignLeftIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1"/>
    <rect x="1" y="6" width="9" height="2" rx="1"/>
    <rect x="1" y="10" width="12" height="2" rx="1"/>
    <rect x="1" y="14" width="7" height="2" rx="1"/>
  </svg>
);

const AlignCenterIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1"/>
    <rect x="3.5" y="6" width="9" height="2" rx="1"/>
    <rect x="2" y="10" width="12" height="2" rx="1"/>
    <rect x="4.5" y="14" width="7" height="2" rx="1"/>
  </svg>
);

const AlignRightIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1"/>
    <rect x="6" y="6" width="9" height="2" rx="1"/>
    <rect x="3" y="10" width="12" height="2" rx="1"/>
    <rect x="8" y="14" width="7" height="2" rx="1"/>
  </svg>
);

const AlignJustifyIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1"/>
    <rect x="1" y="6" width="14" height="2" rx="1"/>
    <rect x="1" y="10" width="14" height="2" rx="1"/>
    <rect x="1" y="14" width="9" height="2" rx="1"/>
  </svg>
);

const BulletListIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
    <circle cx="2" cy="4" r="1.5"/>
    <rect x="5" y="3" width="10" height="2" rx="1"/>
    <circle cx="2" cy="9" r="1.5"/>
    <rect x="5" y="8" width="10" height="2" rx="1"/>
    <circle cx="2" cy="14" r="1.5"/>
    <rect x="5" y="13" width="10" height="2" rx="1"/>
  </svg>
);

const NumberedListIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
    <text x="0" y="5" fontSize="5" fontWeight="bold">1.</text>
    <rect x="5" y="3" width="10" height="2" rx="1"/>
    <text x="0" y="10" fontSize="5" fontWeight="bold">2.</text>
    <rect x="5" y="8" width="10" height="2" rx="1"/>
    <text x="0" y="15" fontSize="5" fontWeight="bold">3.</text>
    <rect x="5" y="13" width="10" height="2" rx="1"/>
  </svg>
);

const IndentIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
    <rect x="1" y="2" width="14" height="1.5" rx="0.75"/>
    <path d="M1 6l4 2.5L1 11z"/>
    <rect x="7" y="7.25" width="8" height="1.5" rx="0.75"/>
    <rect x="1" y="13" width="14" height="1.5" rx="0.75"/>
  </svg>
);

const OutdentIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
    <rect x="1" y="2" width="14" height="1.5" rx="0.75"/>
    <path d="M5 6l-4 2.5L5 11z"/>
    <rect x="1" y="7.25" width="8" height="1.5" rx="0.75"/>
    <rect x="1" y="13" width="14" height="1.5" rx="0.75"/>
  </svg>
);

const UndoIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8A5 5 0 1 1 4.9 12"/>
    <path d="M1 5.5L3.5 8 6 5.5"/>
  </svg>
);

const RedoIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.5 8A5 5 0 1 0 11.1 12"/>
    <path d="M15 5.5L12.5 8 10 5.5"/>
  </svg>
);

const ClearFormatIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 3l10 10M6.5 3h6l-3 4h3l-5 6M3 13h4"/>
  </svg>
);
