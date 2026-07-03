import React, { useState, useEffect, useRef } from "react";

// Helper to parse HTML string into individual paragraphs/sentences block HTML strings
const parseHtmlToBlocks = (html) => {
  if (!html) return [];
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const blocks = [];
  const children = Array.from(tempDiv.childNodes);

  children.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "P") {
      const phtml = node.innerHTML.trim();
      if (!phtml) return;

      // Heuristic: if paragraph is long, try splitting into sentences to flow across pages
      if (node.textContent.length > 300) {
        const sentences = node.innerHTML.split(/(?<=[.!?])\s+/);
        let safeToSplit = true;
        sentences.forEach(s => {
          const openCount = (s.match(/<[a-zA-Z]+/g) || []).length;
          const closeCount = (s.match(/<\/[a-zA-Z]+/g) || []).length;
          if (openCount !== closeCount) {
            safeToSplit = false;
          }
        });

        if (safeToSplit && sentences.length > 1) {
          sentences.forEach(s => {
            blocks.push(`<p>${s.trim()}</p>`);
          });
          return;
        }
      }
      blocks.push(`<p>${phtml}</p>`);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) {
        blocks.push(`<p>${text}</p>`);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      blocks.push(`<p>${node.outerHTML}</p>`);
    }
  });

  return blocks;
};

// A4 Dimensions in points
const PAGE_HEIGHT_PT = 842;
const PAGE_WIDTH_PT = 595.28;

// Available heights for body content on Page 1 vs subsequent pages
const PAGE_1_MAX_BODY_HEIGHT = 478;
const PAGE_N_MAX_BODY_HEIGHT = 670;

const SIGNATORIES_HEIGHT = 90;

const estimateBlockHeight = (blockHtml) => {
  const temp = document.createElement("div");
  temp.innerHTML = blockHtml;
  const text = temp.textContent || "";

  const brCount = (blockHtml.match(/<br\s*\/?>/gi) || []).length;
  const charLines = Math.ceil(text.length / 80) || 1;
  const totalLines = charLines + brCount;

  // Font height (11.5pt) + lineGap (3.5pt) = 15pt per line.
  // Add paragraph separation margin of 10pt.
  return totalLines * 15 + 10;
};

const paginateContent = (htmlContent, hasSignatories) => {
  const blocks = parseHtmlToBlocks(htmlContent);
  const pages = [];

  let currentPageBlocks = [];
  let currentY = 0;
  let isPage1 = true;

  const getPageLimit = (isFirstPage) => {
    return isFirstPage ? PAGE_1_MAX_BODY_HEIGHT : PAGE_N_MAX_BODY_HEIGHT;
  };

  blocks.forEach((block) => {
    const blockHeight = estimateBlockHeight(block);
    const pageLimit = getPageLimit(isPage1);

    if (currentY + blockHeight > pageLimit) {
      pages.push({
        blocks: currentPageBlocks,
        isPage1,
        showSignatories: false
      });
      currentPageBlocks = [block];
      currentY = blockHeight;
      isPage1 = false;
    } else {
      currentPageBlocks.push(block);
      currentY += blockHeight;
    }
  });

  const pageLimit = getPageLimit(isPage1);
  if (hasSignatories) {
    if (currentY + SIGNATORIES_HEIGHT > pageLimit) {
      pages.push({
        blocks: currentPageBlocks,
        isPage1,
        showSignatories: false
      });
      pages.push({
        blocks: [],
        isPage1: false,
        showSignatories: true
      });
    } else {
      pages.push({
        blocks: currentPageBlocks,
        isPage1,
        showSignatories: true
      });
    }
  } else {
    pages.push({
      blocks: currentPageBlocks,
      isPage1,
      showSignatories: false
    });
  }

  return pages;
};

export default function OfficialLetter({ formData, aiData, editorRef, onContentChange, readOnly = false }) {
  const getOverlayStyle = (value, maxWidthMm) => {
    if (!value) return { fontSize: "10pt", lineHeight: "1.2", maxWidth: `${maxWidthMm}mm`, top: "50.5mm" };
    const len = value.length;
    let fontSize = "10pt";
    let lineHeight = "1.2";
    let top = "50.5mm";
    if (len > 30) {
      fontSize = "7pt";
      lineHeight = "1.0";
      top = "49.5mm";
    } else if (len > 20) {
      fontSize = "8pt";
      lineHeight = "1.1";
      top = "50.0mm";
    } else if (len > 15) {
      fontSize = "9pt";
      lineHeight = "1.1";
      top = "50.2mm";
    }
    return {
      fontSize,
      lineHeight,
      top,
      maxWidth: `${maxWidthMm}mm`,
      wordBreak: "break-all",
      whiteSpace: "normal"
    };
  };

  const hasSignatories = !!(formData.signatoryLeftName || formData.signatoryLeftDesignation || formData.signatoryRightName || formData.signatoryRightDesignation);

  const [pages, setPages] = useState([]);
  const [activePageEditIndex, setActivePageEditIndex] = useState(null);
  const [localPagesHtml, setLocalPagesHtml] = useState([]);
  const blurTimeoutRef = useRef(null);

  // Sync external changes into pagination structure when not editing
  useEffect(() => {
    if (activePageEditIndex === null) {
      const paginated = paginateContent(aiData.bodyHtml, hasSignatories);
      setPages(paginated);
      setLocalPagesHtml(paginated.map(p => p.blocks.join("")));
    }
  }, [aiData.bodyHtml, hasSignatories, activePageEditIndex]);

  // Clean up blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handlePageFocus = (index, e) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setActivePageEditIndex(index);
    if (editorRef) {
      editorRef.current = e.currentTarget;
    }
  };

  const handlePageBlur = () => {
    // Wait a short delay to see if another page receives focus
    blurTimeoutRef.current = setTimeout(() => {
      setActivePageEditIndex(null);
      blurTimeoutRef.current = null;
    }, 150);
  };

  const handlePageInput = (index, e) => {
    const newHtml = e.currentTarget.innerHTML;

    // Update local HTML cache
    const updatedHtmls = [...localPagesHtml];
    updatedHtmls[index] = newHtml;
    setLocalPagesHtml(updatedHtmls);

    // Also update virtual DOM pages structure to prevent React from resetting the DOM and creating infinite loops
    const updatedPages = [...pages];
    if (updatedPages[index]) {
      updatedPages[index] = {
        ...updatedPages[index],
        blocks: [newHtml]
      };
      setPages(updatedPages);
    }

    if (onContentChange) {
      onContentChange(updatedHtmls.join(""));
    }
  };

  return (
    <div className="flex flex-col space-y-6 select-text w-full">
      {pages.map((page, index) => {
        const isFirstPage = page.isPage1;
        const totalPages = pages.length;

        return (
          <div
            key={index}
            className="official-letter-page w-[210mm] min-h-[297mm] h-[297mm] bg-white shadow-2xl text-black font-serif text-[12pt] leading-normal flex flex-col justify-between select-text mx-auto border border-slate-200 print:border-none print:shadow-none box-border relative overflow-hidden"
          >
            {/* Top Section: Header */}
            {isFirstPage ? (
              <div className="w-[210mm] relative overflow-hidden select-none shrink-0 border-b border-slate-100" style={{ height: "59.6mm" }}>
                <img
                  src="/header_cropped.png"
                  alt="Ministry of Digital Economy Letterhead"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                />

                {/* Dynamic Overlay: My No. */}
                <div
                  style={getOverlayStyle(formData.refNo, 50)}
                  className="absolute left-[43mm] font-sans font-extrabold text-slate-800 tracking-wide"
                >
                  {formData.refNo || "-"}
                </div>

                {/* Dynamic Overlay: Your No. */}
                <div
                  style={getOverlayStyle(formData.yourNo, 34)}
                  className="absolute left-[120mm] font-sans font-extrabold text-slate-800 tracking-wide"
                >
                  {formData.yourNo || "-"}
                </div>

                {/* Dynamic Overlay: Date */}
                <div
                  style={getOverlayStyle(formData.date, 24)}
                  className="absolute left-[172mm] font-sans font-extrabold text-slate-800 tracking-wide"
                >
                  {formData.date || "-"}
                </div>
              </div>
            ) : (
              /* Top Spacer for Page 2+ to match PDF export margins */
              <div className="w-[210mm] shrink-0" style={{ height: "25.4mm" }} />
            )}

            {/* Middle Section: Padded Document Body */}
            <div className="flex-1 px-[25.4mm] pb-[11.5mm] flex flex-col justify-start shrink-0 pt-[6.5mm] overflow-hidden">

              {/* Recipient & Subject (Only on Page 1) */}
              {isFirstPage && (
                <>
                  <div className="mb-8 text-left leading-relaxed text-[11.5pt] font-serif">
                    <div className="font-bold text-slate-900">{formData.recipientDesignation}</div>
                    <div className="text-slate-800">{formData.recipientCompany}</div>
                  </div>

                  <div className="mb-6 font-sans">
                    <h1 className="font-extrabold text-[12.5pt] underline text-justify uppercase leading-snug tracking-tight text-slate-900">
                      {aiData.subject || "UNTITLED DOCUMENT"}
                    </h1>
                  </div>
                </>
              )}

              {/* ── EDITABLE BODY ── */}
              {!readOnly ? (
                <div
                  ref={(el) => {
                    if (index === activePageEditIndex && editorRef) {
                      editorRef.current = el;
                    }
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={(e) => handlePageFocus(index, e)}
                  onBlur={handlePageBlur}
                  onInput={(e) => handlePageInput(index, e)}
                  className="
                    flex-1 text-justify text-[11.5pt] leading-relaxed font-serif text-slate-850
                    focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:ring-inset
                    rounded-sm min-h-[60px] overflow-hidden
                    empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400
                    empty:before:italic empty:before:pointer-events-none empty:before:font-sans
                    empty:before:text-sm
                  "
                  data-placeholder={index === 0 ? "Click here to start typing the letter body… or use AI tools on the left to auto-generate." : ""}
                  style={{ cursor: "text" }}
                  spellCheck
                  dangerouslySetInnerHTML={{ __html: page.blocks.join("") }}
                />
              ) : (
                /* Read-only: render HTML as-is */
                <div
                  className="flex-1 text-justify text-[11.5pt] leading-relaxed font-serif text-slate-850"
                  dangerouslySetInnerHTML={{ __html: page.blocks.join("") }}
                />
              )}

              {/* Signatories */}
              {page.showSignatories && (
                <div className="border-t border-slate-100 pt-6 mt-8 flex justify-between items-end text-[10.5pt] font-sans shrink-0">

                  {/* Left Signatory */}
                  {(formData.signatoryLeftName || formData.signatoryLeftDesignation) && (
                    <div className="flex flex-col items-start text-left min-w-[180px] max-w-[260px]">
                      <div className="h-8 mb-1 flex items-end">
                        <span className="italic font-serif text-[12pt] text-indigo-800/80 font-bold select-none">
                          {formData.signatoryLeftName ? `Sgd / ${formData.signatoryLeftName.split(' ')[0]}` : ""}
                        </span>
                      </div>
                      <div className="w-full h-[1px] bg-slate-300 my-1" />
                      <span className="font-extrabold text-slate-900 leading-tight">
                        {formData.signatoryLeftName}
                      </span>
                      <span className="text-[9pt] text-slate-500 font-semibold uppercase tracking-wider mt-0.5 leading-snug">
                        {formData.signatoryLeftDesignation}
                      </span>
                    </div>
                  )}

                  {/* Right Signatory */}
                  {(formData.signatoryRightName || formData.signatoryRightDesignation) && (
                    <div className="flex flex-col items-end text-right min-w-[180px] max-w-[260px]">
                      <div className="h-8 mb-1 flex items-end">
                        <span className="italic font-serif text-[12pt] text-indigo-800/80 font-bold select-none">
                          {formData.signatoryRightName ? `Sgd / ${formData.signatoryRightName.split(' ')[0]}` : ""}
                        </span>
                      </div>
                      <div className="w-full h-[1px] bg-slate-300 my-1" />
                      <span className="font-extrabold text-slate-900 leading-tight">
                        {formData.signatoryRightName}
                      </span>
                      <span className="text-[9pt] text-slate-500 font-semibold uppercase tracking-wider mt-0.5 leading-snug">
                        {formData.signatoryRightDesignation}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Section: Footer */}
            <div className="w-[210mm] relative overflow-hidden select-none shrink-0 border-t border-slate-100" style={{ height: "23.8mm" }}>
              <img
                src="/footer_cropped.png"
                alt="Ministry of Digital Economy Footer"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom" }}
              />

              {/* Page Number Overlay in Footer */}
              {!isFirstPage && totalPages > 1 && (
                <div className="absolute right-[25.4mm] bottom-[8mm] text-[8pt] font-sans font-semibold text-slate-500">
                  Page {index + 1} of {totalPages}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
