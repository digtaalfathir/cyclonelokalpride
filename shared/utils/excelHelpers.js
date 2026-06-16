'use strict';

/**
 * Shared helpers for Excel nodes.
 * Kept in one place so cell-address parsing is consistent across all nodes.
 */

/**
 * Convert Excel column letters to a 1-based column index.
 * "A" → 1, "B" → 2, "Z" → 26, "AA" → 27
 */
function colLetterToIndex(letters) {
  return letters.toUpperCase().split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0);
}

/**
 * Parse a cell reference like "A1" → { row: 1, col: 1 }
 */
function parseCell(cellStr) {
  const m = String(cellStr).trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) throw new Error(`Invalid cell reference: "${cellStr}". Use A1 notation.`);
  return { row: parseInt(m[2], 10), col: colLetterToIndex(m[1]) };
}

/**
 * Parse a range like "A1:D100" → { startRow, startCol, endRow, endCol }
 */
function parseRange(rangeStr) {
  const parts = String(rangeStr).trim().split(':');
  if (parts.length !== 2) throw new Error(`Invalid range: "${rangeStr}". Use A1:D100 notation.`);
  const s = parseCell(parts[0]);
  const e = parseCell(parts[1]);
  return { startRow: s.row, startCol: s.col, endRow: e.row, endCol: e.col };
}

/**
 * Extract a plain value from an ExcelJS cell.
 * Handles formulas (returns result), dates (returns ISO string), rich text (returns plain string).
 */
function getCellValue(cell) {
  const v = cell.value;
  if (v === null || v === undefined) return '';
  // Formula cell — return computed result
  if (typeof v === 'object' && v !== null && 'formula' in v) {
    const r = v.result;
    if (r instanceof Date) return r.toISOString();
    return r ?? '';
  }
  // Date cell
  if (v instanceof Date) return v.toISOString();
  // Rich text
  if (typeof v === 'object' && v !== null && 'richText' in v) {
    return v.richText.map(r => r.text || '').join('');
  }
  return v;
}

/**
 * Retrieve an open workbook from context.workbooks.
 * Throws a friendly error if the workbook ID is missing or invalid.
 */
function getWorkbook(context, workbookId) {
  if (!context.workbooks || !context.workbooks[workbookId]) {
    throw new Error(`Excel: workbook "${workbookId}" is not open. Add an Open Excel node before this node.`);
  }
  return context.workbooks[workbookId]; // { workbook, filePath }
}

/**
 * Return a worksheet by name (or the first sheet if name is blank).
 * Throws if the named sheet doesn't exist.
 */
function getWorksheet(workbook, sheetName) {
  const ws = sheetName
    ? workbook.getWorksheet(sheetName)
    : workbook.getWorksheet(1);
  if (!ws) {
    throw new Error(`Excel: sheet "${sheetName}" not found. Check the Sheet Name property.`);
  }
  return ws;
}

module.exports = { parseCell, parseRange, getCellValue, getWorkbook, getWorksheet };
