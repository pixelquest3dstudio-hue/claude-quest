// Little SVG portraits for the dialogue box and the theater couch.
const eyes = (y = 52, dx = 11, iris = '#2b1d3a') => `
  <ellipse cx="${50 - dx}" cy="${y}" rx="7" ry="9" fill="${iris}"/><ellipse cx="${50 + dx}" cy="${y}" rx="7" ry="9" fill="${iris}"/>
  <circle cx="${52 - dx}" cy="${y - 3}" r="3" fill="#fff"/><circle cx="${52 + dx}" cy="${y - 3}" r="3" fill="#fff"/>
  <ellipse cx="${50 - dx - 9}" cy="${y + 11}" rx="5" ry="3" fill="#ff9fb8" opacity=".8"/><ellipse cx="${50 + dx + 9}" cy="${y + 11}" rx="5" ry="3" fill="#ff9fb8" opacity=".8"/>
  <path d="M45 ${y + 12} Q50 ${y + 17} 55 ${y + 12}" stroke="#3a2230" stroke-width="3" fill="none" stroke-linecap="round"/>`;

export const SPARKY_SVG = `<svg viewBox="0 0 100 100"><path d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36 Z" fill="#F08A5D" stroke="#C4603A" stroke-width="5" stroke-linejoin="round"/>${eyes(52, 10)}</svg>`;

export const JESI_SVG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="16" r="12" fill="#4b2a22"/><circle cx="50" cy="56" r="37" fill="#4b2a22"/><circle cx="50" cy="59" r="31" fill="#f3c6a5"/><path d="M19 52 Q28 28 50 30 Q72 28 81 52 Q66 40 50 43 Q34 40 19 52Z" fill="#4b2a22"/><path d="M68 34 l3 6 6 1 -4 4 1 6 -6 -3 -6 3 1 -6 -4 -4 6 -1z" fill="#ffd166"/>${eyes(63, 12, '#4a2a1a')}</svg>`;

export const BOY_SVG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="55" r="36" fill="#3a2620"/><circle cx="50" cy="59" r="31" fill="#f3c6a5"/><path d="M19 54 Q20 28 50 26 Q80 28 81 54 L74 42 L66 48 L60 38 L52 46 L44 37 L37 47 L29 40 L25 50Z" fill="#3a2620"/><path d="M50 26 Q56 12 66 14 Q58 18 56 27Z" fill="#3a2620"/>${eyes(63, 12, '#4a2a1a')}</svg>`;

export const heroSVG = (avatar) => (avatar === 'male' ? BOY_SVG : JESI_SVG);

export const blobSVG = (fill, extra = '') => `<svg viewBox="0 0 100 100"><path d="M50 12 C78 12 90 36 90 58 C90 80 72 90 50 90 C28 90 10 80 10 58 C10 36 22 12 50 12Z" fill="${fill}" stroke="rgba(0,0,0,.15)" stroke-width="4"/>${extra}${eyes(56, 12)}</svg>`;
