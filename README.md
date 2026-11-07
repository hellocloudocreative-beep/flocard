# FLOCARD — Premium NFC Business Card & Digital Identity Platform

> A complete, functional, premium website, interactive front-and-back card designer, digital identity profiles, and admin management platform.

---

## 🚀 Live Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build for production
npm run build
```

The application runs locally on **`http://localhost:5173/`**.

---

## ✨ Features & Architecture

### 1. Cinematic Public Showcase Website
- **Cosmic Space Horizon**: Deep violet and obsidian planetary background with luminous light ribbons, floating cosmic asteroids, and rich atmospheric depth inspired by the reference design.
- **Interactive 3D Cards**: Floating front-and-back business card pair with real-time mouse-tracking tilt, reflection sheen glare, and smooth 180° flip animations.
- **Pillars & Feature Strip**: NFC-enabled contactless transmission, Gold / Platinum / Purple signature editions, and digital profile integration.
- **Realistic Phone Mockup**: Interactive smartphone showcase with real-time portfolio tabs, social icons, and direct vCard download.

### 2. Interactive Card Designer Studio (`/designer`)
- **ISO/IEC 7810 ID-1 Standard Proportions**: Exact 85.60 × 53.98 mm ratio (aspect 1.585) with rounded 3.18mm corners.
- **Front & Back Artwork Canvas**:
  - **Front**: Name, role, tagline, custom logo upload, NFC symbol styling, font size, and letter spacing.
  - **Back**: Real, dynamically generated scannable QR code linked to the user's live profile, technical specs label, and brand URL.
- **Safe Area & Bleed Guides**: 3mm safe zone guide lines and trim boundary overlays.
- **High-Resolution Exports**:
  - Download Front 300 DPI PNG
  - Download Back 300 DPI PNG
  - **Export Double-Sided Print-Ready PDF**: Vector PDF with printer trim crop marks.
- **Design Review Workflow**: Save drafts to customer account or submit for admin production approval.

### 3. Digital Business Profiles (`/p/:slug`)
- Accessible publicly at `/p/akhil`, `/p/sarah`, `/p/marcus`, or custom handles.
- **1-Tap Direct vCard Phonebook Save**: Downloads real `.vcf` vCard 3.0 file that imports name, role, company, phone, email, location, and bio directly into iOS & Android contacts.
- **Direct Social & Communication Channels**: Phone, WhatsApp, Email, LinkedIn, Instagram, Website, GitHub.
- **Interactive Tabs**: Portfolio showcases, services offered, and detailed bio.
- **QR Code Modal**: Allows anyone nearby to scan your profile directly from your screen.

### 4. Permanent NFC Redirect System (`/t/:cardCode`)
- Permanent encrypted routing endpoint (e.g. `/t/flc-akhil-992`).
- Seamlessly resolves the physical NFC card UID to the assigned customer profile (`/p/akhil`).
- Logs tap telemetry (timestamp, operating system, user agent) and presents an interstitial connecting animation before redirecting.

### 5. Secure Admin Dashboard (`/admin`)
- **Telemetry Overview**: Total NFC taps, active profiles, pending card reviews, and chip inventory.
- **Design Review Workflow**: Inspect customer artwork, verify print margins, approve or reject with notes, and export print files.
- **NFC Inventory Management**: Track chip codes (`NTAG216`, 888 Bytes), batch numbers, assignment status, and tap counts.
- **Customer & Profile Management**: Activate, edit, or suspend profiles.
- **Audit Trail**: Cryptographic chronological log of card assignments, design approvals, and profile updates.
- **System Settings**: Supabase database connection monitor, domain routing, and factory demo data reset.

### 6. Customer Account Portal (`/account`)
- Overview of active cards, saved card designs, and profile visit metrics.
- Edit digital business profile in real time with side-by-side phone mockup preview.
- Manage saved card designs and download artwork.

---

## 🗄️ Supabase Cloud & Local Persistence Engine

The platform features a **hybrid data architecture**:
1. **Local Persistent Engine (`src/lib/storage.js`)**: Out-of-the-box persistent storage utilizing `localStorage` with rich seed data (Akhil Anvar, Sarah Chen, Marcus Vance). Every change in the designer or admin console persists across browser refreshes with zero setup required.
2. **Supabase Cloud Integration (`src/lib/supabase.js`)**: Connect to a live Supabase project by configuring environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Database Schema (`supabase-schema.sql`)**: Contains full SQL table definitions (`profiles`, `nfc_cards`, `card_designs`, `analytics_events`, `audit_logs`), Row Level Security (RLS) policies, and performance indexes.

---

## 🖨️ Industrial Card Print Specifications

| Specification | Dimension / Value |
| :--- | :--- |
| **Card Format** | CR80 / ISO/IEC 7810 ID-1 Standard |
| **Trim Size** | 85.60 mm × 53.98 mm (3.370" × 2.125") |
| **Bleed Margin** | 3.00 mm on all edges (89.60 mm × 57.98 mm) |
| **Safe Zone Margin** | 3.00 mm within trim line |
| **Corner Radius** | 3.18 mm (1/8") |
| **Color Mode** | CMYK / Rich Black (`#08060D`) with metallic foil layer |
| **Resolution** | 300 DPI minimum |
| **NFC Microchip** | NXP NTAG216 High Frequency 13.56 MHz (888 Bytes) |

---

## 🧭 Routes Sitemap

- `/` — Homepage (Hero, Floating 3D Cards, Features, Collection, How It Works, Phone Mockup)
- `/cards` — Card Collection showcase & technical comparison matrix
- `/cards/gold` — Gold Edition specifications & customizer
- `/cards/platinum` — Platinum Edition specifications & customizer
- `/cards/custom-purple` — Purple Edition signature theme
- `/designer` — Interactive 3D Card Designer studio with PDF/PNG export
- `/how-it-works` — NFC technology deep dive and device compatibility
- `/digital-profiles` — Digital profile platform showcase
- `/examples` — Real-world example profiles gallery
- `/about` — About FLOCARD, sustainability & craftsmanship
- `/contact` — Contact form & corporate bulk orders
- `/faq` — Comprehensive FAQ accordion
- `/privacy` — Privacy policy
- `/terms` — Terms and conditions
- `/login` — Authentication & 1-click demo persona switcher
- `/account` — Customer account overview
- `/account/designs` — Saved card designs catalog
- `/account/profile` — Digital profile editor
- `/admin` — Admin management console
- `/p/:slug` — Live digital business card profile (e.g. `/p/akhil`)
- `/t/:cardCode` — Permanent NFC redirect handler (e.g. `/t/flc-akhil-992`)
- `/404` — Branded Not Found page
