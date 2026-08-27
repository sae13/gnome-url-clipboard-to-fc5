function pad(value) {
  return String(value).padStart(2, '0');
}

export function validateUrl(value) {
  if (typeof value !== 'string' || value.trim() === '')
    return null;

  const input = value.trim();
  const match = input.match(/^https?:\/\/(\[[0-9a-fA-F:]+\]|[^\s/:?#]+)(?::(\d+))?(?:[/?#][^\s]*)?$/);
  if (!match)
    return null;

  const host = match[1];
  const port = match[2];
  if (port !== undefined && Number(port) > 65535)
    return null;
  if (!host.startsWith('[') && !host.includes('.') && host !== 'localhost')
    return null;

  return input;
}

const MONTH_CODES = 'abcdefghijkl';
const DAY_CODES = '123456789abcdefghijklmnopqrstuv';
const HOUR_CODES = 'abcdefghijklmnopqrstuvwx';
const RANDOM_CODES = '0123456789abcdefghijklmnopqrstuvwxyz';

export function createSlug(date = new Date(), random = Math.random) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime()))
    throw new RangeError('تاریخ نامعتبر است');

  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1)
    throw new RangeError('منبع تصادفی نامعتبر است');

  return [
    pad(date.getFullYear() % 100),
    MONTH_CODES[date.getMonth()],
    DAY_CODES[date.getDate() - 1],
    HOUR_CODES[date.getHours()],
    RANDOM_CODES[Math.floor(sample * RANDOM_CODES.length)],
  ].join('');
}

export function buildRequestBody(url, slug) {
  return {
    url,
    custom_slug: slug,
    hidden: true,
  };
}

export function parseShortenResponse(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('پاسخ نامعتبر سرویس');
  }

  if (!payload || typeof payload.short_url !== 'string' ||
      payload.short_url !== payload.short_url.trim() ||
      validateUrl(payload.short_url) === null)
    throw new Error('پاسخ نامعتبر سرویس');

  return payload.short_url;
}

export class ShortenCoordinator {
  constructor() {
    this.busy = false;
  }

  async execute(input, request) {
    if (this.busy)
      return {status: 'busy'};

    const url = validateUrl(input);
    if (!url)
      return {status: 'invalid'};

    this.busy = true;
    try {
      const response = await request(buildRequestBody(url, createSlug()));
      if (!response || !Number.isInteger(response.status) ||
          response.status < 200 || response.status >= 300)
        return {status: 'service-error'};

      try {
        return {status: 'success', shortUrl: parseShortenResponse(response.body)};
      } catch {
        return {status: 'service-error'};
      }
    } catch {
      return {status: 'network-error'};
    } finally {
      this.busy = false;
    }
  }
}
