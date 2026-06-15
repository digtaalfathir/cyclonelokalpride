'use strict';

const fs   = require('fs');
const path = require('path');
const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'moveFile',
    label: 'Move File',
    category: 'File System',
    description: 'Move or rename a file to a new location',
    color: '#EA580C',
  },
  defaults: {
    sourcePath: '',
    destinationPath: '',
  },
  schema: [
    {
      key: 'sourcePath',
      label: 'Source Path',
      type: 'text',
      placeholder: './temp/file.txt',
      hint: 'Path of the file to move. Supports {{variable}}.',
    },
    {
      key: 'destinationPath',
      label: 'Destination Path',
      type: 'text',
      placeholder: './output/file.txt',
      hint: 'Target path (including filename). Parent directories are created automatically. Supports {{variable}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const src  = path.resolve(interpolate(data.sourcePath      || '', context.variables).trim());
    const dest = path.resolve(interpolate(data.destinationPath || '', context.variables).trim());

    if (!src)  throw new Error('Move File: "Source Path" is required.');
    if (!dest) throw new Error('Move File: "Destination Path" is required.');

    if (!fs.existsSync(src)) {
      throw new Error(`Move File: source not found — "${src}"`);
    }

    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.renameSync(src, dest);
    engine.log('INFO', `File moved: "${src}" → "${dest}"`);
  },
};
