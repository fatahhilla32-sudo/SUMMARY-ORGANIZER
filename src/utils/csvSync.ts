import { ItemCategory, ProductItem } from '../types/dashboard';

/**
 * Normalizes Google Sheets URL to a direct CSV export endpoint
 */
export function normalizeGoogleSheetsUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If already a published CSV or export CSV link
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed;
  }

  // Match /spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Check if there is a gid parameter
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
  }

  return trimmed;
}

/**
 * Intelligent categorization based on item description
 */
export function inferSubcategory(description: string): string {
  const desc = description.toUpperCase();
  if (desc.includes('TROLLEY') || desc.includes('RACK') || desc.includes('SHELF')) {
    return 'Kitchen Trolleys & Racks';
  }
  if (desc.includes('BIN') || desc.includes('PEDAL')) {
    return 'Waste & Pedal Bins';
  }
  if (desc.includes('LAUNDRY') || desc.includes('HAMPER') || desc.includes('TOWEL') || desc.includes('BATHROOM') || desc.includes('SOAP')) {
    return 'Laundry & Bath Organizers';
  }
  if (desc.includes('CUTLERY') || desc.includes('KNIFE') || desc.includes('CUPBOARD') || desc.includes('DRAINER') || desc.includes('UTENSIL') || desc.includes('ROLL')) {
    return 'Kitchen & Cutlery Organizers';
  }
  if (desc.includes('BOX') || desc.includes('BASKET') || desc.includes('DRAWER')) {
    return 'Storage Boxes & Baskets';
  }
  return 'General Organizer';
}

/**
 * Parse CSV line handling quoted strings containing commas
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses numeric text like "Rp 331,231,964" or "2,405,406" or "180 pcs" or "7.60%"
 */
function parseCleanNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val
    .replace(/Rp/gi, '')
    .replace(/pcs/gi, '')
    .replace(/%/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export interface ParsedSheetData {
  items: ProductItem[];
  bmSales?: number;
  periodSales?: number;
  crossSellingSales?: number;
  totalQty?: number;
}

export function parseSpreadsheetCsv(csvText: string): ParsedSheetData {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const items: ProductItem[] = [];

  let bmSales: number | undefined;
  let periodSales: number | undefined;
  let crossSellingSales: number | undefined;
  let totalQty: number | undefined;

  let tableHeaderFound = false;
  let autoIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCsvLine(line);

    // Look for MTD sales
    const lineStr = line.toUpperCase();
    if (lineStr.includes('MTD') && !bmSales) {
      for (const col of cols) {
        if (col.includes('Rp') || /^[0-9,]+$/.test(col)) {
          const val = parseCleanNumber(col);
          if (val > 1000000) bmSales = val;
        }
      }
    }

    // Look for 8 Okt - NOW / Period sales
    if ((lineStr.includes('OKT') || lineStr.includes('NOW') || lineStr.includes('PERIOD')) && !periodSales) {
      for (const col of cols) {
        if (col.includes('Rp') || /^[0-9,]+$/.test(col)) {
          const val = parseCleanNumber(col);
          if (val > 1000000) periodSales = val;
        }
      }
    }

    // Look for Cross selling sales
    if (lineStr.includes('CROOS') || lineStr.includes('CROSS') || lineStr.includes('SALES')) {
      for (const col of cols) {
        if (col.includes('pcs')) {
          totalQty = parseCleanNumber(col);
        }
      }
    }

    // Header detection for product list: NO, KLS, DESCRIPTION, CATAGORY, QTY, VALUE
    if (cols.some((c) => c.toUpperCase() === 'KLS' || c.toUpperCase() === 'DESCRIPTION')) {
      tableHeaderFound = true;
      continue;
    }

    if (tableHeaderFound) {
      // Find columns
      // Typically: [empty or NO, NO or KLS, DESCRIPTION, ..., CATAGORY, QTY, VALUE]
      const nonEmpties = cols.filter((c) => c.length > 0);
      if (nonEmpties.length >= 2) {
        // Find SKU/KLS code: either looks like 7-8 digits or alphanumeric
        let kls = '';
        let desc = '';
        let cat: ItemCategory = 'CONTINUE';
        let qty = 0;
        let val = 0;

        // Try mapping by column indices or content
        for (let j = 0; j < cols.length; j++) {
          const c = cols[j];
          if (!kls && (/^\d{7,8}$/.test(c) || /^x\d+$/i.test(c))) {
            kls = c;
            // Next column is likely description
            if (j + 1 < cols.length && cols[j + 1]) {
              desc = cols[j + 1];
            }
          }
          if (c.toUpperCase().includes('DISCONTINU') || c.toUpperCase().includes('DISCOUNTINU')) {
            cat = 'DISCONTINUE';
          }
        }

        // Check if there is an item description
        if (!desc) {
          // Look for longest uppercase string with letters
          for (const c of cols) {
            if (c.length > 8 && /[A-Z]/.test(c) && !c.includes('Rp') && !/^\d+$/.test(c)) {
              desc = c;
              break;
            }
          }
        }

        if (desc && (kls || desc.length > 5)) {
          // Find qty and value
          const nums: number[] = [];
          for (const c of cols) {
            if (c === kls || c === desc) continue;
            const parsed = parseCleanNumber(c);
            if (parsed > 0 || c === '0') {
              nums.push(parsed);
            }
          }

          if (nums.length >= 2) {
            qty = nums[0];
            val = nums[1];
          } else if (nums.length === 1) {
            if (nums[0] > 1000) {
              val = nums[0];
            } else {
              qty = nums[0];
            }
          }

          items.push({
            no: autoIndex++,
            kls: kls || `SKU-${10000000 + autoIndex}`,
            description: desc,
            category: cat,
            subcategory: inferSubcategory(desc),
            qty: qty,
            value: val,
          });
        }
      }
    }
  }

  // If table header wasn't strictly found, check fallback line parsing
  if (items.length === 0) {
    // Attempt standard CSV header matching
    const headerCols = lines[0].split(',').map((c) => c.trim().toLowerCase());
    const klsIdx = headerCols.findIndex((c) => c.includes('kls') || c.includes('sku'));
    const descIdx = headerCols.findIndex((c) => c.includes('desc') || c.includes('name'));
    const qtyIdx = headerCols.findIndex((c) => c.includes('qty'));
    const valIdx = headerCols.findIndex((c) => c.includes('val') || c.includes('price') || c.includes('sales'));
    const catIdx = headerCols.findIndex((c) => c.includes('cat'));

    if (descIdx !== -1) {
      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (!row[descIdx]) continue;
        const catStr = catIdx !== -1 && row[catIdx] ? row[catIdx].toUpperCase() : '';
        const cat: ItemCategory = catStr.includes('DISCONTINU') ? 'DISCONTINUE' : 'CONTINUE';

        items.push({
          no: autoIndex++,
          kls: klsIdx !== -1 && row[klsIdx] ? row[klsIdx] : `SKU-${10000000 + autoIndex}`,
          description: row[descIdx],
          category: cat,
          subcategory: inferSubcategory(row[descIdx]),
          qty: qtyIdx !== -1 ? parseCleanNumber(row[qtyIdx]) : 0,
          value: valIdx !== -1 ? parseCleanNumber(row[valIdx]) : 0,
        });
      }
    }
  }

  return {
    items,
    bmSales,
    periodSales,
    crossSellingSales,
    totalQty,
  };
}

/**
 * Generate CSV text from current items and summary
 */
export function generateExportCsv(items: ProductItem[], areaSqm: number = 221): string {
  const totalVal = items.reduce((acc, it) => acc + it.value, 0);
  const totalQty = items.reduce((acc, it) => acc + it.qty, 0);

  const lines: string[] = [
    'SUMMARY ORGANIZER - DINING ZONE (221 M2)',
    `Luasan,${areaSqm} m2`,
    `Total Sales Cross-Selling,Rp ${totalVal.toLocaleString('id-ID')}`,
    `Total Quantity,${totalQty} pcs`,
    `Sales Density / m2,Rp ${Math.round(totalVal / areaSqm).toLocaleString('id-ID')}`,
    '',
    'NO,KLS,DESCRIPTION,CATEGORY,SUBCATEGORY,QTY,VALUE,UNIT_PRICE',
  ];

  items.forEach((it) => {
    const unitPrice = it.qty > 0 ? Math.round(it.value / it.qty) : 0;
    lines.push(
      `${it.no},"${it.kls}","${it.description.replace(/"/g, '""')}","${it.category}","${it.subcategory}",${it.qty},${it.value},${unitPrice}`
    );
  });

  return lines.join('\n');
}
