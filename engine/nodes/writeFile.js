'use strict';

const fs   = require('fs');
const path = require('path');
const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'writeFile',
    label: 'Write File',
    category: 'File System',
    description: 'Write or append content to a file',
    color: '#EA580C',
  },
  defaults: {
    filePath: '',
    content: '',
    encoding: 'utf8',
    appendMode: false,
  },
  schema: [
    {
      key: 'filePath',
      label: 'File Path',
      type: 'text',
      placeholder: './output/result.json',
      hint: 'Absolute or relative path. Parent directories are created automatically. Supports {{variable}}.',
    },
    {
      key: 'content',
      label: 'Content',
      type: 'textarea',
      placeholder: '{{myVariable}}',
      hint: 'Text or JSON to write. Supports {{variable}} interpolation.',
    },
    {
      key: 'appendMode',
      label: 'Append Mode',
      type: 'boolean',
      hint: 'When enabled, content is appended instead of overwriting the file.',
    },
    {
      key: 'encoding',
      label: 'Encoding',
      type: 'text',
      placeholder: 'utf8',
      hint: 'utf8 (default) | ascii | base64',
    },
  ],
  execute: async (data, context, engine) => {
    const filePath  = interpolate(data.filePath || '', context.variables).trim();
    const content   = interpolate(data.content  || '', context.variables);
    const encoding  = (data.encoding || 'utf8').trim();
    const appendMode = !!data.appendMode;

    if (!filePath) throw new Error('Write File: "File Path" is required.');

    const resolved = path.resolve(filePath);
    const dir = path.dirname(resolved);

    // Auto-create parent directories
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      engine.log('INFO', `Write File: created directory "${dir}"`);
    }

    if (appendMode) {
      fs.appendFileSync(resolved, content, encoding);
      engine.log('INFO', `File appended: "${resolved}" (+${content.length} chars)`);
    } else {
      fs.writeFileSync(resolved, content, encoding);
      engine.log('INFO', `File written: "${resolved}" (${content.length} chars)`);
    }
  },
};
