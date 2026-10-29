/* ==========================================================================
   vCard (VCF 3.0) GENERATOR & DOWNLOADER
   ========================================================================== */

export function generateVCardString(profile) {
  const nameParts = (profile.name || '').trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const firstName = nameParts[0] || '';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${profile.name || 'FLOCARD Contact'}`,
    profile.company ? `ORG:${profile.company};` : '',
    profile.role ? `TITLE:${profile.role}` : '',
    profile.phone ? `TEL;TYPE=CELL,VOICE:${profile.phone}` : '',
    profile.email ? `EMAIL;TYPE=WORK,INTERNET:${profile.email}` : '',
    profile.website ? `URL:${profile.website}` : '',
    (profile.address || profile.location) ? `ADR;TYPE=WORK:;;${profile.address || profile.location};;;;` : '',
    profile.mapsUrl ? `URL;TYPE=LOCATION:${profile.mapsUrl}` : '',
    profile.bio ? `NOTE:${profile.bio.replace(/\n/g, '\\n')}` : '',
    `NOTE;FLOCARD:Verified FLOCARD NFC Digital Identity - flocard.in/p/${profile.slug || ''}`,
    'REV:' + new Date().toISOString(),
    'END:VCARD'
  ];

  return lines.filter(Boolean).join('\r\n');
}

export function downloadVCard(profile) {
  const vcfContent = generateVCardString(profile);
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `${(profile.slug || 'contact').toLowerCase()}-flocard.vcf`;
  
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
