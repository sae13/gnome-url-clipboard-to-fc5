# GNOME URL Clipboard Shortener for fc5.ir

[فارسی](#فارسی) | [English](#english)

A small GNOME Shell 48 extension that shortens the HTTP or HTTPS URL currently stored in the clipboard through the fc5.ir shortening service.

https://u.fc5.ir/shorten

The extension adds a link icon to the GNOME top bar. Copy a URL, click the icon, and the returned short URL replaces the current clipboard content.

## English

### Features

- Manual activation from a GNOME top-bar icon; it never monitors the clipboard continuously.
- Accepts complete HTTP and HTTPS URLs.
- Sends JSON directly with GNOME's built-in networking stack; no shell command or external runtime is used by the extension.
- Generates a custom slug from the local two-digit year, month, day, hour, and a random two-digit number.
- Prevents concurrent shortening requests.
- Keeps the clipboard unchanged after invalid input, network failure, or an invalid service response.
- Shows GNOME notifications for success and failures.
- Works alongside clipboard managers such as CopyQ.

A generated slug has this shape:

```text
YYMMDDhhNN
```

Example:

```text
2601020069
```

### Compatibility

- GNOME Shell 48
- X11 and Wayland

The current metadata intentionally declares GNOME Shell 48 only. Support for another major GNOME version should be tested before adding it to the compatibility list.

### Privacy

The extension does not continuously watch the clipboard and does not persist or log clipboard data itself. Clicking the icon sends the current URL to the following external service:

https://u.fc5.ir/shorten

The service receives the original URL, the generated custom slug, and the following visibility flag:

```json
{
  "hidden": true
}
```

The external service has its own storage, logging, and retention policy.

### Install from a GitHub release

Download the ZIP asset from the latest release, then run:

```bash
gnome-extensions install --force url-shortener@fc5.ir.shell-extension.zip
gnome-extensions enable url-shortener@fc5.ir
```

If GNOME does not recognize a newly installed extension immediately, log out and log back in. On an X11 development session you may alternatively restart GNOME Shell, but logging out is the safest portable option.

Verify installation:

```bash
gnome-extensions info url-shortener@fc5.ir
```

The expected state is:

```text
Enabled: Yes
State: ACTIVE
```

### Install from source

Clone the repository and run the installer:

```bash
git clone git@github.com:sae13/gnome-url-clipboard-to-fc5.git
cd gnome-url-clipboard-to-fc5
./install.sh
```

The installer runs the unit tests, packages the extension, installs it with replacement enabled, and enables it when the current GNOME session already knows the extension UUID.

If this is the first installation and enabling fails, log out and back in, then run:

```bash
gnome-extensions enable url-shortener@fc5.ir
```

### Usage

1. Copy a complete URL that begins with HTTP or HTTPS.
2. Click the link icon in the GNOME top bar.
3. Wait for the success notification.
4. Paste the newly generated short URL.

### Development

Requirements:

- Node.js 20 or newer for tests
- GNOME extension command-line tools for packaging and local installation
- ZIP tools for archive verification

Run tests:

```bash
npm test
```

Build the exact release artifact:

```bash
npm run pack
```

The output is:

```text
url-shortener@fc5.ir.shell-extension.zip
```

Inspect the archive:

```bash
unzip -t url-shortener@fc5.ir.shell-extension.zip
```

### Release process

The continuous-integration workflow tests the JavaScript code and builds the extension package for pushes and pull requests.

The release workflow runs when a semantic-version tag is pushed:

```bash
git tag v1.0.0
git push origin v1.0.0
```

It verifies that the tag matches the semantic version declared in the package manifest, runs the tests, builds and validates the ZIP file, calculates a checksum, and publishes both files in a GitHub release.

Release tags must use this shape:

```text
vMAJOR.MINOR.PATCH
```

### Uninstall

```bash
gnome-extensions disable url-shortener@fc5.ir
gnome-extensions uninstall url-shortener@fc5.ir
```

### Troubleshooting

If the extension reports that the clipboard is not an HTTP or HTTPS URL, verify the actual clipboard value:

```bash
xsel --clipboard --output
```

Clipboard managers such as CopyQ should not conflict with the extension. They normally record both the original and shortened URL as separate history entries.

If the icon does not appear:

```bash
gnome-extensions info url-shortener@fc5.ir
journalctl --user --since "10 minutes ago" --no-pager
```

## فارسی

این افزونه برای نسخهٔ چهلوهشت پوستهٔ گنوم ساخته شده است. یک نماد پیوند به نوار بالای صفحه اضافه میکند. پس از کپیکردن نشانی، با فشردن نماد، نشانی فعلی کلیپبورد برای کوتاهشدن به سرویس زیر فرستاده میشود:

https://u.fc5.ir/shorten

نشانی کوتاه برگشتی جای متن فعلی کلیپبورد قرار میگیرد.

### قابلیتها

- عملیات فقط با فشردن نماد آغاز میشود و کلیپبورد بهصورت پیوسته پایش نمیشود.
- نشانیهای کامل وب پذیرفته میشوند.
- ارتباط شبکه با امکانات داخلی گنوم انجام میشود.
- نامک از سال دورقمی، ماه، روز و ساعت محلی و سپس یک عدد تصادفی دورقمی ساخته میشود.
- درخواست همزمان ساخته نمیشود.
- در ورودی نامعتبر، خطای شبکه یا پاسخ خراب، کلیپبورد تغییر نمیکند.
- نتیجهٔ موفق یا خطا با اعلان گنوم نمایش داده میشود.
- استفاده همزمان با مدیر کلیپبورد کپیکیو مشکلی ندارد.

قالب نامک:

```text
YYMMDDhhNN
```

نمونه:

```text
2601020069
```

### سازگاری

- نسخهٔ چهلوهشت پوستهٔ گنوم
- نشستهای اکس و ویلند

پشتیبانی نسخههای اصلی دیگر باید پیش از اضافهشدن به فهرست سازگاری آزمایش شود.

### حریم خصوصی

خود افزونه کلیپبورد را بهصورت پیوسته پایش نمیکند و دادهای را ذخیره یا ثبت نمیکند. با فشردن نماد، نشانی فعلی برای سرویس بیرونی ارسال میشود:

https://u.fc5.ir/shorten

درخواست شامل نشانی اصلی، نامک تولیدشده و مقدار زیر است:

```json
{
  "hidden": true
}
```

سیاست ذخیرهسازی و نگهداری دادهٔ سرویس بیرونی مستقل از این افزونه است.

### نصب از انتشار گیتهاب

فایل فشردهٔ آخرین انتشار را دریافت کن و سپس دستورهای زیر را اجرا کن:

```bash
gnome-extensions install --force url-shortener@fc5.ir.shell-extension.zip
gnome-extensions enable url-shortener@fc5.ir
```

اگر گنوم افزونهٔ تازهنصبشده را بلافاصله نشناخت، یکبار از نشست خارج شو و دوباره وارد شو. سپس دستور فعالسازی را دوباره اجرا کن.

برای بررسی وضعیت:

```bash
gnome-extensions info url-shortener@fc5.ir
```

وضعیت مورد انتظار:

```text
Enabled: Yes
State: ACTIVE
```

### نصب از کد منبع

```bash
git clone git@github.com:sae13/gnome-url-clipboard-to-fc5.git
cd gnome-url-clipboard-to-fc5
./install.sh
```

نصبگر آزمونها را اجرا میکند، بسته را میسازد، نسخهٔ قبلی را جایگزین میکند و در صورت شناختهشدن افزونه در نشست فعلی، آن را فعال میکند.

اگر این نخستین نصب است و فعالسازی انجام نشد، یکبار خارج و دوباره وارد شو و سپس اجرا کن:

```bash
gnome-extensions enable url-shortener@fc5.ir
```

### استفاده

۱. یک نشانی کامل وب را کپی کن.

۲. نماد پیوند نوار بالای گنوم را بفشار.

۳. منتظر اعلان موفقیت بمان.

۴. نشانی کوتاه موجود در کلیپبورد را بچسبان.

### توسعه و آزمون

برای آزمون به نسخهٔ بیست یا جدیدتر نود و برای بستهبندی به ابزار خط فرمان افزونههای گنوم نیاز است.

اجرای آزمونها:

```bash
npm test
```

ساخت بستهٔ انتشار:

```bash
npm run pack
```

نام فایل خروجی:

```text
url-shortener@fc5.ir.shell-extension.zip
```

بررسی سلامت بسته:

```bash
unzip -t url-shortener@fc5.ir.shell-extension.zip
```

### فرایند انتشار

گردش بررسی گیتهاب در هر درخواست ادغام و ارسال تغییر، آزمونها را اجرا و بسته را میسازد. گردش انتشار با ارسال یک برچسب نسخه اجرا میشود:

```bash
git tag v1.0.0
git push origin v1.0.0
```

گردش انتشار تطابق برچسب با نسخهٔ بسته را بررسی میکند، آزمونها را اجرا میکند، فایل فشرده و جمع کنترلی را میسازد و یک انتشار گیتهاب ایجاد میکند.

قالب برچسب:

```text
vMAJOR.MINOR.PATCH
```

### حذف

```bash
gnome-extensions disable url-shortener@fc5.ir
gnome-extensions uninstall url-shortener@fc5.ir
```

### عیبیابی

برای دیدن مقدار واقعی کلیپبورد در نشست اکس:

```bash
xsel --clipboard --output
```

کپیکیو معمولاً با افزونه تداخل ندارد و نشانی اصلی و کوتاهشده را بهصورت دو ورودی جدا در تاریخچه ثبت میکند.

اگر نماد دیده نشد، وضعیت افزونه و گزارشهای نشست را بررسی کن:

```bash
gnome-extensions info url-shortener@fc5.ir
journalctl --user --since "10 minutes ago" --no-pager
```

## License

MIT
