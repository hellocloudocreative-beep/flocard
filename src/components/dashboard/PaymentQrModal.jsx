import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, MessageCircle, ExternalLink, Download, Printer, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { generateQrDataUrl } from '../../lib/qr';
import { getOrderUpiPaymentUrl, getOrderWhatsAppPaymentDetailsUrl, getOrderWhatsAppPaymentMessage, getOrderBillAmount, getConfiguredUpiId } from '../../lib/whatsapp';

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawRoundedTopRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function PaymentQrModal({
  isOpen,
  onClose,
  order,
  isLight = false
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [downloadingSlip, setDownloadingSlip] = useState(false);
  const [activeUpiId, setActiveUpiId] = useState(() => order?.upiId || order?.paymentConfig?.upiId || getConfiguredUpiId());

  // Subscribe to real-time Settings changes so any update in Settings reflects immediately
  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      const newUpi = e?.detail?.upiId || getConfiguredUpiId();
      if (newUpi) setActiveUpiId(String(newUpi).trim());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('flocard_invoice_settings_updated', handleSettingsUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('flocard_invoice_settings_updated', handleSettingsUpdate);
      }
    };
  }, []);

  // Update when modal opens
  useEffect(() => {
    if (isOpen) {
      const configured = order?.upiId || order?.paymentConfig?.upiId || getConfiguredUpiId();
      setActiveUpiId(configured);
    }
  }, [isOpen, order]);

  // Fallback defaults
  const orderRef = order?.orderReference || order?.id || 'FLOCARD-ORDER';
  const customerName = order?.customerName || order?.name || order?.customerDetails?.name || 'Customer';
  const customerPhone = order?.customerPhone || order?.phone || order?.customerDetails?.phone || '';
  const amount = getOrderBillAmount(order);
  const formattedAmount = amount.toLocaleString('en-IN');
  const edition = order?.edition ? `${String(order.edition).toUpperCase()} Edition` : (order?.productName || 'FLOCARD NFC Smart Card');

  const upiPayUrl = order ? getOrderUpiPaymentUrl(order, activeUpiId) : '';
  const waUrl = order ? getOrderWhatsAppPaymentDetailsUrl(order, activeUpiId) : null;

  // Generate QR code whenever UPI URL changes
  useEffect(() => {
    if (!isOpen || !upiPayUrl) return;

    let isCurrent = true;
    setLoading(true);

    generateQrDataUrl(upiPayUrl, {
      width: 420,
      margin: 2,
      errorCorrectionLevel: 'H',
      darkColor: '#110C1D',
      lightColor: '#FFFFFF'
    })
      .then((url) => {
        if (isCurrent) {
          setQrDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate UPI QR code:', err);
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, upiPayUrl]);

  if (!isOpen || !order) return null;

  const handleCopyLink = () => {
    if (!upiPayUrl) return;
    navigator.clipboard.writeText(upiPayUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyUpiId = () => {
    if (!activeUpiId) return;
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const handleDownloadQr = async () => {
    if (!qrDataUrl) return;
    setDownloadingSlip(true);

    try {
      const slipDataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const w = 800;
            const h = 1180;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get 2D canvas context');

            // 1. Crisp canvas background
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(0, 0, w, h);

            // 2. Main voucher card
            const cardX = 30;
            const cardY = 30;
            const cardW = 740;
            const cardH = 1120;
            const cardR = 24;

            drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 3. Purple Header Banner
            const headerH = 145;
            drawRoundedTopRect(ctx, cardX, cardY, cardW, headerH, cardR);
            const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + headerH);
            grad.addColorStop(0, '#581C87');
            grad.addColorStop(0.5, '#6B00FF');
            grad.addColorStop(1, '#7C3AED');
            ctx.fillStyle = grad;
            ctx.fill();

            // Header Texts
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('FLOCARDS', w / 2, cardY + 54);

            ctx.fillStyle = '#E9D5FF';
            ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('OFFICIAL PAYMENT SLIP & QR VOUCHER', w / 2, cardY + 84);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Scan and pay instantly using Google Pay, PhonePe, Paytm, or BHIM', w / 2, cardY + 114);

            // 4. Order Information Container
            const infoX = 60;
            const infoY = 195;
            const infoW = 680;
            const infoH = 105;
            drawRoundedRect(ctx, infoX, infoY, infoW, infoH, 14);
            ctx.fillStyle = '#F8FAFC';
            ctx.fill();
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Left: Order Ref & Customer
            ctx.textAlign = 'left';
            ctx.fillStyle = '#64748B';
            ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('ORDER REFERENCE', infoX + 24, infoY + 30);

            ctx.fillStyle = '#1E293B';
            ctx.font = '800 18px monospace';
            ctx.fillText(`#${orderRef}`, infoX + 24, infoY + 55);

            ctx.fillStyle = '#64748B';
            ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('CUSTOMER', infoX + 24, infoY + 85);

            ctx.fillStyle = '#1E293B';
            ctx.font = '600 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const custDisplay = customerPhone ? `${customerName} (${customerPhone})` : customerName;
            ctx.fillText(custDisplay.length > 32 ? custDisplay.substring(0, 30) + '...' : custDisplay, infoX + 95, infoY + 85);

            // Right: Product / Edition & Date
            const rightColX = infoX + 380;
            ctx.fillStyle = '#64748B';
            ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('PRODUCT / EDITION', rightColX, infoY + 30);

            ctx.fillStyle = '#6B00FF';
            ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(edition, rightColX, infoY + 55);

            ctx.fillStyle = '#64748B';
            ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('GENERATED DATE', rightColX, infoY + 85);

            ctx.fillStyle = '#334155';
            ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            ctx.fillText(todayStr, rightColX + 115, infoY + 85);

            // 5. Bill Amount Highlight Box
            const amtX = 60;
            const amtY = 320;
            const amtW = 680;
            const amtH = 96;
            drawRoundedRect(ctx, amtX, amtY, amtW, amtH, 14);
            ctx.fillStyle = '#FAF5FF';
            ctx.fill();
            ctx.strokeStyle = '#D8B4FE';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#7C3AED';
            ctx.font = '800 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('TOTAL PAYABLE AMOUNT', w / 2, amtY + 28);

            ctx.fillStyle = '#6B00FF';
            ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(`₹${formattedAmount}`, w / 2, amtY + 68);

            ctx.fillStyle = '#6B7280';
            ctx.font = '500 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Amount & order reference are automatically pre-filled in UPI apps', w / 2, amtY + 88);

            // 6. QR Code Card Container
            const qrCardX = 175;
            const qrCardY = 435;
            const qrCardW = 450;
            const qrCardH = 490;
            drawRoundedRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 18);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = '#7C3AED';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw QR Image
            const qrImgSize = 360;
            const qrImgX = (w - qrImgSize) / 2;
            const qrImgY = qrCardY + 22;
            ctx.drawImage(img, qrImgX, qrImgY, qrImgSize, qrImgSize);

            // UPI ID Pill
            const upiPillX = qrCardX + 30;
            const upiPillY = qrCardY + 400;
            const upiPillW = qrCardW - 60;
            const upiPillH = 44;
            drawRoundedRect(ctx, upiPillX, upiPillY, upiPillW, upiPillH, 10);
            ctx.fillStyle = '#F3F4F6';
            ctx.fill();
            ctx.strokeStyle = '#D1D5DB';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#1E293B';
            ctx.font = '800 15px monospace';
            ctx.fillText(`UPI ID: ${activeUpiId}`, w / 2, upiPillY + 28);

            ctx.fillStyle = '#10B981';
            ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('● Verified Merchant • Instant Payment Settlement', w / 2, qrCardY + 470);

            // 7. Supported Apps Bar
            const appsX = 60;
            const appsY = 945;
            const appsW = 680;
            const appsH = 54;
            drawRoundedRect(ctx, appsX, appsY, appsW, appsH, 12);
            ctx.fillStyle = '#F8FAFC';
            ctx.fill();
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#94A3B8';
            ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('SUPPORTED PAYMENT METHODS', w / 2, appsY + 21);

            ctx.fillStyle = '#334155';
            ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Google Pay  •  PhonePe  •  Paytm  •  BHIM  •  CRED  •  Any UPI App', w / 2, appsY + 42);

            // 8. Security & Footer Note
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(80, 1020);
            ctx.lineTo(720, 1020);
            ctx.stroke();

            ctx.fillStyle = '#10B981';
            ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('✔ 100% Secure Transaction & Immediate Order Processing', w / 2, 1048);

            ctx.fillStyle = '#64748B';
            ctx.font = '500 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Please do not modify the pre-filled amount to ensure automated order reconciliation.', w / 2, 1072);

            ctx.fillStyle = '#6B00FF';
            ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('FLOCARDS INDIA  •  www.flocard.in  •  Official Print Production Voucher', w / 2, 1098);

            resolve(canvas.toDataURL('image/png', 1.0));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load QR image on canvas'));
        img.src = qrDataUrl;
      });

      const a = document.createElement('a');
      a.href = slipDataUrl;
      a.download = `FLOCARD-Payment-Slip-${orderRef}-INR-${amount}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to generate payment slip PNG:', err);
      // Fallback to raw QR download if canvas fails for any unexpected reason
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `FLOCARD-Payment-QR-${orderRef}-INR-${amount}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingSlip(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Slip - ${orderRef}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #111; }
            .card { max-width: 520px; margin: 0 auto; background: #fff; border: 2px solid #6B00FF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: center; }
            .header { background: linear-gradient(135deg, #581C87 0%, #6B00FF 100%); color: #fff; padding: 24px 20px 20px; }
            .header h2 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; }
            .header .sub { font-size: 11px; font-weight: 700; color: #e9d5ff; margin-top: 4px; letter-spacing: 0.5px; }
            .header .inst { font-size: 12px; color: rgba(255,255,255,0.85); margin-top: 6px; }
            .body { padding: 20px; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; text-align: left; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .row:last-child { margin-bottom: 0; }
            .lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .val { font-weight: 700; color: #1e293b; }
            .amt-box { background: #faf5ff; border: 2px solid #d8b4fe; border-radius: 12px; padding: 12px; margin-bottom: 16px; }
            .amt-title { font-size: 11px; font-weight: 800; color: #7c3aed; }
            .amt-num { font-size: 34px; font-weight: 900; color: #6B00FF; margin: 4px 0; }
            .amt-sub { font-size: 11px; color: #6b7280; }
            .qr-wrap { display: inline-block; background: #fff; padding: 12px; border: 2px solid #6B00FF; border-radius: 16px; margin: 6px 0 14px; }
            .qr-wrap img { width: 240px; height: 240px; display: block; }
            .upi-pill { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-family: monospace; font-weight: 700; color: #1e293b; }
            .verified { font-size: 11px; font-weight: 700; color: #10b981; margin-top: 6px; }
            .apps { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; font-size: 11px; color: #475569; font-weight: 600; margin-top: 14px; }
            .footer { font-size: 10.5px; color: #94a3b8; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2>FLOCARDS</h2>
              <div class="sub">OFFICIAL PAYMENT SLIP & QR VOUCHER</div>
              <div class="inst">Scan with Google Pay, PhonePe, Paytm, or BHIM</div>
            </div>
            <div class="body">
              <div class="info-box">
                <div class="row">
                  <div><div class="lbl">ORDER REFERENCE</div><div class="val">#${orderRef}</div></div>
                  <div style="text-align: right;"><div class="lbl">EDITION</div><div class="val" style="color:#6B00FF;">${edition}</div></div>
                </div>
                <div class="row">
                  <div><div class="lbl">CUSTOMER</div><div class="val">${customerName}${customerPhone ? ` (${customerPhone})` : ''}</div></div>
                  <div style="text-align: right;"><div class="lbl">DATE</div><div class="val">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
                </div>
              </div>

              <div class="amt-box">
                <div class="amt-title">TOTAL PAYABLE AMOUNT</div>
                <div class="amt-num">₹${formattedAmount}</div>
                <div class="amt-sub">Amount & reference pre-filled in UPI apps</div>
              </div>

              <div class="qr-wrap">
                <img src="${qrDataUrl}" alt="Payment QR Code" />
              </div>

              <div>
                <div class="upi-pill">UPI ID: ${activeUpiId}</div>
                <div class="verified">● 100% Verified FLOCARDS Merchant Account</div>
              </div>

              <div class="apps">
                Supported: Google Pay • PhonePe • Paytm • BHIM • CRED • Any UPI App
              </div>

              <div class="footer">
                ✔ 100% Secure Transaction • www.flocard.in • hello@flocard.in
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const bgModal = isLight ? '#FFFFFF' : '#110C1D';
  const borderModal = isLight ? '#E5E7EB' : 'rgba(139, 92, 246, 0.25)';
  const textPrimary = isLight ? '#111827' : '#F9FAFB';
  const textSecondary = isLight ? '#4B5563' : '#9CA3AF';
  const textMuted = isLight ? '#9CA3AF' : '#6B7280';
  const elevatedBg = isLight ? '#F9FAFB' : '#1A132B';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          backgroundColor: bgModal,
          borderRadius: '20px',
          border: `1px solid ${borderModal}`,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${borderModal}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isLight
              ? 'linear-gradient(135deg, rgba(107, 0, 255, 0.05) 0%, rgba(147, 51, 234, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(107, 0, 255, 0.15) 0%, rgba(17, 12, 29, 0.8) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6B00FF 0%, #905cfc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(107, 0, 255, 0.35)'
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: textPrimary }}>
                  Dynamic Payment QR Code
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#10B98122',
                    color: '#10B981',
                    border: '1px solid #10B98144'
                  }}
                >
                  Amount Auto-Filled
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: textSecondary }}>
                Scannable with Google Pay, PhonePe, Paytm, BHIM & CRED
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: textMuted,
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Order & Amount Highlight Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              backgroundColor: elevatedBg,
              border: `1px solid ${borderModal}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#6B00FF', letterSpacing: '0.05em' }}>
                Order #{orderRef} • {edition}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: textPrimary, marginTop: '2px' }}>
                {customerName}
                {customerPhone && <span style={{ fontSize: '0.8rem', color: textMuted, fontWeight: 500, marginLeft: '6px' }}>({customerPhone})</span>}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: textMuted, fontWeight: 600 }}>Exact Payable Amount</div>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: isLight ? '#6B00FF' : '#A855F7',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em'
                }}
              >
                ₹{formattedAmount}
              </div>
            </div>
          </div>

          {/* QR Code Presentation Canvas */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              backgroundColor: isLight ? '#F3F4F6' : '#0B0714',
              borderRadius: '16px',
              border: `1px solid ${borderModal}`,
              position: 'relative'
            }}
          >
            {/* White QR container for flawless scanning */}
            <div
              style={{
                width: '260px',
                height: '260px',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '12px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#6B00FF' }}>
                  <RefreshCw size={28} className="animate-spin" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Generating QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI Payment QR for ₹${formattedAmount}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ color: '#EF4444', fontSize: '0.8rem' }}>Failed to generate QR</div>
              )}
            </div>

            {/* Scan Prompt Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '14px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(107, 0, 255, 0.15)',
                border: isLight ? '1px solid #E5E7EB' : '1px solid rgba(107, 0, 255, 0.3)',
                color: isLight ? '#374151' : '#E9D5FF',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
            >
              <ShieldCheck size={14} color="#10B981" />
              <span>Scanning automatically fills <strong>₹{formattedAmount}</strong> in Google Pay</span>
            </div>
          </div>

          {/* Payee UPI ID Bar */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: elevatedBg,
              border: `1px solid ${borderModal}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: textMuted, fontWeight: 600, marginBottom: '2px' }}>
                Official Payee UPI ID:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: textPrimary, fontSize: '0.92rem' }}>
                  {activeUpiId}
                </span>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(107, 0, 255, 0.1)', color: '#A855F7', border: '1px solid rgba(107, 0, 255, 0.25)' }}>
                  Configured in Settings
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyUpiId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isLight ? '#EDE9FE' : 'rgba(107, 0, 255, 0.2)',
                border: '1px solid rgba(107, 0, 255, 0.3)',
                color: '#6B00FF',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedUpi ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: waUrl ? '1fr 1fr' : '1fr', gap: '10px' }}>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageCircle size={16} />
                <span>Send via WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#6B00FF',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(107, 0, 255, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy GPay Link'}</span>
            </button>
          </div>

          {/* Secondary Utilities: Download & Print */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={downloadingSlip || !qrDataUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${borderModal}`,
                color: textSecondary,
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: downloadingSlip ? 'wait' : 'pointer',
                opacity: downloadingSlip ? 0.7 : 1
              }}
              title="Download complete branded payment voucher with order details as PNG"
            >
              {downloadingSlip ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              <span>{downloadingSlip ? 'Generating Slip...' : 'Download Slip (PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${borderModal}`,
                color: textSecondary,
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={13} />
              <span>Print Slip</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
