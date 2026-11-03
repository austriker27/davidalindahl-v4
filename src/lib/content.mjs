// Loads content/*.json and validates it against content/schema/*.schema.json.
// Imported by pages, so an invalid edit fails `astro build` (and shows an error in dev).

import siteDoc from '../../content/site.json' with { type: 'json' };
import experienceDoc from '../../content/experience.json' with { type: 'json' };
import siteSchema from '../../content/schema/site.schema.json' with { type: 'json' };
import experienceSchema from '../../content/schema/experience.schema.json' with { type: 'json' };
import { validate } from './validate.mjs';

export function checkContent() {
  const errors = [
    ...validate(siteSchema, siteDoc).map((e) => `content/site.json ${e}`),
    ...validate(experienceSchema, experienceDoc).map((e) => `content/experience.json ${e}`),
  ];
  if (errors.length) throw new Error('Content validation failed:\n  ' + errors.join('\n  '));
  return { site: siteDoc, experience: experienceDoc.experience };
}

const content = checkContent();
export const site = content.site;
export const experience = content.experience;
