import React, { useEffect, useRef } from "react";

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

  // Sync HTML from parent into the editable div (only when aiData.bodyHtml changes externally)
  const lastSyncedHtml = useRef(null);
  useEffect(() => {
    if (!editorRef?.current) return;
    // Only sync if html actually changed externally (not from user typing)
    if (aiData.bodyHtml !== lastSyncedHtml.current) {
      editorRef.current.innerHTML = aiData.bodyHtml || "";
      lastSyncedHtml.current = aiData.bodyHtml || "";
    }
  }, [aiData.bodyHtml]);

  const handleInput = () => {
    if (!editorRef?.current || !onContentChange) return;
    const html = editorRef.current.innerHTML;
    lastSyncedHtml.current = html;
    onContentChange(html);
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Single Page Layout */}
      <div
        className="official-letter-page w-[210mm] min-h-[297mm] h-[297mm] bg-white shadow-2xl text-black font-serif text-[12pt] leading-normal flex flex-col justify-between select-text mx-auto border border-slate-200 print:border-none print:shadow-none box-border relative overflow-hidden"
      >
        {/* Top Section: Header */}
        <div className="w-[210mm] relative overflow-hidden select-none shrink-0 border-b border-slate-100" style={{ height: "59.6mm" }}>
          <img
            src="/header_cropped.png"
            alt="Ministry of Digital Economy Letterhead"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />

          {/* Dynamic Overlay: My No. */}
          <div
            style={getOverlayStyle(formData.refNo, 50)}
            className="absolute left-[40mm] font-sans font-extrabold text-slate-800 tracking-wide"
          >
            {formData.refNo || "—"}
          </div>

          {/* Dynamic Overlay: Your No. */}
          <div
            style={getOverlayStyle(formData.yourNo, 34)}
            className="absolute left-[113mm] font-sans font-extrabold text-slate-800 tracking-wide"
          >
            {formData.yourNo || "—"}
          </div>

          {/* Dynamic Overlay: Date */}
          <div
            style={getOverlayStyle(formData.date, 24)}
            className="absolute left-[170mm] font-sans font-extrabold text-slate-800 tracking-wide"
          >
            {formData.date || "—"}
          </div>
        </div>

        {/* Middle Section: Padded Document Body */}
        <div className="flex-1 px-[25.4mm] pb-[11.5mm] flex flex-col justify-start shrink-0 pt-[6.5mm] overflow-hidden">

          {/* Recipient & Subject */}
          <div className="mb-8 text-left leading-relaxed text-[11.5pt] font-serif">
            <div className="font-bold text-slate-900">{formData.recipientDesignation}</div>
            <div className="text-slate-800">{formData.recipientCompany}</div>
          </div>

          <div className="mb-6 font-sans">
            <h1 className="font-extrabold text-[12.5pt] underline text-justify uppercase leading-snug tracking-tight text-slate-900">
              {aiData.subject || "UNTITLED DOCUMENT"}
            </h1>
          </div>

          {/* ── EDITABLE BODY ── */}
          {!readOnly ? (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={(e) => {
                // Allow normal typing; nothing to intercept
              }}
              className="
                flex-1 text-justify text-[11.5pt] leading-relaxed font-serif text-slate-850
                focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:ring-inset
                rounded-sm min-h-[60px] overflow-y-auto
                empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400
                empty:before:italic empty:before:pointer-events-none empty:before:font-sans
                empty:before:text-sm
              "
              data-placeholder="Click here to start typing the letter body… or use AI tools on the left to auto-generate."
              style={{ cursor: "text" }}
              spellCheck
            />
          ) : (
            /* Read-only: render HTML as-is */
            <div
              className="flex-1 text-justify text-[11.5pt] leading-relaxed font-serif text-slate-850"
              dangerouslySetInnerHTML={{ __html: aiData.bodyHtml || "" }}
            />
          )}

          {/* Signatories */}
          {hasSignatories && (
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
        </div>
      </div>
    </div>
  );
}
