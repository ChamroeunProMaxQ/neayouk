import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { GradebookMatrixDto } from "@repo/contracts";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatMonthTitle(monthStr: string): string {
  if (!monthStr) return "";
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1] || "1", 10);
    const name = MONTH_NAMES[monthNum - 1] || parts[1];
    return `${name} ${year}`;
  }
  return monthStr;
}

function getGradeColorStyle(grade: string) {
  switch (grade.toUpperCase()) {
    case "A":
      return { background: "#10B981", color: "#000000" }; // Green
    case "B":
      return { background: "#86EFAC", color: "#000000" }; // Light green
    case "C":
      return { background: "#FBBF24", color: "#000000" }; // Yellow/Amber
    case "D":
      return { background: "#FB923C", color: "#000000" }; // Orange
    case "E":
      return { background: "#F97316", color: "#FFFFFF" }; // Deep Orange
    case "F":
    default:
      return { background: "#B91C1C", color: "#FFFFFF" }; // Dark Red
  }
}

export async function exportGradebookToPdf(
  matrix: GradebookMatrixDto,
  schoolName = "ELC Center"
): Promise<void> {
  const components = matrix.gradingRule?.components || [];
  const rows = matrix.rows || [];

  // Create temporary container for high-resolution rendering
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = "1120px";
  container.style.padding = "40px 48px";
  container.style.backgroundColor = "#FFFFFF";
  container.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.style.color = "#1E293B";

  const monthFormatted = formatMonthTitle(matrix.month);

  let tableHeaderHtml = `
    <th style="padding: 10px 8px; border: 1px solid #1D4ED8; width: 45px; text-align: center; font-size: 14px; font-weight: bold;">No</th>
    <th style="padding: 10px 12px; border: 1px solid #1D4ED8; text-align: left; font-size: 14px; font-weight: bold; min-width: 180px;">Student Name</th>
  `;

  for (const comp of components) {
    tableHeaderHtml += `
      <th style="padding: 10px 8px; border: 1px solid #1D4ED8; text-align: center; font-size: 14px; font-weight: bold;">${comp.name}</th>
    `;
  }

  tableHeaderHtml += `
    <th style="padding: 10px 8px; border: 1px solid #1D4ED8; text-align: center; font-size: 14px; font-weight: bold; width: 65px;">Total</th>
    <th style="padding: 10px 8px; border: 1px solid #1D4ED8; text-align: center; font-size: 14px; font-weight: bold; width: 75px;">Average</th>
    <th style="padding: 10px 8px; border: 1px solid #1D4ED8; text-align: center; font-size: 14px; font-weight: bold; width: 55px;">Rank</th>
    <th style="padding: 10px 8px; border: 1px solid #1D4ED8; text-align: center; font-size: 14px; font-weight: bold; width: 60px;">Grade</th>
  `;

  let tableRowsHtml = "";

  rows.forEach((row, index) => {
    const isEven = index % 2 === 1;
    const rowBg = isEven ? "#EFF6FF" : "#FFFFFF"; // Soft blue zebra tint

    // Calculate component average (e.g. Total / number of components, matching exact reference)
    const numComps = components.length || 1;
    const average = (row.totalRawScore / numComps).toFixed(2);

    const gradeStyle = getGradeColorStyle(row.gradeLetter || "F");

    let componentScoresHtml = "";
    for (const comp of components) {
      const score = row.scores[comp.id];
      const valStr = score !== undefined ? String(score) : "0";
      componentScoresHtml += `
        <td style="padding: 8px 6px; border: 1px solid #CBD5E1; text-align: center; font-size: 14px; color: #1E293B;">${valStr}</td>
      `;
    }

    tableRowsHtml += `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 8px 6px; border: 1px solid #CBD5E1; text-align: center; font-size: 14px; color: #334155; font-weight: 500;">
          ${index + 1}
        </td>
        <td style="padding: 8px 12px; border: 1px solid #CBD5E1; text-align: left; font-size: 14px; font-weight: 600; color: #0F172A;">
          ${row.lastName} ${row.firstName}
        </td>
        ${componentScoresHtml}
        <td style="padding: 8px 6px; border: 1px solid #CBD5E1; text-align: center; font-size: 14px; font-weight: 700; color: #16A34A;">
          ${row.totalRawScore}
        </td>
        <td style="padding: 8px 6px; border: 1px solid #CBD5E1; text-align: center; font-size: 14px; font-weight: 700; color: #EA580C;">
          ${average}
        </td>
        <td style="padding: 8px 6px; border: 1px solid #CBD5E1; text-align: center; font-size: 14px; font-weight: 700; color: #DC2626;">
          ${row.rank ?? "-"}
        </td>
        <td style="padding: 8px 6px; border: 1px solid #CBD5E1; text-align: center; font-size: 14px; font-weight: 800; background-color: ${gradeStyle.background}; color: ${gradeStyle.color};">
          ${row.gradeLetter || "F"}
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <!-- Top Left School Name -->
      <div style="font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 4px;">
        ${schoolName}
      </div>

      <!-- Centered Monthly Score Title -->
      <div style="text-align: center; margin-top: -12px; margin-bottom: 16px;">
        <h1 style="font-size: 26px; font-weight: 800; font-family: Georgia, serif, sans-serif; color: #0F172A; margin: 0;">
          Monthly Score: ${monthFormatted}
        </h1>
      </div>

      <!-- Class and Teacher Info -->
      <div style="font-size: 15px; color: #1E293B; line-height: 1.6; font-family: Georgia, serif, sans-serif;">
        <div><strong>Class:</strong> ${matrix.className} ${matrix.classCode ? `(${matrix.classCode})` : ""}</div>
        <div><strong>Teacher:</strong> ${matrix.teacherName || "Ra Sotheary"}</div>
      </div>
    </div>

    <!-- Main Score Table -->
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #2563EB;">
      <thead>
        <tr style="background-color: #2563EB; color: #FFFFFF;">
          ${tableHeaderHtml}
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution for crisp PDF text
      useCORS: true,
      backgroundColor: "#FFFFFF",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    // A4 Landscape dimensions in mm: 297 x 210
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Maintain aspect ratio with margins
    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    const safeClassName = (matrix.className || "Class").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Monthly_Score_${safeClassName}_${matrix.month}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
