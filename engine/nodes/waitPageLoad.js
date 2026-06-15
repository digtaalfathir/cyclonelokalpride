'use strict';

const VALID_STATES = ['load', 'domcontentloaded', 'networkidle'];

module.exports = {
  meta: {
    type: 'waitPageLoad',
    label: 'Wait Page Load',
    category: 'Browser Wait',
    description: 'Wait for the page to reach a specific load state',
    color: '#7C3AED',
  },
  defaults: {
    state: 'domcontentloaded',
    timeout: '30000',
  },
  schema: [
    { key: 'state', label: 'Load State', type: 'text',
      placeholder: 'domcontentloaded',
      hint: 'load | domcontentloaded | networkidle' },
    { key: 'timeout', label: 'Timeout (ms)', type: 'text',
      placeholder: '30000' },
  ],
  execute: async (data, context, engine) => {
    if (!context.page) throw new Error('Browser not open. Add an "Open Browser" node first.');

    const state   = VALID_STATES.includes(data.state) ? data.state : 'domcontentloaded';
    const timeout = Math.max(1000, parseInt(String(data.timeout || '30000'), 10) || 30000);

    engine.log('INFO', `Waiting page load state: "${state}" (timeout: ${timeout}ms)`);

    await context.page.waitForLoadState(state, { timeout });

    engine.log('INFO', `Page load complete: "${state}"`);
  },
};
