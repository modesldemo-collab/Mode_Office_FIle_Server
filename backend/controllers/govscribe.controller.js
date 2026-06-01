const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { db } = require("../models/db");

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

    const systemInstruction = 
      "You are an elite Administrative AI Assistant operating within a high-level government entity. Draft highly formal, professional official correspondence based on the user intent. You MUST output strictly in JSON format without markdown blocks. Schema: { \"content\": \"String containing the entire body of the letter, with paragraphs separated by two newlines (\\n\\n). Do not include the subject line, salutation, or sign-off in this content block, ONLY the core body paragraphs.\" }.";

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

    const systemInstruction = 
      "You are an elite Administrative AI Assistant operating within a high-level government entity. Improve the grammar, formal tone, and clarity of the provided official correspondence text. You MUST output strictly in JSON format without markdown blocks. Schema: { \"content\": \"String containing the improved text\" }.";

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

    const systemInstruction = 
      "You are an elite Government Document Auditor. Audit the following letter content for grammar mistakes, formal tone errors, and formatting issues. You MUST output strictly in JSON format without markdown blocks. Schema: { \"errors\": [ { \"type\": \"Grammar\" | \"Tone\" | \"Format\", \"issue\": \"Description of the issue\", \"suggestion\": \"Suggested fix\" } ] }.";

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

    // Setup PDFkit document
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: headerHeight + 20, // margin below header image
        bottom: footerHeight + 40, // margin above footer image
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
      
      // On pages 2+, start drawing slightly higher because there's no header image
      doc.y = 100;
    });

    // Write Recipient
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
          indent: 24, // 1/3 inch indent
          lineGap: 4
        });
        doc.moveDown(0.8);
      });
    }

    // Write Signatories
    doc.moveDown(2);
    
    // Check Y position: Signatories need about 80 points.
    // If current cursor Y exceeds 660, start signatories on a fresh page to prevent overflow clipping.
    if (doc.y > 660) {
      doc.addPage();
    }

    // Horizontal line above signatories
    doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(72, doc.y).lineTo(pageWidth - 72, doc.y).stroke();
    doc.moveDown(1);

    const sigY = doc.y;
    const blockWidth = 180;

    // Left Signatory (starts at left margin x = 72)
    doc.fontSize(11).font("Times-Italic").fillColor("#3730a3");
    doc.text(signatoryLeftName ? `Sgd / ${signatoryLeftName.split(" ")[0]}` : "", 72, sigY, { width: blockWidth });
    
    doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(72, sigY + 16).lineTo(72 + 150, sigY + 16).stroke();
    
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f172a");
    doc.text(signatoryLeftName || "", 72, sigY + 24, { width: blockWidth });
    doc.fontSize(8.5).font("Helvetica").fillColor("#64748b");
    doc.text(signatoryLeftDesignation || "", 72, sigY + 36, { width: blockWidth, lineGap: 1 });

    // Right Signatory (starts at right margin boundary x = pageWidth - 72 - blockWidth)
    const rightSigX = pageWidth - 72 - blockWidth;
    doc.fontSize(11).font("Times-Italic").fillColor("#3730a3");
    doc.text(signatoryRightName ? `Sgd / ${signatoryRightName.split(" ")[0]}` : "", rightSigX, sigY, { align: "right", width: blockWidth });
    
    doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(pageWidth - 72 - 150, sigY + 16).lineTo(pageWidth - 72, sigY + 16).stroke();
    
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f172a");
    doc.text(signatoryRightName || "", rightSigX, sigY + 24, { align: "right", width: blockWidth });
    doc.fontSize(8.5).font("Helvetica").fillColor("#64748b");
    doc.text(signatoryRightDesignation || "", rightSigX, sigY + 36, { align: "right", width: blockWidth, lineGap: 1 });

    // Page Numbers loop (e.g. Page X of Y)
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Page numbering drawn in footer
      doc.fontSize(8).font("Helvetica").fillColor("#64748b");
      doc.text(
        `Page ${i + 1} of ${range.count}`,
        72,
        pageHeight - 80,
        { align: "right", width: pageWidth - 144 }
      );
    }

    doc.end();
  } catch (error) {
    console.error("Error exporting PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to export PDF due to an internal server error." });
    }
  }
};
