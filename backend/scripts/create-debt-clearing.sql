-- Database = Spare_Credit, Table = Debt_Clearing
-- รันใน database Spare_Credit (ใช้ร่วมกับ Automation_Queue_Spare_Credit)

USE [Spare_Credit];
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Debt_Clearing')
BEGIN
  CREATE TABLE [dbo].[Debt_Clearing] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    database_name NVARCHAR(50) NOT NULL,
    [Exp_ID] NVARCHAR(100) NULL,
    [เลขที่ใบกำกับ] NVARCHAR(255) NOT NULL,
    [เลขที่ใบเบิก] NVARCHAR(255) NULL,
    [สาขา] NVARCHAR(255) NULL,
    [วันที่ใบกำกับ] DATETIME NULL,
    [รหัสลูกค้า] NVARCHAR(255) NULL,
    [ชื่อลูกค้า] NVARCHAR(255) NULL,
    [ยอดสุทธิ] DECIMAL(18,2) NULL,
    [ต้นทุนรวม] DECIMAL(18,2) NULL,
    [ประเภท] NVARCHAR(255) NULL,
    [BankStatement] NVARCHAR(50) NULL,
    [ส่งBP] NVARCHAR(50) NULL,
    [หมายเหตุ] NVARCHAR(MAX) NULL,
    [หักค่าธรรมเนียม] DECIMAL(18,2) NULL,
    [ส่วนต่างเดบิต] DECIMAL(18,2) NULL,
    [ส่วนต่างเครดิต] DECIMAL(18,2) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ถ้าตารางมีอยู่แล้ว ให้รันคำสั่งด้านล่างเพื่อเพิ่มคอลัมน์ Exp_ID
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Debt_Clearing')
BEGIN
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Debt_Clearing') AND name = 'Exp_ID')
    ALTER TABLE [dbo].[Debt_Clearing] ADD [Exp_ID] NVARCHAR(100) NULL;
END
GO
