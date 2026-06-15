'use strict';

const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'dbQuery',
    label: 'Query Database',
    category: 'Database',
    description: 'Run a SELECT query and store results as array',
    color: '#6366F1',
  },
  defaults: {
    connectionName: 'mainDb',
    sql: 'SELECT * FROM table_name',
    outputVariable: 'rows',
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
      label: 'SQL Query',
      type: 'textarea',
      placeholder: "SELECT * FROM users WHERE status = 'PENDING'",
      hint: 'SELECT statement. Use {{variable}} for dynamic values.',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'rows',
      hint: 'Stores an array of objects. Use with For Each node.',
    },
  ],
  execute: async (data, context, engine) => {
    const name   = interpolate(data.connectionName || 'mainDb', context.variables).trim();
    const sql    = interpolate(data.sql || '', context.variables).trim();
    const outVar = (data.outputVariable || 'rows').trim();

    if (!sql)    throw new Error('Query Database: SQL is required.');
    if (!outVar) throw new Error('Query Database: "Output Variable" is required.');

    const entry = context.databases[name];
    if (!entry) throw new Error(`Query Database: no connection "${name}". Add Connect Database first.`);

    const preview = sql.length > 100 ? sql.slice(0, 100) + '...' : sql;
    engine.log('INFO', `Query (${name}): ${preview}`);

    const rows = entry.provider.query(sql);
    context.variables[outVar] = rows;

    engine.log('INFO', `Rows returned: ${rows.length} → {{${outVar}}}`);
  },
};
