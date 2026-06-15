'use strict';

module.exports = {
  meta: {
    type: 'getCurrentUrl',
    label: 'Get Current URL',
    category: 'Browser Get',
    description: 'Store the current page URL in a workflow variable',
    color: '#2563EB',
  },
  defaults: {
    outputVariable: 'currentUrl',
  },
  schema: [
    { key: 'outputVariable', label: 'Output Variable', type: 'text',
      placeholder: 'currentUrl',
      hint: 'Access with {{currentUrl}} in later nodes.' },
  ],
  execute: async (data, context, engine) => {
    if (!context.page) throw new Error('Browser not open. Add an "Open Browser" node first.');

    const outputVar = (data.outputVariable || 'currentUrl').trim();
    const url = context.page.url();

    context.variables[outputVar] = url;
    engine.log('INFO', `Current URL: "${url}" → {{${outputVar}}}`);
  },
};
