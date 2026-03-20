USE [Center_cost_Credit];
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Automation_Queue_Center_cost_Credit')
BEGIN
  CREATE TABLE [dbo].[Automation_Queue_Center_cost_Credit] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    [database_name] NVARCHAR(100) NOT NULL,

    [สาขา] NVARCHAR(255) NULL,
    [เลขที่JOB] NVARCHAR(255) NULL,
    [เลขที่ใบกำกับ] NVARCHAR(255) NULL,
    [วันที่ใบกำกับ] DATETIME2 NULL,
    [วันที่JOB] DATETIME2 NULL,
    [ประเภทใบงาน] NVARCHAR(255) NULL,
    [รหัสลูกค้า] NVARCHAR(255) NULL,
    [ชื่อลูกค้า] NVARCHAR(255) NULL,
    [รุ่นรถ] NVARCHAR(255) NULL,
    [เลขตัวถังรถ] NVARCHAR(255) NULL,
    [เลขกิโลเมตร] DECIMAL(18,2) NULL,
    [รหัสแคมเปญ] NVARCHAR(255) NULL,
    [สถานะJOB] NVARCHAR(255) NULL,
    [ประเภทการชำระเงิน] NVARCHAR(255) NULL,
    [เลขทะเบียน] NVARCHAR(255) NULL,
    [การเคลม] NVARCHAR(255) NULL,
    [ประเภทภาษี] NVARCHAR(255) NULL,
    [อัตราภาษี] DECIMAL(18,2) NULL,
    [ประเภทการเคลม] NVARCHAR(255) NULL,
    [มูลค่าบริการ] DECIMAL(18,2) NULL,
    [มูลค่าน้ำมัน] DECIMAL(18,2) NULL,
    [มูลค่าค่าใช้จ่ายนอก] DECIMAL(18,2) NULL,
    [มูลค่าค่าใช้จ่ายภายใน] DECIMAL(18,2) NULL,
    [มูลค่าอะไหล่] DECIMAL(18,2) NULL,
    [มูลค่ารวม] DECIMAL(18,2) NULL,
    [ต้นทุนบริการ] DECIMAL(18,2) NULL,
    [ต้นทุนน้ำมัน] DECIMAL(18,2) NULL,
    [ต้นทุนค่าใช้จ่ายนอก] DECIMAL(18,2) NULL,
    [ต้นทุนค่าใช้จ่ายภายใน] DECIMAL(18,2) NULL,
    [ต้นทุนอะไหล่] DECIMAL(18,2) NULL,
    [ต้นทุนรวม] DECIMAL(18,2) NULL,
    [กำไรบริการ] DECIMAL(18,2) NULL,
    [กำไรน้ำมัน] DECIMAL(18,2) NULL,
    [กำไรค่าใช้จ่ายนอก] DECIMAL(18,2) NULL,
    [กำไรค่าใช้จ่ายภายใน] DECIMAL(18,2) NULL,
    [กำไรอะไหล่] DECIMAL(18,2) NULL,
    [กำไรรวม] DECIMAL(18,2) NULL,
    [ประเภทเอกสาร] NVARCHAR(255) NULL,
    [คำอธิบายเอกสาร] NVARCHAR(MAX) NULL,

    [มูลค่ารวมVat] DECIMAL(18,2) NULL,
    [ยอดตัดแล้ว] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [ยอดคงเหลือ] AS (ISNULL([มูลค่ารวมVat], 0) - [ยอดตัดแล้ว]) PERSISTED,
    [ส่งBP] NVARCHAR(50) NULL,
    [หมายเหตุ] NVARCHAR(MAX) NULL,

    automate_status NVARCHAR(50) NOT NULL DEFAULT N'กำลัง automate',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Automation_Queue_Center_cost_Credit_Settlement')
BEGIN
  CREATE TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    [database_name] NVARCHAR(100) NULL,
    [สาขา] NVARCHAR(255) NULL,
    [รหัสลูกค้า] NVARCHAR(255) NULL,
    [ชื่อลูกค้า] NVARCHAR(255) NULL,
    rs_no NVARCHAR(100) NULL,
    received_amount_ex DECIMAL(18,2) NOT NULL,
    withholding_tax DECIMAL(18,2) NULL,
    fee DECIMAL(18,2) NULL,
    diff_debit DECIMAL(18,2) NULL,
    diff_credit DECIMAL(18,2) NULL,
    remark NVARCHAR(MAX) NULL,
    automate_status NVARCHAR(50) NOT NULL DEFAULT N'กำลัง automate',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Automation_Queue_Center_cost_Credit_Settlement')
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit_Settlement')
      AND name = N'database_name'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement]
    ADD [database_name] NVARCHAR(100) NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit_Settlement')
      AND name = N'สาขา'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement]
    ADD [สาขา] NVARCHAR(255) NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit_Settlement')
      AND name = N'รหัสลูกค้า'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement]
    ADD [รหัสลูกค้า] NVARCHAR(255) NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit_Settlement')
      AND name = N'ชื่อลูกค้า'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement]
    ADD [ชื่อลูกค้า] NVARCHAR(255) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Automation_Queue_Center_cost_Credit_Settlement_Item')
BEGIN
  CREATE TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement_Item] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    settlement_id INT NOT NULL,
    queue_id INT NOT NULL,
    [เลขที่ใบกำกับ] NVARCHAR(255) NULL,
    amount_ex DECIMAL(18,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_CC_SettlementItem_Settlement
      FOREIGN KEY (settlement_id) REFERENCES [dbo].[Automation_Queue_Center_cost_Credit_Settlement](id),
    CONSTRAINT FK_CC_SettlementItem_Queue
      FOREIGN KEY (queue_id) REFERENCES [dbo].[Automation_Queue_Center_cost_Credit](id)
  );
END
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Automation_Queue_Center_cost_Credit')
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit')
      AND name = 'database_name'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit]
    ADD [database_name] NVARCHAR(100) NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit')
      AND name = N'มูลค่ารวมVat'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit]
    ADD [มูลค่ารวมVat] DECIMAL(18,2) NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit')
      AND name = N'ส่งBP'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit]
    ADD [ส่งBP] NVARCHAR(50) NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit')
      AND name = N'หมายเหตุ'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit]
    ADD [หมายเหตุ] NVARCHAR(MAX) NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit')
      AND name = N'ยอดตัดแล้ว'
  )
    EXEC('ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit] ADD [ยอดตัดแล้ว] DECIMAL(18,2) NOT NULL DEFAULT 0');

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit')
      AND name = N'ยอดคงเหลือ'
  )
    EXEC('ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit] ADD [ยอดคงเหลือ] AS (ISNULL([มูลค่ารวมVat], 0) - [ยอดตัดแล้ว]) PERSISTED');
END
GO

-- Add rs_no and automate_status to Settlement table if not exists
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Automation_Queue_Center_cost_Credit_Settlement')
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit_Settlement')
      AND name = 'rs_no'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement]
    ADD rs_no NVARCHAR(100) NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit_Settlement')
      AND name = 'automate_status'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement]
    ADD automate_status NVARCHAR(50) NOT NULL DEFAULT N'กำลัง automate';
END
GO

-- Add เลขที่ใบกำกับ to Settlement_Item table if not exists
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Automation_Queue_Center_cost_Credit_Settlement_Item')
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Automation_Queue_Center_cost_Credit_Settlement_Item')
      AND name = N'เลขที่ใบกำกับ'
  )
    ALTER TABLE [dbo].[Automation_Queue_Center_cost_Credit_Settlement_Item]
    ADD [เลขที่ใบกำกับ] NVARCHAR(255) NULL;
END
GO
