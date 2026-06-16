'use strict';

const { evaluate } = require('../utils/expression');

module.exports = {
  meta: {
    type: 'forEachNode',
    label: 'For Each',
    category: 'Logic',
    description: 'Iterate over a collection of items',
    color: '#2563EB',
  },
  defaults: {
    collection: '',
    itemVariable: 'item',
  },
  schema: [
    {
      key: 'collection',
      label: 'Collection',
      type: 'text',
      placeholder: '{{users}}',
      hint: 'Variable containing an array. Use {{variable}} syntax.',
    },
    {
      key: 'itemVariable',
      label: 'Item Variable',
      type: 'text',
      placeholder: 'item',
      hint: 'Name for each element (e.g. access with {{item.name}}).',
    },
  ],
  execute: async (data, context, engine, nodeId) => {
    const collectionExpr = data.collection || '';
    if (!collectionExpr.trim()) throw new Error('For Each: collection is required.');

    const collection = evaluate(collectionExpr, context.variables);
    if (!Array.isArray(collection)) {
      throw new Error(
        `For Each: collection must be an array, got ${typeof collection} (${collectionExpr})`
      );
    }

    const itemVar = (data.itemVariable || 'item').trim();
    const total = collection.length;

    engine.log('INFO', `For Each: ${total} item(s) in collection`);

    for (let i = 0; i < total; i++) {
      if (engine.aborted) break;

      context.variables[itemVar] = collection[i];
      context.variables[`${itemVar}_index`] = i;
      engine.log('INFO', `Loop item ${i + 1}/${total}`);

      await engine.executeFromHandle(nodeId, 'body');
    }

    // Clean up loop variable
    delete context.variables[itemVar];
    delete context.variables[`${itemVar}_index`];

    engine.log('INFO', `For Each: loop complete (${total} iteration(s))`);
    return { nextHandle: 'done' };
  },
};
