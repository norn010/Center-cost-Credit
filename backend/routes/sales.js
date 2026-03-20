const express = require('express');
const { executeQuery, getAvailableDatabases } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const {
    database,
    branch = null,
    startDate = null,
    endDate = null,
    docNo = null,
  } = req.query;

  if (!database) {
    return res.status(400).json({ error: 'database is required' });
  }

  const allowed = getAvailableDatabases().map((d) => d.id);
  if (!allowed.includes(database)) {
    return res.status(400).json({ error: `Unsupported database: ${database}` });
  }

  const query = `
    SELECT TOP (100000)
      *
    FROM [dbo].[vw_SALES_CREDIT_RETURN]
    WHERE
      (@branch IS NULL OR [สาขา] = @branch)
      AND (@startDate IS NULL OR [วันที่ใบกำกับ] >= @startDate)
      AND (@endDate IS NULL OR [วันที่ใบกำกับ] <= @endDate)
      AND (@docNo IS NULL OR [เลขที่เอกสาร] LIKE '%' + @docNo + '%')
    ORDER BY [วันที่ใบกำกับ] DESC
  `;

  const params = {
    branch: branch || null,
    startDate: startDate || null,
    endDate: endDate || null,
    docNo: docNo || null,
  };

  try {
    const result = await executeQuery(database, query, params);
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching sales data', err);
    return res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

module.exports = router;
