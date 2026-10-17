/* ==========================================================================
   PRINT-READY PDF & HIGH-RES ARTWORK EXPORT
   Standard ISO/IEC 7810 ID-1: 85.6mm x 54mm with 300 DPI Rendering
   ========================================================================== */

import { jsPDF } from 'jspdf';

/**
 * Exports a double-sided print-ready PDF containing Front and Back card artwork
 * with standard bleed area, trim marks, and print metadata.
 */
export async function exportCardPDF({ frontCanvas, backCanvas, designName = 'FLOCARD-Design', edition = 'Purple' }) {
  // CR80 Card Dimensions in millimeters
  const cardWidth = 85.6;
  const cardHeight = 54.0;
  const bleed = 3.0; // 3mm bleed margin for industrial print shops
  const pageWidth = cardWidth + (bleed * 2);
  const pageHeight = cardHeight + (bleed * 2);

  // Create PDF in landscape orientation with mm units
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [pageWidth, pageHeight]
  });

  // Page 1: Front
  if (frontCanvas) {
    const frontData = frontCanvas.toDataURL('image/png', 1.0);
    // Fill full bleed area
    doc.addImage(frontData, 'PNG', 0, 0, pageWidth, pageHeight, '', 'FAST');
    
    // Add trim mark guides in margins
    drawCropMarks(doc, bleed, cardWidth, cardHeight);
  }

  // Page 2: Back
  if (backCanvas) {
    doc.addPage([pageWidth, pageHeight], 'landscape');
    const backData = backCanvas.toDataURL('image/png', 1.0);
    doc.addImage(backData, 'PNG', 0, 0, pageWidth, pageHeight, '', 'FAST');
    drawCropMarks(doc, bleed, cardWidth, cardHeight);
  }

  // Save the PDF
  const safeFilename = `${designName.replace(/[^a-zA-Z0-9_-]/g, '_')}_print_ready.pdf`;
  doc.save(safeFilename);
}

/**
 * Draws professional printer crop marks at trim boundaries
 */
function drawCropMarks(doc, bleed, width, height) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  const markLen = 2.0;

  // Top-left
  doc.line(bleed, 0, bleed, bleed - 0.8);
  doc.line(0, bleed, bleed - 0.8, bleed);

  // Top-right
  doc.line(bleed + width, 0, bleed + width, bleed - 0.8);
  doc.line(bleed + width + 0.8, bleed, bleed + width + markLen + 1, bleed);

  // Bottom-left
  doc.line(bleed, bleed + height + 0.8, bleed, bleed + height + markLen + 1);
  doc.line(0, bleed + height, bleed - 0.8, bleed + height);

  // Bottom-right
  doc.line(bleed + width, bleed + height + 0.8, bleed + width, bleed + height + markLen + 1);
  doc.line(bleed + width + 0.8, bleed + height, bleed + width + markLen + 1, bleed + height);
}

/**
 * Downloads high-res PNG of canvas
 */
export function downloadCanvasPNG(canvas, filename = 'flocard-artwork.png') {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}
