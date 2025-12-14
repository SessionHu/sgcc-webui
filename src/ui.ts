import { store, doDecrypt, addKeysFromArmored } from './keystore';
import { Chat, chatStat } from './chat';
import type { WindowMessage } from './typings';

interface Elements {
  contactList: HTMLUListElement | null;
  chatMain: HTMLElement | null;
  addButton: HTMLElement | null;
  toggleButton: HTMLElement | null;
  toggleButtonMobile: HTMLElement | null;
  chatMessages: HTMLElement | null;
  chatInput: HTMLInputElement | null;
  sendButton: HTMLButtonElement | null;
}

const elements: Elements = {
  contactList: document.querySelector('#sidebar ul.contact-list'),
  chatMain: document.querySelector('#chatMain'),
  addButton: document.querySelector('#addButton'),
  toggleButton: document.querySelector('#toggleButton'),
  toggleButtonMobile: document.querySelector('#toggleButtonMobile'),
  chatMessages: document.querySelector('.chat-messages'),
  chatInput: document.querySelector('.chat-input-area textarea'),
  sendButton: document.querySelector('.chat-input-area button'),
};

const createMessageElem = (message: string, type: 'outgoing' | 'incoming') => {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'message-container';

  // 创建新的消息气泡元素
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', type);

  const contentSpan = document.createElement('span');
  contentSpan.classList.add('message-content');
  contentSpan.textContent = message;

  messageDiv.appendChild(contentSpan);
  messageContainer.appendChild(messageDiv);

  return messageContainer;
};

window.addEventListener('message', (e) => {
  const msg: WindowMessage = e.data;
  switch (msg.type) {
    case 'chat-recv':
      const currfp = chatStat.currentChat?.key.getFingerprint().toUpperCase();
      if (msg.data.fp === currfp) {
        const e = createMessageElem(msg.data.text, msg.data.type);
        elements.chatMessages?.appendChild(e) && e.scrollIntoView({ behavior: 'smooth' });
      }
      elements.contactList && setupContactListItems(elements.contactList);
      break;
  }
});

// setupChatListeners
(() => {
  const adjustChatInputHeight = () => {
    const cin = elements.chatInput;
    if (!cin) return;
    const lc = cin.value.split('\n').length;
    cin.style.height = (lc > 1 ? lc * 15 : 20) + 'px';
  };
  const sendMessage = (isfocused: boolean) => {
    if (!elements.chatInput || !elements.chatMessages || !chatStat.currentChat) return;
    const message = elements.chatInput.value;
    if (!message || !message.trim()) return;
    const e = createMessageElem(message, 'outgoing'); // 发送的消息都是 outgoing 类型
    elements.chatMessages.appendChild(e) && e.scrollIntoView({ behavior: 'smooth' });
    chatStat.currentChat.sendMessage(message);
    elements.chatInput.value = ''; // 清空输入框
    adjustChatInputHeight();
    if (isfocused) elements.chatInput.focus(); // 防止虚拟键盘消失
  };
  let isfocused: boolean;
  if (elements.sendButton) {
    elements.sendButton.addEventListener('click', () => sendMessage(isfocused));
  }
  const cin = elements.chatInput;
  if (cin) {
    window.addEventListener('click', (e) => isfocused = e.target === cin);
    cin.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendMessage(isfocused);
    });
    cin.addEventListener('input', () => {
      adjustChatInputHeight();
      isfocused = true;
    });
  }
  let scrollBottom: number;
  elements.chatMessages!.addEventListener('scrollend', () => scrollBottom = elements.chatMessages!.scrollTop + elements.chatMessages!.clientHeight);
  window.addEventListener('resize', () => elements.chatMessages!.scrollTop = scrollBottom - elements.chatMessages!.clientHeight);
})();

// buttons
(() => {
  // 切换到聊天页
  elements.toggleButton?.addEventListener('click', () => {
    elements.chatMain?.classList.remove('hidden'); // 显示聊天页
  });
  // 切换回联系人列表
  elements.toggleButtonMobile?.addEventListener('click', () => {
    elements.chatMain?.classList.add('hidden'); // 隐藏聊天页
    chatStat.currentChat = null;
  });
  // addButton
  elements.addButton?.addEventListener('click', async () => {
    try {
      await addKeysFromArmored(prompt('Enter keys in ASCII-armored format:')!);
      elements.contactList && await setupContactListItems(elements.contactList);
    } catch (e) {
      console.warn(e);
      alert('Invalid keys format: ' + e);
    }
  });
})();

const setupContactListItems = async (elem: HTMLUListElement) => {
  const frag = document.createDocumentFragment();
  for (const k of await store.getAllKeys()) {
    const chat = new Chat(k);
    chatStat.chatMap.set(k.getFingerprint().toUpperCase(), chat);
    const li = document.createElement('li');
    li.className = 'contact-item';
    li.tabIndex = 0;
    li.role = 'button';
    li.dataset.fingerprint = k.getFingerprint().toUpperCase();
    const lastmsgmix = (await chat.lastMessage())?.message;
    const lastmsgstr = lastmsgmix instanceof Uint8Array ?
      (await doDecrypt(lastmsgmix)).data as string : lastmsgmix || '';
    // create elements and append
    /* <div class="avatar"><img src="${chat.avatar}" /></div>` +
     *   <div class="contact-info">' +
     *   <span class="contact-name">${chat.name}</span>` +
     *   <span class="last-message">${lastmsgstr}<span>` +
     * </div>
     */
    const ava = document.createElement('div');
    ava.className = 'avatar';
    const img = document.createElement('img');
    img.src = chat.avatar;
    ava.appendChild(img);
    const info = document.createElement('div');
    info.className = 'contact-info';
    const name = document.createElement('span');
    name.className = 'contact-name';
    name.textContent = chat.name;
    const lastmsg = document.createElement('span');
    lastmsg.className = 'last-message';
    lastmsg.textContent = lastmsgstr;
    info.appendChild(name);
    info.appendChild(lastmsg);
    li.appendChild(ava);
    li.appendChild(info);
    frag.appendChild(li);
  }
  elem.replaceChildren(frag);
}

// contact list (sidebar)
(async () => {
  if (!elements.contactList) return;
  // create list items
  setupContactListItems(elements.contactList);
  // set active
  let activeli = elements.contactList.children[0];
  // callback
  const cb = async (ev: MouseEvent | KeyboardEvent) => {
    if (!elements.chatMain) return;
    // ensure target
    const t = (ev.target as HTMLElement).closest('li');
    if (!t) return;
    // interactive
    i: if (ev instanceof KeyboardEvent) {
      if (ev.key === 'ArrowDown') {
        const next = t.nextElementSibling;
        next instanceof HTMLLIElement && next.focus();
      } else if (ev.key === 'ArrowUp') {
        const prev = t.previousElementSibling;
        prev instanceof HTMLLIElement && prev.focus();
      } else if (ev.key === 'ArrowRight') {
        elements.chatInput?.focus();
      } else if (ev.key === 'Enter') break i;
      return;
    }
    // toggle style
    activeli?.classList.remove('active');
    t.classList.add('active');
    activeli = t;
    // switch to chat
    elements.chatMain.classList.remove('hidden');
    if (elements.chatInput) elements.chatInput.disabled = false;
    if (elements.sendButton) elements.sendButton.disabled = false;
    // chatMain
    const fingerprint = t.dataset.fingerprint;
    if (!fingerprint) return;
    const chat = chatStat.chatMap.get(fingerprint)!;
    elements.chatMain.querySelector('.main-header > h3')!.textContent = chat.name;
    const messages = elements.chatMain.querySelector('.chat-messages')!;
    messages.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const mobj of ((await chat.fetchMessage(BigInt(Date.now() + '000000000'), Infinity)).reverse())) {
      if (typeof mobj.message !== 'string')
        mobj.message = (await doDecrypt(mobj.message)).data as string;
      frag.appendChild(createMessageElem(mobj.message, mobj.type));
    }
    messages.appendChild(frag);
    chatStat.currentChat = chat;
  }
  elements.contactList.addEventListener('click', cb);
  elements.contactList.addEventListener('keydown', cb);
})();
