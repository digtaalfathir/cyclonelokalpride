'use strict';

const path    = require('path');
const fs      = require('fs');
const ExcelJS = require('exceljs');
const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'openExcel',
    label: 'Open Excel',
    category: 'Excel',
    description: 'Open an Excel workbook and load it into the execution context',
    color: '#16A34A',
  },
  defaults: {
    filePath: '',
    outputVariable: 'wb',
    createIfNotExists: false,
  },
  schema: [
    {
      key: 'filePath',
      label: 'File Path',
      type: 'text',
      placeholder: './data/report.xlsx',
      hint: 'Absolute or relative path to the .xlsx file. Supports {{variable}}.',
    },
    {
      key: 'outputVariable',
      label: 'Workbook ID Variable',
      type: 'text',
      placeholder: 'wb',
      hint: 'Variable that stores the workbook ID. Use {{wb}} in all other Excel nodes.',
    },
    {
      key: 'createIfNotExists',
      label: 'Create If Not Exists',
      type: 'boolean',
      hint: 'When enabled, a blank workbook is created if the file does not exist.',
    },
  ],
  execute: async (data, context, engine) => {
    const filePath  = interpolate(data.filePath || '', context.variables).trim();
    const outputVar = (data.outputVariable || 'wb').trim();
    const create    = !!data.createIfNotExists;

    if (!filePath) throw new Error('Open Excel: "File Path" is required.');

    const resolved = path.resolve(filePath);

    // Ensure context.workbooks exists (lazy init for backward compat)
    if (!context.workbooks) context.workbooks = {};

    const workbook = new ExcelJS.Workbook();

    if (fs.existsSync(resolved)) {
      await workbook.xlsx.readFile(resolved);
      engine.log('INFO', `Excel opened: "${resolved}" (${workbook.worksheets.length} sheet(s))`);
    } else if (create) {
      // Blank workbook — user must save to create the file
      workbook.addWorksheet('Sheet1');
      engine.log('INFO', `Excel: file not found, created blank workbook → will be saved to "${resolved}"`);
    } else {
      throw new Error(`Open Excel: file not found — "${resolved}"`);
    }

    // Generate a unique workbook ID for this session
    const workbookId = `wb_${Date.now()}`;
    context.workbooks[workbookId] = { workbook, filePath: resolved };
    context.variables[outputVar] = workbookId;

    engine.log('INFO', `Excel ready → {{${outputVar}}} = "${workbookId}"`);
  },
};
