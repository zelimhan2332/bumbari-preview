/* Visual measurement guide. This schematic is not a 3D body scan or a fit simulation. */
function bodyGuide(active = 'waist', values = {}) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const valid = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
  const waist = valid(values.waist, 72);
  const hip = valid(values.hip, 100);
  const waistY = 139;
  const hipY = Math.round(clamp(waistY + valid(values.hipheight, 20.8) * 1.73, 156, 195));
  const hemY = Math.round(clamp(waistY + valid(values.length, 61.5) * 1.66, hipY + 20, 286));
  const waistHalf = Math.round(clamp(waist * .43, 23, 60));
  const hipHalf = Math.round(clamp(hip * .42, 31, 70));
  const hemHalf = hipHalf + 5;
  const leftWaist = 180 - waistHalf, rightWaist = 180 + waistHalf;
  const leftHip = 180 - hipHalf, rightHip = 180 + hipHalf;
  const leftHem = 180 - hemHalf, rightHem = 180 + hemHalf;
  const rows = [
    ['waist', waistY, 'ТАЛИЯ', values.waist],
    ['hip', hipY, 'БЁДРА', values.hip],
  ];
  const lines = rows.map(([key, y, label, value]) => {
    const selected = active === key;
    const half = key === 'waist' ? waistHalf : hipHalf;
    const number = Number(value);
    const shown = Number.isFinite(number) && number > 0 ? `${number.toLocaleString('ru-RU')} см` : '—';
    return `<g data-measure="${key}" role="button" tabindex="0" aria-label="${label}: ${shown}">
      <rect x="8" y="${y - 14}" width="100" height="27" rx="8" fill="${selected ? '#e4f3e8' : '#f7f8f4'}"/>
      <rect x="267" y="${y - 14}" width="84" height="27" rx="8" fill="${selected ? '#e4f3e8' : '#f7f8f4'}"/>
      <path d="M${180 - half} ${y} H${180 + half}" stroke="${selected ? '#188365' : '#9caaa1'}" stroke-width="${selected ? 2.5 : 1.3}" stroke-dasharray="${selected ? '0' : '4 4'}"/>
      <circle cx="${180 - half}" cy="${y}" r="3" fill="#188365"/><circle cx="${180 + half}" cy="${y}" r="3" fill="#188365"/>
      <text x="17" y="${y + 4}" fill="${selected ? '#176c56' : '#72847b'}" font-size="10" font-weight="700">${label}</text>
      <text x="342" y="${y + 4}" text-anchor="end" fill="${selected ? '#176c56' : '#72847b'}" font-size="11" font-weight="700">${shown}</text></g>`;
  }).join('');
  const dimension = (key, x, y1, y2, label, value) => {
    const selected = active === key;
    const number = Number(value);
    const shown = Number.isFinite(number) && number > 0 ? `${number.toLocaleString('ru-RU')} см` : '—';
    return `<g data-measure="${key}" role="button" tabindex="0" aria-label="${label}: ${shown}">
      <path d="M${x} ${y1} V${y2} M${x - 5} ${y1} H${x + 5} M${x - 5} ${y2} H${x + 5}" fill="none" stroke="${selected ? '#188365' : '#9caaa1'}" stroke-width="${selected ? 2.5 : 1.3}"/>
      <rect x="${x - 38}" y="${key === 'length' ? (y1 + y2) / 2 + 13 : (y1 + y2) / 2 - 11}" width="76" height="23" rx="8" fill="${selected ? '#e4f3e8' : '#f7f8f4'}"/>
      <text x="${x}" y="${key === 'length' ? (y1 + y2) / 2 + 29 : (y1 + y2) / 2 + 5}" text-anchor="middle" fill="#176c56" font-size="11" font-weight="700">${shown}</text>
      <text x="${x}" y="${key === 'length' ? y2 + 19 : y2 + 27}" text-anchor="middle" fill="#72847b" font-size="9" font-weight="700">${label}</text></g>`;
  };
  return `<svg viewBox="0 0 360 330" role="img" aria-label="Портновская схема фигуры с линиями снятия мерок">
    <defs>
      <linearGradient id="skirt-shade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7f9f90"/><stop offset="1" stop-color="#4f776b"/></linearGradient>
      <linearGradient id="top-shade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6f0e8"/><stop offset="1" stop-color="#e5ddd2"/></linearGradient>
    </defs>
    <path d="M${180 - hipHalf * .65} ${hipY + 8} L174 ${hipY + 8} L171 294 Q170 299 166 302 L155 304 Q151 302 152 297 Z M186 ${hipY + 8} L${180 + hipHalf * .65} ${hipY + 8} L208 297 Q209 302 205 304 L194 302 Q190 299 189 294 Z" fill="#d9b8a6" stroke="#ad8d7d" stroke-width="1"/>
    <path d="M154 302 Q160 306 169 300 L173 307 Q166 313 151 309 Z M191 300 Q200 306 207 302 L209 309 Q195 313 187 307 Z" fill="#334c48"/>
    <path d="M146 89 Q137 98 134 114 L126 151 Q123 165 121 177 L128 181 Q133 174 137 160 L148 124 L154 97 Z M214 89 Q223 98 226 114 L234 151 Q237 165 239 177 L232 181 Q227 174 223 160 L212 124 L206 97 Z" fill="#d9b8a6" stroke="#ad8d7d" stroke-width="1.2"/>
    <path d="M122 175 Q119 179 119 187 Q120 195 124 196 L130 181 Z M238 175 Q241 179 241 187 Q240 195 236 196 L230 181 Z" fill="#d9b8a6" stroke="#ad8d7d" stroke-width="1"/>
    <path d="M173 61 L171 75 Q180 82 189 75 L187 61 Z" fill="#d9b8a6" stroke="#ad8d7d" stroke-width="1"/>
    <ellipse cx="180" cy="43" rx="17" ry="22" fill="#ddbdab" stroke="#ad8d7d" stroke-width="1.2"/>
    <path d="M163 40 Q160 20 176 18 Q195 16 198 37 Q190 35 184 29 Q177 36 163 40 Z" fill="#364844"/>
    <path d="M169 73 Q157 76 147 84 Q142 96 146 111 Q150 127 ${leftWaist} ${waistY} Q180 ${waistY + 5} ${rightWaist} ${waistY} Q210 127 214 111 Q218 96 213 84 Q203 76 191 73 Q186 83 180 84 Q174 83 169 73 Z" fill="url(#top-shade)" stroke="#9eaaa0" stroke-width="1.4"/>
    <path d="M${leftWaist} ${waistY} Q180 ${waistY + 5} ${rightWaist} ${waistY} Q${rightHip} ${hipY - 9} ${rightHip} ${hipY} L${rightHem} ${hemY} Q180 ${hemY + 5} ${leftHem} ${hemY} L${leftHip} ${hipY} Q${leftHip} ${hipY - 9} ${leftWaist} ${waistY} Z" fill="url(#skirt-shade)" stroke="#3d6c5b" stroke-width="1.5"/>
    <path d="M${leftWaist} ${waistY + 2} Q180 ${waistY + 7} ${rightWaist} ${waistY + 2} M${leftHip} ${hipY} Q180 ${hipY + 6} ${rightHip} ${hipY} M180 ${waistY + 5} L180 ${hemY - 3}" fill="none" stroke="#d2e2d8" stroke-width="1.2" opacity=".8"/>
    ${lines}
    ${dimension('hipheight', 270, waistY, hipY, 'ВЫСОТА БЁДЕР', values.hipheight)}
    ${dimension('length', 84, waistY, hemY, 'ДЛИНА ЮБКИ', values.length)}
    <text x="180" y="323" text-anchor="middle" fill="#89988e" font-size="10">Пропорции меняются по меркам · не 3D-примерка</text>
  </svg>`;
}
if (typeof module !== 'undefined') module.exports = { bodyGuide };
