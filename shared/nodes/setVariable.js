'use strict';

const { interpolate } = require('../utils/interpolate');
const { evaluate }    = require('../utils/expression');

module.exports = {
  meta: {
    type: 'setVariable',
    label: 'Set Variable',
    category: 'Logic',
    description: 'Assign a value to a workflow variable',
    color: '#16A34A',
  },
  defaults: {
    variableName: '',
    value: '',
  },
  schema: [
    {
      key: 'variableName',
      label: 'Variable Name',
      type: 'text',
      placeholder: 'username',
    },
    {
      key: 'value',
      label: 'Value',
      type: 'text',
      placeholder: 'admin',
      hint: 'Plain text, {{variable}}, or a typed expression: {{[1,2,3]}} {{true}} {{42}} {{response.data}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const name = (data.variableName || '').trim();
    if (!name) throw new Error('Set Variable: "Variable Name" is required.');

    const raw = data.value ?? '';

    // If the entire value is a single {{expr}}, evaluate to preserve native type
    // (array, object, number, boolean) instead of converting to a JSON string.
    // Otherwise fall back to string interpolation for plain text and mixed templates.
    let resolved;
    const trimmed = raw.trim();
    if (/^\{\{.+\}\}$/.test(trimmed)) {
      try {
        resolved = evaluate(trimmed, context.variables);
      } catch (_) {
        resolved = interpolate(raw, context.variables);
      }
    } else {
      resolved = interpolate(raw, context.variables);
    }

    context.variables[name] = resolved;

    const display = typeof resolved === 'object' && resolved !== null
      ? JSON.stringify(resolved).slice(0, 120)
      : String(resolved).slice(0, 120);
    engine.log('INFO', `Variable "${name}" = ${display}`);
  },
};
