import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { showPrompt } from './components/Prompt';
import { store, addKeysFromArmored, doEncrypt } from './keystore';
import { Chat } from './chat';
import type { Key } from 'openpgp';
import type { WindowMessage, ChatMessageRecord  } from './typings';
import styles from './App.module.scss';

const MESSAGE_PAGE_SIZE = 30;

function App() {
  const [contacts, setContacts] = useState<Key[]>([]);
  const [activeContact, setActiveContact] = useState<Key | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load contacts on mount
  const loadContacts = async () => {
    try {
      const keys = await store.getAllKeys();
      setContacts(keys);
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
  };
  useEffect(() => {
    loadContacts();
  }, []);

  // Handle active contact change: load messages
  useEffect(() => {
    if (activeContact) {
      const currentChat = new Chat(activeContact);
      setChat(currentChat);
      setHasMore(true);

      const fetchMessages = async () => {
        setIsLoadingMore(true);
        const history = (await currentChat.fetchMessage(BigInt(Date.now() + '000000000'), MESSAGE_PAGE_SIZE)).reverse();
        setMessages(history);
        if (history.length < MESSAGE_PAGE_SIZE) {
          setHasMore(false);
        }
        setIsLoadingMore(false);
      };
      fetchMessages();
    } else {
      setChat(null);
      setMessages([]);
    }
  }, [activeContact]);

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent<WindowMessage>) => {
      if (e.data.type === 'chat-recv') {
        const currfp = activeContact?.getFingerprint().toUpperCase();
        if (e.data.data.keyfp === currfp) {
          setMessages(prev => [...prev, e.data.data]);
        }
        loadContacts();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeContact]);


  const handleAddContact = async () => {
    try {
      const armoredKeys = await showPrompt({
        label: 'Enter keys in ASCII-armored format:',
        title: 'Add contact',
        type: 'multiline'
      });
      if (armoredKeys) {
        await addKeysFromArmored(armoredKeys);
        await loadContacts();
      }
    } catch (e) {
      console.warn(e);
      alert('Invalid keys format: ' + e);
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!chat || !messageContent.trim()) return;
    const message = await doEncrypt(chat.key, messageContent);
    const msgrecord = await chat.sendMessage(message);
    setMessages(prev => [...prev, msgrecord]);

  };

  const handleLoadMore = async () => {
    if (!chat || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const oldestMessageId = messages[0]?.msgid;
    if (!oldestMessageId) {
      setIsLoadingMore(false);
      return;
    }

    const olderMessages = (await chat.fetchMessage(oldestMessageId, MESSAGE_PAGE_SIZE)).reverse();

    if (olderMessages.length > 0) {
      // Prepend older messages
      setMessages(prev => [...olderMessages, ...prev]);
    }

    if (olderMessages.length < MESSAGE_PAGE_SIZE) {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className={styles.chatContainer}>
      <Sidebar
        contacts={contacts}
        activeContact={activeContact}
        onSelectContact={(k) => {
          setActiveContact(k);
          toggleSidebar();
        }}
        onAddContact={handleAddContact}
        toggleVisibility={toggleSidebar}
      />
      <ChatWindow
        chat={chat}
        messages={messages}
        onSendMessage={handleSendMessage}
        isVisible={!isSidebarVisible || window.innerWidth > 768}
        toggleVisibility={toggleSidebar}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
}

export default App;
