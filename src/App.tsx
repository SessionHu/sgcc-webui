import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { showPrompt } from './components/Prompt';
import { store, addKeysFromArmored, doEncrypt } from './keystore';
import { Chat } from './chat';
import type { Key } from 'openpgp';
import type { WindowMessage } from './typings';
import type { ChatMessageRecord } from './idbutils';
import styles from './App.module.scss';

function App() {
  const [contacts, setContacts] = useState<Key[]>([]);
  const [activeContact, setActiveContact] = useState<Key | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);

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

      const fetchMessages = async () => {
        const history = (await currentChat.fetchMessage(BigInt(Date.now() + '000000000'), Infinity)).reverse();
        setMessages(history);
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
        // TODO: Update last message for non-active chats in sidebar
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
      />
    </div>
  );
}

export default App;
