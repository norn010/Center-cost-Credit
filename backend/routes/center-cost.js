const express = require('express');
const {
  executeQuery,
  runInDatabase,
  getQueueDatabaseName,
  getAvailableDatabases,
  sql,
} = require('../db');

const router = express.Router();

const VIEW_COLUMNS = [
  'สาขา',
  'เลขที่JOB',
  'เลขที่ใบกำกับ',
  'วันที่ใบกำกับ',
  'วันที่JOB',
  'ประเภทใบงาน',
  'รหัสลูกค้า',
  'ชื่อลูกค้า',
  'รุ่นรถ',
  'เลขตัวถังรถ',
  'เลขกิโลเมตร',
  'รหัสแคมเปญ',
  'สถานะJOB',
  'ประเภทการชำระเงิน',
  'เลขทะเบียน',
  'การเคลม',
  'ประเภทภาษี',
  'อัตราภาษี',
  'ประเภทการเคลม',
  'มูลค่าบริการ',
  'มูลค่าน้ำมัน',
  'มูลค่าค่าใช้จ่ายนอก',
  'มูลค่าค่าใช้จ่ายภายใน',
  'มูลค่าอะไหล่',
  'มูลค่ารวม',
  'ต้นทุนบริการ',
  'ต้นทุนน้ำมัน',
  'ต้นทุนค่าใช้จ่ายนอก',
  'ต้นทุนค่าใช้จ่ายภายใน',
  'ต้นทุนอะไหล่',
  'ต้นทุนรวม',
  'กำไรบริการ',
  'กำไรน้ำมัน',
  'กำไรค่าใช้จ่ายนอก',
  'กำไรค่าใช้จ่ายภายใน',
  'กำไรอะไหล่',
  'กำไรรวม',
  'ประเภทเอกสาร',
  'คำอธิบายเอกสาร',
];

const DECIMAL_COLUMNS = new Set([
  'เลขกิโลเมตร',
  'อัตราภาษี',
  'มูลค่าบริการ',
  'มูลค่าน้ำมัน',
  'มูลค่าค่าใช้จ่ายนอก',
  'มูลค่าค่าใช้จ่ายภายใน',
  'มูลค่าอะไหล่',
  'มูลค่ารวม',
  'ต้นทุนบริการ',
  'ต้นทุนน้ำมัน',
  'ต้นทุนค่าใช้จ่ายนอก',
  'ต้นทุนค่าใช้จ่ายภายใน',
  'ต้นทุนอะไหล่',
  'ต้นทุนรวม',
  'กำไรบริการ',
  'กำไรน้ำมัน',
  'กำไรค่าใช้จ่ายนอก',
  'กำไรค่าใช้จ่ายภายใน',
  'กำไรอะไหล่',
  'กำไรรวม',
]);

const DATE_COLUMNS = new Set(['วันที่ใบกำกับ', 'วันที่JOB']);
const MAX_TEXT_COLUMNS = new Set(['คำอธิบายเอกสาร']);

const STATUS_MAP = {
  processing: 'กำลัง automate',
  completed: 'เสร็จแล้ว',
};
const BP_STATUS_OPTIONS = new Set(['ส่งให้BP', 'BPส่งกลับ']);

/** Settlement header automate_status (queue-style wording) */
const SETTLEMENT_AUTOMATE_STATUS_MAP = {
  processing: 'กำลัง automate',
};

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function toDbStatus(rawStatus) {
  if (!rawStatus) return null;
  if (STATUS_MAP[rawStatus]) return STATUS_MAP[rawStatus];
  return rawStatus;
}

function toSettlementAutomateStatusFilter(raw) {
  if (!raw) return SETTLEMENT_AUTOMATE_STATUS_MAP.processing;
  if (SETTLEMENT_AUTOMATE_STATUS_MAP[raw]) return SETTLEMENT_AUTOMATE_STATUS_MAP[raw];
  return String(raw);
}

function parseNumberOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseNonNegativeNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function pickUniqueValueOrMixed(rows, fieldName) {
  const values = [...new Set(rows.map((row) => row[fieldName]).filter((v) => v != null && v !== ''))];
  if (values.length === 0) return null;
  if (values.length === 1) return String(values[0]);
  return 'หลายรายการ';
}

function escapeSqlIdentifier(value) {
  return String(value).replaceAll(']', ']]');
}

function escapeSqlString(value) {
  return String(value).replaceAll("'", "''");
}

function resolveSourceDatabases(databaseFilter) {
  const available = getAvailableDatabases().map((d) => d.id);
  if (!databaseFilter) return available;

  const requested = String(databaseFilter)
    .split(',')
    .map((db) => db.trim())
    .filter(Boolean);

  return requested.filter((db) => available.includes(db));
}

async function resolveQueueDatabaseName() {
  const configuredDb = getQueueDatabaseName();
  const fallbackDb = 'Center_cost_Credit';
  const candidates = [...new Set([configuredDb, fallbackDb])];

  for (const dbName of candidates) {
    try {
      const result = await executeQuery(
        dbName,
        "SELECT OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit', 'U') AS object_id",
      );
      if (result.recordset?.[0]?.object_id) {
        return dbName;
      }
    } catch (err) {
      // ignore and try next candidate
    }
  }

  return configuredDb;
}

router.get('/', async (req, res) => {
  const {
    database = null,
    branch = null,
    startDate = null,
    endDate = null,
    search = null,
    page = 1,
    pageSize = 100,
  } = req.query;

  const safePage = parsePositiveInt(page, 1);
  const safePageSize = Math.min(parsePositiveInt(pageSize, 100), 500);
  const offset = (safePage - 1) * safePageSize;
  const sourceDatabases = resolveSourceDatabases(database);

  if (sourceDatabases.length === 0) {
    return res.status(400).json({ error: 'No valid source databases selected' });
  }

  const whereClause = `
    WHERE
      (@branch IS NULL OR [สาขา] = @branch)
      AND (@startDate IS NULL OR [วันที่ใบกำกับ] >= @startDate)
      AND (@endDate IS NULL OR [วันที่ใบกำกับ] <= @endDate)
      AND (
        @search IS NULL
        OR [เลขที่JOB] LIKE '%' + @search + '%'
        OR [เลขที่ใบกำกับ] LIKE '%' + @search + '%'
        OR [รหัสลูกค้า] LIKE '%' + @search + '%'
        OR [ชื่อลูกค้า] LIKE '%' + @search + '%'
        OR [เลขทะเบียน] LIKE '%' + @search + '%'
      )
  `;

  const columnsSql = VIEW_COLUMNS.map((columnName) => `[${columnName}]`).join(',\n      ');
  const unionSql = sourceDatabases
    .map((dbName) => {
      const safeDb = escapeSqlIdentifier(dbName);
      const safeLiteral = escapeSqlString(dbName);
      return `
        SELECT
          N'${safeLiteral}' AS [database_name],
          ${columnsSql}
        FROM [${safeDb}].[dbo].[vw_ServiceProfitCreditBranch]
        ${whereClause}
      `;
    })
    .join('\n      UNION ALL\n');

  const dataQuery = `
    ;WITH source_data AS (
      ${unionSql}
    )
    SELECT
      [database_name],
      ${columnsSql}
    FROM source_data
    ORDER BY [วันที่ใบกำกับ] DESC, [เลขที่JOB] DESC
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY
  `;

  const countQuery = `
    ;WITH source_data AS (
      ${unionSql}
    )
    SELECT COUNT(1) AS total
    FROM source_data
  `;

  const params = {
    branch: branch || null,
    startDate: startDate || null,
    endDate: endDate || null,
    search: search || null,
    offset,
    pageSize: safePageSize,
  };

  try {
    const [dataResult, countResult] = await Promise.all([
      executeQuery('master', dataQuery, params),
      executeQuery('master', countQuery, params),
    ]);
    return res.json({
      data: dataResult.recordset || [],
      total: countResult.recordset?.[0]?.total || 0,
      page: safePage,
      pageSize: safePageSize,
    });
  } catch (err) {
    console.error('Error fetching center cost data', err);
    return res.status(500).json({ error: 'Failed to fetch center cost data' });
  }
});

router.post('/automate', async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows are required' });
  }
  if (rows.some((row) => !row.database_name)) {
    return res.status(400).json({ error: 'database_name is required for every row' });
  }

  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  try {
    const insertColumns = [
      'database_name',
      ...VIEW_COLUMNS,
      'มูลค่ารวมVat',
      'ส่งBP',
      'หมายเหตุ',
      'automate_status',
    ];
    const columnsList = insertColumns.map((c) => `[${c}]`).join(', ');

    for (const row of rows) {
      const paramEntries = insertColumns.map((columnName, i) => {
        const paramName = `p${i}`;
        let value;
        if (columnName === 'database_name') {
          value = String(row.database_name);
        } else if (columnName === 'automate_status') {
          value = 'กำลัง automate';
        } else if (columnName === 'มูลค่ารวมVat') {
          const base = parseNumberOrNull(row['มูลค่ารวม']);
          value = base != null ? Math.round((base + base * 0.07) * 100) / 100 : null;
        } else if (columnName === 'ส่งBP' || columnName === 'หมายเหตุ') {
          value = null;
        } else {
          const raw = row[columnName];
          if (raw == null || raw === '') {
            value = null;
          } else if (DECIMAL_COLUMNS.has(columnName)) {
            value = parseNumberOrNull(raw);
          } else if (DATE_COLUMNS.has(columnName)) {
            value = parseDateOrNull(raw);
          } else {
            value = String(raw);
          }
        }
        return { paramName, value };
      });

      const placeholders = paramEntries.map((e) => `@${e.paramName}`).join(', ');
      const insertQuery = `INSERT INTO [dbo].[Automation_Queue_Center_cost_Credit] (${columnsList}) VALUES (${placeholders})`;

      await executeQuery(queueDb, insertQuery, Object.fromEntries(
        paramEntries.map((e) => [e.paramName, e.value]),
      ));
    }

    return res.json({ success: true, inserted: rows.length });
  } catch (err) {
    console.error('Error inserting center cost queue', err);
    const preceding = Array.isArray(err.precedingErrors)
      ? err.precedingErrors.map((e) => e.message).filter(Boolean)
      : [];
    const detailMessage =
      preceding[0] ||
      err.originalError?.message ||
      err.rollbackError?.message ||
      err.message;
    const detail =
      process.env.NODE_ENV === 'development' ? detailMessage : 'Failed to queue automation';
    return res.status(500).json({
      error: 'Failed to send records to automation queue.',
      detail,
    });
  }
});

router.get('/queue', async (req, res) => {
  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { status = null, database = null, sendBp = null } = req.query;
  const statusForDb = toDbStatus(status);
  const queueColumnsSql = VIEW_COLUMNS.map((columnName) => `[${columnName}]`).join(',\n      ');
  const query = `
    SELECT
      id,
      database_name,
      ${queueColumnsSql},
      [มูลค่ารวมVat],
      [ส่งBP],
      [หมายเหตุ],
      automate_status,
      created_at,
      updated_at
    FROM [dbo].[Automation_Queue_Center_cost_Credit]
    WHERE
      (@status IS NULL OR automate_status = @status)
      AND (@database IS NULL OR database_name = @database)
      AND (@sendBp IS NULL OR [ส่งBP] = @sendBp)
    ORDER BY created_at DESC
  `;

  try {
    const result = await executeQuery(queueDb, query, {
      status: statusForDb || null,
      database: database || null,
      sendBp: sendBp || null,
    });
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching center cost queue', err);
    return res.status(500).json({ error: 'Failed to fetch center cost queue' });
  }
});

router.put('/:id/complete', async (req, res) => {
  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { id } = req.params;
  const query = `
    UPDATE [dbo].[Automation_Queue_Center_cost_Credit]
    SET
      automate_status = N'เสร็จแล้ว',
      updated_at = GETDATE()
    WHERE id = @id
  `;

  try {
    const result = await executeQuery(queueDb, query, { id });
    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ error: 'Queue row not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error completing queue row', err);
    return res.status(500).json({ error: 'Failed to complete queue row' });
  }
});

router.put('/:id/bp-fields', async (req, res) => {
  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { id } = req.params;
  const { sendBP, หมายเหตุ } = req.body || {};
  const hasSendBp = Object.prototype.hasOwnProperty.call(req.body || {}, 'sendBP');
  const hasRemark = Object.prototype.hasOwnProperty.call(req.body || {}, 'หมายเหตุ');

  if (!hasSendBp && !hasRemark) {
    return res.status(400).json({ error: 'sendBP or หมายเหตุ is required' });
  }

  if (hasSendBp && sendBP != null && !BP_STATUS_OPTIONS.has(sendBP)) {
    return res.status(400).json({ error: 'Invalid sendBP value' });
  }

  const setClauses = ['updated_at = GETDATE()'];
  const params = { id };
  if (hasSendBp) {
    setClauses.push('[ส่งBP] = @sendBP');
    params.sendBP = sendBP || null;
  }
  if (hasRemark) {
    setClauses.push('[หมายเหตุ] = @remark');
    params.remark = หมายเหตุ == null || หมายเหตุ === '' ? null : String(หมายเหตุ);
  }

  const query = `
    UPDATE [dbo].[Automation_Queue_Center_cost_Credit]
    SET ${setClauses.join(', ')}
    WHERE id = @id
  `;

  try {
    const result = await executeQuery(queueDb, query, params);
    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ error: 'Queue row not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating BP fields', err);
    return res.status(500).json({ error: 'Failed to update BP fields' });
  }
});

router.put('/:id/bp-submit', async (req, res) => {
  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { id } = req.params;
  const { หมายเหตุ } = req.body || {};
  const query = `
    UPDATE [dbo].[Automation_Queue_Center_cost_Credit]
    SET
      [หมายเหตุ] = @remark,
      [ส่งBP] = N'BPส่งกลับ',
      updated_at = GETDATE()
    WHERE
      id = @id
      AND ISNULL([ส่งBP], N'') = N'ส่งให้BP'
  `;

  try {
    const result = await executeQuery(queueDb, query, {
      id,
      remark: หมายเหตุ == null || หมายเหตุ === '' ? null : String(หมายเหตุ),
    });
    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ error: 'Queue row not found or sendBP is not ส่งให้BP' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error submitting BP row', err);
    return res.status(500).json({ error: 'Failed to submit BP row' });
  }
});

router.get('/settlement-candidates', async (req, res) => {
  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { branch = null, includeSettled = null } = req.query;
  const queueColumnsSql = VIEW_COLUMNS.map((columnName) => `[${columnName}]`).join(',\n      ');
  const query = `
    SELECT
      id,
      database_name,
      ${queueColumnsSql},
      [มูลค่ารวมVat],
      [ยอดตัดแล้ว],
      [ยอดคงเหลือ],
      [ส่งBP],
      [หมายเหตุ],
      automate_status,
      created_at,
      updated_at,
      [ยอดตัดแล้ว] AS paid_amount_ex,
      CASE WHEN [ยอดคงเหลือ] < 0 THEN 0 ELSE [ยอดคงเหลือ] END AS remaining_amount_ex
    FROM [dbo].[Automation_Queue_Center_cost_Credit]
    WHERE
      automate_status = N'เสร็จแล้ว'
      AND (@branch IS NULL OR [สาขา] = @branch)
      AND (
        @includeSettled = 1
        OR CASE WHEN [ยอดคงเหลือ] < 0 THEN 0 ELSE [ยอดคงเหลือ] END > 0
      )
    ORDER BY created_at DESC
  `;

  try {
    const result = await executeQuery(queueDb, query, {
      branch: branch || null,
      includeSettled: includeSettled === 'true' ? 1 : 0,
    });
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching settlement candidates', err);
    return res.status(500).json({ error: 'Failed to fetch settlement candidates' });
  }
});

router.get('/settlements/:id/items', async (req, res) => {
  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const settlementId = parsePositiveInt(req.params.id, null);
  if (!settlementId) {
    return res.status(400).json({ error: 'Invalid settlement id' });
  }

  const query = `
    SELECT
      id,
      settlement_id,
      queue_id,
      [เลขที่ใบกำกับ],
      amount_ex,
      created_at
    FROM [dbo].[Automation_Queue_Center_cost_Credit_Settlement_Item]
    WHERE settlement_id = @settlement_id
    ORDER BY id ASC
  `;

  try {
    const result = await executeQuery(queueDb, query, { settlement_id: settlementId });
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching settlement items', err);
    return res.status(500).json({ error: 'Failed to fetch settlement items' });
  }
});

router.get('/settlements', async (req, res) => {
  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const automateStatus = toSettlementAutomateStatusFilter(req.query.automate_status || req.query.status);

  const query = `
    SELECT
      id,
      [database_name],
      [สาขา],
      [รหัสลูกค้า],
      [ชื่อลูกค้า],
      rs_no,
      received_amount_ex,
      withholding_tax,
      fee,
      diff_debit,
      diff_credit,
      remark,
      automate_status,
      created_at
    FROM [dbo].[Automation_Queue_Center_cost_Credit_Settlement]
    WHERE automate_status = @automate_status
    ORDER BY created_at DESC
  `;

  try {
    const result = await executeQuery(queueDb, query, { automate_status: automateStatus });
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching settlements', err);
    return res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

router.post('/settlements', async (req, res) => {
  const queueDb = await resolveQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { header = {}, items = [] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required' });
  }

  const receivedAmountEx = parseNonNegativeNumber(header.received_amount_ex, null);
  const withholdingTax = parseNonNegativeNumber(header.withholding_tax, 0);
  const fee = parseNonNegativeNumber(header.fee, 0);
  const diffDebit = parseNonNegativeNumber(header.diff_debit, 0);
  const diffCredit = parseNonNegativeNumber(header.diff_credit, 0);
  if (receivedAmountEx == null || withholdingTax == null || fee == null || diffDebit == null || diffCredit == null) {
    return res.status(400).json({ error: 'Invalid numeric values in header' });
  }

  const cleanedItems = items.map((item) => ({
    queue_id: Number.parseInt(item.queue_id, 10),
    amount_ex: parseNonNegativeNumber(item.amount_ex, null),
  }));
  if (cleanedItems.some((item) => !Number.isInteger(item.queue_id) || item.queue_id <= 0 || item.amount_ex == null || item.amount_ex <= 0)) {
    return res.status(400).json({ error: 'Each item requires valid queue_id and amount_ex > 0' });
  }

  const totalAllocated = cleanedItems.reduce((sum, item) => sum + item.amount_ex, 0);
  if (totalAllocated > receivedAmountEx) {
    return res.status(400).json({ error: 'Allocated amount exceeds received_amount_ex' });
  }

  try {
    const idList = cleanedItems.map((item) => item.queue_id).join(',');
    const remainingQuery = `
      SELECT
        id,
        CASE WHEN [ยอดคงเหลือ] < 0 THEN 0 ELSE [ยอดคงเหลือ] END AS remaining_amount_ex
      FROM [dbo].[Automation_Queue_Center_cost_Credit]
      WHERE id IN (${idList})
    `;
    const remainingResult = await executeQuery(queueDb, remainingQuery);
    const remainingMap = new Map((remainingResult.recordset || []).map((row) => [row.id, Number(row.remaining_amount_ex) || 0]));

    const invalidItem = cleanedItems.find((item) => item.amount_ex > (remainingMap.get(item.queue_id) ?? 0));
    if (invalidItem) {
      return res.status(400).json({ error: `Allocation exceeds remaining amount for queue_id ${invalidItem.queue_id}` });
    }

    const rowMetaQuery = `
      SELECT
        [id],
        [database_name],
        [สาขา],
        [รหัสลูกค้า],
        [ชื่อลูกค้า],
        [เลขที่ใบกำกับ]
      FROM [dbo].[Automation_Queue_Center_cost_Credit]
      WHERE [id] IN (${idList})
    `;
    const rowMetaResult = await executeQuery(queueDb, rowMetaQuery);
    const rowMetaRows = rowMetaResult.recordset || [];
    const rowMetaById = new Map(rowMetaRows.map((r) => [r.id, r]));
    const settlementDatabaseName = pickUniqueValueOrMixed(rowMetaRows, 'database_name');
    const settlementBranch = pickUniqueValueOrMixed(rowMetaRows, 'สาขา');
    const settlementCustomerCode = pickUniqueValueOrMixed(rowMetaRows, 'รหัสลูกค้า');
    const settlementCustomerName = pickUniqueValueOrMixed(rowMetaRows, 'ชื่อลูกค้า');

    const insertHeaderQuery = `
      INSERT INTO [dbo].[Automation_Queue_Center_cost_Credit_Settlement]
      ([database_name], [สาขา], [รหัสลูกค้า], [ชื่อลูกค้า], rs_no, received_amount_ex, withholding_tax, fee, diff_debit, diff_credit, remark)
      VALUES (@database_name, @branch, @customer_code, @customer_name, @rs_no, @received_amount_ex, @withholding_tax, @fee, @diff_debit, @diff_credit, @remark);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
    `;
    const headerResult = await executeQuery(queueDb, insertHeaderQuery, {
      database_name: settlementDatabaseName,
      branch: settlementBranch,
      customer_code: settlementCustomerCode,
      customer_name: settlementCustomerName,
      rs_no: header.rs_no == null || header.rs_no === '' ? null : String(header.rs_no),
      received_amount_ex: receivedAmountEx,
      withholding_tax: withholdingTax,
      fee,
      diff_debit: diffDebit,
      diff_credit: diffCredit,
      remark: header.remark == null || header.remark === '' ? null : String(header.remark),
    });
    const settlementId = headerResult.recordset?.[0]?.id;
    if (!settlementId) {
      return res.status(500).json({ error: 'Failed to create settlement header' });
    }

    for (const item of cleanedItems) {
      const meta = rowMetaById.get(item.queue_id);
      const invoiceNo = meta?.['เลขที่ใบกำกับ'] ?? null;
      await executeQuery(
        queueDb,
        `INSERT INTO [dbo].[Automation_Queue_Center_cost_Credit_Settlement_Item] (settlement_id, queue_id, [เลขที่ใบกำกับ], amount_ex) VALUES (@settlement_id, @queue_id, @invoice_no, @amount_ex)`,
        {
          settlement_id: settlementId,
          queue_id: item.queue_id,
          invoice_no: invoiceNo == null || invoiceNo === '' ? null : String(invoiceNo),
          amount_ex: item.amount_ex,
        },
      );
      // sync ยอดตัดแล้ว back to queue table (ยอดคงเหลือ is a computed persisted column)
      await executeQuery(
        queueDb,
        `UPDATE [dbo].[Automation_Queue_Center_cost_Credit]
         SET [ยอดตัดแล้ว] = (
           SELECT ISNULL(SUM(amount_ex), 0)
           FROM [dbo].[Automation_Queue_Center_cost_Credit_Settlement_Item]
           WHERE queue_id = @queue_id
         ),
         updated_at = GETDATE()
         WHERE id = @queue_id`,
        { queue_id: item.queue_id },
      );
    }

    return res.json({
      success: true,
      settlement_id: settlementId,
      item_count: cleanedItems.length,
      total_allocated: totalAllocated,
    });
  } catch (err) {
    console.error('Error creating settlement', err);
    return res.status(500).json({ error: 'Failed to create settlement' });
  }
});

module.exports = router;
