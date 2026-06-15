'use strict';

const { evaluateBool } = require('../utils/expression');

module.exports = {
  meta: {
    type: 'ifNode',
    label: 'IF',
    category: 'Logic',
    description: 'Branch workflow based on a condition',
    color: '#7C3AED',
  },
  defaults: {
    condition: '',
  },
  schema: [
    {
      key: 'condition',
      label: 'Condition',
      type: 'text',
      placeholder: '{{response.status == 200}}',
      hint: 'Supports {{variable}} expressions. Routes to TRUE or FALSE branch.',
    },
  ],
  execute: async (data, context, engine) => {
    const condition = data.condition || '';
    if (!condition.trim()) throw new Error('IF: condition is required.');

    const result = evaluateBool(condition, context.variables);
    engine.log('INFO', `IF condition "${condition}" → ${result ? 'TRUE' : 'FALSE'}`);

    return { nextHandle: result ? 'true' : 'false' };
  },
};
