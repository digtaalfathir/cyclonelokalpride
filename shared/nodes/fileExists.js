'use strict';

const fs   = require('fs');
const path = require('path');
const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'fileExists',
    label: 'File Exists',
    category: 'File System',
    description: 'Check if a file exists; stores true/false in a variable',
    color: '#EA580C',
  },
  defaults: {
    filePath: '',
    outputVariable: 'fileExists',
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
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'fileExists',
      hint: 'Stores true or false. Use with IF: {{fileExists == true}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const filePath  = path.resolve(interpolate(data.filePath || '', context.variables).trim());
    const outputVar = (data.outputVariable || 'fileExists').trim();

    if (!filePath) throw new Error('File Exists: "File Path" is required.');

    let exists = false;
    try {
      exists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (_) {
      exists = false;
    }

    context.variables[outputVar] = exists;
    engine.log('INFO', `File exists "${filePath}": ${exists} → {{${outputVar}}}`);
  },
};
