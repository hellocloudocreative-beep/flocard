/* ==========================================================================
   FLOCARD DIGITAL PROFILE THEME PRESETS ENGINE
   Provides comprehensive luxury finishes and synchronized palettes for:
   1. Digital Profile Pages (/p/:slug)
   2. Profile Editor (Admin & User)
   3. Morphing Compact Identity Cards
   ========================================================================== */

export const PROFILE_THEMES = {
  gold: {
    id: 'gold',
    name: 'Gold Edition',
    badge: 'Luxury 24K',
    subtitle: 'Champagne Gold & Charcoal',
    description: 'Near-black charcoal canvas adorned with refined champagne gold typography and radiant metallic glow.',
    accentColor: '#E9C766',
    secondaryColor: '#C9972C',
    glowColor: '#C9972C',
    cardBg: '#0C0B0A',
    pageBgDark: '#0A0908',
    pageBgLight: '#FAF7EE',
    textColor: '#FFF0A6',
    subtitleColor: '#C5A059',
    borderColor: 'rgba(233, 199, 102, 0.35)',
    borderGlow: 'rgba(201, 151, 44, 0.25)',
    bannerGradientStart: '#2A1F0B',
    bannerGradientEnd: '#0D0B08',
    bannerSolid: '#181308',
    buttonBg: '#E9C766',
    buttonText: '#0C0B0A',
    verifiedBadgeBg: '#C9972C',
    verifiedBadgeColor: '#0C0B0A',
    cardPortraitBg: '/assets/cardbg-gold-portrait.png',
    cardLandscapeBg: '/assets/cardbg-gold.png',
    logoAsset: '/assets/flocard-logo-gold.png',
    swatchGradient: 'linear-gradient(135deg, #E9C766 0%, #C9972C 50%, #0C0B0A 100%)'
  },
  purple: {
    id: 'purple',
    name: 'Purple Signature',
    badge: 'Signature',
    subtitle: 'Obsidian & Luminous Ultraviolet',
    description: 'Our iconic signature theme with deep cinematic ultraviolet radiance and velvet obsidian surfaces.',
    accentColor: '#A855F7',
    secondaryColor: '#6B00FF',
    glowColor: '#6B00FF',
    cardBg: '#0F091A',
    pageBgDark: '#08060D',
    pageBgLight: '#F8F7FC',
    textColor: '#FFFFFF',
    subtitleColor: '#D8B4FE',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    borderGlow: 'rgba(107, 0, 255, 0.35)',
    bannerGradientStart: '#2E1065',
    bannerGradientEnd: '#090514',
    bannerSolid: '#1A0B2E',
    buttonBg: '#A855F7',
    buttonText: '#FFFFFF',
    verifiedBadgeBg: '#6B00FF',
    verifiedBadgeColor: '#FFFFFF',
    cardPortraitBg: '/assets/cardbg-purple-portrait.png',
    cardLandscapeBg: '/assets/cardbg-purple.png',
    logoAsset: '/assets/flocard-logo-white.png',
    swatchGradient: 'linear-gradient(135deg, #A855F7 0%, #6B00FF 50%, #0F091A 100%)'
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Steel',
    badge: 'Modern',
    subtitle: 'Brushed Platinum Alloy',
    description: 'Engineered brushed platinum and chrome precision lines against pure carbon black.',
    accentColor: '#E2E8F0',
    secondaryColor: '#94A3B8',
    glowColor: '#64748B',
    cardBg: '#0F1117',
    pageBgDark: '#080A0F',
    pageBgLight: '#F1F5F9',
    textColor: '#FFFFFF',
    subtitleColor: '#CBD5E1',
    borderColor: 'rgba(226, 232, 240, 0.35)',
    borderGlow: 'rgba(226, 232, 240, 0.25)',
    bannerGradientStart: '#1E293B',
    bannerGradientEnd: '#0A0D14',
    bannerSolid: '#111827',
    buttonBg: '#E2E8F0',
    buttonText: '#0F1117',
    verifiedBadgeBg: '#94A3B8',
    verifiedBadgeColor: '#0F1117',
    cardPortraitBg: '/assets/cardbg-platinum-portrait.png',
    cardLandscapeBg: '/assets/cardbg-platinum.png',
    logoAsset: '/assets/flocard-logo-platinum.png',
    swatchGradient: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 50%, #0F1117 100%)'
  },
  metal: {
    id: 'metal',
    name: 'Stealth Metal',
    badge: 'Stealth',
    subtitle: 'Brushed Gunmetal Titanium',
    description: 'Precision-engineered brushed gunmetal with laser-crisp white typography and executive minimalism.',
    accentColor: '#CBD5E1',
    secondaryColor: '#64748B',
    glowColor: '#475569',
    cardBg: '#18191C',
    pageBgDark: '#0D0E11',
    pageBgLight: '#F3F4F6',
    textColor: '#F1F5F9',
    subtitleColor: '#94A3B8',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    borderGlow: 'rgba(148, 163, 184, 0.25)',
    bannerGradientStart: '#2B2D31',
    bannerGradientEnd: '#121316',
    bannerSolid: '#18191C',
    buttonBg: '#CBD5E1',
    buttonText: '#18191C',
    verifiedBadgeBg: '#64748B',
    verifiedBadgeColor: '#FFFFFF',
    cardPortraitBg: '/assets/cardbg-metal-portrait.png',
    cardLandscapeBg: '/assets/cardbg-metal.png',
    logoAsset: '/assets/flocard-logo-white.png',
    swatchGradient: 'linear-gradient(135deg, #CBD5E1 0%, #64748B 50%, #18191C 100%)'
  },
  rose_gold: {
    id: 'rose_gold',
    name: 'Rose Gold',
    badge: 'Elegance',
    subtitle: 'Metallic Rose Gold Foil',
    description: 'Warm metallic rose gold radiance balanced with deep mahogany velvet undertones.',
    accentColor: '#F4B5A4',
    secondaryColor: '#D97762',
    glowColor: '#C5624D',
    cardBg: '#140A0D',
    pageBgDark: '#0F070A',
    pageBgLight: '#FFF5F5',
    textColor: '#FFE4DE',
    subtitleColor: '#E0A899',
    borderColor: 'rgba(244, 181, 164, 0.35)',
    borderGlow: 'rgba(224, 168, 153, 0.25)',
    bannerGradientStart: '#3B151E',
    bannerGradientEnd: '#0F070A',
    bannerSolid: '#220E14',
    buttonBg: '#F4B5A4',
    buttonText: '#140A0D',
    verifiedBadgeBg: '#D97762',
    verifiedBadgeColor: '#FFFFFF',
    cardPortraitBg: '/assets/cardbg-purple-portrait.png',
    cardLandscapeBg: '/assets/cardbg-purple.png',
    logoAsset: '/assets/flocard-logo-gold.png',
    swatchGradient: 'linear-gradient(135deg, #F4B5A4 0%, #D97762 50%, #140A0D 100%)'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Sovereign',
    badge: 'Prestige',
    subtitle: 'Deep Malachite & Emerald',
    description: 'Majestic deep forest emerald radiance paired with sovereign lustrous highlights.',
    accentColor: '#10B981',
    secondaryColor: '#059669',
    glowColor: '#059669',
    cardBg: '#05140D',
    pageBgDark: '#030D08',
    pageBgLight: '#F0FDF4',
    textColor: '#A7F3D0',
    subtitleColor: '#6EE7B7',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderGlow: 'rgba(16, 185, 129, 0.25)',
    bannerGradientStart: '#064E3B',
    bannerGradientEnd: '#021810',
    bannerSolid: '#052E23',
    buttonBg: '#10B981',
    buttonText: '#05140D',
    verifiedBadgeBg: '#059669',
    verifiedBadgeColor: '#FFFFFF',
    cardPortraitBg: '/assets/cardbg-purple-portrait.png',
    cardLandscapeBg: '/assets/cardbg-purple.png',
    logoAsset: '/assets/flocard-logo-white.png',
    swatchGradient: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #05140D 100%)'
  },
  sapphire: {
    id: 'sapphire',
    name: 'Royal Sapphire',
    badge: 'Executive',
    subtitle: 'Cobalt & Electric Blue',
    description: 'Deep royal blue aura with crystalline electric highlights for visionary leaders.',
    accentColor: '#38BDF8',
    secondaryColor: '#2563EB',
    glowColor: '#1D4ED8',
    cardBg: '#081024',
    pageBgDark: '#040713',
    pageBgLight: '#F0F9FF',
    textColor: '#BAE6FD',
    subtitleColor: '#7DD3FC',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderGlow: 'rgba(59, 130, 246, 0.25)',
    bannerGradientStart: '#0C2B68',
    bannerGradientEnd: '#040713',
    bannerSolid: '#0A1A3A',
    buttonBg: '#38BDF8',
    buttonText: '#081024',
    verifiedBadgeBg: '#2563EB',
    verifiedBadgeColor: '#FFFFFF',
    cardPortraitBg: '/assets/cardbg-purple-portrait.png',
    cardLandscapeBg: '/assets/cardbg-purple.png',
    logoAsset: '/assets/flocard-logo-white.png',
    swatchGradient: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #081024 100%)'
  },
  white: {
    id: 'white',
    name: 'Porcelain White',
    badge: 'Minimalist',
    subtitle: 'Pure White & Gold Accent',
    description: 'Pristine architectural porcelain white aesthetic with ultra-sharp high contrast and gold leaf styling.',
    accentColor: '#E9C766',
    secondaryColor: '#18181B',
    glowColor: '#E9C766',
    cardBg: '#18181B',
    pageBgDark: '#0D0E12',
    pageBgLight: '#FFFFFF',
    textColor: '#FFFFFF',
    subtitleColor: '#E2E8F0',
    borderColor: 'rgba(233, 199, 102, 0.3)',
    borderGlow: 'rgba(233, 199, 102, 0.2)',
    bannerGradientStart: '#2A2A30',
    bannerGradientEnd: '#0E0E12',
    bannerSolid: '#18181F',
    buttonBg: '#E9C766',
    buttonText: '#18181B',
    verifiedBadgeBg: '#E9C766',
    verifiedBadgeColor: '#18181B',
    cardPortraitBg: '',
    cardLandscapeBg: '',
    logoAsset: '/assets/flocard-logo-gold.png',
    swatchGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E9C766 50%, #18181B 100%)'
  }
};

/**
 * Safely resolves a theme definition based on a theme identifier, card finish, or edition.
 * Defaults to 'purple' (Signature Purple).
 */
export function getProfileTheme(key) {
  if (!key) return PROFILE_THEMES.purple;
  const normalized = String(key).trim().toLowerCase().replace(/[-\s]/g, '_');
  
  if (normalized === 'steel') return PROFILE_THEMES.platinum;
  if (normalized === 'rosegold') return PROFILE_THEMES.rose_gold;
  
  return PROFILE_THEMES[normalized] || PROFILE_THEMES.purple;
}

/**
 * Returns list of all available themes for UI pickers
 */
export const AVAILABLE_PROFILE_THEMES = Object.values(PROFILE_THEMES);

/**
 * Applies a theme preset to an existing profile object or form data
 */
export function applyThemeToProfile(profile, themeKey) {
  const theme = getProfileTheme(themeKey);
  const currentBanner = profile?.banner || {};

  // Check if banner is using preset gradients
  const isDefaultGradient = !currentBanner.url && (
    !currentBanner.type || currentBanner.type === 'gradient'
  );

  return {
    ...profile,
    theme: theme.id,
    cardFinish: theme.id === 'platinum' ? 'steel' : theme.id,
    edition: theme.id,
    accentColor: theme.accentColor,
    glowColor: theme.glowColor,
    cardPortraitBg: theme.cardPortraitBg,
    banner: {
      ...currentBanner,
      gradientStart: isDefaultGradient ? theme.bannerGradientStart : (currentBanner.gradientStart || theme.bannerGradientStart),
      gradientEnd: isDefaultGradient ? theme.bannerGradientEnd : (currentBanner.gradientEnd || theme.bannerGradientEnd),
      solidColor: isDefaultGradient ? theme.bannerSolid : (currentBanner.solidColor || theme.bannerSolid)
    }
  };
}
