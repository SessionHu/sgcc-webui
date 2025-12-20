import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { showPrompt } from './components/Prompt';
import { store, addKeysFromArmored } from './keystore';
import { Chat } from './chat';
import type { Key } from 'openpgp';
import styles from './App.module.scss';

function App() {
  const [contacts, setContacts] = useState<Key[]>([]);
  const [activeContact, setActiveContact] = useState<Key | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const [chat, setChat] = useState<Chat | null>(null);

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
    } else {
      setChat(null);
    }
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
        isVisible={!isSidebarVisible || window.innerWidth > 768}
        toggleVisibility={toggleSidebar}
      />
    </div>
  );
}

export default App;
