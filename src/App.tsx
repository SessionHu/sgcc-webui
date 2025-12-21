import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { Chat } from './chat';
import type { Key } from 'openpgp';
import styles from './App.module.scss';

function App() {
  const [activeContact, setActiveContact] = useState<Key | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const [chat, setChat] = useState<Chat | null>(null);

  // Handle active contact change: load messages
  useEffect(() => {
    setChat(activeContact ? new Chat(activeContact) : null);
  }, [activeContact]);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const handleContactsLoaded = (contacts: Key[]) => {
    if (contacts.length > 0) {
      if (!activeContact) {
        setActiveContact(contacts[0]!);
      }
    } else {
      setActiveContact(null);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <Sidebar
        activeContact={activeContact}
        onSelectContact={(k) => {
          setActiveContact(k);
          toggleSidebar();
        }}
        toggleVisibility={toggleSidebar}
        onContactsLoaded={handleContactsLoaded}
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
