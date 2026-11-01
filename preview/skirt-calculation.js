/* Source: Ателье-2001, PDF pages 5–7. */
function calculateSkirtReference({ waist, hip, hipHeight, length, hipEaseHalf = 1, material = 'woven' }) {
  const values = { waist, hip, hipHeight, length };
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`Некорректная мерка: ${name}`);
  }
  if (hip <= waist) throw new Error('Обхват бёдер должен быть больше талии для этого примера');
  if (hipHeight >= length) throw new Error('Высота бёдер должна быть меньше длины юбки');
  if (material !== 'woven') throw new Error('Для выбранного материала основа ещё не проверена');
  if (hipEaseHalf !== 1 && hipEaseHalf !== 2) throw new Error('Прибавка должна быть 1 или 2 см на половину изделия');
  const hipHalfWithEase = hip / 2 + hipEaseHalf;
  const waistHalfWithEase = waist / 2 + 1;
  const intake = hipHalfWithEase - waistHalfWithEase;
  const exactBookCase = hip === 100 && length === 61.5 && hipHeight === 20.8 && hipEaseHalf === 1;
  let darts = null;
  if (exactBookCase && waist === 76) darts = { side: 7, front: 2, back: [3] };
  if (exactBookCase && waist === 72) darts = { side: 7, front: 2, back: [3, 2] };
  if (darts && darts.side + darts.front + darts.back.reduce((a, b) => a + b, 0) !== intake) {
    throw new Error('Контроль раствора не сошёлся');
  }
  return { hipHalfWithEase, waistHalfWithEase, intake, darts, exactBookCase: !!darts, hipEaseHalf, material,
    source: 'Ателье-2001, PDF 5–7 (печатные 6–8)' };
}
if (typeof module !== 'undefined') module.exports = { calculateSkirtReference };
