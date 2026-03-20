const express = require('express');
const { sql, runInDatabase, getQueueDatabaseName } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { database, rows } = req.body;

  if (!database || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'database and rows are required' });
  }

  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  try {
    await runInDatabase(queueDb, async (request) => {
      const table = new sql.Table('Automation_Queue_Spare_Credit');
      table.create = false;
      table.columns.add('database_name', sql.NVarChar(50), { nullable: false });
      table.columns.add('เลขที่ใบกำกับ', sql.NVarChar(255), { nullable: false });
      table.columns.add('เลขที่ใบเบิก', sql.NVarChar(255), { nullable: true });
      table.columns.add('สาขา', sql.NVarChar(255), { nullable: true });
      table.columns.add('วันที่ใบกำกับ', sql.DateTime, { nullable: true });
      table.columns.add('รหัสลูกค้า', sql.NVarChar(255), { nullable: true });
      table.columns.add('ชื่อลูกค้า', sql.NVarChar(255), { nullable: true });

      table.columns.add('ราคารวม', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ยอดคงเหลือ', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ส่วนลด', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ภาษีมูลค่าเพิ่ม', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ยอดสุทธิ', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ต้นทุนรวม', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('กำไร', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('เงินมัดจำสุทธิ', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ภาษีเงินมัดจำ', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('เงินมัดจำรวม', sql.Decimal(18, 2), { nullable: true });
      table.columns.add('ยอดรวมทั้งหมด', sql.Decimal(18, 2), { nullable: true });

      table.columns.add('สถานะ', sql.NVarChar(50), { nullable: true });
      table.columns.add('ประเภทเอกสาร', sql.NVarChar(255), { nullable: true });

      table.columns.add('automate_status', sql.NVarChar(50), { nullable: false });

      rows.forEach((row) => {
        table.rows.add(
          database,
          row['เลขที่เอกสาร'] || null, // แมปเข้า เลขที่ใบกำกับ
          row['เลขที่PK'] || null, // แมปเข้า เลขที่ใบเบิก
          row['สาขา'] || null,
          row['วันที่ใบกำกับ'] || null,
          row['รหัสลูกค้า'] || null,
          row['ชื่อลูกค้า'] || null,

          row['ราคารวม'] != null ? Number(row['ราคารวม']) : null,
          row['ยอดคงเหลือ'] != null ? Number(row['ยอดคงเหลือ']) : null,
          row['ส่วนลด'] != null ? Number(row['ส่วนลด']) : null,
          row['ภาษีมูลค่าเพิ่ม'] != null ? Number(row['ภาษีมูลค่าเพิ่ม']) : null,
          row['ยอดสุทธิ'] != null ? Number(row['ยอดสุทธิ']) : null,
          row['ต้นทุนรวม'] != null ? Number(row['ต้นทุนรวม']) : null,
          row['กำไร'] != null ? Number(row['กำไร']) : null,
          row['เงินมัดจำสุทธิ'] != null ? Number(row['เงินมัดจำสุทธิ']) : null,
          row['ภาษีเงินมัดจำ'] != null ? Number(row['ภาษีเงินมัดจำ']) : null,
          row['เงินมัดจำรวม'] != null ? Number(row['เงินมัดจำรวม']) : null,
          row['ยอดรวมทั้งหมด'] != null ? Number(row['ยอดรวมทั้งหมด']) : null,

          row['สถานะ'] || null,
          row['ประเภทเอกสาร'] || null,

          'กำลัง automate',
        );
      });

      await request.bulk(table);
    });

    return res.json({ success: true, inserted: rows.length });
  } catch (err) {
    console.error('Error inserting into Automation_Queue_Spare_Credit', err);
    const message =
      process.env.NODE_ENV === 'development' ? err.message : 'Failed to queue automation';
    return res.status(500).json({ error: 'Failed to send records to automation queue.', detail: message });
  }
});

module.exports = router;
