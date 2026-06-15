'use strict';

const { interpolate } = require('../utils/interpolate');
const { getWorkbook, getWorksheet } = require('../utils/excelHelpers');

module.exports = {
  meta: {
    type: 'writeCell',
    label: 'Write Cell',
    category: 'Excel',
    description: 'Write a value to a single cell',
    color: '#16A34A',
  },
  defaults: {
    workbookId: '',
    sheetName: '',
    cell: 'A1',
    value: '',
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
      key: 'cell',
      label: 'Cell',
      type: 'text',
      placeholder: 'B2',
      hint: 'A1 notation. Supports {{variable}} e.g. B{{row}}.',
    },
    {
      key: 'value',
      label: 'Value',
      type: 'text',
      placeholder: '{{myVariable}}',
      hint: 'Text, number, or {{variable}}. Numeric strings are stored as numbers automatically.',
    },
  ],
  execute: async (data, context, engine) => {
    const workbookId = interpolate(data.workbookId || '', context.variables).trim();
    const sheetName  = interpolate(data.sheetName  || '', context.variables).trim();
    const cellRef    = interpolate(data.cell        || 'A1', context.variables).trim();
    const rawValue   = interpolate(data.value       || '', context.variables);

    const { workbook } = getWorkbook(context, workbookId);
    const worksheet    = getWorksheet(workbook, sheetName);

    // Auto-coerce: store numeric strings as actual numbers so Excel
    // treats them as numbers (sum, chart, etc.) not text.
    let cellValue = rawValue;
    if (rawValue !== '' && !isNaN(rawValue) && rawValue.trim() !== '') {
      cellValue = parseFloat(rawValue);
    }

    worksheet.getCell(cellRef).value = cellValue;
    engine.log('INFO', `Cell written: ${cellRef} = ${JSON.stringify(cellValue)}`);
  },
};
