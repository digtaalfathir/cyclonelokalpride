'use strict';

/**
 * Factory that returns the correct DatabaseProvider based on databaseType.
 * Add new cases here when MySQL / PostgreSQL providers are implemented.
 */
function createProvider(type) {
  switch ((type || '').toLowerCase().trim()) {
    case 'sqlite':
      return new (require('./providers/SQLiteProvider'))();
    // Future:
    // case 'mysql':      return new (require('./providers/MySQLProvider'))();
    // case 'postgresql': return new (require('./providers/PostgreSQLProvider'))();
    default:
      throw new Error(`Database: unsupported type "${type}". Supported: sqlite`);
  }
}

module.exports = { createProvider };
