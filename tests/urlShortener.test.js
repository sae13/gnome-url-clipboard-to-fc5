import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRequestBody,
  createSlug,
  formatSuccessMessage,
  parseShortenResponse,
  SERVICE_ENDPOINT,
  ShortenCoordinator,
  validateUrl,
} from '../urlShortener.js';

test('درخواست کوتاهسازی به دامنهٔ جدید فرستاده میشود', () => {
  assert.equal(SERVICE_ENDPOINT, 'https://u.linxu.ir/shorten');
});

test('پیام موفقیت با نشانی کوتاه در انتهای متن ساخته میشود', () => {
  assert.equal(
    formatSuccessMessage('https://u.linxu.ir/26hscj'),
    'نشانی کوتاه در کلیپبورد قرار گرفت.\nhttps://u.linxu.ir/26hscj'
  );
});

test('فقط نشانی کامل HTTP یا HTTPS پذیرفته میشود', () => {
  assert.equal(validateUrl('https://example.com/path?q=1'), 'https://example.com/path?q=1');
  assert.equal(validateUrl('  http://example.com  '), 'http://example.com');
  for (const value of ['', 'example.com', 'ftp://example.com', 'hello', 'https://'])
    assert.equal(validateUrl(value), null);
  assert.equal(validateUrl('https://example.com:999999/path'), null);
});

test('اعتبارسنجی در محیط گنوم بدون سازندهٔ سراسری URL کار میکند', () => {
  const savedUrl = globalThis.URL;
  try {
    globalThis.URL = undefined;
    assert.equal(validateUrl('https://u.fc5.ir/example'), 'https://u.fc5.ir/example');
  } finally {
    globalThis.URL = savedUrl;
  }
});

test('نامک فشرده از سال، ماه، روز، ساعت و یک نویسهٔ تصادفی ساخته میشود', () => {
  const date = new Date(2026, 0, 2, 0, 1, 1);
  assert.equal(createSlug(date, () => 0), '26a2a0');
  assert.equal(createSlug(new Date(2026, 11, 31, 23), () => 0.999999), '26lvxz');
  assert.equal(createSlug(new Date(2026, 9, 10, 1), () => 10 / 36), '26jaba');
  assert.throws(() => createSlug(date, () => Number.NaN), /تصادفی/);
  assert.match(createSlug(date, () => 0.5), /^[0-9]{2}[a-l][1-9a-v][a-x][0-9a-z]$/);
});

test('همهٔ نگاشتهای ماه، روز و ساعت پایدار هستند', () => {
  const months = Array.from({length: 12}, (_, month) =>
    createSlug(new Date(2026, month, 1, 0), () => 0)[2]
  ).join('');
  assert.equal(months, 'abcdefghijkl');

  const days = Array.from({length: 31}, (_, day) =>
    createSlug(new Date(2026, 0, day + 1, 0), () => 0)[3]
  ).join('');
  assert.equal(days, '123456789abcdefghijklmnopqrstuv');

  const hours = Array.from({length: 24}, (_, hour) =>
    createSlug(new Date(2026, 0, 1, hour), () => 0)[4]
  ).join('');
  assert.equal(hours, 'abcdefghijklmnopqrstuvwx');
});

test('تاریخ و منبع تصادفی نامعتبر رد میشوند', () => {
  assert.throws(() => createSlug(new Date('invalid')), /تاریخ/);
  assert.throws(() => createSlug(null), /تاریخ/);
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -0.01, 1])
    assert.throws(() => createSlug(new Date(2026, 0, 1), () => value), /تصادفی/);
});

test('بدنهٔ درخواست شامل نشانی، نامک سفارشی و hidden درست است', () => {
  assert.deepEqual(buildRequestBody('https://example.com/x', '26a2a0'), {
    url: 'https://example.com/x',
    custom_slug: '26a2a0',
    hidden: true,
  });
});

test('پاسخ موفق با دامنهٔ جدید برگردانده میشود', () => {
  assert.equal(parseShortenResponse('{"short_url":"https://u.linxu.ir/abc"}'), 'https://u.linxu.ir/abc');
});

test('دامنهٔ قدیمی با حفظ کامل ادامهٔ نشانی به دامنهٔ جدید تبدیل میشود', () => {
  assert.equal(
    parseShortenResponse('{"short_url":"https://u.fc5.ir/a%20b?q=x%2Fy#part"}'),
    'https://u.linxu.ir/a%20b?q=x%2Fy#part'
  );
});

test('پاسخ سرویس فقط از دامنهٔ جدید یا قدیمی پذیرفته میشود', () => {
  for (const value of [
    '{"short_url":"https://example.org/abc"}',
    '{"short_url":"http://u.linxu.ir/abc"}',
    '{"short_url":"http://u.fc5.ir/abc"}',
    '{"short_url":"https://U.FC5.IR/abc"}',
    '{"short_url":"https://u.fc5.ir:443/abc"}',
    '{"short_url":"https://u.linxu.ir.evil.test/abc"}',
    '{"short_url":"https://u.fc5.ir@evil.test/abc"}',
  ])
    assert.throws(() => parseShortenResponse(value), /پاسخ نامعتبر/);
});

test('مقدار short_url باید یک نشانی کامل HTTP یا HTTPS باشد', () => {
  for (const value of [
    '{"short_url":"javascript:alert(1)"}',
    '{"short_url":"not a url"}',
    '{"short_url":" https://u.fc5.ir/abc "}',
  ])
    assert.throws(() => parseShortenResponse(value), /پاسخ نامعتبر/);
});

test('پاسخ خراب یا بدون short_url رد میشود', () => {
  for (const value of ['', 'null', '{}', '{bad', '{"short_url":""}', '{"short_url":42}'])
    assert.throws(() => parseShortenResponse(value), /پاسخ نامعتبر/);
});

test('وضعیت ناموفق سرویس قابل تشخیص است و پاسخ آن پذیرفته نمیشود', () => {
  assert.throws(() => parseShortenResponse('{"detail":"failed"}'), /پاسخ نامعتبر/);
});

test('متن نامعتبر درخواست نمیفرستد', async () => {
  const coordinator = new ShortenCoordinator();
  let calls = 0;
  const result = await coordinator.execute('not a url', async () => {
    calls++;
  });
  assert.deepEqual(result, {status: 'invalid'});
  assert.equal(calls, 0);
});

test('مسیر موفق نشانی کوتاه را برمیگرداند', async () => {
  const coordinator = new ShortenCoordinator();
  const result = await coordinator.execute('https://example.com', async body => {
    assert.equal(body.hidden, true);
    return {status: 200, body: '{"short_url":"https://u.fc5.ir/ok"}'};
  });
  assert.deepEqual(result, {status: 'success', shortUrl: 'https://u.linxu.ir/ok'});
});

test('پاسخ خراب و وضعیت ناموفق خطای سرویس میدهند', async () => {
  const coordinator = new ShortenCoordinator();
  assert.deepEqual(
    await coordinator.execute('https://example.com', async () => ({status: 500, body: '{}'})),
    {status: 'service-error'}
  );
  assert.deepEqual(
    await coordinator.execute('https://example.com', async () => ({status: 200, body: '{}'})),
    {status: 'service-error'}
  );
  assert.deepEqual(
    await coordinator.execute('https://example.com', async () => ({body: '{"short_url":"https://u.fc5.ir/x"}'})),
    {status: 'service-error'}
  );
});

test('خطای ارتباط به عنوان خطای شبکه برگردانده میشود', async () => {
  const coordinator = new ShortenCoordinator();
  const result = await coordinator.execute('https://example.com', async () => {
    throw new Error('offline');
  });
  assert.deepEqual(result, {status: 'network-error'});
});

test('درخواست دوم هنگام اجرای درخواست اول ساخته نمیشود', async () => {
  const coordinator = new ShortenCoordinator();
  let release;
  let calls = 0;
  const first = coordinator.execute('https://example.com', () => {
    calls++;
    return new Promise(resolve => {
      release = resolve;
    });
  });
  assert.deepEqual(
    await coordinator.execute('https://example.org', async () => {
      calls++;
    }),
    {status: 'busy'}
  );
  assert.equal(calls, 1);
  release({status: 200, body: '{"short_url":"https://u.fc5.ir/one"}'});
  await first;
});
