const SHEET_NAME = 'Sonecas';
const FEEDINGS_SHEET_NAME = 'Mamadas';
const SLEEP_DIARY_SHEET_NAME = 'DiarioSono';
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

const SLEEP_DIARY_HEADERS = [
  'Recebido em',
  'ID da soneca',
  'Bebê',
  'Idade (meses)',
  'Data',
  'Soneca nº',
  'Início',
  'Fim',
  'Duração (min)',
  'Onde terminou',
  'Humor ao acordar',
  'Tempo para dormir (min)',
  'Tipo de ajuda',
  'Mamada antes da soneca',
  'Usou chupeta',
  'Acordou quando caiu',
  'Janela de sono usada'
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

  if (e && e.parameter && e.parameter.action === 'listSleepDiary') {
    return jsonResponse(listSleepDiaryRows(getSleepDiarySheet()));
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

    if (payload.action === 'upsertSleepDiary') {
      return jsonResponse(upsertSleepDiaryRows(getSleepDiarySheet(), [payload]));
    }

    if (payload.action === 'bulkUpsertSleepDiary') {
      return jsonResponse(upsertSleepDiaryRows(getSleepDiarySheet(), payload.records || []));
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

function getSleepDiarySheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SLEEP_DIARY_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SLEEP_DIARY_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SLEEP_DIARY_HEADERS);
    sheet.setFrozenRows(1);
  } else {
    ensureSpecificHeaders(sheet, SLEEP_DIARY_HEADERS);
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

function upsertSleepDiaryRows(sheet, records) {
  const existingRows = getExistingIdRows(sheet);
  const inserted = [];
  const updated = [];
  const skipped = [];

  records.forEach((record) => {
    const id = String(record.napId || record.id || '');
    if (!id) {
      skipped.push(id);
      return;
    }

    const row = toSleepDiarySheetRow(record);
    if (existingRows.has(id)) {
      sheet.getRange(existingRows.get(id), 1, 1, SLEEP_DIARY_HEADERS.length).setValues([row]);
      updated.push(id);
      return;
    }

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, SLEEP_DIARY_HEADERS.length).setValues([row]);
    existingRows.set(id, sheet.getLastRow());
    inserted.push(id);
  });

  return {
    ok: true,
    inserted: inserted,
    updated: updated,
    skipped: skipped
  };
}

function getExistingIds(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();

  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  return new Set(values.map((row) => String(row[0])).filter(Boolean));
}

function getExistingIdRows(sheet) {
  const lastRow = sheet.getLastRow();
  const rows = new Map();
  if (lastRow < 2) return rows;

  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  values.forEach((row, index) => {
    const id = String(row[0] || '');
    if (id) rows.set(id, index + 2);
  });
  return rows;
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

function toSleepDiarySheetRow(payload) {
  return [
    new Date(),
    payload.napId || payload.id || '',
    payload.babyName || '',
    payload.babyAge || '',
    payload.date || '',
    payload.napNumber || '',
    toDateTimeString(payload.start),
    toDateTimeString(payload.end),
    payload.duration || '',
    payload.sleepEndPlaceLabel || sleepEndPlaceLabel(payload.sleepEndPlace),
    payload.wakeMoodLabel || wakeMoodLabel(payload.wakeMood),
    payload.sleepLatency || '',
    payload.helpTypesLabel || helpTypesLabel(payload.helpTypes),
    payload.feedingBeforeNap || '',
    payload.pacifierLabel || yesNoLabel(payload.pacifier),
    payload.pacifierWakeLabel || yesNoLabel(payload.pacifierWake),
    payload.wakeWindowUsedLabel || payload.wakeWindowUsed || ''
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

function listSleepDiaryRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, records: [] };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, SLEEP_DIARY_HEADERS.length).getValues();
  const records = values
    .filter((row) => row[1])
    .map((row) => ({
      receivedAt: toIsoString(row[0]),
      napId: String(row[1]),
      babyName: row[2] || '',
      babyAge: row[3] || '',
      date: row[4] || '',
      napNumber: row[5] || '',
      start: toDateTimeString(row[6]),
      end: toDateTimeString(row[7]),
      duration: Number(row[8] || 0),
      sleepEndPlace: sleepEndPlaceKey(row[9]),
      wakeMood: wakeMoodKey(row[10]),
      sleepLatency: Number(row[11] || 0) > 0 ? row[11] : '',
      helpTypes: helpTypesKey(row[12]),
      feedingBeforeNap: row[13] || '',
      pacifier: yesNoKey(row[14]) || yesNoKey(row[11]),
      pacifierWake: yesNoKey(row[15]) || yesNoKey(row[12]),
      wakeWindowUsed: row[16] || row[13] || ''
    }));

  return { ok: true, records: records };
}

function yesNoKey(value) {
  const text = String(value || '').toLowerCase();
  if (text === 'sim' || text === 'yes') return 'yes';
  if (text === 'não' || text === 'nao' || text === 'no') return 'no';
  return '';
}

function yesNoLabel(value) {
  if (value === 'yes') return 'Sim';
  if (value === 'no') return 'Não';
  return '';
}

function sleepEndPlaceKey(value) {
  const text = String(value || '').toLowerCase();
  if (text === 'berço (com ajuda)' || text === 'berco (com ajuda)' || text === 'crib-help') return 'crib-help';
  if (text === 'berço (sozinha)' || text === 'berco (sozinha)' || text === 'crib-alone') return 'crib-alone';
  if (text === 'berço' || text === 'berco' || text === 'crib' || text === 'sim' || text === 'yes') return 'crib-help';
  if (text === 'colo' || text === 'lap' || text === 'não' || text === 'nao' || text === 'no') return 'lap';
  return '';
}

function sleepEndPlaceLabel(value) {
  if (value === 'crib' || value === 'crib-help') return 'Berço (com ajuda)';
  if (value === 'crib-alone') return 'Berço (sozinha)';
  if (value === 'lap') return 'Colo';
  return '';
}

function wakeMoodKey(value) {
  const text = String(value || '').toLowerCase();
  if (text === 'feliz' || text === 'happy') return 'happy';
  if (text === 'calma' || text === 'calm') return 'calm';
  if (text === 'irritada' || text === 'upset') return 'upset';
  if (text === 'chorando' || text === 'crying') return 'crying';
  return '';
}

function wakeMoodLabel(value) {
  if (value === 'happy') return 'Feliz';
  if (value === 'calm') return 'Calma';
  if (value === 'upset') return 'Irritada';
  if (value === 'crying') return 'Chorando';
  return '';
}

function helpTypesKey(value) {
  if (Array.isArray(value)) return value.join(', ');
  return String(value || '');
}

function helpTypesLabel(value) {
  if (Array.isArray(value)) {
    const labels = {
      lap: 'colo',
      rocking: 'balanço',
      'chest-hand': 'mão no peito',
      pacifier: 'chupeta',
      voice: 'voz',
      shush: 'shhhh'
    };
    return value.map((item) => labels[item] || item).filter(Boolean).join(', ');
  }
  return String(value || '');
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
