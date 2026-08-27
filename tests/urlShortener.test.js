import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRequestBody,
  createSlug,
  parseShortenResponse,
  ShortenCoordinator,
  validateUrl,
} from '../urlShortener.js';

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

test('نامک از زمان محلی و عدد تصادفی دورقمی ساخته میشود', () => {
  const date = new Date(2026, 0, 2, 0, 1, 1);
  assert.equal(createSlug(date, () => 0.655), '2026010200010168');
  assert.match(createSlug(date, () => 0), /^2026010200010110$/);
  assert.match(createSlug(date, () => 0.999999), /^2026010200010199$/);
  assert.throws(() => createSlug(date, () => Number.NaN), /تصادفی/);
});

test('بدنهٔ درخواست شامل نشانی، نامک سفارشی و hidden درست است', () => {
  assert.deepEqual(buildRequestBody('https://example.com/x', '2026010200010169'), {
    url: 'https://example.com/x',
    custom_slug: '2026010200010169',
    hidden: true,
  });
});

test('پاسخ موفق از short_url خوانده میشود', () => {
  assert.equal(parseShortenResponse('{"short_url":"https://u.fc5.ir/abc"}'), 'https://u.fc5.ir/abc');
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
  assert.deepEqual(result, {status: 'success', shortUrl: 'https://u.fc5.ir/ok'});
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
