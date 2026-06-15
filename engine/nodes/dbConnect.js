'use strict';

const { interpolate } = require('../utils/interpolate');
const { createProvider } = require('../database/DatabaseFactory');

module.exports = {
  meta: {
    type: 'dbConnect',
    label: 'Connect Database',
    category: 'Database',
    description: 'Open a database connection',
    color: '#6366F1',
  },
  defaults: {
    connectionName: 'mainDb',
    databaseType: 'sqlite',
    databasePath: './data/app.db',
  },
  schema: [
    {
      key: 'connectionName',
      label: 'Connection Name',
      type: 'text',
      placeholder: 'mainDb',
      hint: 'Identifier used by Query/Execute/Disconnect nodes. Must be unique per run.',
    },
    {
      key: 'databaseType',
      label: 'Database Type',
      type: 'text',
      placeholder: 'sqlite',
      hint: 'sqlite (MySQL and PostgreSQL planned for future stages).',
    },
    {
      key: 'databasePath',
      label: 'Database Path',
      type: 'text',
      placeholder: './data/app.db',
      hint: 'Relative or absolute path to .db file. Folder is auto-created if missing.',
    },
  ],
  execute: async (data, context, engine) => {
    const name   = interpolate(data.connectionName || 'mainDb', context.variables).trim();
    const type   = interpolate(data.databaseType   || 'sqlite', context.variables).trim();
    const dbPath = interpolate(data.databasePath   || '',       context.variables).trim();

    if (!name)   throw new Error('Connect Database: "Connection Name" is required.');
    if (!dbPath) throw new Error('Connect Database: "Database Path" is required.');

    if (context.databases[name]) {
      engine.log('INFO', `Database "${name}" already connected — reusing.`);
      return;
    }

    const provider = createProvider(type);
    await provider.connect({ databaseType: type, databasePath: dbPath });

    context.databases[name] = { provider, type };
    engine.log('INFO', `Database connected: "${name}" (${type}) → ${dbPath}`);
  },
};
