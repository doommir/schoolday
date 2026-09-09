export type PreviewProgress = {grade:string; step:number; response:string; choice:number|null; checked:boolean; first:number|null};
export const previewKey = (grade:string) => 'schoolday.preview.v1.' + grade;
export function readPreview(raw:string|null, grade:string):PreviewProgress|null {
  try {
    const s = JSON.parse(raw || 'null');
    const choice = (v:unknown) => v === null || Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 2;
    if(!s || !['6','7','8'].includes(grade) || s.grade !== grade || !Number.isInteger(s.step) || s.step < 0 || s.step > 7 || typeof s.response !== 'string' || s.response.length > 15000 || !choice(s.choice) || !choice(s.first) || typeof s.checked !== 'boolean' || s.checked && s.choice === null) return null;
    return {grade:s.grade, step:s.step, response:s.response, choice:s.choice, checked:s.checked, first:s.first};
  } catch {return null;}
}
