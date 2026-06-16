'use strict';

const path = require('path');
const fs   = require('fs');
const BaseProvider = require('./BaseProvider');

// Cache SQL.js initialization — WASM is loaded once per process
let _SQL = null;
async function getSql() {
  if (!_SQL) _SQL = await require('sql.js')();
  return _SQL;
}

class SQLiteProvider extends BaseProvider {
  constructor() {
    super();
    this._path = null;
    this.db    = null;
  }

  async connect(config) {
    const SQL = await getSql();
    this._path = path.resolve(config.databasePath);

    // Auto-create parent directory
    const dir = path.dirname(this._path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(this._path)) {
      const buf = fs.readFileSync(this._path);
      this.db = new SQL.Database(buf);
    } else {
      // New file — starts as empty in-memory DB; persisted on first execute/disconnect
      this.db = new SQL.Database();
    }
  }

  query(sql) {
    const results = this.db.exec(sql);
    if (!results.length) return [];
    const { columns, values } = results[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }

  execute(sql) {
    this.db.exec(sql);
    const changes = this.db.getRowsModified();
    this._saveToDisk();
    return { changes };
  }

  _saveToDisk() {
    if (this._path && this.db) {
      const data = this.db.export();
      fs.writeFileSync(this._path, Buffer.from(data));
    }
  }

  disconnect() {
    if (this.db) {
      this._saveToDisk();
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = SQLiteProvider;
