/* ==========================================================================
   FLOCARD — Professional Tax Invoice Modal & PDF Generator
   Compliant with Indian GST & Corporate Accounting Standards.
   Supports instant Browser Print (Clean Print CSS) and Vector PDF Download.
   ========================================================================== */

import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useData } from '../../../context/DataContext';

export default function InvoiceModal({ order, onClose }) {
  const { invoiceSettings } = useData();
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);

  if (!order) return null;

  const settings = invoiceSettings || {
    companyName: 'FLOCARD Technologies Pvt. Ltd.',
    tradeName: 'FLOCARD Connected Identity Systems',
    gstin: '32AAAAF1234A1Z5',
    pan: 'AAAAF1234A',
    taxRatePercent: 18,
    invoicePrefix: 'INV',
    supportEmail: 'billing@flocard.in',
    supportPhone: '+91 97782 78552',
    website: 'https://flocard.in',
    addressLine1: 'FLOCARD Innovation Hub, 4th Floor',
    addressLine2: 'Infopark Expressway, Kakkanad',
    cityStatePin: 'Kochi, Kerala 682042, India',
    bankName: 'HDFC Bank Ltd',
    accountName: 'FLOCARD TECHNOLOGIES PRIVATE LIMITED',
    accountNumber: '50200084920194',
    ifsc: 'HDFC0001234',
    upiId: 'flocard@hdfcbank',
    notesTerms: '1. Computer generated tax invoice under Rule 46 of CGST Rules, 2017.\n2. All NFC hardware products carry 1-Year manufacturing replacement warranty.\n3. Digital profile lifetime routing is included with card activation.\n4. Subject to Kochi jurisdiction only.'
  };

  const invoiceNumber = order.invoiceId || `INV-${new Date(order.orderDate || Date.now()).getFullYear()}-${String(order.id || '1000').slice(-4)}`;
  const invoiceDate = new Date(order.invoiceDate || order.orderDate || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const items = order.items && order.items.length > 0 ? order.items : [
    {
      id: 'item_1',
      productName: `${String(order.edition || 'PURPLE').toUpperCase()} Edition NFC Smart Business Card`,
      sku: `FLC-CRD-${String(order.edition || 'PRP').slice(0, 3).toUpperCase()}-01`,
      quantity: order.quantity || 1,
      unitPrice: order.unitPrice || order.totalAmount || 1999,
      discount: order.discount || 0,
      tax: order.tax || 0,
      total: order.totalAmount || 1999
    }
  ];

  const subtotal = items.reduce((sum, item) => sum + (Number(item.unitPrice || 0) * Number(item.quantity || 1)), 0);
  const totalDiscount = Number(order.discount || 0);
  const totalTax = Number(order.tax || 0);
  const shippingCharge = Number(order.shippingCharge || 0);
  const grandTotal = Number(order.totalAmount || (subtotal - totalDiscount + totalTax + shippingCharge));
  const amountPaid = Number(order.amountPaid !== undefined ? order.amountPaid : (order.paymentStatus === 'paid' ? grandTotal : 0));
  const amountOutstanding = Math.max(0, Number(order.amountOutstanding !== undefined ? order.amountOutstanding : (grandTotal - amountPaid)));
  const refundAmount = Number(order.refundAmount || 0);

  // Browser Direct Print
  const handlePrint = () => {
    window.print();
  };

  // High-fidelity vector PDF generation using jsPDF
  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = 45;

      // Header Brand Background Box
      doc.setFillColor(15, 10, 25);
      doc.rect(margin, y, pageWidth - (margin * 2), 70, 'F');

      // Brand Logo & Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(240, 240, 255);
      doc.text('FLOCARD', margin + 18, y + 32);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(180, 160, 220);
      doc.text(settings.tradeName || 'Connected Identity Systems', margin + 18, y + 48);

      // Tax Invoice Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(216, 180, 254);
      doc.text('TAX INVOICE', pageWidth - margin - 18, y + 32, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 220);
      doc.text(`Invoice: ${invoiceNumber}`, pageWidth - margin - 18, y + 48, { align: 'right' });

      y += 85;

      // Seller and Buyer Grid
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 130);
      doc.text('ISSUED BY (SELLER)', margin, y);
      doc.text('BILLED TO (CUSTOMER)', pageWidth / 2 + 10, y);

      y += 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.text(settings.companyName || 'FLOCARD Technologies Pvt. Ltd.', margin, y);
      doc.text(order.customerName || 'Valued Client', pageWidth / 2 + 10, y);

      y += 13;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 80);
      doc.text(settings.addressLine1 || '', margin, y);
      doc.text(order.company ? `Company: ${order.company}` : `Phone: ${order.customerPhone || 'N/A'}`, pageWidth / 2 + 10, y);

      y += 12;
      doc.text(`${settings.cityStatePin || ''}`, margin, y);
      doc.text(`Email: ${order.customerEmail || 'billing@client.com'}`, pageWidth / 2 + 10, y);

      y += 12;
      doc.text(`GSTIN: ${settings.gstin || 'N/A'}  |  PAN: ${settings.pan || 'N/A'}`, margin, y);
      doc.text(`Shipping: ${order.shippingAddress || 'Digital / Direct Express Delivery'}`, pageWidth / 2 + 10, y);

      y += 24;

      // Metadata Bar
      doc.setFillColor(245, 245, 250);
      doc.rect(margin, y, pageWidth - (margin * 2), 24, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 70);
      doc.text(`Invoice Date: ${invoiceDate}`, margin + 10, y + 16);
      doc.text(`Order Ref: ${order.orderReference || order.id}`, margin + 170, y + 16);
      doc.text(`Payment Method: ${(order.paymentMethod || 'UPI').toUpperCase()}`, margin + 320, y + 16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Status: ${(order.paymentStatus || 'PAID').toUpperCase()}`, pageWidth - margin - 10, y + 16, { align: 'right' });

      y += 36;

      // Items Table Header
      doc.setFillColor(30, 20, 50);
      doc.rect(margin, y, pageWidth - (margin * 2), 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text('ITEM & DESCRIPTION', margin + 8, y + 15);
      doc.text('SKU', margin + 210, y + 15);
      doc.text('QTY', margin + 310, y + 15, { align: 'right' });
      doc.text('UNIT PRICE', margin + 390, y + 15, { align: 'right' });
      doc.text('TOTAL', pageWidth - margin - 8, y + 15, { align: 'right' });

      y += 22;

      // Items Rows
      items.forEach((item, index) => {
        doc.setFillColor(index % 2 === 0 ? 255 : 249, index % 2 === 0 ? 255 : 249, 252);
        doc.rect(margin, y, pageWidth - (margin * 2), 26, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(25, 25, 30);
        doc.text(item.productName || item.name || 'FLOCARD NFC Smart Card', margin + 8, y + 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 100);
        doc.text(item.sku || `FLC-SKU-${index + 1}`, margin + 210, y + 16);

        doc.setFontSize(9);
        doc.setTextColor(30, 30, 35);
        doc.text(String(item.quantity || 1), margin + 310, y + 16, { align: 'right' });
        doc.text(`Rs. ${(Number(item.unitPrice) || 0).toLocaleString('en-IN')}`, margin + 390, y + 16, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${(Number(item.total || item.unitPrice * (item.quantity || 1)) || 0).toLocaleString('en-IN')}`, pageWidth - margin - 8, y + 16, { align: 'right' });

        y += 26;
      });

      y += 15;

      // Financial Summary Box on Right
      const sumBoxX = pageWidth - margin - 220;
      doc.setFillColor(250, 250, 255);
      doc.rect(sumBoxX, y, 220, 110, 'F');
      doc.setDrawColor(230, 230, 240);
      doc.rect(sumBoxX, y, 220, 110, 'S');

      let sy = y + 18;
      const printSumRow = (label, val, isBold = false, isAccent = false) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(isAccent ? 120 : 80, isAccent ? 40 : 80, isAccent ? 230 : 90);
        doc.text(label, sumBoxX + 12, sy);
        doc.text(val, sumBoxX + 208, sy, { align: 'right' });
        sy += 16;
      };

      printSumRow('Subtotal:', `Rs. ${subtotal.toLocaleString('en-IN')}`);
      if (totalDiscount > 0) printSumRow('Discount Applied:', `- Rs. ${totalDiscount.toLocaleString('en-IN')}`);
      printSumRow(`Taxes (${settings.taxRatePercent || 18}% IGST/CGST):`, `Rs. ${totalTax.toLocaleString('en-IN')}`);
      if (shippingCharge > 0) printSumRow('Shipping Charges:', `Rs. ${shippingCharge.toLocaleString('en-IN')}`);

      doc.setDrawColor(210, 210, 220);
      doc.line(sumBoxX + 10, sy - 4, sumBoxX + 210, sy - 4);

      printSumRow('Grand Total:', `Rs. ${grandTotal.toLocaleString('en-IN')}`, true, true);

      // Left Box: Bank Details & Remittance
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 60);
      doc.text('BANK DETAILS & PAYMENT REMITTANCE', margin, y + 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 90);
      doc.text(`Bank: ${settings.bankName || 'HDFC Bank Ltd'}`, margin, y + 30);
      doc.text(`A/C Name: ${settings.accountName || settings.companyName}`, margin, y + 42);
      doc.text(`A/C No: ${settings.accountNumber || '50200084920194'}`, margin, y + 54);
      doc.text(`IFSC: ${settings.ifsc || 'HDFC0001234'}  |  UPI: ${settings.upiId || 'flocard@hdfcbank'}`, margin, y + 66);
      doc.text(`Payment Ref: ${order.transactionReference || 'N/A'}`, margin, y + 78);

      y = Math.max(y + 120, sy + 20);

      // Terms & Conditions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 120);
      doc.text('TERMS & CONDITIONS', margin, y);
      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 135);
      const splitTerms = doc.splitTextToSize(settings.notesTerms || 'Computer generated tax invoice. 1-Year hardware replacement warranty.', pageWidth - (margin * 2));
      doc.text(splitTerms, margin, y);

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 170);
      doc.text(`FLOCARD Cloud Verification • ${settings.website} • Support: ${settings.supportEmail}`, pageWidth / 2, 800, { align: 'center' });

      doc.save(`FLOCARD_Invoice_${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not generate PDF. Please use the Print option instead.');
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PAID
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            PARTIALLY PAID
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Clock className="w-3.5 h-3.5" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-4xl my-8 bg-[#0D0819] border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:my-0 print:w-full print:max-w-none print:bg-white text-white print:text-black">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#140C26] border-b border-purple-500/20 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Invoice Preview & Accounting Slip</h2>
              <p className="text-xs text-purple-300/70">{invoiceNumber} • {order.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              title="Print via Browser"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              title="Download Vector PDF"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div ref={invoiceRef} className="p-8 md:p-12 print:p-8 space-y-8 bg-[#0D0819] print:bg-white">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/10 print:border-zinc-300">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-black tracking-wider text-purple-400 print:text-purple-700">FLOCARD</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 print:border-zinc-300 print:text-zinc-600">
                  ORIGINAL FOR RECIPIENT
                </span>
              </div>
              <h1 className="text-sm font-semibold text-zinc-300 print:text-zinc-800">{settings.tradeName}</h1>
              <p className="text-xs text-zinc-400 print:text-zinc-600">{settings.companyName}</p>
              <p className="text-xs text-zinc-400 print:text-zinc-600">{settings.addressLine1}, {settings.addressLine2}</p>
              <p className="text-xs text-zinc-400 print:text-zinc-600">{settings.cityStatePin}</p>
              <p className="text-xs text-zinc-400 print:text-zinc-600 mt-1">
                <strong className="text-zinc-300 print:text-zinc-800">GSTIN:</strong> {settings.gstin} | <strong className="text-zinc-300 print:text-zinc-800">PAN:</strong> {settings.pan}
              </p>
            </div>

            <div className="text-left md:text-right space-y-1.5">
              <div className="inline-block mb-1">{getStatusBadge(order.paymentStatus)}</div>
              <div className="text-2xl font-bold tracking-tight text-white print:text-zinc-900">{invoiceNumber}</div>
              <p className="text-xs text-zinc-400 print:text-zinc-600">
                <strong className="text-zinc-300 print:text-zinc-700">Date:</strong> {invoiceDate}
              </p>
              <p className="text-xs text-zinc-400 print:text-zinc-600">
                <strong className="text-zinc-300 print:text-zinc-700">Order ID:</strong> {order.orderReference || order.id}
              </p>
              <p className="text-xs text-zinc-400 print:text-zinc-600">
                <strong className="text-zinc-300 print:text-zinc-700">Payment:</strong> {(order.paymentMethod || 'UPI').toUpperCase()} ({order.transactionReference || 'Auto'})
              </p>
            </div>
          </div>

          {/* Billed To / Shipped To Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-white/[0.02] border border-white/5 print:bg-zinc-50 print:border-zinc-200">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-purple-400 print:text-purple-700 mb-1">
                Billed To (Client Details)
              </p>
              <h3 className="text-sm font-bold text-white print:text-zinc-900">{order.customerName}</h3>
              {order.company && <p className="text-xs text-zinc-300 print:text-zinc-700 font-medium">{order.company}</p>}
              <p className="text-xs text-zinc-400 print:text-zinc-600">{order.customerEmail}</p>
              <p className="text-xs text-zinc-400 print:text-zinc-600">{order.customerPhone}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-purple-400 print:text-purple-700 mb-1">
                Shipping & Delivery Address
              </p>
              <p className="text-xs text-zinc-300 print:text-zinc-700 whitespace-pre-line leading-relaxed">
                {order.shippingAddress || 'Plot 42, Infopark Phase II, Kochi, Kerala 682042'}
              </p>
              {order.cardCode && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[11px] font-mono border border-purple-500/20 print:border-zinc-300 print:text-zinc-700">
                  <QrCode className="w-3 h-3" />
                  NFC Card Serial: {order.cardCode}
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10 print:border-zinc-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#140C26] print:bg-zinc-100 text-zinc-300 print:text-zinc-700 font-semibold uppercase tracking-wider text-[10px] border-b border-white/10 print:border-zinc-300">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product & Specification</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-zinc-200">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-white/[0.01]">
                    <td className="py-3 px-4 text-zinc-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-white print:text-zinc-900">
                      <div>{item.productName || item.name}</div>
                      <div className="text-[11px] text-zinc-400 print:text-zinc-500">{item.variant || 'Standard NFC Chipset'}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 print:text-zinc-600 font-mono text-[11px]">{item.sku || 'FLC-CARD-01'}</td>
                    <td className="py-3 px-4 text-center text-zinc-300 print:text-zinc-800 font-semibold">{item.quantity || 1}</td>
                    <td className="py-3 px-4 text-right text-zinc-300 print:text-zinc-800">₹{(Number(item.unitPrice) || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-rose-400 print:text-rose-600">
                      {Number(item.discount || 0) > 0 ? `-₹${Number(item.discount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white print:text-zinc-900">
                      ₹{(Number(item.total || item.unitPrice * (item.quantity || 1)) || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Remittance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* Bank Info */}
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 print:bg-zinc-50 print:border-zinc-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 print:text-purple-700">
                <CreditCard className="w-4 h-4" />
                Bank Remittance & UPI Payment
              </div>
              <div className="text-xs space-y-1 text-zinc-400 print:text-zinc-600">
                <p><strong className="text-zinc-300 print:text-zinc-800">Bank:</strong> {settings.bankName}</p>
                <p><strong className="text-zinc-300 print:text-zinc-800">Beneficiary:</strong> {settings.accountName}</p>
                <p><strong className="text-zinc-300 print:text-zinc-800">Account No:</strong> <span className="font-mono">{settings.accountNumber}</span></p>
                <p><strong className="text-zinc-300 print:text-zinc-800">IFSC Code:</strong> <span className="font-mono">{settings.ifsc}</span></p>
                <p><strong className="text-zinc-300 print:text-zinc-800">UPI ID:</strong> <span className="font-mono text-purple-400 print:text-purple-700">{settings.upiId}</span></p>
              </div>
            </div>

            {/* Total Calculation Card */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 text-zinc-400 print:text-zinc-600">
                <span>Gross Subtotal:</span>
                <span className="font-medium text-zinc-200 print:text-zinc-800">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between py-1.5 text-rose-400">
                  <span>Discounts Applied:</span>
                  <span className="font-medium">-₹{totalDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 text-zinc-400 print:text-zinc-600">
                <span>Applicable GST ({settings.taxRatePercent || 18}% IGST/CGST):</span>
                <span className="font-medium text-zinc-200 print:text-zinc-800">₹{totalTax.toLocaleString('en-IN')}</span>
              </div>
              {shippingCharge > 0 && (
                <div className="flex justify-between py-1.5 text-zinc-400 print:text-zinc-600">
                  <span>Shipping & Delivery:</span>
                  <span className="font-medium text-zinc-200 print:text-zinc-800">₹{shippingCharge.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 border-t border-b border-white/10 print:border-zinc-300 text-sm font-bold text-white print:text-zinc-900">
                <span>Grand Total:</span>
                <span className="text-purple-400 print:text-purple-700">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 text-emerald-400 font-semibold">
                <span>Amount Paid:</span>
                <span>₹{amountPaid.toLocaleString('en-IN')}</span>
              </div>
              {amountOutstanding > 0 && (
                <div className="flex justify-between py-1.5 text-amber-400 font-semibold">
                  <span>Balance Outstanding:</span>
                  <span>₹{amountOutstanding.toLocaleString('en-IN')}</span>
                </div>
              )}
              {refundAmount > 0 && (
                <div className="flex justify-between py-1.5 text-rose-400 font-semibold">
                  <span>Refunded to Source:</span>
                  <span>₹{refundAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Declarations */}
          <div className="pt-6 border-t border-white/10 print:border-zinc-300 text-[11px] text-zinc-400 print:text-zinc-600 space-y-2">
            <p className="font-semibold text-zinc-300 print:text-zinc-800 uppercase tracking-wider text-[10px]">
              Declarations & Terms of Supply
            </p>
            <p className="whitespace-pre-line leading-relaxed font-sans">{settings.notesTerms}</p>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pt-4 text-[10px] text-zinc-500">
              <p>For questions or warranty claims, contact: {settings.supportEmail} or {settings.supportPhone}</p>
              <div className="text-right">
                <p className="font-semibold text-zinc-300 print:text-zinc-800">Authorised Signatory</p>
                <p>FLOCARD Technologies Pvt. Ltd.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
