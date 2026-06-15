'use strict';

const fs   = require('fs');
const path = require('path');
const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'createDirectory',
    label: 'Create Directory',
    category: 'File System',
    description: 'Create a directory (and any missing parents)',
    color: '#EA580C',
  },
  defaults: {
    directoryPath: '',
  },
  schema: [
    {
      key: 'directoryPath',
      label: 'Directory Path',
      type: 'text',
      placeholder: './output/reports',
      hint: 'Absolute or relative path. All missing parent directories are created. Supports {{variable}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const dirPath = path.resolve(interpolate(data.directoryPath || '', context.variables).trim());

    if (!dirPath) throw new Error('Create Directory: "Directory Path" is required.');

    if (fs.existsSync(dirPath)) {
      engine.log('INFO', `Create Directory: already exists — "${dirPath}"`);
      return;
    }

    fs.mkdirSync(dirPath, { recursive: true });
    engine.log('INFO', `Directory created: "${dirPath}"`);
  },
};
