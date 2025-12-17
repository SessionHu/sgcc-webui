import * as openpgp from 'openpgp';
import * as idbutils from './idbutils';
import { showPrompt } from './components/Prompt';

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
    cachedAllKeys = null;
    const fp = key.getFingerprint().toUpperCase();
    const binaryKey = key.write();
    return await idbutils.keystore.addKey(fp, binaryKey);
  },
  async removeKey(key: openpgp.Key) {
    cachedAllKeys = null;
    const fp = key.getFingerprint().toUpperCase();
    return await idbutils.keystore.removeKey(fp);
  },
  async getAllKeys(): Promise<Array<Readonly<openpgp.Key>>> {
    return cachedAllKeys ??= await Promise.all((await idbutils.keystore.getAllKeys()).map(k => openpgp.readKey({ binaryKey: k })));
  }
};
let cachedAllKeys: Array<Readonly<openpgp.Key>> | null;

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
      const armoredKey = await showPrompt({
        title: 'Private Key Input',
        label: 'Please enter your armored private key:',
        type: 'multiline',
      });
      if (armoredKey === null) {
        alert('Private key input cancelled. Cannot proceed without a private key.');
        continue;
      }
      const k = await openpgp.readPrivateKey({ armoredKey });
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
  let cacheClearTimer: ReturnType<typeof setTimeout> | null = null;
  let decryptionPromise: Promise<openpgp.PrivateKey> | null = null;

  const scheduleCacheClear = () => {
    if (cacheClearTimer) {
      clearTimeout(cacheClearTimer);
    }
    cacheClearTimer = setTimeout(() => {
      cache = null;
      cacheClearTimer = null;
    }, 1000 * 60);
  };

  const promptAndDecrypt = async (): Promise<openpgp.PrivateKey> => {
    try {
      const passphrase = await showPrompt({
        title: 'Passphrase Input',
        label: 'Please enter your passphrase:',
        type: 'password',
      });
      if (passphrase === null) {
        throw new Error('Passphrase input cancelled.');
      }
      const decryptedKey = await openpgp.decryptKey({
        privateKey: privatekey,
        passphrase: passphrase
      });
      return decryptedKey;
    } catch (e) {
      alert('Invalid passphrase: ' + String(e));
      console.warn(e);
      return promptAndDecrypt(); // Re-prompt on failure
    }
  };

  return async function getMyDecryptedPrivateKey() {
    if (cache) {
      scheduleCacheClear();
      return cache;
    }

    if (decryptionPromise) {
      return await decryptionPromise;
    }

    decryptionPromise = (async () => {
      try {
        const decryptedKey = await promptAndDecrypt();
        cache = decryptedKey;
        scheduleCacheClear();
        return cache;
      } finally {
        decryptionPromise = null;
      }
    })();

    return await decryptionPromise;
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
