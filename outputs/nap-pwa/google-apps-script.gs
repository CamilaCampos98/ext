const SHEET_NAME = 'Sonecas';
const FEEDINGS_SHEET_NAME = 'Mamadas';
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
  'Inicio do dia',
  'Tipo'
];

const FEEDING_HEADERS = [
  'Recebido em',
  'ID',
  'Bebê',
  'Idade (meses)',
  'Horário',
  'Tipo',
  'Peito',
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

  if (e && e.parameter && e.parameter.action === 'listFeedings') {
    return jsonResponse(listFeedingRows(getFeedingSheet()));
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

    if (payload.action === 'deleteFeeding') {
      return jsonResponse(deleteRowById(getFeedingSheet(), payload.id));
    }

    if (payload.action === 'appendFeeding') {
      return jsonResponse(appendMissingFeedingRows(getFeedingSheet(), [payload]));
    }

    if (payload.action === 'bulkAppendFeedings') {
      return jsonResponse(appendMissingFeedingRows(getFeedingSheet(), payload.records || []));
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

function getFeedingSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(FEEDINGS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(FEEDINGS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(FEEDING_HEADERS);
    sheet.setFrozenRows(1);
  } else {
    ensureSpecificHeaders(sheet, FEEDING_HEADERS);
  }

  return sheet;
}

function ensureHeaders(sheet) {
  ensureSpecificHeaders(sheet, HEADERS);
}

function ensureSpecificHeaders(sheet, headers) {
  const width = Math.max(sheet.getLastColumn(), headers.length);
  const currentHeaders = sheet.getRange(1, 1, 1, width).getValues()[0];

  headers.forEach((header, index) => {
    if (currentHeaders[index] !== header) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });
}

function deleteNapRow(sheet, id) {
  return deleteRowById(sheet, id);
}

function deleteRowById(sheet, id) {
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

function appendMissingFeedingRows(sheet, records) {
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
    rows.push(toFeedingSheetRow(record));
  });

  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, FEEDING_HEADERS.length).setValues(rows);
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
    toDateTimeString(payload.start),
    toDateTimeString(payload.end),
    payload.duration || '',
    payload.mood || '',
    toTimeString(payload.lastWake),
    toTimeString(payload.bedtime),
    payload.sleep24 || '',
    payload.napCount || '',
    payload.wakeWindow || '',
    payload.nextWindow || '',
    payload.nightSuggestion || '',
    payload.note || '',
    toTimeString(payload.dayStart),
    payload.type || 'nap'
  ];
}

function toFeedingSheetRow(payload) {
  return [
    new Date(),
    payload.id || '',
    payload.babyName || '',
    payload.babyAge || '',
    toDateTimeString(payload.at),
    payload.typeLabel || payload.type || '',
    payload.sideLabel || payload.side || '',
    payload.note || '',
    toTimeString(payload.dayStart)
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
      start: toDateTimeString(row[4]),
      end: toDateTimeString(row[5]),
      duration: Number(row[6] || 0),
      mood: row[7] || '',
      lastWake: toTimeString(row[8]),
      bedtime: toTimeString(row[9]),
      sleep24: row[10] || '',
      napCount: row[11] || '',
      wakeWindow: row[12] || '',
      nextWindow: row[13] || '',
      nightSuggestion: row[14] || '',
      note: row[15] || '',
      dayStart: toTimeString(row[16]),
      type: row[17] || 'nap'
    }));

  return { ok: true, records: records };
}

function listFeedingRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, records: [] };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, FEEDING_HEADERS.length).getValues();
  const records = values
    .filter((row) => row[1])
    .map((row) => ({
      receivedAt: toIsoString(row[0]),
      id: String(row[1]),
      babyName: row[2] || '',
      babyAge: row[3] || '',
      at: toDateTimeString(row[4]),
      type: feedingTypeKey(row[5]),
      side: feedingSideKey(row[6]),
      note: row[7] || '',
      dayStart: toTimeString(row[8])
    }));

  return { ok: true, records: records };
}

function feedingTypeKey(value) {
  const text = String(value || '').toLowerCase();
  if (text.indexOf('fórmula') >= 0 || text.indexOf('formula') >= 0) return 'formula';
  if (text.indexOf('mamadeira') >= 0) return 'bottle';
  return 'breast';
}

function feedingSideKey(value) {
  const text = String(value || '').toLowerCase();
  if (text.indexOf('direito') >= 0) return 'right';
  if (text.indexOf('ambos') >= 0) return 'both';
  if (text.indexOf('esquerdo') >= 0) return 'left';
  return '';
}

function toIsoString(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return String(value);
}

function toDateTimeString(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  }

  const text = String(value);
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && /Z|[+-]\d{2}:?\d{2}$/.test(text)) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  }

  const localMatch = text.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
  if (localMatch) return localMatch[1] + 'T' + localMatch[2] + ':' + localMatch[3] + ':00';

  return text;
}

function toTimeString(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }

  const text = String(value);
  if (/^1899-12-(30|31)/.test(text)) return '';

  const isoTime = text.match(/T(\d{2}):(\d{2})/);
  if (isoTime) return isoTime[1] + ':' + isoTime[2];

  const plainTime = text.match(/(\d{1,2}):(\d{2})/);
  if (plainTime) {
    return String(Number(plainTime[1])).padStart(2, '0') + ':' + plainTime[2];
  }

  return text;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
