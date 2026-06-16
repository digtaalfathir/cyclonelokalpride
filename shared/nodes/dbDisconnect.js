'use strict';

const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'dbDisconnect',
    label: 'Disconnect Database',
    category: 'Database',
    description: 'Close a database connection and release resources',
    color: '#6366F1',
  },
  defaults: {
    connectionName: 'mainDb',
  },
  schema: [
    {
      key: 'connectionName',
      label: 'Connection Name',
      type: 'text',
      placeholder: 'mainDb',
      hint: 'Must match the Connection Name used in Connect Database.',
    },
  ],
  execute: async (data, context, engine) => {
    const name = interpolate(data.connectionName || 'mainDb', context.variables).trim();

    const entry = context.databases[name];
    if (!entry) {
      engine.log('WARN', `Disconnect Database: no active connection "${name}" — skipping.`);
      return;
    }

    entry.provider.disconnect();
    delete context.databases[name];
    engine.log('INFO', `Database disconnected: "${name}"`);
  },
};
