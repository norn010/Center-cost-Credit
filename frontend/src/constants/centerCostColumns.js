export const CENTER_COST_FIELDS = [
  { key: 'database_name', type: 'text' },
  { key: 'สาขา', type: 'text' },
  { key: 'เลขที่JOB', type: 'text' },
  { key: 'เลขที่ใบกำกับ', type: 'text' },
  { key: 'วันที่ใบกำกับ', type: 'date' },
  { key: 'วันที่JOB', type: 'date' },
  { key: 'ประเภทใบงาน', type: 'text' },
  { key: 'รหัสลูกค้า', type: 'text' },
  { key: 'ชื่อลูกค้า', type: 'text' },
  { key: 'รุ่นรถ', type: 'text' },
  { key: 'เลขตัวถังรถ', type: 'text' },
  { key: 'เลขกิโลเมตร', type: 'number' },
  { key: 'รหัสแคมเปญ', type: 'text' },
  { key: 'สถานะJOB', type: 'text' },
  { key: 'ประเภทการชำระเงิน', type: 'text' },
  { key: 'เลขทะเบียน', type: 'text' },
  { key: 'การเคลม', type: 'text' },
  { key: 'ประเภทภาษี', type: 'text' },
  { key: 'อัตราภาษี', type: 'number' },
  { key: 'ประเภทการเคลม', type: 'text' },
  { key: 'มูลค่าบริการ', type: 'currency' },
  { key: 'มูลค่าน้ำมัน', type: 'currency' },
  { key: 'มูลค่าค่าใช้จ่ายนอก', type: 'currency' },
  { key: 'มูลค่าค่าใช้จ่ายภายใน', type: 'currency' },
  { key: 'มูลค่าอะไหล่', type: 'currency' },
  { key: 'มูลค่ารวม', type: 'currency' },
  { key: 'มูลค่ารวมVat', type: 'currency' },
  { key: 'ต้นทุนบริการ', type: 'currency' },
  { key: 'ต้นทุนน้ำมัน', type: 'currency' },
  { key: 'ต้นทุนค่าใช้จ่ายนอก', type: 'currency' },
  { key: 'ต้นทุนค่าใช้จ่ายภายใน', type: 'currency' },
  { key: 'ต้นทุนอะไหล่', type: 'currency' },
  { key: 'ต้นทุนรวม', type: 'currency' },
  { key: 'กำไรบริการ', type: 'currency' },
  { key: 'กำไรน้ำมัน', type: 'currency' },
  { key: 'กำไรค่าใช้จ่ายนอก', type: 'currency' },
  { key: 'กำไรค่าใช้จ่ายภายใน', type: 'currency' },
  { key: 'กำไรอะไหล่', type: 'currency' },
  { key: 'กำไรรวม', type: 'currency' },
  { key: 'ประเภทเอกสาร', type: 'text' },
  { key: 'คำอธิบายเอกสาร', type: 'text' },
];

export function isNumericField(type) {
  return type === 'number' || type === 'currency';
}

export function formatCenterCostValue(type, value) {
  if (value == null || value === '') return '';
  if (type === 'date') {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  }
  if (type === 'number' || type === 'currency') {
    const num = Number(value);
    if (Number.isNaN(num)) return '';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return String(value);
}
