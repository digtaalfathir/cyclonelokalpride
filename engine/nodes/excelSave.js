'use strict';

const { interpolate } = require('../utils/interpolate');
const { getWorkbook } = require('../utils/excelHelpers');

module.exports = {
  meta: {
    type: 'saveExcel',
    label: 'Save Excel',
    category: 'Excel',
    description: 'Save the workbook back to its file on disk',
    color: '#16A34A',
  },
  defaults: {
    workbookId: '',
    saveAs: '',
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
      key: 'saveAs',
      label: 'Save As (optional)',
      type: 'text',
      placeholder: './output/report-copy.xlsx',
      hint: 'Leave blank to overwrite the original file. Fill to save a copy. Supports {{variable}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const workbookId = interpolate(data.workbookId || '', context.variables).trim();
    const saveAs     = interpolate(data.saveAs     || '', context.variables).trim();

    const { workbook, filePath } = getWorkbook(context, workbookId);

    const targetPath = saveAs || filePath;
    await workbook.xlsx.writeFile(targetPath);

    engine.log('INFO', `Excel saved: "${targetPath}"`);
  },
};
