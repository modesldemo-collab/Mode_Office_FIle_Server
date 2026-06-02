import React from "react";

export default function OfficialLetter({ formData, aiData }) {
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

  // Helper to split paragraphs into pages based on character capacity
  const paginateParagraphs = (paragraphs, hasSignatories) => {
    const pages = [];
    let currentPageParagraphs = [];
    let currentChars = 0;
    
    // Page 1 capacity: less because of header image
    const page1Capacity = hasSignatories ? 1200 : 1700;
    const nextPageCapacity = 2400;
    
    let isPage1 = true;
    
    for (let p of paragraphs) {
      const pLen = p.length;
      const capacity = isPage1 ? page1Capacity : nextPageCapacity;
      
      if (currentChars + pLen > capacity && currentPageParagraphs.length > 0) {
        pages.push(currentPageParagraphs);
        currentPageParagraphs = [p];
        currentChars = pLen;
        isPage1 = false;
      } else {
        currentPageParagraphs.push(p);
        currentChars += pLen;
      }
    }
    
    if (currentPageParagraphs.length > 0) {
      pages.push(currentPageParagraphs);
    }
    
    if (pages.length === 0) {
      pages.push([]);
    }
    
    return pages;
  };

  const hasSignatories = !!(formData.signatoryLeftName || formData.signatoryLeftDesignation || formData.signatoryRightName || formData.signatoryRightDesignation);
  const pages = paginateParagraphs(aiData.body_paragraphs || [], hasSignatories);

  return (
    <div className="flex flex-col space-y-6">
      {pages.map((pageParagraphs, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;
        
        return (
          <div 
            key={pageIdx} 
            className="official-letter-page w-[210mm] min-h-[297mm] h-[297mm] bg-white shadow-2xl text-black font-serif text-[12pt] leading-normal flex flex-col justify-between select-text mx-auto border border-slate-200 print:border-none print:shadow-none box-border relative overflow-hidden"
          >
            {/* Top Section: Header (Page 1 only) */}
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
            ) : (
              // Spacer for pages 2+ to match the 72pt (25.4mm) top margin
              <div className="h-[25.4mm] shrink-0" />
            )}

            {/* Middle Section: Padded Document Body (Align with PDF margins: left/right 25.4mm, bottom 11.5mm + footer = 100pt) */}
            <div className={`flex-1 px-[25.4mm] pb-[11.5mm] flex flex-col justify-start shrink-0 ${isFirstPage ? "pt-[6.5mm]" : "pt-0"}`}>
              
              {/* Recipient & Subject (Page 1 only) */}
              {isFirstPage && (
                <>
                  <div className="mb-8 text-left leading-relaxed text-[11.5pt] font-serif">
                    <div className="font-bold text-slate-900">{formData.recipientDesignation}</div>
                    <div className="text-slate-800">{formData.recipientCompany}</div>
                  </div>

                  <div className="mb-6 font-sans">
                    <h1 className="font-extrabold text-[12.5pt] underline text-justify uppercase leading-snug tracking-tight text-slate-900">
                      {aiData.subject}
                    </h1>
                  </div>
                </>
              )}

              {/* Body Content */}
              <div className="space-y-2.5 text-justify text-[11.5pt] leading-relaxed flex-1 font-serif text-slate-850">
                {pageParagraphs.length > 0 ? (
                  pageParagraphs.map((paragraph, index) => (
                    <p key={index} className="text-justify indent-5">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  isFirstPage && (
                    <p className="text-slate-400 italic text-center pt-8 font-sans">
                      Please enter the letter intent in the Left Panel and click generate to draft the official directive.
                    </p>
                  )
                )}
              </div>

              {/* Signatories (Last Page only) */}
              {isLastPage && hasSignatories && (
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

            {/* Bottom Section: Footer (All pages) */}
            <div className="w-[210mm] relative overflow-hidden select-none shrink-0 border-t border-slate-100" style={{ height: "23.8mm" }}>
              <img 
                src="/footer_cropped.png" 
                alt="Ministry of Digital Economy Footer" 
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom" }}
              />
              
              {/* Page Numbering in Footer if multi-page */}
              {pages.length > 1 && pageIdx > 0 && (
                <div className="absolute right-[25.4mm] bottom-[14mm] font-sans text-[8pt] text-slate-500 font-semibold">
                  Page {pageIdx + 1} of {pages.length}
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
