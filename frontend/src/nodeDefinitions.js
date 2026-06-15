/**
 * Node type definitions for the workflow designer.
 * Maps to the engine plugin system.
 */

export const NODE_DEFINITIONS = [
  {
    type: 'start',
    label: 'Start',
    category: 'Flow Control',
    description: 'Workflow entry point',
    iconKey: 'play',
    color: '#16A34A',
    defaults: {},
    schema: [],
    maxInstances: 1,
    hasInput: false,
    hasOutput: true,
  },
  {
    type: 'openBrowser',
    label: 'Open Browser',
    category: 'Browser',
    description: 'Launch a browser instance',
    iconKey: 'globe',
    color: '#2563EB',
    defaults: { headless: false },
    schema: [
      { key: 'headless', label: 'Headless Mode', type: 'boolean' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'navigateUrl',
    label: 'Navigate URL',
    category: 'Browser',
    description: 'Go to a web address',
    iconKey: 'link',
    color: '#7C3AED',
    defaults: { url: 'https://example.com' },
    schema: [
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'inputText',
    label: 'Input Text',
    category: 'Input',
    description: 'Type into an input field',
    iconKey: 'type',
    color: '#D97706',
    defaults: { selector: '', value: '', clearFirst: true },
    schema: [
      { key: 'selector',   label: 'CSS Selector',    type: 'text',    placeholder: '#username', isSelector: true },
      { key: 'value',      label: 'Value',            type: 'text',    placeholder: 'Enter text...' },
      { key: 'clearFirst', label: 'Clear Field First',type: 'boolean' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'clickElement',
    label: 'Click Element',
    category: 'Mouse',
    description: 'Click a page element',
    iconKey: 'mouse',
    color: '#7C3AED',
    defaults: { selector: '', doubleClick: false },
    schema: [
      { key: 'selector',    label: 'CSS Selector', type: 'text',    placeholder: '#login-button', isSelector: true },
      { key: 'doubleClick', label: 'Double Click', type: 'boolean' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'end',
    label: 'End',
    category: 'Flow Control',
    description: 'Workflow end point',
    iconKey: 'stop',
    color: '#6B7280',
    defaults: { autoCloseBrowser: true, restoreWindow: true },
    schema: [
      { key: 'autoCloseBrowser', label: 'Auto Close Browser',    type: 'boolean',
        hint: 'When disabled, the browser stays open after the workflow finishes.' },
      { key: 'restoreWindow',    label: 'Restore Cyclone Window', type: 'boolean',
        hint: 'Bring Cyclone back to the foreground after execution.' },
    ],
    maxInstances: 1,
    hasInput: true,
    hasOutput: false,
  },

  // ── Stage 2 nodes ─────────────────────────────────────────
  {
    type: 'setVariable',
    label: 'Set Variable',
    category: 'Logic',
    description: 'Assign a value to a workflow variable',
    iconKey: 'variable',
    color: '#16A34A',
    defaults: { variableName: '', value: '' },
    schema: [
      { key: 'variableName', label: 'Variable Name', type: 'text',
        placeholder: 'username' },
      { key: 'value', label: 'Value', type: 'text',
        placeholder: 'admin',
        hint: 'Supports {{otherVariable}} interpolation.' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'logMessage',
    label: 'Log Message',
    category: 'Logic',
    description: 'Print a message to the execution console',
    iconKey: 'log',
    color: '#6B7280',
    defaults: { message: '', level: 'INFO' },
    schema: [
      { key: 'message', label: 'Message', type: 'textarea',
        placeholder: 'Hello, {{username}}',
        hint: 'Supports {{variable}} and {{obj.nested}} interpolation.' },
      { key: 'level', label: 'Level', type: 'text',
        placeholder: 'INFO',
        hint: 'INFO, WARN, ERROR, or SUCCESS.' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'delay',
    label: 'Delay',
    category: 'Logic',
    description: 'Pause execution for a number of milliseconds',
    iconKey: 'clock',
    color: '#D97706',
    defaults: { milliseconds: '1000' },
    schema: [
      { key: 'milliseconds', label: 'Milliseconds', type: 'text',
        placeholder: '1000',
        hint: 'Supports {{variable}} — resolved at runtime.' },
    ],
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'httpRequest',
    label: 'HTTP Request',
    category: 'API',
    description: 'Make an HTTP call and store the response',
    iconKey: 'api',
    color: '#2563EB',
    defaults: { method: 'GET', url: '', headers: '', body: '', outputVariable: 'response' },
    schema: [
      { key: 'method', label: 'Method', type: 'text',
        placeholder: 'GET' },
      { key: 'url', label: 'URL', type: 'text',
        placeholder: 'https://api.example.com/users/{{userId}}',
        hint: 'Supports {{variable}} interpolation.' },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea',
        placeholder: '{"Authorization": "Bearer {{token}}"}',
        hint: 'Optional JSON object. Supports {{variable}}.' },
      { key: 'body', label: 'Body (JSON)', type: 'textarea',
        placeholder: '{"username": "{{username}}"}',
        hint: 'Used for POST / PUT / PATCH. Supports {{variable}}.' },
      { key: 'outputVariable', label: 'Output Variable', type: 'text',
        placeholder: 'response',
        hint: 'Access response data with {{response.data.id}}.' },
    ],
    hasInput: true,
    hasOutput: true,
  },

  // ── Stage 3 nodes ─────────────────────────────────────────
  {
    type: 'ifNode',
    label: 'IF',
    category: 'Logic',
    description: 'Branch workflow based on a condition',
    iconKey: 'condition',
    color: '#7C3AED',
    defaults: { condition: '' },
    schema: [
      { key: 'condition', label: 'Condition', type: 'text',
        placeholder: '{{response.status == 200}}',
        hint: 'Supports {{variable}} expressions. Routes to TRUE or FALSE branch.' },
    ],
    hasInput: true,
    hasOutput: false,
    outputHandles: [
      { id: 'true',  label: 'TRUE',  color: '#16A34A' },
      { id: 'false', label: 'FALSE', color: '#DC2626' },
    ],
  },
  {
    type: 'forEachNode',
    label: 'For Each',
    category: 'Logic',
    description: 'Iterate over each item in a collection',
    iconKey: 'loop',
    color: '#2563EB',
    defaults: { collection: '', itemVariable: 'item' },
    schema: [
      { key: 'collection',   label: 'Collection',   type: 'text',
        placeholder: '{{users}}',
        hint: 'Variable containing an array. Use {{variable}} syntax.' },
      { key: 'itemVariable', label: 'Item Variable', type: 'text',
        placeholder: 'item',
        hint: 'Name for each element (e.g. access with {{item.name}}).' },
    ],
    hasInput: true,
    hasOutput: false,
    outputHandles: [
      { id: 'body', label: 'BODY', color: '#2563EB' },
      { id: 'done', label: 'DONE', color: '#16A34A' },
    ],
  },
  {
    type: 'tryCatchNode',
    label: 'Try / Catch',
    category: 'Logic',
    description: 'Handle errors without stopping the workflow',
    iconKey: 'shield',
    color: '#D97706',
    defaults: { errorVariable: 'lastError' },
    schema: [
      { key: 'errorVariable', label: 'Error Variable', type: 'text',
        placeholder: 'lastError',
        hint: 'Variable that stores the error message if TRY fails.' },
    ],
    hasInput: true,
    hasOutput: false,
    outputHandles: [
      { id: 'try',   label: 'TRY',   color: '#16A34A' },
      { id: 'catch', label: 'CATCH', color: '#DC2626' },
    ],
  },
];

export function getNodesByCategory() {
  const categories = {};
  for (const def of NODE_DEFINITIONS) {
    if (!categories[def.category]) categories[def.category] = [];
    categories[def.category].push(def);
  }
  return categories;
}

export function getNodeDefinition(type) {
  return NODE_DEFINITIONS.find(d => d.type === type) || null;
}
