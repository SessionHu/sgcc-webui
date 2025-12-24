import { openDB } from 'idb';
import type { ChatMessageRecord, WindowMessageIdbMsgUpdate } from './typings';

const db = await openDB('SGCCDB', 1, {
  upgrade(db) {
    db.createObjectStore('keystore', {
      keyPath: 'keyfp'
    });
    const messagesStore = db.createObjectStore('messages', {
      keyPath: 'msgid'
    });
    messagesStore.createIndex('by_keyfp_and_msgid', ['keyfp', 'msgid']);
    db.createObjectStore('myinfo');
  },
});

export const myinfo = {
  async getMyinfo(): Promise<Uint8Array | null> {
    const myinfo = await db.get('myinfo', 'myinfo');
    if (myinfo instanceof Uint8Array)
      return myinfo;
    else
      return null
  },
  async setMyinfo(myinfo: Uint8Array) {
    return await db.put('myinfo', myinfo, 'myinfo');
  }
};

export const keystore = {
  async addKey(keyfp: string, key: Uint8Array) {
    return await db.put('keystore', { keyfp, key });
  },
  async getAllKeyfps(): Promise<string[]> {
    const keys = await db.getAllKeys('keystore');
    return keys.map(keyfp => keyfp.toString());
  },
  async getAllKeys(): Promise<Uint8Array[]> {
    const keys = await db.getAll('keystore');
    return keys.map(key => key.key);
  },
  async getKey(keyfp: string): Promise<Uint8Array | null> {
    const key = await db.get('keystore', keyfp);
    if (typeof key === 'object' && 'key' in key && key.key instanceof Uint8Array)
      return key.key;
    else
      return null;
  },
  async removeKey(keyfp: string) {
    return await db.delete('keystore', keyfp);
  }
};

const ZERO_LENGTH_32 = '0'.repeat(32);

export const messages = {
  async addMessage(cmr: ChatMessageRecord) {
    await db.put('messages', {
      ...cmr,
      msgid: cmr.msgid.toString(36).padStart(32, '0')
    });
    window.postMessage({
      type: 'idb-msg-update'
    } as WindowMessageIdbMsgUpdate);
  },
  async getMessagesBeforeOffset(keyfp: string, offsetMsgid: bigint, limit: number): Promise<ChatMessageRecord[]> {
    const tx = db.transaction('messages', 'readonly');
    const index = tx.objectStore('messages').index('by_keyfp_and_msgid');
    // [0] 必须等于 keyfp
    // [1] 必须严格小于 offsetMsgid (BigInt)
    const range = IDBKeyRange.bound(
      [keyfp, ZERO_LENGTH_32], // 复合范围的起点: [keyfp, 32 * '0']
      [keyfp, offsetMsgid.toString(36).padStart(32, '0')], // 复合范围的终点: [keyfp, offsetMsgid]
      false, // 下界包含 (false)
      true   // 上界排他 (true), 确保不包含 offsetMsgid 本身喵
    );
    const messages = new Array<ChatMessageRecord>;
    let cursor = await index.openCursor(range, 'prev');
    while (cursor && messages.length < limit) {
      messages.push({
        ...cursor.value,
        msgid: bigIntFromRadix36(cursor.value.msgid)
      }as ChatMessageRecord);
      cursor = await cursor.continue();
    }
    await tx.done;
    return messages;
  },
  async removeMessage(msgid: bigint) {
    return await db.delete('messages', msgid.toString(36).padStart(32, '0'));
  },
  async lastMessage(keyfp?: string): Promise<ChatMessageRecord | null> {
    const tx = db.transaction('messages', 'readonly');
    if (keyfp) {
      const index = tx.objectStore('messages').index('by_keyfp_and_msgid');
      const range = IDBKeyRange.bound([keyfp], [keyfp, MAX_36_KEY]);
      const cursor = await index.openCursor(range, 'prev');
      if (cursor) {
        const rawMessage = cursor.value;
        const message = {
          ...rawMessage,
          msgid: bigIntFromRadix36(rawMessage.msgid)
        } as ChatMessageRecord;
        await tx.done;
        return message;
      }
    } else {
      const store = tx.objectStore('messages');
      const cursor = await store.openCursor(null, 'prev');
      if (cursor) {
        const rawMessage = cursor.value;
        const message = {
          ...rawMessage,
          msgid: bigIntFromRadix36(rawMessage.msgid)
        } as ChatMessageRecord;
        await tx.done;
        return message;
      }
    }
    await tx.done;
    return null;
  }
};

const MAX_36_KEY = 'z'.repeat(32);

function bigIntFromRadix36(str: string): bigint {
  str = str.toLowerCase();
  let result = 0n;
  const radix = 36n;
  const ccA = 'a'.charCodeAt(0);
  for (const char of str) {
    let digit: bigint;
    // 0-9
    if (char >= '0' && char <= '9') {
      digit = BigInt(char);
    }
    // a-z
    else if (char >= 'a' && char <= 'z') {
      // ASCII 'a' => 10
      digit = BigInt(char.charCodeAt(0) - ccA + 10);
    } else {
      throw new TypeError('Not a valid radix-36 string: ' + str);
    }
    result = result * radix + digit;
  }
  return result;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const dbutil = {
  async exportDB(): Promise<string> {
    const tx = db.transaction(['keystore', 'messages', 'myinfo'], 'readonly');
    const keystoreData = await tx.objectStore('keystore').getAll();
    const messagesData = await tx.objectStore('messages').getAll();
    const myinfoData = await tx.objectStore('myinfo').get('myinfo');
    await tx.done;
    const exportData = {
      keystore: keystoreData.map(({ keyfp, key }: { keyfp: string, key: Uint8Array }) => ({
        keyfp,
        key: uint8ArrayToBase64(key)
      })),
      messages: messagesData.map((msg: { message: Uint8Array, [key:string]: any}) => ({
        ...msg,
        message: uint8ArrayToBase64(msg.message)
      })),
      myinfo: myinfoData ? uint8ArrayToBase64(myinfoData) : null,
    };
    return JSON.stringify(exportData);
  },
  async importDB(jsonString: string): Promise<void> {
    const importData = JSON.parse(jsonString);
    const keystoreData = importData.keystore.map(({ keyfp, key }: { keyfp: string, key: string }) => ({
      keyfp,
      key: base64ToUint8Array(key)
    }));
    const messagesData = importData.messages.map((msg: { message: string, [key:string]: any}) => ({
      ...msg,
      message: base64ToUint8Array(msg.message)
    }));
    const myinfoData = importData.myinfo ? base64ToUint8Array(importData.myinfo) : null;
    const tx = db.transaction(['keystore', 'messages', 'myinfo'], 'readwrite');
    const keystoreStore = tx.objectStore('keystore');
    const messagesStore = tx.objectStore('messages');
    const myinfoStore = tx.objectStore('myinfo');
    await keystoreStore.clear();
    await messagesStore.clear();
    await myinfoStore.clear();
    for (const item of keystoreData) {
      keystoreStore.put(item);
    }
    for (const item of messagesData) {
      messagesStore.put(item);
    }
    if (myinfoData) {
      myinfoStore.put(myinfoData, 'myinfo');
    }
    return tx.done;
  }
};
