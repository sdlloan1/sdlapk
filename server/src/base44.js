// Read-only link to the Base44 app that powers the website.
// Calls `<BASE44_API_URL>/entities/<Entity>` with an `api_key` header (see the SDL OpenAPI spec).

const DEFAULT_API_URL = 'https://shubhdhanlakshmi-beta-version.base44.app/api';
const REQUEST_TIMEOUT_MS = 10000;

const money = (value) =>
  value === null || value === undefined || value === ''
    ? ''
    : `₹${Number(value).toLocaleString('en-IN')}`;

const join = (...parts) => parts.filter(Boolean).join(' · ');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const SOURCES = [
  {
    key: 'loans',
    label: 'Loan applications',
    entity: 'LoanApplication',
    sortBy: '-created_date',
    shape: (row) => ({
      id: row.id,
      title: row.user_name || row.user_mobile || row.loan_id || 'Loan application',
      meta: join(money(row.amount), row.status, row.due_date && `due ${row.due_date}`),
    }),
  },
  {
    key: 'partners',
    label: 'Partners',
    entity: 'TeamMember',
    sortBy: 'order',
    shape: (row) => ({
      id: row.id,
      title: row.name || 'Partner',
      meta: join(row.role, row.education, row.upi_enabled ? 'UPI on' : 'UPI off'),
    }),
  },
  {
    key: 'tickets',
    label: 'Support tickets',
    entity: 'SupportTicket',
    sortBy: '-created_date',
    shape: (row) => ({
      id: row.id,
      title: row.user_name || row.user_mobile || 'Support ticket',
      meta: join(row.status, String(row.message || '').slice(0, 90)),
    }),
  },
  {
    key: 'withdrawals',
    label: 'Partner withdrawals',
    entity: 'PartnerWithdrawal',
    sortBy: '-created_date',
    shape: (row) => ({
      id: row.id,
      title: row.user_name || 'Withdrawal',
      meta: join(money(row.amount), row.withdrawal_type, row.status),
    }),
  },
];

export function baseUrl() {
  return String(process.env.BASE44_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
}

export function host() {
  try {
    return new URL(baseUrl()).hostname;
  } catch {
    return baseUrl();
  }
}

export function isLinked() {
  return Boolean(String(process.env.BASE44_API_KEY || '').trim());
}

export function listSources() {
  return SOURCES.map(({ key, label }) => ({ key, label }));
}

export async function listRecords(key, limit = 8) {
  const source = SOURCES.find((item) => item.key === key) || SOURCES[0];
  if (!isLinked()) return { source: source.key, linked: false, rows: [] };

  const url = `${baseUrl()}/entities/${source.entity}?limit=${limit}&sort_by=${encodeURIComponent(source.sortBy)}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { api_key: String(process.env.BASE44_API_KEY).trim() },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(502, 'Could not reach your Base44 app.');
  }

  const rejected = response.status === 401 || response.status === 403;
  if (!response.ok) {
    throw new HttpError(
      rejected ? 400 : 502,
      rejected
        ? 'The Base44 API key was rejected — check BASE44_API_KEY.'
        : `Your Base44 app returned ${response.status}.`
    );
  }

  const body = await response.json().catch(() => []);
  const rows = (Array.isArray(body) ? body : []).slice(0, limit).map(source.shape);
  return { source: source.key, linked: true, rows };
}
