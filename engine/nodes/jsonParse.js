'use strict';

const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'jsonParse',
    label: 'JSON Parse',
    category: 'Data Processing',
    description: 'Parse a JSON string into a usable object or array',
    color: '#0891B2',
  },
  defaults: {
    input: '',
    outputVariable: 'jsonData',
  },
  schema: [
    {
      key: 'input',
      label: 'JSON Input',
      type: 'text',
      placeholder: '{{response.raw}}',
      hint: 'Variable or text containing a valid JSON string. Supports {{variable}}.',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'jsonData',
      hint: 'Access parsed data with {{jsonData.key}} or {{jsonData.0.name}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const raw = interpolate(data.input || '', context.variables);
    const outputVar = (data.outputVariable || 'jsonData').trim();

    if (!raw) throw new Error('JSON Parse: "JSON Input" is required.');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`JSON Parse: invalid JSON — ${err.message}`);
    }

    context.variables[outputVar] = parsed;

    const type = Array.isArray(parsed) ? `array[${parsed.length}]` : typeof parsed;
    engine.log('INFO', `JSON parsed → {{${outputVar}}} (${type})`);
  },
};
