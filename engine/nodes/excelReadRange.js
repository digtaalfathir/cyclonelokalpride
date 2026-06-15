'use strict';

const { interpolate } = require('../utils/interpolate');
const { getWorkbook, getWorksheet, parseRange, getCellValue } = require('../utils/excelHelpers');

module.exports = {
  meta: {
    type: 'readRange',
    label: 'Read Range',
    category: 'Excel',
    description: 'Read a cell range into an array variable (use with For Each)',
    color: '#16A34A',
  },
  defaults: {
    workbookId: '',
    sheetName: '',
    range: 'A1:D100',
    outputVariable: 'rows',
    skipEmptyRows: true,
  },
  schema: [
    {
      key: 'workbookId',
      label: 'Workbook ID',
      type: 'text',
      placeholder: '{{wb}}',
      hint: 'Workbook ID from Open Excel.',
    },
    {
      key: 'sheetName',
      label: 'Sheet Name',
      type: 'text',
      placeholder: 'Sheet1',
      hint: 'Leave blank to use the first sheet. Supports {{variable}}.',
    },
    {
      key: 'range',
      label: 'Range',
      type: 'text',
      placeholder: 'A1:D100',
      hint: 'A1 notation. Single column (A2:A100) → flat array. Multi-column → array of arrays.',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'rows',
      hint: 'Single-col: {{rows.0}} per item. Multi-col: {{rows.0}} for first cell of each row.',
    },
    {
      key: 'skipEmptyRows',
      label: 'Skip Empty Rows',
      type: 'boolean',
      hint: 'When enabled, rows with no values are excluded from the output array.',
    },
  ],
  execute: async (data, context, engine) => {
    const workbookId  = interpolate(data.workbookId || '', context.variables).trim();
    const sheetName   = interpolate(data.sheetName  || '', context.variables).trim();
    const rangeStr    = interpolate(data.range       || 'A1:D100', context.variables).trim();
    const outputVar   = (data.outputVariable || 'rows').trim();
    const skipEmpty   = data.skipEmptyRows !== false;

    const { workbook } = getWorkbook(context, workbookId);
    const worksheet    = getWorksheet(workbook, sheetName);
    const { startRow, startCol, endRow, endCol } = parseRange(rangeStr);
    const isSingleCol  = startCol === endCol;

    const result = [];

    for (let r = startRow; r <= endRow; r++) {
      const wsRow   = worksheet.getRow(r);
      const rowData = [];
      let hasValue  = false;

      for (let c = startCol; c <= endCol; c++) {
        const val = getCellValue(wsRow.getCell(c));
        rowData.push(val);
        if (val !== '' && val !== null && val !== undefined) hasValue = true;
      }

      if (!skipEmpty || hasValue) {
        result.push(isSingleCol ? rowData[0] : rowData);
      }
    }

    context.variables[outputVar] = result;
    engine.log('INFO', `Range read: ${rangeStr} → ${result.length} row(s) → {{${outputVar}}}`);
  },
};
