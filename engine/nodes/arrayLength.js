'use strict';

const { evaluate } = require('../utils/expression');

module.exports = {
  meta: {
    type: 'arrayLength',
    label: 'Array Length',
    category: 'Data Processing',
    description: 'Get the number of items in an array and store it in a variable',
    color: '#0891B2',
  },
  defaults: {
    inputArray: '',
    outputVariable: 'arrayLength',
  },
  schema: [
    {
      key: 'inputArray',
      label: 'Input Array',
      type: 'text',
      placeholder: '{{users}}',
      hint: 'Variable containing an array. Use {{variableName}} syntax.',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'arrayLength',
      hint: 'Stores the count as a number. Use with IF: {{arrayLength > 0}}.',
    },
  ],
  execute: async (data, context, engine) => {
    const expr   = (data.inputArray || '').trim();
    const outVar = (data.outputVariable || 'arrayLength').trim();

    if (!expr) throw new Error('Array Length: "Input Array" is required.');

    const arr = evaluate(expr, context.variables);
    if (!Array.isArray(arr)) {
      throw new Error(`Array Length: expected an array but got ${typeof arr}. Use {{variableName}} syntax.`);
    }

    context.variables[outVar] = arr.length;
    engine.log('INFO', `Array length = ${arr.length} → {{${outVar}}}`);
  },
};
