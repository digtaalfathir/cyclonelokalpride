'use strict';

const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'stringContains',
    label: 'String Contains',
    category: 'Data Processing',
    description: 'Check if a string contains a substring; stores true/false',
    color: '#0891B2',
  },
  defaults: {
    input: '',
    search: '',
    caseSensitive: true,
    outputVariable: 'containsResult',
  },
  schema: [
    {
      key: 'input',
      label: 'Input String',
      type: 'text',
      placeholder: '{{someVariable}}',
      hint: 'The source string to search within. Supports {{variable}}.',
    },
    {
      key: 'search',
      label: 'Search For',
      type: 'text',
      placeholder: 'hello',
      hint: 'Substring to look for.',
    },
    {
      key: 'caseSensitive',
      label: 'Case Sensitive',
      type: 'boolean',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'containsResult',
      hint: 'Stores true or false. Use with IF: {{containsResult == true}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const input    = interpolate(data.input  || '', context.variables);
    const search   = interpolate(data.search || '', context.variables);
    const outVar   = (data.outputVariable || 'containsResult').trim();
    const caseSens = data.caseSensitive !== false;

    if (!search) throw new Error('String Contains: "Search For" value is required.');

    const result = caseSens
      ? input.includes(search)
      : input.toLowerCase().includes(search.toLowerCase());

    context.variables[outVar] = result;
    engine.log('INFO', `String contains "${search}": ${result} → {{${outVar}}}`);
  },
};
