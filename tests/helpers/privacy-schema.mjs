import fs from 'node:fs';
export function installPrivacySchema(sql){const source=fs.readFileSync('lib/privacy-schema.ts','utf8');const triggers=JSON.parse(source.split('export const privacyTriggers=')[1].split(';\nlet ready=')[0]);for(const trigger of triggers)sql.exec(trigger);}
