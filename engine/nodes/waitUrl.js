'use strict';

const { interpolate } = require('../utils/interpolate');

module.exports = {
  meta: {
    type: 'waitUrl',
    label: 'Wait URL',
    category: 'Browser Wait',
    description: 'Wait until the page URL contains the expected value',
    color: '#7C3AED',
  },
  defaults: {
    expectedUrl: '',
    timeout: '15000',
  },
  schema: [
    { key: 'expectedUrl', label: 'Expected URL', type: 'text',
      placeholder: 'https://example.com/success',
      hint: 'Partial match — waits until current URL contains this string. Supports {{variable}}.' },
    { key: 'timeout', label: 'Timeout (ms)', type: 'text',
      placeholder: '15000' },
  ],
  execute: async (data, context, engine) => {
    if (!context.page) throw new Error('Browser not open. Add an "Open Browser" node first.');

    const expectedUrl = interpolate(data.expectedUrl || '', context.variables);
    if (!expectedUrl) throw new Error('Wait URL: expectedUrl is required.');

    const timeout = Math.max(1000, parseInt(interpolate(String(data.timeout || '15000'), context.variables), 10) || 15000);

    engine.log('INFO', `Waiting URL: "${expectedUrl}" (timeout: ${timeout}ms)`);

    // Check current URL immediately before waiting
    const currentUrl = context.page.url();
    if (currentUrl.includes(expectedUrl)) {
      engine.log('INFO', `URL matched immediately: "${currentUrl}"`);
      return;
    }

    await context.page.waitForURL(
      url => String(url).includes(expectedUrl),
      { timeout }
    );

    engine.log('INFO', `URL matched: "${context.page.url()}"`);
  },
};
