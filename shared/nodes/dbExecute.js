'use strict';

const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'dbExecute',
    label: 'Execute Database',
    category: 'Database',
    description: 'Run INSERT, UPDATE, DELETE or DDL',
    color: '#6366F1',
  },
  defaults: {
    connectionName: 'mainDb',
    sql: '',
  },
  schema: [
    {
      key: 'connectionName',
      label: 'Connection Name',
      type: 'text',
      placeholder: 'mainDb',
    },
    {
      key: 'sql',
      label: 'SQL Statement',
      type: 'textarea',
      placeholder: "UPDATE vin_queue SET status='DONE' WHERE id={{row.id}}",
      hint: 'INSERT, UPDATE, DELETE, CREATE TABLE. Use {{variable}} for dynamic values. Multiple statements separated by ; are supported.',
    },
  ],
  execute: async (data, context, engine) => {
    const name = interpolate(data.connectionName || 'mainDb', context.variables).trim();
    const sql  = interpolate(data.sql || '', context.variables).trim();

    if (!sql) throw new Error('Execute Database: SQL is required.');

    const entry = context.databases[name];
    if (!entry) throw new Error(`Execute Database: no connection "${name}". Add Connect Database first.`);

    const preview = sql.length > 100 ? sql.slice(0, 100) + '...' : sql;
    engine.log('INFO', `Execute (${name}): ${preview}`);

    const result = entry.provider.execute(sql);
    engine.log('INFO', `Execute success: ${result.changes} row(s) affected`);
  },
};
