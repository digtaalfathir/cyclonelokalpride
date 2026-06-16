'use strict';

/**
 * Abstract database provider interface.
 * Extend this class to add MySQL, PostgreSQL, etc.
 */
class BaseProvider {
  async connect(config) { throw new Error(`${this.constructor.name}: connect() not implemented`); }
  query(sql)   { throw new Error(`${this.constructor.name}: query() not implemented`); }
  execute(sql) { throw new Error(`${this.constructor.name}: execute() not implemented`); }
  disconnect() { throw new Error(`${this.constructor.name}: disconnect() not implemented`); }
}

module.exports = BaseProvider;
