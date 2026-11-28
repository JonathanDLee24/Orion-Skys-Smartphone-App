import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Placeholder receipt store until the document backend exists. Every function
// the screen uses is async and keyed by dossier id, so swapping these bodies
// for API calls should not require changes to PaymentReceiptScreen.

export const RECEIPT_AUDIT_ACTIONS = {
  REPLACED: 'REPLACED',
  REMOVED: 'REMOVED',
};

// Who is recorded in the audit log until admin sessions carry a real identity.
export const DEFAULT_RECEIPT_ACTOR = 'Admin';

const PLACEHOLDER_RECEIPT = {
  id: 'receipt-staging-downpayment',
  title: 'Staging Downpayment',
  fileName: 'TXN_SKY_99218_RECEIPT.pdf',
  fileUri: null,
  transactionId: 'TXN_SKY_99218',
  amount: 12450,
  currency: 'USD',
  paymentMethod: 'Wire Transfer',
  payer: { name: 'Sarah Chen', role: 'Client' },
  paidAt: '2026-11-10T17:30:00Z',
};

const receiptsByDossier = new Map();
const auditLogsByDossier = new Map();

function ensureDossier(dossierId) {
  if (!receiptsByDossier.has(dossierId)) receiptsByDossier.set(dossierId, { ...PLACEHOLDER_RECEIPT });
  if (!auditLogsByDossier.has(dossierId)) auditLogsByDossier.set(dossierId, []);
}

function copyReceipt(receipt) {
  return receipt ? { ...receipt, payer: { ...receipt.payer } } : null;
}

function copyAuditEntry(entry) {
  return { ...entry, archivedReceipt: copyReceipt(entry.archivedReceipt) };
}

function recordAudit(dossierId, entry) {
  const log = auditLogsByDossier.get(dossierId);
  const saved = { id: `audit-${dossierId}-${log.length + 1}`, ...entry };
  log.unshift(saved);
  return saved;
}

// Test helper: drop all in-memory receipts and audit entries.
export function clearPaymentReceiptsSession() {
  receiptsByDossier.clear();
  auditLogsByDossier.clear();
}

// Returns the receipt attached to the dossier, or null once it has been removed.
export async function fetchDossierReceipt(dossierId) {
  ensureDossier(dossierId);
  return copyReceipt(receiptsByDossier.get(dossierId));
}

// Newest entry first. Each replace/remove entry keeps `archivedReceipt`, a copy
// of the receipt that stopped being active, so its PDF stays downloadable.
export async function fetchReceiptAuditLog(dossierId) {
  ensureDossier(dossierId);
  return auditLogsByDossier.get(dossierId).map(copyAuditEntry);
}

// Swaps the attached file. The financial record stays with the dossier; only
// the document changes.
export async function replaceDossierReceipt(dossierId, file, { actor = DEFAULT_RECEIPT_ACTOR, at = new Date() } = {}) {
  if (!file?.name) throw new Error('Choose a PDF receipt to attach.');
  ensureDossier(dossierId);
  // After a removal there is no current receipt; re-attach against the
  // dossier's placeholder financial record.
  const current = receiptsByDossier.get(dossierId);
  const updated = { ...(current || PLACEHOLDER_RECEIPT), fileName: file.name, fileUri: file.uri || null };
  receiptsByDossier.set(dossierId, updated);
  recordAudit(dossierId, {
    action: RECEIPT_AUDIT_ACTIONS.REPLACED,
    actor,
    at: at.toISOString(),
    fileName: file.name,
    previousFileName: current ? current.fileName : null,
    archivedReceipt: copyReceipt(current),
  });
  return copyReceipt(updated);
}

export async function removeDossierReceipt(dossierId, { actor = DEFAULT_RECEIPT_ACTOR, at = new Date() } = {}) {
  ensureDossier(dossierId);
  const current = receiptsByDossier.get(dossierId);
  if (!current) throw new Error('There is no receipt attached to this dossier.');
  receiptsByDossier.set(dossierId, null);
  recordAudit(dossierId, {
    action: RECEIPT_AUDIT_ACTIONS.REMOVED,
    actor,
    at: at.toISOString(),
    fileName: current.fileName,
    previousFileName: current.fileName,
    archivedReceipt: copyReceipt(current),
  });
  return null;
}

// Downloads the inactive copy kept on an audit entry.
export async function downloadArchivedReceiptPdf(dossier, auditEntryId) {
  ensureDossier(dossier.id);
  const entry = auditLogsByDossier.get(dossier.id).find((item) => item.id === auditEntryId);
  if (!entry?.archivedReceipt) throw new Error('That audit entry has no archived receipt.');
  await downloadReceiptPdf(entry.archivedReceipt, dossier);
}

export function formatReceiptAmount(amount, currency = 'USD') {
  const value = Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$${value} ${currency}`;
}

export function describeAuditEntry(entry) {
  if (entry.action === RECEIPT_AUDIT_ACTIONS.REMOVED) return `Removed ${entry.fileName}`;
  if (entry.previousFileName) return `Replaced ${entry.previousFileName} with ${entry.fileName}`;
  return `Attached ${entry.fileName}`;
}

// PDF text strings only take printable ASCII; parentheses and backslashes
// must be escaped.
function pdfText(value) {
  return String(value ?? '').replace(/[^\x20-\x7E]/g, '').replace(/([\\()])/g, '\\$1');
}

// Placeholder until the backend stores the real receipt file: a one-page PDF
// built from the receipt record, so preview and download show real content.
export function buildReceiptPdf(receipt, dossier = {}) {
  const left = 72;
  const valueX = 250;
  const ops = [];
  const text = (x, y, size, font, value) => ops.push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`);
  const rule = (y) => ops.push(`0.8 G 1 w ${left} ${y} m 540 ${y} l S 0 G`);

  text(left, 720, 10, 'F2', 'ORION SKYS DRONES');
  text(left, 690, 22, 'F2', 'PAYMENT RECEIPT');
  text(left, 664, 14, 'F1', receipt.title);
  rule(645);

  const rows = [
    ['Dossier', dossier.id],
    ['Event', dossier.event],
    ['Transaction ID', receipt.transactionId],
    ['Payment method', receipt.paymentMethod],
    ['Payer', receipt.payer ? `${receipt.payer.name} (${receipt.payer.role})` : ''],
    ['Date paid', receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''],
  ].filter(([, value]) => value);
  let y = 615;
  rows.forEach(([label, value]) => {
    text(left, y, 11, 'F1', label);
    text(valueX, y, 11, 'F2', value);
    y -= 24;
  });

  rule(y + 6);
  text(left, y - 22, 13, 'F2', 'Amount paid');
  text(valueX, y - 22, 16, 'F2', formatReceiptAmount(receipt.amount, receipt.currency));

  const stream = ops.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

// Web only: a URL an <iframe> or link can load. Call revoke() when finished.
// A picked replacement file is used as-is; otherwise the placeholder PDF is built.
export function createReceiptPdfUrl(receipt, dossier) {
  if (receipt.fileUri) return { url: receipt.fileUri, revoke: () => {} };
  const url = URL.createObjectURL(new Blob([buildReceiptPdf(receipt, dossier)], { type: 'application/pdf' }));
  return { url, revoke: () => URL.revokeObjectURL(url) };
}

// Saves the receipt PDF to the device.
export async function downloadReceiptPdf(receipt, dossier) {
  if (!receipt) throw new Error('There is no receipt to download.');
  const { fileName } = receipt;

  if (Platform.OS === 'web') {
    const { url, revoke } = createReceiptPdfUrl(receipt, dossier);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    revoke();
    return;
  }

  let uri = receipt.fileUri;
  if (!uri) {
    const file = new File(Paths.cache, fileName);
    file.write(buildReceiptPdf(receipt, dossier));
    uri = file.uri;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('Saving files is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: fileName });
}
