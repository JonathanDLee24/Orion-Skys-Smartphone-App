// Stand-in for GET /api/authorizations/:id/credential-profile until the backend exists.
export const DEFAULT_CREDENTIAL_PROFILE = {
  signerName: 'Jordan Matthews',
  title: 'Director of Operations',
  company: 'Northstar Logistics, Inc.',
  verifiedAt: '2026-11-06T14:30:00.000Z',
};

export const SIGNATURE_MODES = ['draw', 'keypad'];

// Session-only store. Replace submitSignature with POST /api/authorizations/:id/signature
// when the backend exists; the record shape below is the intended request body.
export const signOffSession = {
  signatures: [],
};

export function getCredentialProfile(profile) {
  if (!profile) return { ...DEFAULT_CREDENTIAL_PROFILE };
  return {
    signerName: String(profile.signerName ?? '').trim(),
    title: String(profile.title ?? '').trim(),
    company: String(profile.company ?? '').trim(),
    verifiedAt: profile.verifiedAt,
  };
}

export function formatVerificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? '');
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatSignatureTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? '');
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function countPoints(strokes = []) {
  return strokes.reduce((total, stroke) => total + (Array.isArray(stroke) ? stroke.length : 0), 0);
}

// Serializes touch points into an SVG path so a signature can be stored or replayed
// without shipping a bitmap.
export function describeStrokes(strokes = []) {
  return strokes
    .filter((stroke) => Array.isArray(stroke) && stroke.length > 0)
    .map((stroke) => stroke
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${Number(point.x).toFixed(1)},${Number(point.y).toFixed(1)}`)
      .join(' '))
    .join(' ');
}

export function hasSignature({ mode = 'draw', strokes = [], typedName = '' } = {}) {
  if (mode === 'keypad') return String(typedName ?? '').trim().length > 0;
  return countPoints(strokes) > 0;
}

export function signatureErrorMessage(mode) {
  return mode === 'keypad'
    ? 'Enter your full legal name before submitting.'
    : 'Please draw your signature before submitting.';
}

export function buildSignatureRecord({ profile, mode = 'draw', strokes = [], typedName = '', timestamp = new Date().toISOString() }) {
  if (!SIGNATURE_MODES.includes(mode)) throw new Error('Choose a signature method before submitting.');
  if (!hasSignature({ mode, strokes, typedName })) throw new Error(signatureErrorMessage(mode));

  const credential = getCredentialProfile(profile);
  if (!credential.signerName || !credential.company) throw new Error('The credential profile is incomplete. Contact your administrator.');

  const drawn = mode === 'draw';
  const record = {
    id: `sig_${Date.now()}_${signOffSession.signatures.length + 1}`,
    signerName: credential.signerName,
    title: credential.title,
    company: credential.company,
    verificationDate: credential.verifiedAt,
    signatureType: mode,
    signaturePath: drawn ? describeStrokes(strokes) : '',
    signatureText: drawn ? '' : String(typedName).trim(),
    pointCount: drawn ? countPoints(strokes) : 0,
    timestamp,
    status: 'signed',
  };
  return record;
}

export async function submitSignature(input) {
  const record = buildSignatureRecord(input);
  signOffSession.signatures.push(record);
  return { ...record };
}

export function getSignature(id) {
  const record = signOffSession.signatures.find((signature) => signature.id === id);
  return record ? { ...record } : null;
}

export function getLatestSignature() {
  const record = signOffSession.signatures[signOffSession.signatures.length - 1];
  return record ? { ...record } : null;
}

export function clearSignOffSession() {
  signOffSession.signatures.length = 0;
}
