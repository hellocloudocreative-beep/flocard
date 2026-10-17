/* ==========================================================================
   FLOCARD CONSTANTS & CONFIGURATION
   ========================================================================== */

export const BRAND = {
  name: 'FLOCARD',
  tagline: 'One Tap. Every Connection.',
  domain: 'flocard.in',
  supportEmail: 'contact@flocard.in',
  whatsapp: '916238578552',
  whatsappFormatted: '+91 6238 578 552',
  phone: '+91 6238 578 552',
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
    description: 'Black card surface adorned with restrained 24K-toned metallic gold foil accents and warm reflections.',
    accentColor: '#D4AF37',
    secondaryColor: '#AA820A',
    textColor: '#F5E6BE',
    gradient: 'linear-gradient(135deg, #12100E 0%, #2A2111 60%, #0D0B08 100%)',
    bgImage: '/assets/cardbg-gold.png',
    logoAsset: '/assets/flocard-logo-gold.png',
    border: '1px solid rgba(212, 175, 55, 0.45)',
    glow: 'rgba(212, 175, 55, 0.35)',
    cardBg: '#12100E',
    highlightText: 'Black with 24K Gold Foil Accent',
    defaults: {
      primaryAccent: '#D4AF37',
      secondaryAccent: '#AA820A',
      nameColor: '#D4AF37',
      roleColor: '#D4AF37',
      taglineColor: '#A89260',
      nfcColor: '#D4AF37',
      qrColor: '#D4AF37'
    },
    specs: {
      material: 'Obsidian Matte Polymer with Gold Edge Foil',
      finish: 'Dual-Tone Brushed Metal & Velvet Touch',
      chip: 'NXP NTAG216 High Frequency 13.56 MHz',
      capacity: '888 Bytes usable EEPROM memory',
      durability: 'Scratch-resistant ceramic coating'
    }
  },
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
  }
};

export function getFlocardLogoAsset(edition = 'purple', primaryAccent = null) {
  if (edition === 'gold') return '/assets/flocard-logo-gold.png';
  if (edition === 'platinum') return '/assets/flocard-logo-platinum.png';
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
