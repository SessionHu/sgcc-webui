import * as openpgp from 'openpgp';
import * as idbutils from './idbutils';

export const store = {
  async getKey(fpOrId: string) {
    const keyfps = await idbutils.keystore.getAllKeyfps();
    const fp = keyfps.find(v => v.endsWith(fpOrId.toUpperCase()));
    if (!fp) return null;
    const binaryKey = await idbutils.keystore.getKey(fp);
    if (!binaryKey) return null;
    return await openpgp.readKey({ binaryKey });
  },
  async addKey(key: openpgp.Key) {
    const fp = key.getFingerprint().toUpperCase();
    const binaryKey = key.write();
    return await idbutils.keystore.addKey(fp, binaryKey);
  },
  async removeKey(key: openpgp.Key) {
    const fp = key.getFingerprint().toUpperCase();
    return await idbutils.keystore.removeKey(fp);
  },
  async getAllKeys(): Promise<Array<Readonly<openpgp.Key>>> {
    return Promise.all((await idbutils.keystore.getAllKeys()).map(k => openpgp.readKey({ binaryKey: k })));
  }
};

const privatekey: openpgp.PrivateKey = await (async () => {
  try {
    const myinfo = await idbutils.myinfo.getMyinfo();
    if (myinfo)
      return await openpgp.readPrivateKey({ binaryKey: myinfo });
  } catch (e) {
    console.warn(e);
  }
  while (true)
    try {
      const k = await openpgp.readPrivateKey({ armoredKey: prompt('private key:')! });
      idbutils.myinfo.setMyinfo(k.write()).catch(console.warn);
      alert('Welcome back! ' + k.users[0]?.userID?.userID);
      return k;
    } catch (e) {
      alert('Invalid private key: ' + String(e));
      console.warn(e);
    }
})();

export async function getMyKey() {
  return privatekey.toPublic();
}

const getMyDecryptedPrivateKey = (() => {
  let cache: openpgp.PrivateKey | null = null;
  let cacheClearTimer: NodeJS.Timeout | null = null;

  const scheduleCacheClear = () => {
    if (cacheClearTimer) {
      clearTimeout(cacheClearTimer);
    }
    cacheClearTimer = setTimeout(() => {
      cache = null;
      cacheClearTimer = null;
    }, 1000 * 60);
  };

  return async function cb() {
    if (cache) {
      scheduleCacheClear();
      return cache;
    }

    try {
      const decryptedKey = await openpgp.decryptKey({
        privateKey: privatekey,
        passphrase: prompt('passphrase:')!
      });
      cache = decryptedKey;
      scheduleCacheClear();
      return cache;
    } catch (e) {
      cache = null;
      if (cacheClearTimer) {
        clearTimeout(cacheClearTimer);
        cacheClearTimer = null;
      }
      alert('Invalid passphrase: ' + String(e));
      console.warn(e);
      return cb();
    }
  };
})();


export async function doEncrypt(key: openpgp.Key, messagetext: string) {
  const message = await openpgp.createMessage({
    text: messagetext,
    format: 'utf8'
  });
  const encrypted = await openpgp.encrypt({
    message,
    encryptionKeys: [ key, await getMyKey()],
    signingKeys: await getMyDecryptedPrivateKey(),
    format: 'binary'
  });
  return encrypted as Uint8Array;
}

export async function doDecrypt(binaryMessage: Uint8Array) {
  const message = await openpgp.readMessage({ binaryMessage });
  const decrypted = await openpgp.decrypt({
    message,
    decryptionKeys: await getMyDecryptedPrivateKey(),
    verificationKeys: await store.getAllKeys() as openpgp.PublicKey[]
  });
  return decrypted;
}

export async function addKeysFromArmored(armoredKeys: string) {
  const keys = await openpgp.readKeys({ armoredKeys });
  for (const key of keys) {
    await store.addKey(key);
  }
}
