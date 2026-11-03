#!/usr/bin/env node
// Validate content/*.json against its schemas without running a full build.
import { checkContent } from '../src/lib/content.mjs';

try {
  const { experience } = checkContent();
  console.log(`✓ content valid (${experience.length} experience entries)`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
