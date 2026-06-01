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

  return (
    <div className="official-letter-page w-[210mm] min-h-[297mm] bg-white shadow-2xl text-black font-serif text-[12pt] leading-normal flex flex-col justify-between select-text mx-auto border border-slate-200 print:border-none print:shadow-none box-border relative overflow-hidden">
      
      {/* Top Section: High-Fidelity Full-Bleed Letterhead Header (Cropped Aspect Ratio = 3.525) */}
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

      {/* Middle Section: Padded Document Body (Standard 1-inch left/right margins) */}
      <div className="flex-1 px-[25.4mm] pt-[6mm] pb-[10mm] flex flex-col justify-start">
        
        {/* Recipient Address Block (margin bottom 8, left aligned) */}
        <div className="mb-8 text-left leading-relaxed text-[11.5pt] font-serif">
          <div className="font-bold text-slate-900">{formData.recipientDesignation}</div>
          <div className="text-slate-800">{formData.recipientCompany}</div>
        </div>

        {/* Subject: Bold, Underlined, text-justify */}
        <div className="mb-6 font-sans">
          <h1 className="font-extrabold text-[12.5pt] underline text-justify uppercase leading-snug tracking-tight text-slate-900">
            {aiData.subject}
          </h1>
        </div>

        {/* Body: Map through body paragraphs with text-justify and bottom margins */}
        <div className="space-y-4 text-justify text-[11.5pt] leading-relaxed flex-1 font-serif text-slate-850">
          {aiData.body_paragraphs && aiData.body_paragraphs.length > 0 ? (
            aiData.body_paragraphs.map((paragraph, index) => (
              <p key={index} className="text-justify indent-8">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-slate-400 italic text-center pt-8 font-sans">
              Please enter the letter intent in the Left Panel and click generate to draft the official directive.
            </p>
          )}
        </div>

        {/* Signatories block (flex space-between, mt-12, styled inside the text margins) */}
        <div className="border-t border-slate-100 pt-6 mt-12 flex justify-between items-end text-[10.5pt] font-sans shrink-0">
          
          {/* Left Signatory */}
          <div className="flex flex-col items-start text-left min-w-[180px] max-w-[260px]">
            {/* Simulated Signature */}
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

          {/* Right Signatory */}
          <div className="flex flex-col items-end text-right min-w-[180px] max-w-[260px]">
            {/* Simulated Signature */}
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

        </div>

      </div>

      {/* Bottom Section: High-Fidelity Full-Bleed Letterhead Footer (Cropped Aspect Ratio = 8.81) */}
      <div className="w-[210mm] relative overflow-hidden select-none shrink-0 border-t border-slate-100" style={{ height: "23.8mm" }}>
        <img 
          src="/footer_cropped.png" 
          alt="Ministry of Digital Economy Footer" 
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom" }}
        />
      </div>

    </div>
  );
}
