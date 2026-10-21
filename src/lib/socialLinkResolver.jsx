/* ==========================================================================
   FLOCARD SOCIAL & CONTACT LINK RESOLVER
   Dynamic link resolution engine:
   1. Explicit custom icon override
   2. Known platform match (Lucide & official SVGs)
   3. Auto-detected website favicon via hostname
   4. Clean generic fallback icon
   Guarantees valid href (tel:, mailto:, https:) and safe external opening.
   ========================================================================== */

import React, { useState } from 'react';
import {
  Globe,
  Link as LinkIcon,
  Phone,
  Mail,
  MessageSquare,
  Share2,
  Video,
  Send,
  Music,
  FileText,
  Compass
} from 'lucide-react';
import {
  PhoneIcon,
  MailIcon,
  WhatsappIcon,
  GlobeIcon,
  LinkedinIcon,
  InstagramIcon,
  TwitterIcon,
  GithubIcon,
  YoutubeIcon,
  FacebookIcon
} from '../components/SocialIcons';

// Known social domains mapped to platform keys
const DOMAIN_PLATFORM_MAP = {
  'instagram.com': 'instagram',
  'instagr.am': 'instagram',
  'linkedin.com': 'linkedin',
  'wa.me': 'whatsapp',
  'whatsapp.com': 'whatsapp',
  'api.whatsapp.com': 'whatsapp',
  'twitter.com': 'twitter',
  'x.com': 'twitter',
  'github.com': 'github',
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'facebook.com': 'facebook',
  'fb.com': 'facebook',
  't.me': 'telegram',
  'telegram.me': 'telegram',
  'dribbble.com': 'dribbble',
  'behance.net': 'behance',
  'medium.com': 'medium',
  'spotify.com': 'spotify',
  'discord.gg': 'discord',
  'discord.com': 'discord',
  'pinterest.com': 'pinterest',
  'tiktok.com': 'tiktok'
};

/**
 * Extracts and normalizes hostname from any URL string safely.
 */
export function extractHostname(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('//')) {
    clean = 'https://' + clean;
  }
  try {
    const parsed = new URL(clean);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    // If not a full URL, strip paths manually
    const stripped = clean.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    return stripped.toLowerCase();
  }
}

/**
 * Generates an authoritative high-res favicon URL for any hostname.
 */
export function getFaviconUrl(urlOrHostname) {
  const host = extractHostname(urlOrHostname);
  if (!host) return null;
  // Use Google Favicon Service with 64px resolution
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

/**
 * Normalizes destination URL based on contact type
 */
export function normalizeLinkHref(type, value) {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';

  if (type === 'call' || type === 'phone') {
    return str.startsWith('tel:') ? str : `tel:${str.replace(/\s+/g, '')}`;
  }
  if (type === 'email' || type === 'mail') {
    return str.startsWith('mailto:') ? str : `mailto:${str}`;
  }
  if (type === 'whatsapp') {
    if (str.startsWith('https://wa.me') || str.startsWith('https://api.whatsapp.com')) return str;
    const cleanNum = str.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNum}`;
  }

  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('tel:') || str.startsWith('mailto:')) {
    return str;
  }
  return `https://${str}`;
}

/**
 * Detects the platform identifier from a key, type, or URL
 */
export function detectPlatform(keyOrType, url) {
  const normKey = (keyOrType || '').toLowerCase().trim();
  if (['phone', 'call', 'telephone', 'mobile'].includes(normKey)) return 'call';
  if (['email', 'mail'].includes(normKey)) return 'email';
  if (['whatsapp', 'wa'].includes(normKey)) return 'whatsapp';
  if (['website', 'web', 'site', 'homepage', 'portfolio'].includes(normKey)) return 'website';

  // Check URL hostname
  const host = extractHostname(url);
  for (const [domain, platform] of Object.entries(DOMAIN_PLATFORM_MAP)) {
    if (host === domain || host.endsWith('.' + domain)) {
      return platform;
    }
  }

  if (DOMAIN_PLATFORM_MAP[normKey]) return DOMAIN_PLATFORM_MAP[normKey];
  return 'custom';
}

/**
 * Resolves all active, ordered links for a given profile:
 * 1. Call
 * 2. Email
 * 3. WhatsApp
 * 4. Website
 * 5. LinkedIn
 * 6. Instagram
 * 7. Followed by any additional configured social or custom links
 */
export function resolveProfileLinks(profile) {
  if (!profile) return [];
  const links = [];

  // 1. Phone / Call
  if (profile.phone && String(profile.phone).trim()) {
    links.push({
      id: 'link_call',
      platform: 'call',
      label: 'Call',
      title: `Call ${profile.phone}`,
      href: normalizeLinkHref('call', profile.phone),
      isExternal: false,
      value: profile.phone
    });
  }

  // 2. Email
  if (profile.email && String(profile.email).trim()) {
    links.push({
      id: 'link_email',
      platform: 'email',
      label: 'Email',
      title: `Email ${profile.email}`,
      href: normalizeLinkHref('email', profile.email),
      isExternal: false,
      value: profile.email
    });
  }

  // 3. WhatsApp
  const rawWhatsApp = profile.whatsapp || profile.socialLinks?.whatsapp || profile.phone;
  if (rawWhatsApp && String(rawWhatsApp).trim()) {
    const cleanNum = String(rawWhatsApp).replace(/[^0-9]/g, '');
    if (cleanNum.length >= 7) {
      links.push({
        id: 'link_whatsapp',
        platform: 'whatsapp',
        label: 'WhatsApp',
        title: 'Chat on WhatsApp',
        href: `https://wa.me/${cleanNum}`,
        isExternal: true,
        value: cleanNum
      });
    }
  }

  // 4. Website
  if (profile.website && String(profile.website).trim()) {
    const host = extractHostname(profile.website);
    links.push({
      id: 'link_website',
      platform: 'website',
      label: 'Website',
      title: `Visit ${host || profile.website}`,
      href: normalizeLinkHref('url', profile.website),
      faviconUrl: getFaviconUrl(profile.website),
      isExternal: true,
      value: profile.website
    });
  }

  // 5. LinkedIn
  const linkedinUrl = profile.socialLinks?.linkedin || profile.linkedin;
  if (linkedinUrl && String(linkedinUrl).trim()) {
    links.push({
      id: 'link_linkedin',
      platform: 'linkedin',
      label: 'LinkedIn',
      title: 'Connect on LinkedIn',
      href: normalizeLinkHref('url', linkedinUrl),
      isExternal: true,
      value: linkedinUrl
    });
  }

  // 6. Instagram
  const instagramUrl = profile.socialLinks?.instagram || profile.instagram;
  if (instagramUrl && String(instagramUrl).trim()) {
    const cleanInsta = String(instagramUrl).startsWith('http')
      ? instagramUrl
      : `https://instagram.com/${instagramUrl.replace(/^@/, '')}`;
    links.push({
      id: 'link_instagram',
      platform: 'instagram',
      label: 'Instagram',
      title: 'Follow on Instagram',
      href: normalizeLinkHref('url', cleanInsta),
      isExternal: true,
      value: cleanInsta
    });
  }

  // 7. Additional predefined social links (Twitter/X, GitHub, YouTube, Facebook, Telegram)
  const socialMap = profile.socialLinks || {};
  const additionalPredefined = [
    { key: 'twitter', label: 'X (Twitter)', defaultPrefix: 'https://x.com/' },
    { key: 'x', label: 'X', defaultPrefix: 'https://x.com/' },
    { key: 'github', label: 'GitHub', defaultPrefix: 'https://github.com/' },
    { key: 'youtube', label: 'YouTube', defaultPrefix: 'https://youtube.com/' },
    { key: 'facebook', label: 'Facebook', defaultPrefix: 'https://facebook.com/' },
    { key: 'telegram', label: 'Telegram', defaultPrefix: 'https://t.me/' }
  ];

  additionalPredefined.forEach(({ key, label, defaultPrefix }) => {
    const rawVal = socialMap[key];
    if (rawVal && String(rawVal).trim() && !links.some(l => l.platform === (key === 'x' ? 'twitter' : key))) {
      const url = String(rawVal).startsWith('http') ? rawVal : `${defaultPrefix}${rawVal.replace(/^@/, '')}`;
      links.push({
        id: `link_${key}`,
        platform: key === 'x' ? 'twitter' : key,
        label,
        title: `${label}`,
        href: normalizeLinkHref('url', url),
        faviconUrl: getFaviconUrl(url),
        isExternal: true,
        value: url
      });
    }
  });

  // 8. Custom user links (e.g. from profile.customLinks or other arbitrary links)
  if (Array.isArray(profile.customLinks)) {
    profile.customLinks.forEach((item, index) => {
      if (!item || (!item.url && !item.href)) return;
      const url = item.url || item.href;
      const host = extractHostname(url);
      const detected = detectPlatform(item.title || item.label || host, url);
      const label = item.title || item.label || host.split('.')[0] || 'Link';
      links.push({
        id: item.id || `custom_link_${index}`,
        platform: detected,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        title: item.title || label,
        href: normalizeLinkHref('url', url),
        faviconUrl: getFaviconUrl(url),
        customIconUrl: item.iconUrl || item.icon,
        isExternal: true,
        value: url
      });
    });
  }

  return links;
}

/**
 * Renders the accurate Icon or auto-detected Favicon for a resolved link
 */
export function DynamicLinkIcon({ link, size = 20, color = 'currentColor' }) {
  const [faviconError, setFaviconError] = useState(false);
  const platform = link?.platform;

  if (platform === 'call') return <PhoneIcon size={size} color={color} />;
  if (platform === 'email') return <MailIcon size={size} color={color} />;
  if (platform === 'whatsapp') return <WhatsappIcon size={size} color={color} />;
  if (platform === 'linkedin') return <LinkedinIcon size={size} color={color} />;
  if (platform === 'instagram') return <InstagramIcon size={size} color={color} />;
  if (platform === 'twitter') return <TwitterIcon size={size} color={color} />;
  if (platform === 'github') return <GithubIcon size={size} color={color} />;
  if (platform === 'youtube') return <YoutubeIcon size={size} color={color} />;
  if (platform === 'facebook') return <FacebookIcon size={size} color={color} />;

  // Custom icon override URL
  if (link?.customIconUrl) {
    return (
      <img
        src={link.customIconUrl}
        alt={link.label || 'Link'}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius: '4px', objectFit: 'contain' }}
        onError={() => setFaviconError(true)}
      />
    );
  }

  // Favicon from domain (priority 3)
  if (link?.faviconUrl && !faviconError) {
    return (
      <img
        src={link.faviconUrl}
        alt={link.label || 'Favicon'}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '4px',
          objectFit: 'contain',
          display: 'block'
        }}
        onError={() => setFaviconError(true)}
        loading="lazy"
      />
    );
  }

  // Website default
  if (platform === 'website') return <GlobeIcon size={size} color={color} />;

  // Generic fallback
  return <LinkIcon size={size} color={color} />;
}
