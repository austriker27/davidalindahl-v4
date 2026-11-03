// Minimal JSON Schema validator covering the subset used in content/schema/*.
// Supports: type (incl. arrays of types), required, properties,
// additionalProperties:false, items, minItems, minLength, maxLength, pattern.
// Kept dependency-free so content can be checked without building (npm run check).

const typeOf = (v) =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;

export function validate(schema, value, path = '$') {
  const errors = [];
  const t = typeOf(value);

  if (schema.type) {
    const allowed = [].concat(schema.type);
    const ok = allowed.includes(t) || (t === 'integer' && allowed.includes('number'));
    if (!ok) return [`${path}: expected ${allowed.join(' | ')}, got ${t}`];
  }

  if (t === 'string') {
    if (schema.minLength != null && value.length < schema.minLength)
      errors.push(`${path}: must be at least ${schema.minLength} characters`);
    if (schema.maxLength != null && value.length > schema.maxLength)
      errors.push(`${path}: must be at most ${schema.maxLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value))
      errors.push(`${path}: "${value}" does not match ${schema.pattern}`);
  }

  if (t === 'array') {
    if (schema.minItems != null && value.length < schema.minItems)
      errors.push(`${path}: needs at least ${schema.minItems} item(s)`);
    if (schema.items) value.forEach((v, i) => errors.push(...validate(schema.items, v, `${path}[${i}]`)));
  }

  if (t === 'object') {
    for (const key of schema.required ?? [])
      if (!(key in value)) errors.push(`${path}: missing required field "${key}"`);
    for (const [key, v] of Object.entries(value)) {
      const sub = schema.properties?.[key];
      if (sub) errors.push(...validate(sub, v, `${path}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${path}: unknown field "${key}"`);
    }
  }

  return errors;
}
