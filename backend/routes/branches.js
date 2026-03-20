const express = require('express');
const { executeQuery, getAvailableDatabases } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const { database, startDate = null, endDate = null } = req.query;

  if (!database) {
    return res.status(400).json({ error: 'database is required' });
  }

  const allowed = getAvailableDatabases().map((d) => d.id);
  if (!allowed.includes(database)) {
    return res.status(400).json({ error: `Unsupported database: ${database}` });
  }

  const query = `
    SELECT DISTINCT [สาขา]
    FROM [dbo].[vw_SALES_CREDIT_RETURN]
    WHERE
      [สาขา] IS NOT NULL
      AND [สาขา] <> ''
      AND (@startDate IS NULL OR [วันที่ใบกำกับ] >= @startDate)
      AND (@endDate IS NULL OR [วันที่ใบกำกับ] <= @endDate)
    ORDER BY [สาขา]
  `;

  const params = {
    startDate: startDate || null,
    endDate: endDate || null,
  };

  try {
    const result = await executeQuery(database, query, params);
    const branches = (result.recordset || []).map((row) => row['สาขา']);
    return res.json(branches);
  } catch (err) {
    console.error('Error fetching branches', err);
    return res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

module.exports = router;
