'use strict';

const { interpolate } = require('../utils/interpolate');
const { getWorkbook } = require('../utils/excelHelpers');

module.exports = {
  meta: {
    type: 'closeExcel',
    label: 'Close Excel',
    category: 'Excel',
    description: 'Release the workbook from memory and free resources',
    color: '#16A34A',
  },
  defaults: {
    workbookId: '',
  },
  schema: [
    {
      key: 'workbookId',
      label: 'Workbook ID',
      type: 'text',
      placeholder: '{{wb}}',
      hint: 'Workbook ID from Open Excel. Always close the workbook when done.',
    },
  ],
  execute: async (data, context, engine) => {
    const workbookId = interpolate(data.workbookId || '', context.variables).trim();

    // Validates the workbook exists before closing
    const { filePath } = getWorkbook(context, workbookId);
    delete context.workbooks[workbookId];

    engine.log('INFO', `Excel closed: "${filePath}"`);
  },
};
