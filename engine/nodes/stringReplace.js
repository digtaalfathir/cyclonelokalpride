'use strict';

const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'stringReplace',
    label: 'String Replace',
    category: 'Data Processing',
    description: 'Replace all occurrences of a substring with another value',
    color: '#0891B2',
  },
  defaults: {
    input: '',
    search: '',
    replace: '',
    outputVariable: 'result',
  },
  schema: [
    {
      key: 'input',
      label: 'Input String',
      type: 'text',
      placeholder: '{{someVariable}}',
      hint: 'The source string. Supports {{variable}}.',
    },
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: '-',
      hint: 'Substring to find (all occurrences are replaced).',
    },
    {
      key: 'replace',
      label: 'Replace With',
      type: 'text',
      placeholder: '',
      hint: 'Replacement text. Leave blank to delete the found substring.',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'result',
    },
  ],
  execute: async (data, context, engine) => {
    const input  = interpolate(data.input   || '', context.variables);
    const search = interpolate(data.search  || '', context.variables);
    const repl   = interpolate(data.replace || '', context.variables);
    const outVar = (data.outputVariable || 'result').trim();

    if (!search) throw new Error('String Replace: "Search" value is required.');

    // Global replace without regex to avoid special-character issues
    const result = input.split(search).join(repl);
    context.variables[outVar] = result;

    const preview = input.length > 40 ? input.slice(0, 40) + '...' : input;
    engine.log('INFO', `String replaced "${search}"→"${repl}" in "${preview}" → {{${outVar}}}`);
  },
};
