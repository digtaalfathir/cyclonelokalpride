'use strict';

const fs   = require('fs');
const path = require('path');
const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'readFile',
    label: 'Read File',
    category: 'File System',
    description: 'Read the contents of a file into a variable',
    color: '#EA580C',
  },
  defaults: {
    filePath: '',
    encoding: 'utf8',
    outputVariable: 'fileContent',
  },
  schema: [
    {
      key: 'filePath',
      label: 'File Path',
      type: 'text',
      placeholder: './data/input.json',
      hint: 'Absolute or relative path. Supports {{variable}}.',
    },
    {
      key: 'encoding',
      label: 'Encoding',
      type: 'text',
      placeholder: 'utf8',
      hint: 'utf8 (default) | ascii | base64 | binary',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'fileContent',
      hint: 'File contents stored here as a string. Combine with JSON Parse for JSON files.',
    },
  ],
  execute: async (data, context, engine) => {
    const filePath  = interpolate(data.filePath || '', context.variables).trim();
    const encoding  = (data.encoding || 'utf8').trim();
    const outputVar = (data.outputVariable || 'fileContent').trim();

    if (!filePath) throw new Error('Read File: "File Path" is required.');

    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Read File: file not found — "${resolved}"`);
    }

    const content = fs.readFileSync(resolved, encoding);
    context.variables[outputVar] = content;

    engine.log('INFO', `File read: "${resolved}" (${content.length} chars) → {{${outputVar}}}`);
  },
};
