import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup?version=3.0';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import {
  ShortenCoordinator,
} from './urlShortener.js';

const ENDPOINT = 'https://u.fc5.ir/shorten';
const REQUEST_TIMEOUT_SECONDS = 15;

const UrlShortenerIndicator = GObject.registerClass(
class UrlShortenerIndicator extends PanelMenu.Button {
  _init(onActivate) {
    super._init(0.0, 'کوتاهکنندهٔ نشانی', false);
    this._onActivate = onActivate;
    this.add_child(new St.Icon({
      icon_name: 'insert-link-symbolic',
      style_class: 'system-status-icon',
    }));
  }

  vfunc_event(event) {
    if (event.type() === Clutter.EventType.BUTTON_RELEASE) {
      if (event.get_button() !== Clutter.BUTTON_PRIMARY)
        return super.vfunc_event(event);
      this._onActivate();
      return Clutter.EVENT_STOP;
    }
    if (event.type() === Clutter.EventType.KEY_RELEASE) {
      const symbol = event.get_key_symbol();
      if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_space) {
        this._onActivate();
        return Clutter.EVENT_STOP;
      }
    }
    return super.vfunc_event(event);
  }

  setBusy(busy) {
    if (busy)
      this.add_style_class_name('url-shortener-indicator-busy');
    else
      this.remove_style_class_name('url-shortener-indicator-busy');
  }
});

export default class UrlShortenerExtension extends Extension {
  enable() {
    this._generation = (this._generation ?? 0) + 1;
    this._busy = false;
    this._destroyed = false;
    this._coordinator = new ShortenCoordinator();
    this._session = new Soup.Session({timeout: REQUEST_TIMEOUT_SECONDS});
    this._indicator = new UrlShortenerIndicator(() => this._shortenClipboard());
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._generation = (this._generation ?? 0) + 1;
    this._destroyed = true;
    this._busy = false;
    this._session?.abort();
    this._session = null;
    this._coordinator = null;
    this._indicator?.destroy();
    this._indicator = null;
  }

  _notify(message) {
    if (!this._destroyed)
      Main.notify('کوتاهکنندهٔ نشانی', message);
  }

  async _shortenClipboard() {
    const generation = this._generation;
    if (this._busy) {
      this._notify('درخواست قبلی هنوز در حال اجراست.');
      return;
    }

    const clipboard = St.Clipboard.get_default();
    let clipboardText;
    try {
      clipboardText = await new Promise(resolve => {
        clipboard.get_text(St.ClipboardType.CLIPBOARD, (_clipboard, text) => resolve(text));
      });
    } catch {
      this._notify('خواندن کلیپبورد ممکن نشد.');
      return;
    }

    if (this._destroyed || generation !== this._generation)
      return;

    // خواندن کلیپبورد ناهمگام است؛ ممکن است کلیک دیگری در این فاصله
    // درخواست را آغاز کرده باشد.
    if (this._busy) {
      this._notify('درخواست قبلی هنوز در حال اجراست.');
      return;
    }

    this._busy = true;
    this._indicator?.setBusy(true);
    try {
      const result = await this._coordinator.execute(clipboardText, async requestBody => {
        const message = Soup.Message.new('POST', ENDPOINT);
        message.set_request_body_from_bytes(
          'application/json',
          new GLib.Bytes(new TextEncoder().encode(JSON.stringify(requestBody)))
        );
        const bytes = await this._session.send_and_read_async(
          message,
          GLib.PRIORITY_DEFAULT,
          null
        );
        return {
          status: message.get_status(),
          body: new TextDecoder().decode(bytes.get_data()),
        };
      });

      if (this._destroyed || generation !== this._generation)
        return;
      if (result.status === 'busy') {
        this._notify('درخواست قبلی هنوز در حال اجراست.');
        return;
      }
      if (result.status === 'invalid') {
        this._notify('متن کلیپبورد یک نشانی کامل HTTP یا HTTPS نیست.');
        return;
      }
      if (result.status === 'network-error') {
        this._notify('ارتباط با سرویس برقرار نشد یا مهلت درخواست پایان یافت.');
        return;
      }
      if (result.status === 'service-error') {
        this._notify('سرویس پاسخ موفقی نداد.');
        return;
      }
      if (result.status !== 'success' || typeof result.shortUrl !== 'string') {
        this._notify('پاسخ سرویس قابل استفاده نبود.');
        return;
      }
      try {
        clipboard.set_text(St.ClipboardType.CLIPBOARD, result.shortUrl);
      } catch {
        this._notify('نوشتن نشانی کوتاه در کلیپبورد ممکن نشد.');
        return;
      }
      this._notify('نشانی کوتاه در کلیپبورد قرار گرفت.');
    } finally {
      if (generation === this._generation) {
        this._busy = false;
        this._indicator?.setBusy(false);
      }
    }
  }
}
