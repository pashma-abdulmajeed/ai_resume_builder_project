import { jsPDF } from "jspdf";

export function generateResumePDF(resume) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin;
  let y = margin;

  const personal = resume.personal || {};

  function ensureSpace(height = 8) {
    if (y + height > bottomLimit) {
      pdf.addPage();
      y = margin;
    }
  }

  function addWrappedText(value, options = {}) {
    const {
      fontSize = 10,
      bold = false,
      indent = 0,
      lineGap = 1.5,
    } = options;

    const text = String(value || "").trim();
    if (!text) return;

    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(fontSize);

    const lines = pdf.splitTextToSize(
      text,
      contentWidth - indent
    );

    const lineHeight = fontSize * 0.45 + lineGap;

    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, margin + indent, y);
      y += lineHeight;
    }
  }

  function addSection(title) {
    if (y > margin) y += 4;
    ensureSpace(12);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(35, 55, 85);
    pdf.text(title.toUpperCase(), margin, y);
    y += 2;

    pdf.setDrawColor(160, 175, 195);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5;

    pdf.setTextColor(35, 35, 35);
  }

  // Name and contact details
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(30, 50, 80);

  const name = personal.name || "Your Name";
  const nameLines = pdf.splitTextToSize(name, contentWidth);
  for (const line of nameLines) {
    ensureSpace(11);
    pdf.text(line, margin, y);
    y += 10;
  }

  const contacts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.website,
  ].filter((item) => String(item || "").trim());

  if (contacts.length) {
    y += 1;
    addWrappedText(contacts.join("  |  "), {
      fontSize: 9,
      lineGap: 1,
    });
  }

  y += 3;

  // Professional summary
  if (String(resume.summary || "").trim()) {
    addSection("Professional Summary");
    addWrappedText(resume.summary);
  }

  // Education
  const education = (resume.education || []).filter((item) =>
    [item.institution, item.degree, item.year].some((v) =>
      String(v || "").trim()
    )
  );

  if (education.length) {
    addSection("Education");

    for (const item of education) {
      ensureSpace(12);

      if (item.degree) {
        addWrappedText(item.degree, { bold: true });
      }

      const details = [item.institution, item.year]
        .filter((v) => String(v || "").trim())
        .join(" | ");

      addWrappedText(details, { fontSize: 9 });
      y += 2;
    }
  }

  // Work experience
  const experience = (resume.experience || []).filter((item) =>
    [item.company, item.role, item.duration, item.description].some(
      (v) => String(v || "").trim()
    )
  );

  if (experience.length) {
    addSection("Work Experience");

    for (const item of experience) {
      ensureSpace(12);

      const heading = [item.role, item.company]
        .filter((v) => String(v || "").trim())
        .join(" — ");

      if (heading) addWrappedText(heading, { bold: true });

      if (item.duration) {
        addWrappedText(item.duration, { fontSize: 9 });
      }

      if (item.description) {
        addWrappedText(item.description, { indent: 2 });
      }

      y += 3;
    }
  }

  // Skills
  if (String(resume.skills || "").trim()) {
    addSection("Skills");
    addWrappedText(resume.skills);
  }

  // Footer page numbers
  const pageCount = pdf.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);

    pdf.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    );
  }

  const safeName = String(personal.name || "resume")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  pdf.save(`${safeName || "resume"}_Resume.pdf`);
}
