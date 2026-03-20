-- Database = Spare_Credit
-- Tables: reconcile_batch, reconcile_detail

USE [Spare_Credit];
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reconcile_batch')
BEGIN
  CREATE TABLE [dbo].[reconcile_batch] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    database_name NVARCHAR(50) NOT NULL,
    [branch] NVARCHAR(50) NULL,
    [รหัสลูกค้า] NVARCHAR(255) NULL,
    bank_account NVARCHAR(255) NULL,
    bank_account_name NVARCHAR(255) NULL,
    ar_account NVARCHAR(255) NULL,
    ar_account_name NVARCHAR(255) NULL,
    fee_account NVARCHAR(255) NULL,
    fee_account_name NVARCHAR(255) NULL,
    diff_account NVARCHAR(255) NULL,
    diff_account_name NVARCHAR(255) NULL,
    rs_docno NVARCHAR(100) NOT NULL,
    fee DECIMAL(18,2) NULL,
    diff_debit DECIMAL(18,2) NULL,
    diff_credit DECIMAL(18,2) NULL,
    [ยอดรวมสุทธิ] DECIMAL(18,2) NULL,
    bank_statement NVARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ถ้าตารางมีอยู่แล้ว ให้รันเพื่อเพิ่มคอลัมน์ รหัสลูกค้า
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'reconcile_batch')
BEGIN
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = N'รหัสลูกค้า')
    ALTER TABLE [dbo].[reconcile_batch] ADD [รหัสลูกค้า] NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = 'bank_account')
    ALTER TABLE [dbo].[reconcile_batch] ADD bank_account NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = 'bank_account_name')
    ALTER TABLE [dbo].[reconcile_batch] ADD bank_account_name NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = 'ar_account')
    ALTER TABLE [dbo].[reconcile_batch] ADD ar_account NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = 'ar_account_name')
    ALTER TABLE [dbo].[reconcile_batch] ADD ar_account_name NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = 'fee_account')
    ALTER TABLE [dbo].[reconcile_batch] ADD fee_account NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = 'fee_account_name')
    ALTER TABLE [dbo].[reconcile_batch] ADD fee_account_name NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = 'diff_account')
    ALTER TABLE [dbo].[reconcile_batch] ADD diff_account NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = 'diff_account_name')
    ALTER TABLE [dbo].[reconcile_batch] ADD diff_account_name NVARCHAR(255) NULL;
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reconcile_batch') AND name = N'ยอดรวมสุทธิ')
    ALTER TABLE [dbo].[reconcile_batch] ADD [ยอดรวมสุทธิ] DECIMAL(18,2) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reconcile_detail')
BEGIN
  CREATE TABLE [dbo].[reconcile_detail] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    batch_id INT NOT NULL,
    queue_id INT NOT NULL,
    invoice_no NVARCHAR(255) NULL,
    pk_no NVARCHAR(255) NULL,
    amount DECIMAL(18,2) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_reconcile_detail_batch FOREIGN KEY (batch_id) REFERENCES [dbo].[reconcile_batch](id)
  );
END
GO
