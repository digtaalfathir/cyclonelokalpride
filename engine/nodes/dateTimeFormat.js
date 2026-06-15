'use strict';

const { interpolate } = require('../utils/interpolate');

// Token → regex & part extractor
const TOKEN_MAP = [
  { token: 'YYYY', re: '(\\d{4})',   part: (m) => ({ year:   parseInt(m, 10) }) },
  { token: 'MM',   re: '(\\d{1,2})', part: (m) => ({ month:  parseInt(m, 10) - 1 }) },
  { token: 'DD',   re: '(\\d{1,2})', part: (m) => ({ day:    parseInt(m, 10) }) },
  { token: 'HH',   re: '(\\d{1,2})', part: (m) => ({ hour:   parseInt(m, 10) }) },
  { token: 'mm',   re: '(\\d{1,2})', part: (m) => ({ minute: parseInt(m, 10) }) },
  { token: 'ss',   re: '(\\d{1,2})', part: (m) => ({ second: parseInt(m, 10) }) },
];

function parseWithFormat(str, fmt) {
  let reStr = fmt.replace(/[-/.:TZ]/g, m => '\\' + m);
  const extractors = [];
  for (const { token, re, part } of TOKEN_MAP) {
    if (reStr.includes(token)) {
      reStr = reStr.replace(token, re);
      extractors.push(part);
    }
  }
  const match = new RegExp('^' + reStr + '$').exec(str.trim());
  if (!match) return null;
  const p = { year: 1970, month: 0, day: 1, hour: 0, minute: 0, second: 0 };
  extractors.forEach((fn, i) => Object.assign(p, fn(match[i + 1])));
  return new Date(p.year, p.month, p.day, p.hour, p.minute, p.second);
}

function formatDate(date, fmt) {
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, tok => {
    switch (tok) {
      case 'YYYY': return pad(date.getFullYear(), 4);
      case 'MM':   return pad(date.getMonth() + 1);
      case 'DD':   return pad(date.getDate());
      case 'HH':   return pad(date.getHours());
      case 'mm':   return pad(date.getMinutes());
      case 'ss':   return pad(date.getSeconds());
      default:     return tok;
    }
  });
}

// ─────────────────────────────────────────────────────────────

module.exports = {
  meta: {
    type: 'dateTimeFormat',
    label: 'Date Time Format',
    category: 'Data Processing',
    description: 'Parse and reformat a date/time string',
    color: '#0891B2',
  },
  defaults: {
    inputDate: '',
    inputFormat: '',
    outputFormat: 'DD/MM/YYYY',
    outputVariable: 'formattedDate',
  },
  schema: [
    {
      key: 'inputDate',
      label: 'Input Date',
      type: 'text',
      placeholder: '2026-06-15',
      hint: 'Supports {{variable}}. ISO format is auto-detected when Input Format is blank.',
    },
    {
      key: 'inputFormat',
      label: 'Input Format',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      hint: 'Tokens: YYYY MM DD HH mm ss. Leave blank to auto-parse ISO / common formats.',
    },
    {
      key: 'outputFormat',
      label: 'Output Format',
      type: 'text',
      placeholder: 'DD/MM/YYYY',
      hint: 'Tokens: YYYY MM DD HH mm ss.  e.g. DD/MM/YYYY HH:mm:ss',
    },
    {
      key: 'outputVariable',
      label: 'Output Variable',
      type: 'text',
      placeholder: 'formattedDate',
    },
  ],
  execute: async (data, context, engine) => {
    const inputDate  = interpolate(data.inputDate  || '', context.variables).trim();
    const inputFmt   = (data.inputFormat  || '').trim();
    const outputFmt  = (data.outputFormat || 'DD/MM/YYYY').trim();
    const outVar     = (data.outputVariable || 'formattedDate').trim();

    if (!inputDate) throw new Error('Date Time Format: "Input Date" is required.');

    let date;
    if (inputFmt) {
      date = parseWithFormat(inputDate, inputFmt);
      if (!date || isNaN(date.getTime())) {
        throw new Error(`Date Time Format: cannot parse "${inputDate}" with format "${inputFmt}".`);
      }
    } else {
      date = new Date(inputDate);
      if (isNaN(date.getTime())) {
        throw new Error(`Date Time Format: cannot parse "${inputDate}" as a valid date.`);
      }
    }

    const result = formatDate(date, outputFmt);
    context.variables[outVar] = result;
    engine.log('INFO', `Date formatted: "${inputDate}" → "${result}" → {{${outVar}}}`);
  },
};
