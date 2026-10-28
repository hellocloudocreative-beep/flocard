/* ==========================================================================
   FLOCARDS PRINT-READY A4 TAX INVOICE PDF GENERATOR
   Standard ISO 216 A4 (210mm x 297mm) with vector layout & theme styling
   Generates verifiable business invoices with exact server-side pricing data.
   ========================================================================== */

import { jsPDF } from 'jspdf';
import { DEFAULT_BUSINESS_DETAILS } from './orderPricing.js';

/**
 * Available Invoice Themes
 */
export const INVOICE_THEMES = [
  {
    id: 'midnight_purple',
    name: 'Midnight Purple',
    description: 'FLOCARDS signature deep royal purple header with crisp slate accents',
    primaryColor: [107, 0, 255],     // #6B00FF
    secondaryColor: [112, 56, 248],  // #7038F8
    textColor: [30, 27, 46],
    tableHeaderBg: [243, 238, 255],
    accentHex: '#6B00FF'
  },
  {
    id: 'minimal_black',
    name: 'Minimal Black',
    description: 'Sleek executive monochrome contrast with minimalist geometry',
    primaryColor: [20, 20, 25],      // #141419
    secondaryColor: [60, 60, 70],
    textColor: [24, 24, 28],
    tableHeaderBg: [244, 244, 246],
    accentHex: '#141419'
  },
  {
    id: 'elegant_light',
    name: 'Elegant Light',
    description: 'Clean bright layout with subtle lavender hairline dividers and high paper legibility',
    primaryColor: [59, 7, 100],      // #3B0764
    secondaryColor: [147, 51, 234],
    textColor: [31, 41, 55],
    tableHeaderBg: [248, 250, 252],
    accentHex: '#7C3AED'
  },
  {
    id: 'brand_color',
    name: 'Brand Color',
    description: 'Dynamically harmonized with customer’s NFC card edition or company palette',
    primaryColor: [112, 56, 248],    // #7038F8
    secondaryColor: [168, 85, 247],
    textColor: [26, 20, 35],
    tableHeaderBg: [245, 243, 255],
    accentHex: '#7038F8'
  }
];

export function getInvoiceTheme(themeId = 'midnight_purple') {
  return INVOICE_THEMES.find(t => t.id === themeId) || INVOICE_THEMES[0];
}

/**
 * Builds and downloads a professional A4 Tax Invoice PDF
 */
export async function downloadInvoicePDF({
  invoiceNumber,
  order,
  pricing,
  themeId = 'midnight_purple',
  customAccent = null,
  businessDetails = DEFAULT_BUSINESS_DETAILS,
  customDetails = null,
  customItems = null,
  customTotals = null
}) {
  const theme = getInvoiceTheme(themeId);
  const primaryRgb = customAccent ? hexToRgb(customAccent) : theme.primaryColor;

  // Standard A4 dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2);

  // 1. Header Banner / Brand Strip
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FLOCARDS', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('TAX INVOICE & PROOF OF PURCHASE', pageWidth - margin, 13, { align: 'right' });
  doc.setFontSize(8);
  doc.text('https://flocard.in  |  Indiranagar, Bengaluru', pageWidth - margin, 20, { align: 'right' });

  // 2. Invoice Meta Bar (Invoice Number, Date, Order Ref, Payment Status)
  let y = 38;
  doc.setTextColor(50, 50, 60);

  // Left Meta: Invoice # & Order Ref
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`INVOICE: ${invoiceNumber}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Order Reference: ${order.orderReference || order.id || 'N/A'}`, margin, y + 6);
  doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin, y + 11);

  // Right Meta: Payment Status Badge
  const isPaid = order.paymentStatus === 'payment_confirmed' || order.payment_status === 'payment_confirmed';
  const payStatusText = isPaid ? 'PAYMENT CONFIRMED' : 'PAYMENT PENDING';
  const payBadgeWidth = 48;
  const payBadgeHeight = 7.5;
  const payBadgeX = pageWidth - margin - payBadgeWidth;

  if (isPaid) {
    doc.setFillColor(220, 252, 231); // Light green
    doc.setDrawColor(34, 197, 94);
    doc.setTextColor(22, 101, 52);
  } else {
    doc.setFillColor(254, 243, 199); // Light amber
    doc.setDrawColor(245, 158, 11);
    doc.setTextColor(146, 64, 14);
  }
  doc.roundedRect(payBadgeX, y - 3, payBadgeWidth, payBadgeHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(payStatusText, payBadgeX + (payBadgeWidth / 2), y + 2, { align: 'center' });

  if (order.paymentReference || order.payment_reference) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 110);
    doc.text(`UTR / Ref: ${order.paymentReference || order.payment_reference}`, pageWidth - margin, y + 11, { align: 'right' });
  }

  // 3. Two-Column Business Details vs Customer Details Box
  y = 56;
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  const colWidth = (contentWidth - 10) / 2;

  // Seller Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('ISSUED BY (SELLER):', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 40);
  doc.text(businessDetails.legalName || 'FLOCARDS TECHNOLOGIES PRIVATE LIMITED', margin, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(80, 80, 95);
  doc.text(businessDetails.addressLine1 || 'FLOCARDS HQ, 100 Feet Road, Indiranagar', margin, y + 10);
  doc.text(businessDetails.addressLine2 || 'Bengaluru, Karnataka - 560038, India', margin, y + 14);
  doc.text(`GSTIN: ${businessDetails.gstin}  |  PAN: ${businessDetails.pan}`, margin, y + 18);
  doc.text(`Contact: ${businessDetails.supportPhone}  |  ${businessDetails.supportEmail}`, margin, y + 22);

  // Buyer / Bill To Column (Uses customDetails if provided)
  const rightColX = margin + colWidth + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('BILLED TO (CUSTOMER):', rightColX, y);

  const billCustomerName = customDetails?.customerName || order.customerName || order.customerDetails?.fullName || 'Customer';
  const billPlace = customDetails?.place || order.customerDetails?.city || '';
  const billCompany = customDetails?.company !== undefined ? customDetails.company : (order.company || order.billingDetails?.company || order.customerDetails?.company || '');
  const billPhone = customDetails?.phone !== undefined ? customDetails.phone : (order.customerPhone || order.customerDetails?.phone || 'N/A');
  const billEmail = customDetails?.email !== undefined ? customDetails.email : (order.customerEmail || order.customerDetails?.email || 'N/A');
  const billAddress = customDetails?.shippingAddress !== undefined ? customDetails.shippingAddress : (order.shippingAddress || order.shipping_address || (order.customerDetails?.address ? `${order.customerDetails.address}, ${order.customerDetails.city || ''} ${order.customerDetails.postalCode || ''}` : 'Standard Delivery'));
  const billGstin = customDetails?.gstin !== undefined ? customDetails.gstin : (order.billingDetails?.gstin || order.customerDetails?.gstin || '');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 40);
  doc.text(billCustomerName, rightColX, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(80, 80, 95);
  let billY = y + 10;
  if (billCompany) {
    doc.text(`Company: ${billCompany}`, rightColX, billY);
    billY += 4;
  }
  if (billPlace) {
    doc.text(`Place of Supply: ${billPlace}`, rightColX, billY);
    billY += 4;
  }
  doc.text(`Phone: ${billPhone}  |  Email: ${billEmail}`, rightColX, billY);
  billY += 4;
  doc.text(`Ship To: ${billAddress}`, rightColX, billY, { maxWidth: colWidth });
  if (billGstin) {
    billY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Buyer GSTIN: ${billGstin}`, rightColX, billY);
  }

  // 4. Line Items Table Header
  y = 92;
  const thBg = theme.tableHeaderBg;
  doc.setFillColor(thBg[0], thBg[1], thBg[2]);
  doc.rect(margin, y, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('#', margin + 3, y + 5.5);
  doc.text('DESCRIPTION & SPECIFICATION', margin + 12, y + 5.5);
  doc.text('HSN/SAC', margin + 98, y + 5.5);
  doc.text('QTY', margin + 120, y + 5.5);
  doc.text('RATE (₹)', margin + 138, y + 5.5);
  doc.text('AMOUNT (₹)', pageWidth - margin - 3, y + 5.5, { align: 'right' });

  // 5. Line Items Rows (Uses customItems if provided)
  y += 8;
  let rows = [];

  if (Array.isArray(customItems) && customItems.length > 0) {
    rows = customItems.map((item, i) => {
      const q = Number(item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1));
      const r = Number(item.rate !== undefined ? item.rate : (item.unitPrice !== undefined ? item.unitPrice : 0));
      const a = Number(item.amount !== undefined ? item.amount : (q * r));
      return {
        index: i + 1,
        title: String(item.title || item.name || item.productName || `Item ${i + 1}`),
        subtitle: String(item.subtitle || item.description || item.specs || ''),
        hsn: String(item.hsn || businessDetails.sacCode || '998439'),
        qty: q,
        rate: r,
        amount: a
      };
    });
  } else {
    const editionName = (order.edition || 'Purple').toUpperCase();
    const quantity = order.quantity || 1;
    const unitPrice = pricing.unitPrice || 1499;

    rows.push({
      index: 1,
      title: `FLOCARDS Smart NFC Business Card — ${editionName} Edition`,
      subtitle: 'NFC Embedded Matte Polymer Card + Dynamic Live Digital Profile',
      hsn: businessDetails.sacCode || '998439',
      qty: quantity,
      rate: unitPrice,
      amount: unitPrice * quantity
    });

    if (pricing.customizationCharge > 0) {
      rows.push({
        index: rows.length + 1,
        title: 'Custom Laser / Artwork Studio Setup Fee',
        subtitle: 'High-precision dual-sided UV print & alignment setup',
        hsn: '998314',
        qty: 1,
        rate: pricing.customizationCharge,
        amount: pricing.customizationCharge
      });
    }

    if (pricing.invoiceAddonCharge > 0) {
      rows.push({
        index: rows.length + 1,
        title: 'Tax Invoice & Business Compliance Add-On',
        subtitle: 'Official tax invoice issuance, audit trail & digital PDF export',
        hsn: '998439',
        qty: 1,
        rate: pricing.invoiceAddonCharge,
        amount: pricing.invoiceAddonCharge
      });
    }

    if (pricing.deliveryCharge > 0) {
      rows.push({
        index: rows.length + 1,
        title: 'Insured Tracked Courier Delivery',
        subtitle: 'Doorstep surface courier with tamper-evident packaging',
        hsn: '996812',
        qty: 1,
        rate: pricing.deliveryCharge,
        amount: pricing.deliveryCharge
      });
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  rows.forEach((row, i) => {
    const rowY = y + (i * 12);
    // Alternate row background
    if (i % 2 === 1) {
      doc.setFillColor(252, 252, 254);
      doc.rect(margin, rowY, contentWidth, 12, 'F');
    }
    doc.setDrawColor(240, 240, 245);
    doc.line(margin, rowY + 12, pageWidth - margin, rowY + 12);

    doc.setTextColor(80, 80, 90);
    doc.text(String(row.index), margin + 3, rowY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 40);
    doc.text(row.title, margin + 12, rowY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 120);
    doc.text(row.subtitle, margin + 12, rowY + 9.5);

    doc.setFontSize(8);
    doc.text(row.hsn, margin + 98, rowY + 6);
    doc.text(String(row.qty), margin + 120, rowY + 6);
    doc.text(`₹${Number(row.rate).toFixed(2)}`, margin + 138, rowY + 6);
    doc.text(`₹${Number(row.amount).toFixed(2)}`, pageWidth - margin - 3, rowY + 6, { align: 'right' });
  });

  // 6. Totals & Tax Calculation Breakdown
  y += (rows.length * 12) + 8;
  const totalsX = margin + 105;
  const totalsValX = pageWidth - margin - 3;
  const lineSpacing = 5.5;

  let computedTaxableBase = pricing.taxableBase;
  let computedCgst = pricing.cgstAmount;
  let computedSgst = pricing.sgstAmount;
  let computedTotal = pricing.totalAmount;

  if (customTotals) {
    computedTaxableBase = customTotals.taxableBase ?? computedTaxableBase;
    computedCgst = customTotals.cgstAmount ?? computedCgst;
    computedSgst = customTotals.sgstAmount ?? computedSgst;
    computedTotal = customTotals.totalAmount ?? computedTotal;
  } else if (Array.isArray(customItems) && customItems.length > 0) {
    computedTaxableBase = rows.reduce((sum, r) => sum + r.amount, 0);
    computedCgst = Math.round(computedTaxableBase * 0.09 * 100) / 100;
    computedSgst = Math.round(computedTaxableBase * 0.09 * 100) / 100;
    computedTotal = Math.round((computedTaxableBase + computedCgst + computedSgst) * 100) / 100;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 95);

  doc.text('Taxable Subtotal:', totalsX, y);
  doc.text(`₹${Number(computedTaxableBase).toFixed(2)}`, totalsValX, y, { align: 'right' });

  y += lineSpacing;
  doc.text(`CGST (9.0%):`, totalsX, y);
  doc.text(`₹${Number(computedCgst).toFixed(2)}`, totalsValX, y, { align: 'right' });

  y += lineSpacing;
  doc.text(`SGST (9.0%):`, totalsX, y);
  doc.text(`₹${Number(computedSgst).toFixed(2)}`, totalsValX, y, { align: 'right' });

  y += lineSpacing + 2;
  // Total Bar
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(totalsX - 4, y - 4, contentWidth - 101, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL AMOUNT:', totalsX, y + 2.5);
  doc.text(`₹${Number(computedTotal).toFixed(2)}`, totalsValX, y + 2.5, { align: 'right' });

  // 7. Terms, Notes & Authorized Signatory Footer
  y += 18;
  doc.setDrawColor(230, 230, 235);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('TERMS & CONDITIONS:', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 125);
  doc.text('1. All smart cards carry a 1-year chip operational warranty against manufacturing defects.', margin, y + 4.5);
  doc.text('2. Payments are verified via official bank statement reconciliation prior to dispatch.', margin, y + 8.5);
  doc.text('3. This document is a computer-generated tax invoice and requires no physical signature under IT Act 2000.', margin, y + 12.5);

  // Digital Stamp Box on Right
  const stampX = pageWidth - margin - 50;
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(stampX, y - 2, 50, 20, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text('FLOCARDS VERIFIED', stampX + 25, y + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 110);
  doc.text('Official Digital Seal', stampX + 25, y + 9.5, { align: 'center' });
  doc.text(new Date().toISOString().split('T')[0], stampX + 25, y + 14, { align: 'center' });

  // Bottom Footer Band
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 160);
  doc.text(
    'FLOCARDS India  |  Indiranagar, Bengaluru  |  support@flocard.in  |  flocard.in',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  // Trigger browser download
  const safeFilename = `${invoiceNumber}_${(order.orderReference || order.id || 'ORDER').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
  return safeFilename;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16)
    ];
  }
  return [
    parseInt(clean.substring(0, 2), 16) || 107,
    parseInt(clean.substring(2, 4), 16) || 0,
    parseInt(clean.substring(4, 6), 16) || 255
  ];
}
