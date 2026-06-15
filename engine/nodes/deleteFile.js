'use strict';

const fs   = require('fs');
const path = require('path');
const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'deleteFile',
    label: 'Delete File',
    category: 'File System',
    description: 'Delete a file from disk',
    color: '#EA580C',
  },
  defaults: {
    filePath: '',
    ignoreNotFound: true,
  },
  schema: [
    {
      key: 'filePath',
      label: 'File Path',
      type: 'text',
      placeholder: './temp/file.txt',
      hint: 'Absolute or relative path. Supports {{variable}}.',
    },
    {
      key: 'ignoreNotFound',
      label: 'Ignore If Not Found',
      type: 'boolean',
      hint: 'When enabled, no error is thrown if the file does not exist.',
    },
  ],
  execute: async (data, context, engine) => {
    const filePath = path.resolve(interpolate(data.filePath || '', context.variables).trim());
    const ignore   = data.ignoreNotFound !== false;

    if (!filePath) throw new Error('Delete File: "File Path" is required.');

    if (!fs.existsSync(filePath)) {
      if (ignore) {
        engine.log('WARN', `Delete File: not found (skipped) — "${filePath}"`);
        return;
      }
      throw new Error(`Delete File: file not found — "${filePath}"`);
    }

    fs.unlinkSync(filePath);
    engine.log('INFO', `File deleted: "${filePath}"`);
  },
};
