-- Database = Spare_Credit, Table = Automation_Queue_Spare_Credit
-- 1) สร้าง database ก่อน (รันใน master หรือ context อื่น):
--    CREATE DATABASE [Spare_Credit];
-- 2) เปิดใช้ database Spare_Credit แล้วรันสคริปต์ด้านล่าง

USE [Spare_Credit];
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Automation_Queue_Spare_Credit')
BEGIN
  CREATE TABLE [dbo].[Automation_Queue_Spare_Credit] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    database_name NVARCHAR(50) NOT NULL,
    [Exp_ID] NVARCHAR(100) NULL,

    -- ข้อมูลจากใบกำกับ / ใบเบิก
    [เลขที่ใบกำกับ] NVARCHAR(255) NOT NULL,
    [เลขที่ใบเบิก] NVARCHAR(255) NULL,
    [สาขา] NVARCHAR(255) NULL,
    [วันที่ใบกำกับ] DATETIME NULL,

    -- ลูกค้า
    [รหัสลูกค้า] NVARCHAR(255) NULL,
    [ชื่อลูกค้า] NVARCHAR(255) NULL,

    -- ตัวเลขทางการเงินจาก view
    [ราคารวม]        DECIMAL(18,2) NULL,
    [ยอดคงเหลือ]     DECIMAL(18,2) NULL,
    [ส่วนลด]         DECIMAL(18,2) NULL,
    [ภาษีมูลค่าเพิ่ม] DECIMAL(18,2) NULL,
    [ยอดสุทธิ]       DECIMAL(18,2) NULL,
    [ต้นทุนรวม]      DECIMAL(18,2) NULL,
    [กำไร]           DECIMAL(18,2) NULL,
    [เงินมัดจำสุทธิ] DECIMAL(18,2) NULL,
    [ภาษีเงินมัดจำ]  DECIMAL(18,2) NULL,
    [เงินมัดจำรวม]   DECIMAL(18,2) NULL,
    [ยอดรวมทั้งหมด]  DECIMAL(18,2) NULL,

    -- สถานะเอกสาร
    [สถานะ] NVARCHAR(50) NULL,
    [ประเภทเอกสาร] NVARCHAR(255) NULL,

    -- ข้อมูลเพิ่มเติมที่ให้ผู้ใช้กรอกในภายหลัง
    [ประเภท] NVARCHAR(255) NULL,
    [BankStatement] NVARCHAR(50) NULL,
    [ส่งBP] NVARCHAR(50) NULL,
    [หมายเหตุ] NVARCHAR(MAX) NULL,
    [หักค่าธรรมเนียม] DECIMAL(18,2) NULL,
    [ส่วนต่างเดบิต] DECIMAL(18,2) NULL,
    [ส่วนต่างเครดิต] DECIMAL(18,2) NULL,

    -- การทำงานของ automation
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    automate_status NVARCHAR(50) NOT NULL DEFAULT N'กำลัง automate'
  );
END
GO

-- ถ้าตารางมีอยู่แล้ว ให้รันคำสั่งด้านล่างเพื่อเพิ่มคอลัมน์ ส่งBP และ หมายเหตุ
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Automation_Queue_Spare_Credit')
BEGIN
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Spare_Credit') AND name = N'ส่งBP')
    ALTER TABLE [dbo].[Automation_Queue_Spare_Credit] ADD [ส่งBP] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Spare_Credit') AND name = N'หมายเหตุ')
    ALTER TABLE [dbo].[Automation_Queue_Spare_Credit] ADD [หมายเหตุ] NVARCHAR(MAX) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Spare_Credit') AND name = 'Exp_ID')
    ALTER TABLE [dbo].[Automation_Queue_Spare_Credit] ADD [Exp_ID] NVARCHAR(100) NULL;
END
GO
