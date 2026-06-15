'use strict';

const fs   = require('fs');
const path = require('path');
const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'directoryExists',
    label: 'Directory Exists',
    category: 'File System',
    description: 'Check if a directory exists; stores true/false in a variable',
    color: '#EA580C',
  },
  defaults: {
    directoryPath: '',
    outputVariable: 'dirExists',
  },
  schema: [
    {
      key: 'directoryPath',
      label: 'Directory Path',
      type: 'text',
      placeholder: './output',
      hint: 'Absolute or relative path. Supports {{variable}}.',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'dirExists',
      hint: 'Stores true or false. Use with IF: {{dirExists == true}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const dirPath   = path.resolve(interpolate(data.directoryPath || '', context.variables).trim());
    const outputVar = (data.outputVariable || 'dirExists').trim();

    if (!dirPath) throw new Error('Directory Exists: "Directory Path" is required.');

    let exists = false;
    try {
      exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch (_) {
      exists = false;
    }

    context.variables[outputVar] = exists;
    engine.log('INFO', `Directory exists "${dirPath}": ${exists} → {{${outputVar}}}`);
  },
};
