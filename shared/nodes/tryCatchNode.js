'use strict';

module.exports = {
  meta: {
    type: 'tryCatchNode',
    label: 'Try / Catch',
    category: 'Logic',
    description: 'Handle errors without stopping the workflow',
    color: '#D97706',
  },
  defaults: {
    errorVariable: 'lastError',
  },
  schema: [
    {
      key: 'errorVariable',
      label: 'Error Variable',
      type: 'text',
      placeholder: 'lastError',
      hint: 'Variable name that stores the error message if the TRY block fails.',
    },
  ],
  execute: async (data, context, engine, nodeId) => {
    const errorVar = (data.errorVariable || 'lastError').trim();

    engine.log('INFO', 'Try/Catch: entering TRY block');
    try {
      await engine.executeFromHandle(nodeId, 'try');
      engine.log('INFO', 'Try/Catch: TRY block succeeded');
    } catch (err) {
      context.variables[errorVar] = err.message;
      context.lastError = err.message;
      engine.log('ERROR', `Try/Catch: TRY failed — ${err.message}`);
      engine.log('INFO', 'Try/Catch: entering CATCH block');
      await engine.executeFromHandle(nodeId, 'catch');
      engine.log('INFO', 'Try/Catch: CATCH block completed');
    }

    // Signal that this handler managed graph traversal internally
    return { _handled: true };
  },
};
