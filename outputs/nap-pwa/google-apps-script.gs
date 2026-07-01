const SHEET_NAME = 'Sonecas';
const SHARED_TOKEN = 'sonecas';

const HEADERS = [
  'Recebido em',
  'ID',
  'Bebê',
  'Idade (meses)',
  'Início',
  'Fim',
  'Duração (min)',
  'Humor',
  'Último despertar',
  'Hora de dormir',
  'Sono 24h (min)',
  'Sonecas hoje',
  'Janela usada',
  'Próxima janela',
  'Sono noturno sugerido',
  'Observação',
  'Inicio do dia'
];

function doGet(e) {
  const token = e && e.parameter ? e.parameter.token : '';

  if (SHARED_TOKEN && token && token !== SHARED_TOKEN) {
    return jsonResponse({ ok: false, error: 'Token inválido.' });
  }

  if (e && e.parameter && e.parameter.action === 'list') {
    return jsonResponse(listRows(getSheet()));
  }

  return jsonResponse({
    ok: true,
    message: 'Endpoint da PWA de sonecas ativo.'
  });
}

function doPost(e) {
  try {
    const payload = parsePayload(e);

    if (SHARED_TOKEN && payload.token !== SHARED_TOKEN) {
      return jsonResponse({ ok: false, error: 'Token inválido.' });
    }

    const sheet = getSheet();

    if (payload.action === 'delete') {
      return jsonResponse(deleteNapRow(sheet, payload.id));
    }

    if (payload.action === 'bulkAppend') {
      return jsonResponse(appendMissingRows(sheet, payload.records || []));
    }

    return jsonResponse(appendMissingRows(sheet, [payload]));
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message
    });
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Requisição vazia.');
  }
  return JSON.parse(e.postData.contents);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else {
    ensureHeaders(sheet);
  }

  return sheet;
}

function ensureHeaders(sheet) {
  const width = Math.max(sheet.getLastColumn(), HEADERS.length);
  const currentHeaders = sheet.getRange(1, 1, 1, width).getValues()[0];

  HEADERS.forEach((header, index) => {
    if (currentHeaders[index] !== header) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });
}

function deleteNapRow(sheet, id) {
  if (!id) {
    return { ok: false, error: 'ID ausente.' };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, deleted: false };
  }

  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === String(id)) {
      sheet.deleteRow(index + 2);
      return { ok: true, deleted: true };
    }
  }

  return { ok: true, deleted: false };
}

function appendMissingRows(sheet, records) {
  const existingIds = getExistingIds(sheet);
  const rows = [];
  const inserted = [];
  const skipped = [];

  records.forEach((record) => {
    const id = String(record.id || '');
    if (!id || existingIds.has(id)) {
      skipped.push(id);
      return;
    }

    existingIds.add(id);
    inserted.push(id);
    rows.push(toSheetRow(record));
  });

  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  }

  return {
    ok: true,
    inserted: inserted,
    skipped: skipped
  };
}

function getExistingIds(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();

  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  return new Set(values.map((row) => String(row[0])).filter(Boolean));
}

function toSheetRow(payload) {
  return [
    new Date(),
    payload.id || '',
    payload.babyName || '',
    payload.babyAge || '',
    payload.start || '',
    payload.end || '',
    payload.duration || '',
    payload.mood || '',
    payload.lastWake || '',
    payload.bedtime || '',
    payload.sleep24 || '',
    payload.napCount || '',
    payload.wakeWindow || '',
    payload.nextWindow || '',
    payload.nightSuggestion || '',
    payload.note || '',
    payload.dayStart || ''
  ];
}

function listRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, records: [] };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const records = values
    .filter((row) => row[1])
    .map((row) => ({
      receivedAt: toIsoString(row[0]),
      id: String(row[1]),
      babyName: row[2] || '',
      babyAge: row[3] || '',
      start: toIsoString(row[4]),
      end: toIsoString(row[5]),
      duration: Number(row[6] || 0),
      mood: row[7] || '',
      lastWake: row[8] || '',
      bedtime: row[9] || '',
      sleep24: row[10] || '',
      napCount: row[11] || '',
      wakeWindow: row[12] || '',
      nextWindow: row[13] || '',
      nightSuggestion: row[14] || '',
      note: row[15] || '',
      dayStart: row[16] || ''
    }));

  return { ok: true, records: records };
}

function toIsoString(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return String(value);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
