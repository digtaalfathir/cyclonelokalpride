'use strict';

/**
 * Evaluates a JS expression string with workflow variables in scope.
 *
 * Safe for a local desktop RPA tool: variables are passed as explicit named
 * parameters so they shadow any same-named globals. The caller controls what
 * goes into `variables`; never pass untrusted user-controlled data as keys.
 *
 * Supported syntax examples:
 *   {{count > 10}}
 *   {{status == "OK"}}
 *   {{response.data.name}}
 *   {{user.age >= 18 && user.active}}
 *   users                        (bare expression without {{ }})
 */
function evaluate(expression, variables = {}) {
  if (typeof expression !== 'string') return expression;

  let expr = expression.trim();

  // Strip {{ }} wrapper if present
  if (expr.startsWith('{{') && expr.endsWith('}}')) {
    expr = expr.slice(2, -2).trim();
  }

  if (!expr) return undefined;

  // Inject top-level variable keys as named parameters so dot-access works
  // naturally: `response.data.name` resolves because `response` is in scope.
  const keys = Object.keys(variables);
  const values = keys.map(k => variables[k]);

  try {
    // 'use strict' reduces accidental global writes but does not sandbox
    // Node builtins — acceptable for a local, trusted workflow tool.
    const fn = new Function(...keys, `'use strict'; return (${expr});`);
    return fn(...values);
  } catch (err) {
    throw new Error(`Expression "${expr}": ${err.message}`);
  }
}

/**
 * Same as evaluate() but always coerces the result to boolean.
 * Use this for IF-condition checks.
 */
function evaluateBool(expression, variables = {}) {
  return Boolean(evaluate(expression, variables));
}

module.exports = { evaluate, evaluateBool };
