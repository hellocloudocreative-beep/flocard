/* ==========================================================================
   FLOCARDS VIDEO PORTFOLIO SECTION
   Features:
   - YouTube standard (16:9) and YouTube Shorts (9:16) embed resolver
   - URL parsing & validation (supports youtu.be, youtube.com/watch, youtube.com/shorts)
   - Lazy-loaded iframes without intrusive autoplays
   - Titles, descriptions, and accessible controls
   ========================================================================== */

import React from 'react';
import { Video, Play, Sparkles } from 'lucide-react';
import { YoutubeIcon } from '../SocialIcons';

/**
 * Extract YouTube Embed URL from any valid YouTube / Shorts link
 */
export function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const clean = url.trim();

  // YouTube Shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = clean.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}`,
      videoId: shortsMatch[1],
      isShort: true
    };
  }

  // Standard watch: youtube.com/watch?v=VIDEO_ID
  const watchMatch = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (watchMatch && watchMatch[1]) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${watchMatch[1]}`,
      videoId: watchMatch[1],
      isShort: false
    };
  }

  // Direct embed link
  if (clean.includes('youtube.com/embed/')) {
    return {
      embedUrl: clean,
      videoId: clean.split('embed/')[1]?.split('?')[0],
      isShort: false
    };
  }

  return null;
}

export default function VideoPortfolioSection({
  videos = [],
  accentColor = '#A855F7',
  glowColor = '#6B00FF',
  isLight = false
}) {
  const published = Array.isArray(videos)
    ? videos.filter(v => Boolean(v && v.url && v.visible !== false))
    : [];

  if (published.length === 0) {
    return null;
  }

  return (
    <section
      className="flocard-profile-section flocard-videos-section"
      style={{
        width: '100%',
        margin: '0 auto',
        padding: '36px 0',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Video size={20} />
          </div>
          <div>
            <h2
              style={{
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                fontSize: 'clamp(1.15rem, 3.2vw, 1.4rem)',
                fontWeight: 700,
                color: isLight ? '#130B22' : '#FFFFFF',
                margin: 0,
                lineHeight: 1.2
              }}
            >
              Featured Videos & Demonstrations
            </h2>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748B' : '#94A3B8' }}>
              Product Walkthroughs & Recorded Keynotes
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {published.map((vid, idx) => {
          const ytInfo = getYouTubeEmbedUrl(vid.url);
          const isShort = vid.isShort || ytInfo?.isShort;

          return (
            <div
              key={vid.id || idx}
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.07)'}`,
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.04)' : '0 10px 30px rgba(0,0,0,0.3)',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Embed Container */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: isShort ? '9/16' : '16/9',
                  maxHeight: isShort ? '480px' : 'none',
                  backgroundColor: '#000000',
                  position: 'relative'
                }}
              >
                {ytInfo ? (
                  <iframe
                    src={`${ytInfo.embedUrl}?rel=0&modestbranding=1&playsinline=1`}
                    title={vid.title || 'Video Player'}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#94A3B8',
                      fontSize: '0.86rem'
                    }}
                  >
                    Invalid video URL
                  </div>
                )}
              </div>

              {/* Title & Description */}
              {(vid.title || vid.description) && (
                <div style={{ padding: '16px 20px' }}>
                  {vid.title && (
                    <h3
                      style={{
                        fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: isLight ? '#0F172A' : '#FFFFFF',
                        margin: '0 0 6px',
                        lineHeight: 1.3
                      }}
                    >
                      {vid.title}
                    </h3>
                  )}
                  {vid.description && (
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: isLight ? '#475569' : '#CBD5E1',
                        lineHeight: 1.5,
                        margin: 0
                      }}
                    >
                      {vid.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
