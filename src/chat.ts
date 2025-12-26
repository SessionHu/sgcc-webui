import { Md5 } from 'ts-md5';
import pLimit from 'p-limit';
import type * as openpgp from 'openpgp';

import * as keystore from './keystore';
import * as idbutils from './idbutils';
import type { ChatMessageRecord, WindowMessage, WindowMessageChatRecv } from './typings';

function getAvatar(name: string, email?: string): string {
  if (email)
    return 'https://www.gravatar.com/avatar/' + Md5.hashStr(email) + '?s=64&d=identicon';
  const color = Math.floor(Array.from(name).map(v => v.codePointAt(0) || 0).reduce((a, b) => a + b, 0)).toString(16).padEnd(3, 'a').substring(0, 3);
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="64" height="64" fill="#' + color + '" />' +
    '<text x="50%" y="50%" ' +
      'dominant-baseline="central" ' +
      'text-anchor="middle" ' +
      'font-family="sans-serif" ' +
      'font-size="32" ' +
      'fill="#FFFFFF">' +
      name[0] +
    '</text>' +
    '</svg>'
  );
}

class SGCC {
  readonly #base: string;
  get base() {
    return this.#base;
  }
  readonly #ac = new AbortController;
  constructor(base: string) {
    this.#base = base;
  }
  async send(key: openpgp.Key, res: Uint8Array) {
    return await fetch(this.#base + '/cgi-bin/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/pgp-encrypted',
        'x-sgcc-to': key.getFingerprint().toUpperCase()
      },
      body: new Uint8Array(res),
      signal: this.#ac.signal
    });
  }
  async watch(offset = 0n) {
    return await fetch(this.#base + '/cgi-bin/watch?offset=' + offset, {
      headers: { 'x-sgcc-to': (await keystore.getMyKey()).getFingerprint().toUpperCase() },
      signal: this.#ac.signal
    });
  }
  async recv(fts: string) {
    return await fetch(this.#base + '/cgi-bin/recv', {
      headers: {
        'x-sgcc-to': (await keystore.getMyKey()).getFingerprint().toUpperCase(),
        'x-sgcc-fts': fts
      },
      signal: this.#ac.signal
    });
  }
  abort() {
    return this.#ac.abort();
  }
}
let sgcc = new SGCC(await idbutils.myinfo.backendUrl() || 'https://sgcc.xhustudio.eu.org');
window.addEventListener('message', (e: MessageEvent<WindowMessage>) => {
  if (e.data.type !== 'backend-switch') return;
  sgcc.abort();
  sgcc = new SGCC(e.data.data);
});

export class Chat {
  readonly key: openpgp.Key;
  get name() {
    return this.#altname || this.key.users[0]?.userID?.name || 'Anonymous';
  }
  set name(n: string) {
    this.#altname = n;
  }
  #altname?: string;
  get email() {
    return this.key.users[0]?.userID?.email || '???';
  }
  get avatar() {
    return getAvatar(this.name, this.email.trim().toLowerCase());
  }
  constructor(key: openpgp.Key) {
    this.key = key;
  }
  async sendMessage(message: Uint8Array) {
    const res = await sgcc.send(this.key, message);
    if (!res.ok) console.warn('Request failed! Code:' + res.status);
    const r: ChatMessageRecord = {
      keyfp: this.key.getFingerprint().toUpperCase(),
      message,
      type: 'outgoing',
      msgid: BigInt((await res.text()).trim()),
      backend: sgcc.base
    };
    await idbutils.messages.addMessage(r);
    return r;
  }
  async fetchMessage(offset: bigint, limit: number) {
		return await idbutils.messages.getMessagesBeforeOffset(this.key.getFingerprint().toUpperCase(), offset, limit);
  }
  async lastMessage() {
    return await idbutils.messages.lastMessage(this.key.getFingerprint().toUpperCase());
  }
}

const limit = pLimit(16);

// receive messages
(async () => {
  let offset = (await idbutils.messages.lastMessage())?.msgid || 0n;
  while (true) {
    try {
      const res = (await (await sgcc.watch(offset)).text()).split('\n').filter(Boolean);
      const messagePromises = res.map(msgid => limit(async () => {
        const msgbody = await (await sgcc.recv(msgid)).bytes();
        return { msgbody, msgid };
      }));
      for await (const p of messagePromises) {
        const message = p.msgbody;
        const msgid = BigInt(p.msgid);
        window.postMessage({
          type: 'chat-recv',
          data: {
            type: 'incoming',
            msgid,
            message,
            backend: sgcc.base
          },
        } as WindowMessageChatRecv);
        offset = msgid;
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') continue;
      console.warn(e);
      await new Promise((r) => setTimeout(r, 1e4));
    }
  }
})();
