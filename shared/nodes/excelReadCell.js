'use strict';

const { interpolate } = require('../utils/interpolate');
const { getWorkbook, getWorksheet, getCellValue } = require('../utils/excelHelpers');

module.exports = {
  meta: {
    type: 'readCell',
    label: 'Read Cell',
    category: 'Excel',
    description: 'Read the value of a single cell into a variable',
    color: '#16A34A',
  },
  defaults: {
    workbookId: '',
    sheetName: '',
    cell: 'A1',
    outputVariable: 'cellValue',
  },
  schema: [
    {
      key: 'workbookId',
      label: 'Workbook ID',
      type: 'text',
      placeholder: '{{wb}}',
      hint: 'The workbook ID returned by Open Excel. Use {{wb}} if you named the variable "wb".',
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
      placeholder: 'A1',
      hint: 'A1 notation. Supports {{variable}} e.g. A{{row}}.',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'cellValue',
    },
  ],
  execute: async (data, context, engine) => {
    const workbookId = interpolate(data.workbookId || '', context.variables).trim();
    const sheetName  = interpolate(data.sheetName  || '', context.variables).trim();
    const cellRef    = interpolate(data.cell       || 'A1', context.variables).trim();
    const outputVar  = (data.outputVariable || 'cellValue').trim();

    const { workbook } = getWorkbook(context, workbookId);
    const worksheet    = getWorksheet(workbook, sheetName);
    const cell         = worksheet.getCell(cellRef);
    const value        = getCellValue(cell);

    context.variables[outputVar] = value;
    engine.log('INFO', `Cell read: ${cellRef} = ${JSON.stringify(value)} → {{${outputVar}}}`);
  },
};
