const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { db } = require("../models/db");

/**
 * Helper to check if we should fall back to mock data
 */
function shouldMock() {
  const apiKey = process.env.GEMINI_API_KEY;
  return !apiKey || apiKey.startsWith("AQ.") || apiKey === "your_gemini_api_key_here";
}

/**
 * Advanced Mock Letter Generator based on subject keywords
 */
function generateAdvancedMockLetter(subject, recipientDesignation, recipientCompany) {
  const subjLower = (subject || "").toLowerCase();
  const recipientStr = recipientDesignation ? `${recipientDesignation} of ${recipientCompany || "your organization"}` : "the designated authority";

  let body = "";

  if (subjLower.includes("leave") || subjLower.includes("vacation") || subjLower.includes("absence")) {
    body = `I am writing to formally submit a request for an extension of leave, commencing from the scheduled date, due to unavoidable personal obligations. In accordance with the Human Resources protocols of the Ministry, all pending duties have been temporarily delegated to ensure operational continuity.

Furthermore, please find attached the necessary supporting documentation and certifications for your review. I assure you that I will remain accessible via email to address any urgent administrative matters that may arise during my absence.

I kindly request that you review this application and grant authorization for the aforementioned period. Your favorable consideration in this matter would be highly appreciated.`;
  } else if (subjLower.includes("equipment") || subjLower.includes("hardware") || subjLower.includes("computer") || subjLower.includes("laptop") || subjLower.includes("procure") || subjLower.includes("infrastructure") || subjLower.includes("device")) {
    body = `We write to formally submit a procurement request for critical office and technical infrastructure upgrades required to maintain operational efficiency within our department. The current equipment has reached its optimal lifecycle utility, resulting in frequent disruptions and system latency.

In alignment with the national digital transition directives, we propose the acquisition of modernized workstations and secure network hardware. Detailed technical specifications and budgetary estimates have been compiled in accordance with standard procurement guidelines.

We request your authorization to initiate the formal bidding and selection process. We look forward to your guidance and prompt approval to proceed with this essential modernization initiative.`;
  } else if (subjLower.includes("access") || subjLower.includes("database") || subjLower.includes("db") || subjLower.includes("network") || subjLower.includes("permission") || subjLower.includes("credentials")) {
    body = `I am writing to formally request the authorization and provisioning of database access credentials for the central information systems. This request is initiated to facilitate the retrieval of operational datasets required for daily administrative reporting and cross-departmental auditing.

Please be assured that all data handling protocols will strictly conform to the national cybersecurity framework and confidentiality agreements. Access will be limited to designated personnel for authorized official purposes only.

Therefore, we kindly request the IT systems administration department to grant the necessary credentials at your earliest convenience. Thank you for your cooperation and assistance in resolving this connectivity requirement.`;
  } else {
    body = `We write to formally bring to your attention the matter concerning the administrative request for the "${subject || "Official Correspondence Request"}". In accordance with the standard operating procedures of the Ministry, this office has initiated a comprehensive evaluation of the relevant files.

Furthermore, please be advised that the necessary assessments and inter-departmental consultations are currently underway. We anticipate providing a detailed progress update once the preliminary evaluations and statutory reviews are finalized.

We appreciate your cooperation in facilitating this process and look forward to a successful resolution. Should you require any additional clarifications, please do not hesitate to contact our secretariat.`;
  }

  return { content: body };
}

/**
 * Advanced Mock Letter Improver with programmatic polishing rules
 */
function generateAdvancedMockImprovement(content) {
  let polished = content || "";

  // Sophisticated administrative vocabulary replacements
  polished = polished
    .replace(/\bget the acces to work with\b/gi, "procure and provision authorized access credentials for")
    .replace(/\bget access to\b/gi, "secure official authorization credentials for")
    .replace(/\bget\b/gi, "procure")
    .replace(/\bgive\b/gi, "provide and extend")
    .replace(/\bneed\b/gi, "require")
    .replace(/\bwant\b/gi, "seek")
    .replace(/\bhelp\b/gi, "facilitate and support")
    .replace(/\bwork with\b/gi, "collaborate and operate with")
    .replace(/\bdb\b/gi, "central database infrastructure")
    .replace(/\bdatabase\b/gi, "relational data management repository")
    .replace(/\bacces\b/gi, "access credentials")
    .replace(/\bofficially\b/gi, "in an official administrative capacity")
    .replace(/\bbad\b/gi, "sub-optimal")
    .replace(/\bquick\b/gi, "expeditious")
    .replace(/\btell\b/gi, "convey and formally declare")
    .replace(/\bask\b/gi, "inquire and request");

  const lines = polished.split("\n").map(line => line.trim()).filter(Boolean);
  let finalPolished = "";
  
  if (lines.length > 0) {
    // Structure like a formal government document improvement
    finalPolished = `We write to formally address the correspondence previously submitted. In accordance with the standard protocols of the Ministry, the content has been refined for administrative clarity and formal presentation:

` + lines.join("\n\n") + `

Furthermore, please be assured that the wording now aligns fully with the established civil service communication guidelines.`;
  } else {
    finalPolished = `The provided document content has been successfully audited and polished to meet high-level administrative guidelines.`;
  }

  return { content: finalPolished };
}

/**
 * Advanced Mock Letter Auditor based on rule-based linguistic checking
 */
function generateAdvancedMockAudit(content) {
  const errors = [];
  const text = (content || "").toLowerCase();

  // Rule-based common drafting checks
  if (text.includes("acces") && !text.includes("access ")) {
    errors.push({
      type: "Grammar",
      issue: `Spelling error detected: "acces".`,
      suggestion: `Correct the spelling to "access" to maintain standard professional English.`
    });
  }
  if (text.includes("db")) {
    errors.push({
      type: "Format",
      issue: `Informal abbreviation "db" used instead of full form.`,
      suggestion: `Replace "db" with "database system" or "central database" for formal clarity.`
    });
  }
  if (text.includes("get")) {
    errors.push({
      type: "Tone",
      issue: `Use of the informal active verb "get".`,
      suggestion: `Use formal alternative verbs like "procure", "obtain", or "provision".`
    });
  }
  if (text.includes("need") || text.includes("want")) {
    errors.push({
      type: "Tone",
      issue: `Informal phrasing "need" or "want" detected.`,
      suggestion: `Use passive forms like "is required" or formal verbs like "request" / "necessitate".`
    });
  }

  // Fallbacks if no specific matches exist
  if (errors.length === 0) {
    errors.push({
      type: "Tone",
      issue: "The correspondence uses standard active phrasing.",
      suggestion: "Consider converting active expressions into passive voice (e.g., 'We write to inform you' to 'Please be informed that') to align with high-level administrative standards."
    });
    errors.push({
      type: "Format",
      issue: "Document layout structure verification.",
      suggestion: "Ensure there is a double-newline separating each paragraph in the main body block."
    });
  }

  return { errors };
}

/**
 * Helper to get the Gemini model instance.
 */
function getGeminiModel(systemInstruction) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the server environment. Please define it in your backend .env file.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction,
  });
}

/**
 * Generate official letter content
 */
exports.generate = async (req, res) => {
  try {
    const { subject, recipientDesignation, recipientCompany } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "Subject is required to generate the official letter" });
    }

    if (shouldMock()) {
      console.warn("⚠️  GEMINI_API_KEY is missing or invalid. Falling back to mock letter generation.");
      const mockResult = generateAdvancedMockLetter(subject, recipientDesignation, recipientCompany);
      return res.json(mockResult);
    }

    const systemInstruction = 
      "You are an elite Government Administrative AI Assistant operating in a high-level official state office. Your task is to draft formal, official correspondence that matches the administrative templates of ministries and state departments. Structure the letter with: an introduction paragraph presenting the request, a detailed rationale paragraph supporting it, and a polite, formal conclusion paragraph. Use passive voice, highly formal administrative vocabulary, and avoid abbreviations. Output strictly in JSON format without markdown. Schema: { \"content\": \"String containing the body paragraphs separated by double-newlines.\" }";

    const model = getGeminiModel(systemInstruction);

    const prompt = `Draft the body paragraphs of an official formal letter addressing the following context:
- Recipient Role/Designation: ${recipientDesignation || "N/A"}
- Recipient Company/Organization: ${recipientCompany || "N/A"}
- Subject: ${subject}

Write only the body paragraphs. Ensure a highly formal, government-appropriate tone.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response received from the Gemini model.");
    }

    // Parse the generated JSON response
    const letterData = JSON.parse(responseText.trim());
    return res.json(letterData);
  } catch (error) {
    console.error("Error generating official letter:", error);
    if (error.message && (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid") || error.message.includes("UNAUTHENTICATED"))) {
      console.warn("⚠️  Gemini API error detected. Falling back to mock letter generation.");
      const mockResult = generateAdvancedMockLetter(req.body.subject, req.body.recipientDesignation, req.body.recipientCompany);
      return res.json(mockResult);
    }
    return res.status(500).json({ 
      error: error.message || "Failed to generate letter content due to an internal server error." 
    });
  }
};

/**
 * Improve content formal tone and grammar
 */
exports.improve = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required to improve" });
    }

    if (shouldMock()) {
      console.warn("⚠️  GEMINI_API_KEY is missing or invalid. Falling back to mock letter improvement.");
      const mockResult = generateAdvancedMockImprovement(content);
      return res.json(mockResult);
    }

    const systemInstruction = 
      "You are an elite Government Administrative AI Assistant. Improve the provided official correspondence text. Enhance the syntax to use passive voice, sophisticated formal vocabulary, and clear transition phrases suitable for high-level civil service communications. Resolve all grammar, punctuation, and structural sub-optimalities. Output strictly in JSON format without markdown. Schema: { \"content\": \"String containing the improved text.\" }";

    const model = getGeminiModel(systemInstruction);

    const prompt = `Improve the following letter content for grammar, formal government tone, and clarity:\n\n${content}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response received from the Gemini model.");
    }

    const data = JSON.parse(responseText.trim());
    return res.json(data);
  } catch (error) {
    console.error("Error improving content:", error);
    if (error.message && (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid") || error.message.includes("UNAUTHENTICATED"))) {
      console.warn("⚠️  Gemini API error detected. Falling back to mock letter improvement.");
      const mockResult = generateAdvancedMockImprovement(req.body.content);
      return res.json(mockResult);
    }
    return res.status(500).json({ 
      error: error.message || "Failed to improve content due to an internal server error." 
    });
  }
};

/**
 * Audit content for grammar and tone mistakes
 */
exports.audit = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required for audit" });
    }

    if (shouldMock()) {
      console.warn("⚠️  GEMINI_API_KEY is missing or invalid. Falling back to mock letter audit.");
      const mockResult = generateAdvancedMockAudit(content);
      return res.json(mockResult);
    }

    const systemInstruction = 
      "You are an elite Government Document Auditor. Audit the provided letter text for spelling errors, formatting issues, and tone concerns (such as informal language, overly active phrasing, or colloquialisms). Identify each issue precisely and suggest a professional fix. Output strictly in JSON format without markdown. Schema: { \"errors\": [ { \"type\": \"Grammar\" | \"Tone\" | \"Format\", \"issue\": \"Specific description of the mistake\", \"suggestion\": \"Clear recommended revision\" } ] }";

    const model = getGeminiModel(systemInstruction);

    const prompt = `Audit the following letter content:\n\n${content}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response received from the Gemini model.");
    }

    const data = JSON.parse(responseText.trim());
    return res.json(data);
  } catch (error) {
    console.error("Error auditing content:", error);
    if (error.message && (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid") || error.message.includes("UNAUTHENTICATED"))) {
      console.warn("⚠️  Gemini API error detected. Falling back to mock letter audit.");
      const mockResult = generateAdvancedMockAudit(req.body.content);
      return res.json(mockResult);
    }
    return res.status(500).json({ 
      error: error.message || "Failed to audit content due to an internal server error." 
    });
  }
};

/**
 * GET user's saved GovScribe draft
 */
exports.getDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT ref_no, your_no, date, recipient_designation, recipient_company,
              subject, body_content, signatory_left_name, signatory_left_designation,
              signatory_right_name, signatory_right_designation, selected_theme
       FROM govscribe_drafts
       WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ draft: null });
    }
    return res.json({ draft: rows[0] });
  } catch (error) {
    console.error("Error getting draft:", error);
    return res.status(500).json({ error: "Failed to retrieve draft from server." });
  }
};

/**
 * POST save/autosave user's GovScribe draft
 */
exports.saveDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      refNo,
      yourNo,
      date,
      recipientDesignation,
      recipientCompany,
      subject,
      bodyContent,
      signatoryLeftName,
      signatoryLeftDesignation,
      signatoryRightName,
      signatoryRightDesignation,
      selectedTheme
    } = req.body;

    await db.query(
      `INSERT INTO govscribe_drafts (
        user_id, ref_no, your_no, date, recipient_designation, recipient_company,
        subject, body_content, signatory_left_name, signatory_left_designation,
        signatory_right_name, signatory_right_designation, selected_theme
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ref_no = VALUES(ref_no),
        your_no = VALUES(your_no),
        date = VALUES(date),
        recipient_designation = VALUES(recipient_designation),
        recipient_company = VALUES(recipient_company),
        subject = VALUES(subject),
        body_content = VALUES(body_content),
        signatory_left_name = VALUES(signatory_left_name),
        signatory_left_designation = VALUES(signatory_left_designation),
        signatory_right_name = VALUES(signatory_right_name),
        signatory_right_designation = VALUES(signatory_right_designation),
        selected_theme = VALUES(selected_theme)`,
      [
        userId, refNo || "", yourNo || "", date || "", recipientDesignation || "", recipientCompany || "",
        subject || "", bodyContent || "", signatoryLeftName || "", signatoryLeftDesignation || "",
        signatoryRightName || "", signatoryRightDesignation || "", selectedTheme || "navy"
      ]
    );

    return res.json({ success: true, message: "Draft saved on server." });
  } catch (error) {
    console.error("Error saving draft:", error);
    return res.status(500).json({ error: "Failed to save draft on server." });
  }
};

/**
 * POST export GovScribe letter to A4 PDF with multi-page pagination support
 */
exports.exportLetterPDF = async (req, res) => {
  try {
    const {
      refNo,
      yourNo,
      date,
      recipientDesignation,
      recipientCompany,
      subject,
      bodyContent,
      signatoryLeftName,
      signatoryLeftDesignation,
      signatoryRightName,
      signatoryRightDesignation
    } = req.body;

    // Define A4 dimensions (595.28 x 841.89 points)
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const headerHeight = 169; // 59.6mm in points
    const footerHeight = 67.5; // 23.8mm in points

    // Setup PDFkit document with standard margins.
    // Page 1 content is manually offset below the header, while pages 2+ automatically use the 72pt top margin.
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 72,
        bottom: 100, // Safe bottom margin above footer
        left: 72,
        right: 72
      },
      bufferPages: true // Enable buffering to calculate total pages for page numbers
    });

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Official_Letter_${refNo || "Draft"}.pdf"`);
    doc.pipe(res);

    // Load Letterhead images
    const headerPath = path.join(__dirname, "..", "assets", "header_cropped.png");
    const footerPath = path.join(__dirname, "..", "assets", "footer_cropped.png");

    // Page 1 Header and Footer drawing
    if (fs.existsSync(headerPath)) {
      doc.image(headerPath, 0, 0, { width: pageWidth, height: headerHeight });
    }
    if (fs.existsSync(footerPath)) {
      doc.image(footerPath, 0, pageHeight - footerHeight, { width: pageWidth, height: footerHeight });
    }

    // Draw metadata overlays on Page 1 Header with dynamic sizing and wrapping
    const getPdfOverlayStyle = (value) => {
      if (!value) return { fontSize: 10, lineGap: 0, yOffset: 0 };
      const len = value.length;
      if (len > 30) {
        return { fontSize: 7, lineGap: -1.5, yOffset: -3 };
      } else if (len > 20) {
        return { fontSize: 8, lineGap: 0, yOffset: -2 };
      } else if (len > 15) {
        return { fontSize: 9, lineGap: 0, yOffset: -1 };
      } else {
        return { fontSize: 10, lineGap: 0, yOffset: 0 };
      }
    };

    // My No (x: 113, max width: 50mm = 141 points)
    const refNoStyle = getPdfOverlayStyle(refNo);
    doc.fontSize(refNoStyle.fontSize).font("Helvetica-Bold").fillColor("#334155");
    doc.text(refNo || "—", 113, 143 + refNoStyle.yOffset, {
      width: 141,
      lineGap: refNoStyle.lineGap
    });

    // Your No (x: 320, max width: 34mm = 96 points)
    const yourNoStyle = getPdfOverlayStyle(yourNo);
    doc.fontSize(yourNoStyle.fontSize).font("Helvetica-Bold").fillColor("#334155");
    doc.text(yourNo || "—", 320, 143 + yourNoStyle.yOffset, {
      width: 96,
      lineGap: yourNoStyle.lineGap
    });

    // Date (x: 482, max width: 24mm = 68 points)
    const dateStyle = getPdfOverlayStyle(date);
    doc.fontSize(dateStyle.fontSize).font("Helvetica-Bold").fillColor("#334155");
    doc.text(date || "—", 482, 143 + dateStyle.yOffset, {
      width: 68,
      lineGap: dateStyle.lineGap
    });

    // Multi-page page added event handler
    doc.on("pageAdded", () => {
      // Draw footer on every new page
      if (fs.existsSync(footerPath)) {
        doc.image(footerPath, 0, pageHeight - footerHeight, { width: pageWidth, height: footerHeight });
      }
      doc.x = 72; // Ensure x is reset to left margin on page overflow
    });

    // Write Recipient
    doc.x = 72; // Reset x to left margin after drawing date header overlay
    doc.y = headerHeight + 20; // Ensure we start below header
    doc.fontSize(11.5).font("Times-Bold").fillColor("#0f172a");
    doc.text(recipientDesignation || "", { align: "left" });
    doc.font("Times-Roman").fillColor("#1e293b");
    doc.text(recipientCompany || "", { align: "left" });
    doc.moveDown(1.5);

    // Write Subject
    doc.fontSize(12.5).font("Helvetica-Bold").fillColor("#0f172a");
    const subjectText = subject ? subject.toUpperCase() : "UNTITLED DOCUMENT";
    doc.text(subjectText, {
      align: "justify",
      underline: true,
      lineGap: 3
    });
    doc.moveDown(1.5);

    // Write Body paragraphs
    doc.fontSize(11.5).font("Times-Roman").fillColor("#1e293b");
    const paragraphs = bodyContent ? bodyContent.split("\n\n").map(p => p.trim()).filter(Boolean) : [];
    
    if (paragraphs.length === 0) {
      doc.font("Times-Italic").fillColor("#94a3b8").text("No letter content drafted.", { align: "center" });
    } else {
      paragraphs.forEach((p) => {
        // Automatically checks for overflow and creates a new page when needed
        doc.text(p, {
          align: "justify",
          indent: 18, // 1/4 inch indent
          lineGap: 3.5
        });
        doc.moveDown(0.4);
      });
    }

    // Write Signatories
    const hasLeftSignatory = signatoryLeftName || signatoryLeftDesignation;
    const hasRightSignatory = signatoryRightName || signatoryRightDesignation;

    if (hasLeftSignatory || hasRightSignatory) {
      doc.moveDown(2);
      
      // Check Y position: Signatories need about 80 points.
      // If current cursor Y exceeds 660, start signatories on a fresh page to prevent overflow clipping.
      if (doc.y > 660) {
        doc.addPage();
      }

      // Removed horizontal line above signatories per request
      doc.moveDown(1);

      const sigY = doc.y;
      const blockWidth = 180;

      // Left Signatory (starts at left margin x = 72)
      if (hasLeftSignatory) {
        if (signatoryLeftName) {
          doc.fontSize(11).font("Times-Italic").fillColor("#3730a3");
          doc.text(`Sgd / ${signatoryLeftName.split(" ")[0]}`, 72, sigY, { width: blockWidth });
          
          doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(72, sigY + 16).lineTo(72 + 150, sigY + 16).stroke();
          
          doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(signatoryLeftName, 72, sigY + 24, { width: blockWidth });
        }
        if (signatoryLeftDesignation) {
          doc.fontSize(8.5).font("Helvetica").fillColor("#64748b");
          doc.text(signatoryLeftDesignation, 72, signatoryLeftName ? sigY + 36 : sigY, { width: blockWidth, lineGap: 1 });
        }
      }

      // Right Signatory (starts at right margin boundary x = pageWidth - 72 - blockWidth)
      if (hasRightSignatory) {
        const rightSigX = pageWidth - 72 - blockWidth;
        if (signatoryRightName) {
          doc.fontSize(11).font("Times-Italic").fillColor("#3730a3");
          doc.text(`Sgd / ${signatoryRightName.split(" ")[0]}`, rightSigX, sigY, { align: "right", width: blockWidth });
          
          doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(pageWidth - 72 - 150, sigY + 16).lineTo(pageWidth - 72, sigY + 16).stroke();
          
          doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f172a");
          doc.text(signatoryRightName, rightSigX, sigY + 24, { align: "right", width: blockWidth });
        }
        if (signatoryRightDesignation) {
          doc.fontSize(8.5).font("Helvetica").fillColor("#64748b");
          doc.text(signatoryRightDesignation, rightSigX, signatoryRightName ? sigY + 36 : sigY, { align: "right", width: blockWidth, lineGap: 1 });
        }
      }
    }

    // Page Numbers loop (e.g. Page X of Y)
    const range = doc.bufferedPageRange();
    if (range.count > 1) {
      for (let i = range.start; i < range.start + range.count; i++) {
        // Skip page numbering on the first page of multi-page documents
        if (i === range.start) continue;

        doc.switchToPage(i);
        
        // Temporarily set bottom margin to 0 to prevent text drawing from triggering a page break
        const oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        
        // Page numbering drawn in footer
        doc.fontSize(8).font("Helvetica").fillColor("#64748b");
        doc.text(
          `Page ${i - range.start + 1} of ${range.count}`,
          72,
          pageHeight - 80,
          { align: "right", width: pageWidth - 144 }
        );
        
        // Restore bottom margin
        doc.page.margins.bottom = oldBottomMargin;
      }
    }

    doc.end();
  } catch (error) {
    console.error("Error exporting PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to export PDF due to an internal server error." });
    }
  }
};
