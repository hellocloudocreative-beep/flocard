/* ==========================================================================
   PRINT-READY PDF & HIGH-RES ARTWORK EXPORT
   Standard ISO/IEC 7810 ID-1: 85.6mm x 54mm with 300 DPI Rendering
   Supports Dual-Sided Combined PNGs, Multi-File Export, Web Share, & Clipboard
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
 * Downloads high-res PNG of canvas with safe DOM attachment
 */
export function downloadCanvasPNG(canvas, filename = 'flocard-artwork.png') {
  if (!canvas) return;
  try {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 400);
  } catch (e) {
    console.error('Error downloading canvas PNG:', e);
  }
}

/**
 * Creates a combined dual-sided artwork canvas showing both Front and Back
 * on a single luxury specification presentation sheet.
 */
export function createCombinedArtworkCanvas({ frontCanvas, backCanvas, designName = 'FLOCARD Card', editionName = 'Purple' }) {
  if (!frontCanvas || !backCanvas) return null;

  const cardW = frontCanvas.width || 1080;
  const cardH = frontCanvas.height || 681;
  const gap = 60;
  const padding = 60;
  const headerH = 120;
  const footerH = 60;

  const combined = document.createElement('canvas');
  combined.width = (cardW * 2) + gap + (padding * 2);
  combined.height = cardH + headerH + footerH + (padding * 2);

  const ctx = combined.getContext('2d');
  if (!ctx) return null;

  // 1. Luxury deep obsidian background
  const bgGrad = ctx.createLinearGradient(0, 0, combined.width, combined.height);
  bgGrad.addColorStop(0, '#090510');
  bgGrad.addColorStop(0.5, '#150A26');
  bgGrad.addColorStop(1, '#06030B');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, combined.width, combined.height);

  // Subtle grid lines in background
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < combined.width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, combined.height);
    ctx.stroke();
  }
  for (let y = 0; y < combined.height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(combined.width, y);
    ctx.stroke();
  }

  // 2. Header Branding
  ctx.fillStyle = '#A855F7';
  ctx.font = 'bold 38px "Space Grotesk", sans-serif';
  ctx.fillText('FLOCARD™ DUAL-SIDED PRINT SPECIFICATION', padding, 68);

  ctx.fillStyle = '#B8AEC8';
  ctx.font = '22px "Inter", sans-serif';
  ctx.fillText(`${designName} • ${editionName} • CR80 ISO/IEC 7810 ID-1 (85.60 × 53.98 mm) • 300 DPI Industrial`, padding, 106);

  // 3. Draw Front Card
  const cardY = padding + headerH;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;
  ctx.drawImage(frontCanvas, padding, cardY, cardW, cardH);
  ctx.restore();

  // Front Label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px "Space Grotesk", sans-serif';
  ctx.fillText('SIDE A: FRONT ARTWORK', padding, cardY + cardH + 40);

  ctx.fillStyle = '#82758F';
  ctx.font = '18px "Inter", sans-serif';
  ctx.fillText('Laser-etched details & NFC inductive antenna', padding, cardY + cardH + 68);

  // 4. Draw Back Card
  const backX = padding + cardW + gap;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;
  ctx.drawImage(backCanvas, backX, cardY, cardW, cardH);
  ctx.restore();

  // Back Label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px "Space Grotesk", sans-serif';
  ctx.fillText('SIDE B: BACK ARTWORK (NFC & QR)', backX, cardY + cardH + 40);

  ctx.fillStyle = '#82758F';
  ctx.font = '18px "Inter", sans-serif';
  ctx.fillText('Permanent encrypted dynamic routing & NTAG216 chip', backX, cardY + cardH + 68);

  return combined;
}

/**
 * Downloads both front and back sides cleanly.
 * Automatically exports a combined high-res PNG containing both sides side-by-side,
 * plus triggers downloads for individual front and back files.
 */
export async function downloadBothSides({ frontCanvas, backCanvas, designName = 'FLOCARD Card', editionName = 'Purple' }) {
  const safeName = designName.replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Generate Combined Dual-Sided Artwork (Guarantees BOTH sides in 1 file!)
  if (frontCanvas && backCanvas) {
    const combinedCanvas = createCombinedArtworkCanvas({ frontCanvas, backCanvas, designName, editionName });
    if (combinedCanvas) {
      downloadCanvasPNG(combinedCanvas, `${safeName}_BOTH_SIDES_300dpi.png`);
    }
  }

  // 2. Download Front
  if (frontCanvas) {
    setTimeout(() => {
      downloadCanvasPNG(frontCanvas, `${safeName}_front_300dpi.png`);
    }, 250);
  }

  // 3. Download Back
  if (backCanvas) {
    setTimeout(() => {
      downloadCanvasPNG(backCanvas, `${safeName}_back_300dpi.png`);
    }, 550);
  }
}

/**
 * Copies a canvas image directly to the system clipboard (PNG blob)
 * Allows user to instantly paste (Ctrl+V / Cmd+V) directly into WhatsApp!
 */
export async function copyCanvasToClipboard(canvas) {
  if (!canvas || !navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
    return false;
  }
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        resolve(true);
      } catch (err) {
        console.warn('Clipboard write error:', err);
        resolve(false);
      }
    }, 'image/png');
  });
}

/**
 * Uses Web Share API to share design files directly to WhatsApp or native apps.
 * On mobile and supported desktops, this attaches the real image files directly!
 */
export async function shareDesignFiles({ frontCanvas, backCanvas, designName = 'FLOCARD Card', editionName = 'Purple', text = '' }) {
  if (!navigator.canShare || !navigator.share) {
    return false;
  }

  try {
    const files = [];
    const safeName = designName.replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. Generate Combined Dual-Sided Artwork (Guarantees BOTH sides attached in 1 image)
    if (frontCanvas && backCanvas) {
      const combined = createCombinedArtworkCanvas({ frontCanvas, backCanvas, designName, editionName });
      if (combined) {
        const combinedBlob = await new Promise(r => combined.toBlob(r, 'image/png', 1.0));
        if (combinedBlob) {
          files.push(new File([combinedBlob], `${safeName}_BOTH_SIDES_300dpi.png`, { type: 'image/png' }));
        }
      }
    }

    // Fallback to front canvas if combined wasn't built
    if (files.length === 0 && frontCanvas) {
      const frontBlob = await new Promise(r => frontCanvas.toBlob(r, 'image/png', 1.0));
      if (frontBlob) {
        files.push(new File([frontBlob], `${safeName}_front.png`, { type: 'image/png' }));
      }
    }

    if (files.length > 0 && navigator.canShare({ files })) {
      await navigator.share({
        title: designName,
        text,
        files
      });
      return true;
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Web Share failed:', err);
    }
  }

  return false;
}
