import { Lead, LeadSource } from '../types';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }[];
}

/**
 * List Google Spreadsheets from the user's Google Drive
 */
export async function listGoogleDriveSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink,iconLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=25`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Drive API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Get spreadsheet details and sheets tabs
 */
export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string): Promise<SheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Sheets API error: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId || 0,
      title: s.properties?.title || 'Sheet1',
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount
    }))
  };
}

/**
 * Fetch rows/values from a specific spreadsheet and range
 */
export async function getSpreadsheetValues(
  accessToken: string, 
  spreadsheetId: string, 
  range: string = 'Sheet1!A1:Z500'
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Sheets API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Create a brand new Google Spreadsheet populated with CRM Leads
 */
export async function createGoogleSpreadsheetWithLeads(
  accessToken: string,
  title: string,
  leads: Lead[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const headers = [
    'Lead Name',
    'Phone',
    'Email',
    'Company',
    'City',
    'State',
    'Source',
    'Status',
    'Deal Value (INR)',
    'AI Rating',
    'AI Score',
    'Created At',
    'Notes'
  ];

  const rows = leads.map((l) => [
    l.name || '',
    l.phone || '',
    l.email || '',
    l.company || '',
    l.city || '',
    l.state || '',
    l.source || 'Direct',
    l.status || 'New Lead',
    l.dealValue ? l.dealValue.toString() : '0',
    l.aiRating || 'Warm',
    l.aiScore ? l.aiScore.toString() : '70',
    l.createdAt ? new Date(l.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    l.notes || ''
  ]);

  const body = {
    properties: {
      title: title || `ARCLE CRM Leads Export - ${new Date().toLocaleDateString()}`
    },
    sheets: [
      {
        properties: {
          title: 'CRM Leads',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headers.map((h) => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    backgroundColor: { red: 0.26, green: 0.27, blue: 0.79 }, // Indigo header
                    horizontalAlignment: 'CENTER'
                  }
                }))
              },
              ...rows.map((row) => ({
                values: row.map((cell) => ({
                  userEnteredValue: { stringValue: String(cell) }
                }))
              }))
            ]
          }
        ]
      }
    ]
  };

  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
}

/**
 * Append leads to an existing Google Spreadsheet
 */
export async function appendLeadsToGoogleSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string = 'Sheet1',
  leads: Lead[]
): Promise<{ updatedRows: number }> {
  const rows = leads.map((l) => [
    l.name || '',
    l.phone || '',
    l.email || '',
    l.company || '',
    l.city || '',
    l.state || '',
    l.source || 'Direct',
    l.status || 'New Lead',
    l.dealValue ? l.dealValue.toString() : '0',
    l.aiRating || 'Warm',
    l.aiScore ? l.aiScore.toString() : '70',
    new Date().toLocaleDateString(),
    l.notes || ''
  ]);

  const range = `${sheetTitle}!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to append rows to Google Spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    updatedRows: data.updates?.updatedRows || rows.length
  };
}

/**
 * Intelligent parser to convert arbitrary 2D sheet values into Lead objects
 */
export function parseSheetRowsToLeads(values: string[][], defaultSource = 'Google Sheets'): Partial<Lead>[] {
  if (!values || values.length === 0) return [];

  // Check if first row is header
  const headerRow = values[0].map(h => (h || '').toString().toLowerCase().trim());
  const hasHeaders = headerRow.some(h => 
    h.includes('name') || h.includes('phone') || h.includes('email') || h.includes('contact') || h.includes('company')
  );

  const getColIndex = (keywords: string[]): number => {
    return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const nameIdx = getColIndex(['name', 'full name', 'lead', 'client', 'customer', 'person']);
  const phoneIdx = getColIndex(['phone', 'mobile', 'cell', 'contact', 'tel', 'whatsapp', 'number']);
  const emailIdx = getColIndex(['email', 'mail', 'e-mail']);
  const companyIdx = getColIndex(['company', 'organization', 'org', 'business', 'firm', 'agency']);
  const cityIdx = getColIndex(['city', 'location', 'town', 'address']);
  const stateIdx = getColIndex(['state', 'province', 'region']);
  const sourceIdx = getColIndex(['source', 'channel', 'campaign', 'origin', 'medium']);
  const statusIdx = getColIndex(['status', 'stage', 'disposition']);
  const valueIdx = getColIndex(['value', 'deal', 'budget', 'amount', 'price', 'revenue']);
  const notesIdx = getColIndex(['notes', 'note', 'comment', 'message', 'remarks', 'query', 'requirement']);

  const dataRows = hasHeaders ? values.slice(1) : values;

  return dataRows
    .filter(row => row && row.some(cell => cell && cell.toString().trim().length > 0))
    .map(row => {
      const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : (row[0] || 'Inbound Lead').trim();
      const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].trim() : (row[1] || '+91 90000 00000').trim();
      const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim() : (row[2] || '');
      const company = companyIdx !== -1 && row[companyIdx] ? row[companyIdx].trim() : (row[3] || '');
      const city = cityIdx !== -1 && row[cityIdx] ? row[cityIdx].trim() : 'Mumbai';
      const state = stateIdx !== -1 && row[stateIdx] ? row[stateIdx].trim() : 'Maharashtra';
      const source = sourceIdx !== -1 && row[sourceIdx] ? row[sourceIdx].trim() : defaultSource;
      const status = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].trim() : 'New Lead';
      
      let dealValue = 50000;
      if (valueIdx !== -1 && row[valueIdx]) {
        const parsed = parseInt(row[valueIdx].replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) dealValue = parsed;
      }

      const notes = notesIdx !== -1 && row[notesIdx] ? row[notesIdx].trim() : '';

      return {
        name: name || 'Google Sheet Lead',
        phone: phone || '+91 98765 43210',
        email,
        company,
        city,
        state,
        source: (source || 'Google Sheets') as LeadSource,
        status: status as any,
        dealValue,
        notes
      };
    });
}
