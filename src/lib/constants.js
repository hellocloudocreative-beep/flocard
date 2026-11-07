/* ==========================================================================
   FLOCARD CONSTANTS & CONFIGURATION
   ========================================================================== */

export const BRAND = {
  name: 'FLOCARD',
  tagline: '',
  domain: 'flocard.in',
  supportEmail: 'contact@flocard.in',
  whatsapp: '919778278552',
  whatsappFormatted: '+91 97782 78552',
  phone: '+91 97782 78552',
  heroEyebrow: 'PREMIUM NFC BUSINESS CARDS',
  heroTitle: 'YOUR IDENTITY. ONE TAP AWAY.',
  heroSubtitle: 'Premium NFC business cards that connect your professional identity, portfolio, and contact details in one tap.',
};

export const TEMPLATES = {
  standard: {
    id: 'standard',
    name: 'Standard FLOCARD Design',
    badge: 'Theme 1 (Pages 1–3)',
    description: 'Name, Role, Tagline, and NFC icon on the front. Official FLOCARD logo and QR code on the back.',
    pdfPages: 'Pages 1–3'
  },
  customer_logo: {
    id: 'customer_logo',
    name: 'Customer Logo Design',
    badge: 'Theme 2 (Pages 4–6)',
    description: 'Prominent Customer Logo badge, NFC icon, and Tagline on the front. Name, Role, FLOCARD logo, and QR code on the back.',
    pdfPages: 'Pages 4–6'
  }
};

export const EDITIONS = {
  platinum: {
    id: 'platinum',
    name: 'Platinum Edition',
    badge: 'Modern',
    popular: false,
    tagline: 'A sleek and modern look for forward-thinking professionals.',
    description: 'Engineered brushed platinum and chrome precision lines against pure carbon black.',
    accentColor: '#E2E8F0',
    secondaryColor: '#94A3B8',
    textColor: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #0F1117 0%, #1E2330 60%, #0A0D14 100%)',
    bgImage: '/assets/cardbg-platinum.png',
    bgPortraitImage: '/assets/cardbg-platinum-portrait.png',
    logoAsset: '/assets/flocard-logo-platinum.png',
    border: '1px solid rgba(226, 232, 240, 0.4)',
    glow: 'rgba(226, 232, 240, 0.25)',
    cardBg: '#0F1117',
    highlightText: 'Sleek Obsidian & Platinum Alloy Accent',
    defaults: {
      primaryAccent: '#E2E8F0',
      secondaryAccent: '#94A3B8',
      nameColor: '#E2E8F0',
      roleColor: '#CBD5E1',
      taglineColor: '#94A3B8',
      nfcColor: '#E2E8F0',
      qrColor: '#E2E8F0'
    },
    specs: {
      material: 'Satin Stainless Steel & Polymer Hybrid',
      finish: 'Precision Laser Etched with Frosted Luster',
      chip: 'NXP NTAG216 High Frequency 13.56 MHz',
      capacity: '888 Bytes usable EEPROM memory',
      durability: 'Bend-proof reinforced structure'
    }
  },
  purple: {
    id: 'purple',
    name: 'Purple Edition',
    badge: 'Signature',
    popular: true,
    tagline: 'Our signature theme with a luminous deep-purple & obsidian finish.',
    description: 'Cinematic deep-violet radiance combined with matte obsidian surfaces and crisp typography.',
    accentColor: '#A855F7',
    secondaryColor: '#6B00FF',
    textColor: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #100B19 0%, #200B3B 55%, #0B0714 100%)',
    bgImage: '/assets/cardbg-purple.png',
    bgPortraitImage: '/assets/cardbg-purple-portrait.png',
    logoAsset: '/assets/flocard-logo-white.png',
    border: '1px solid rgba(168, 85, 247, 0.4)',
    glow: 'rgba(107, 0, 255, 0.35)',
    cardBg: '#0F091A',
    highlightText: 'Signature Obsidian Purple',
    defaults: {
      primaryAccent: '#A855F7',
      secondaryAccent: '#6B00FF',
      nameColor: '#FFFFFF',
      roleColor: '#D8B4FE',
      taglineColor: '#B9AEC9',
      nfcColor: '#FFFFFF',
      qrColor: '#FFFFFF'
    },
    specs: {
      material: 'Recycled Matte Polymer / Metal Core Option',
      finish: 'Matte Obsidian with Ultraviolet UV Gloss Accent',
      chip: 'NXP NTAG216 High Frequency 13.56 MHz',
      capacity: '888 Bytes usable EEPROM memory',
      durability: 'Waterproof IP68, 100,000 tap cycles'
    }
  },
  gold: {
    id: 'gold',
    name: 'Gold Edition',
    badge: 'Luxury',
    popular: false,
    tagline: 'A bold and luxurious design for professionals who stand out.',
    description: 'Near-black charcoal surface adorned with refined metallic champagne gold typography and subtle brushed reflections.',
    accentColor: '#E9C766',
    secondaryColor: '#C9972C',
    textColor: '#FFF0A6',
    gradient: 'linear-gradient(145deg, #0C0B0A 0%, #151310 50%, #0A0908 100%)',
    bgImage: '/assets/cardbg-gold.png',
    bgPortraitImage: '/assets/cardbg-gold-portrait.png',
    logoAsset: '/assets/flocard-logo-gold.png',
    border: '1px solid rgba(233, 199, 102, 0.35)',
    glow: 'rgba(201, 151, 44, 0.18)',
    cardBg: '#0C0B0A',
    highlightText: 'Charcoal with Champagne Gold Metallic Typography',
    defaults: {
      primaryAccent: '#E9C766',
      secondaryAccent: '#C9972C',
      nameColor: '#E9C766',
      roleColor: '#E9C766',
      taglineColor: '#C5A059',
      nfcColor: '#E9C766',
      qrColor: '#E9C766'
    },
    specs: {
      material: 'Near-Black Matte Polymer with Champagne Gold Foil',
      finish: 'Dual-Tone Brushed Metal & Velvet Touch',
      chip: 'NXP NTAG216 High Frequency 13.56 MHz',
      capacity: '888 Bytes usable EEPROM memory',
      durability: 'Scratch-resistant ceramic coating'
    }
  },
  metal: {
    id: 'metal',
    name: 'Metal Edition',
    badge: 'Stealth',
    popular: false,
    tagline: 'Precision-engineered brushed gunmetal for modern leaders.',
    description: 'Dark brushed gunmetal finish with ultra-crisp laser-white typography and executive minimalism.',
    accentColor: '#CBD5E1',
    secondaryColor: '#64748B',
    textColor: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #18191C 0%, #2B2D31 55%, #121316 100%)',
    bgImage: '/assets/cardbg-metal.png',
    bgPortraitImage: '/assets/cardbg-metal-portrait.png',
    logoAsset: '/assets/flocard-logo-white.png',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    glow: 'rgba(148, 163, 184, 0.25)',
    cardBg: '#18191C',
    highlightText: 'Brushed Gunmetal Titanium Finish',
    defaults: {
      primaryAccent: '#CBD5E1',
      secondaryAccent: '#64748B',
      nameColor: '#FFFFFF',
      roleColor: '#CBD5E1',
      taglineColor: '#94A3B8',
      nfcColor: '#CBD5E1',
      qrColor: '#FFFFFF'
    },
    specs: {
      material: 'Brushed Gunmetal Steel & Composite Core',
      finish: 'Matte Brushed Metal with Laser Precision Etching',
      chip: 'NXP NTAG216 High Frequency 13.56 MHz',
      capacity: '888 Bytes usable EEPROM memory',
      durability: 'Scratch-resistant PVD coating, Waterproof IP68'
    }
  },
  white: {
    id: 'white',
    name: 'Pure White Edition',
    badge: 'Minimalist',
    popular: false,
    tagline: 'Pristine architectural porcelain white with pure black or metallic gold typography.',
    description: 'Engineered ultra-dense porcelain white composite with high-contrast obsidian black or metallic gold typography and laser-etched precision.',
    accentColor: '#000000',
    secondaryColor: '#E9C766',
    textColor: '#000000',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #EDF2F7 100%)',
    bgImage: '',
    bgPortraitImage: '',
    logoAsset: '/assets/flocard-logo-dark.png',
    border: '1px solid rgba(0, 0, 0, 0.14)',
    glow: 'rgba(0, 0, 0, 0.12)',
    cardBg: '#FFFFFF',
    highlightText: 'Pristine Porcelain White with High-Contrast Typography',
    defaults: {
      primaryAccent: '#000000',
      secondaryAccent: '#E9C766',
      nameColor: '#000000',
      roleColor: '#1A1A1A',
      detailsColor: '#1A1A1A',
      taglineColor: '#555555',
      nfcColor: '#000000',
      qrColor: '#000000'
    },
    specs: {
      material: 'Ultra-Dense Silk Matte Porcelain Polymer Composite',
      finish: 'Pristine Silk Touch White with Precision Contrast Laser Foil',
      chip: 'NXP NTAG216 High Frequency 13.56 MHz',
      capacity: '888 Bytes usable EEPROM memory',
      durability: 'Stain-resistant Oleophobic coating, Waterproof IP68'
    }
  }
};

export const CARD_BACKGROUNDS = {
  purple: {
    landscape: '/assets/cardbg-purple.png',
    portrait: '/assets/cardbg-purple-portrait.png',
    accent: '#A855F7',
    glow: '#6B00FF'
  },
  gold: {
    landscape: '/assets/cardbg-gold.png',
    portrait: '/assets/cardbg-gold-portrait.png',
    accent: '#E9C766',
    glow: '#C9972C'
  },
  steel: {
    landscape: '/assets/cardbg-platinum.png',
    portrait: '/assets/cardbg-platinum-portrait.png',
    accent: '#94A3B8',
    glow: '#64748B'
  },
  platinum: {
    landscape: '/assets/cardbg-platinum.png',
    portrait: '/assets/cardbg-platinum-portrait.png',
    accent: '#E2E8F0',
    glow: '#64748B'
  },
  metal: {
    landscape: '/assets/cardbg-metal.png',
    portrait: '/assets/cardbg-metal-portrait.png',
    accent: '#CBD5E1',
    glow: '#64748B'
  },
  white: {
    landscape: '',
    portrait: '',
    accent: '#000000',
    glow: 'rgba(0, 0, 0, 0.12)'
  }
};

export function getFlocardLogoAsset(edition = 'purple', primaryAccent = null, nameColor = null) {
  if (edition === 'gold') return '/assets/flocard-logo-gold.png';
  if (edition === 'platinum') return '/assets/flocard-logo-platinum.png';
  if (edition === 'metal') return '/assets/flocard-logo-white.png';
  if (edition === 'white') {
    const isGold = (primaryAccent && (primaryAccent.toLowerCase() === '#e9c766' || primaryAccent.toLowerCase() === '#d4af37')) ||
                   (nameColor && (nameColor.toLowerCase() === '#e9c766' || nameColor.toLowerCase() === '#d4af37'));
    return isGold ? '/assets/flocard-logo-gold.png' : '/assets/flocard-logo-dark.png';
  }
  return '/assets/flocard-logo-white.png';
}

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Customize Your Card',
    description: 'Choose a design template, personalize your name, role, typography, and company branding in our live interactive 3D studio.',
    icon: 'Layers'
  },
  {
    step: '02',
    title: 'Get Your NFC Card',
    description: 'We encode your secure NFC chip with encrypted redirect routing and precision-print your card with high-end tactile finish.',
    icon: 'PackageCheck'
  },
  {
    step: '03',
    title: 'Tap or Scan',
    description: 'No app required for anyone. Simply tap the card against any modern iPhone or Android, or scan the scannable dynamic QR code.',
    icon: 'Radio'
  },
  {
    step: '04',
    title: 'Make Connections',
    description: 'Your contacts can instantly save your verified vCard directly into their address book, view your portfolio, and contact you seamlessly.',
    icon: 'Users'
  }
];

export const FEATURES = [
  {
    title: 'NFC Enabled',
    subtitle: 'One tap sharing',
    desc: 'Instant contactless transmission to any smartphone without app downloads.'
  },
  {
    title: 'Premium Design',
    subtitle: 'Gold, Platinum & Purple',
    desc: 'Architected with aerospace-grade aesthetics, tactile finishes, and rounded corners.'
  },
  {
    title: 'Digital Profile',
    subtitle: 'Everything in one link',
    desc: 'Dynamic portfolios, rich social networks, booking links, and real-time edits.'
  },
  {
    title: 'Professional Identity',
    subtitle: 'Make a lasting impression',
    desc: 'Replace thousands of disposable paper cards with one sustainable digital signature.'
  }
];

export const FONT_OPTIONS = [
  { id: 'Space Grotesk', name: 'Space Grotesk', style: 'Modern Tech & Bold' },
  { id: 'Sora', name: 'Sora', style: 'Geometric Luxury' },
  { id: 'Inter', name: 'Inter', style: 'Ultra Clean & Minimal' },
  { id: 'Outfit', name: 'Outfit', style: 'Contemporary Editorial' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', style: 'Sleek Corporate' },
  { id: 'Cinzel', name: 'Cinzel', style: 'Regal Roman Classical' },
  { id: 'Playfair Display', name: 'Playfair Display', style: 'Luxury Serif' },
  { id: 'Montserrat', name: 'Montserrat', style: 'Geometric Bold' }
];

/**
 * Resolves a reliable Google Maps link from either an explicit URL,
 * or automatically generates a search link using street address + location city.
 */
export function resolveMapUrl(data = {}) {
  if (!data) return null;
  const rawUrl = typeof data === 'string' ? data : (data.mapsUrl || data.mapUrl || '');
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
    const trimmed = rawUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }
  const address = typeof data === 'object' ? data.address : '';
  const location = typeof data === 'object' ? data.location : '';
  const fullAddress = [address, location]
    .filter(Boolean)
    .map(s => String(s).trim())
    .filter(Boolean)
    .join(', ');
  if (fullAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  }
  return null;
}

