import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { Chat } from './chat';
import type { Key } from 'openpgp';
import styles from './App.module.scss';

function App() {
  const [activeContact, setActiveContact] = useState<Key | null>(null);
  const [isChatWindowVisible, setChatWindowVisible] = useState(false);

  const [chat, setChat] = useState<Chat | null>(null);

  // Handle active contact change: load messages
  useEffect(() => {
    setChat(activeContact ? new Chat(activeContact) : null);
  }, [activeContact]);

  const toggleSidebar = (isVisible?: boolean) => {
    setChatWindowVisible(isVisible ?? !isChatWindowVisible);
  };

  return (
    <div className={styles.chatContainer}>
      <Sidebar
        activeContact={activeContact}
        onSelectContact={(k) => {
          setActiveContact(k);
          toggleSidebar(true);
        }}
        toggleVisibility={toggleSidebar}
      />
      <ChatWindow
        chat={chat}
        isVisible={isChatWindowVisible}
        toggleVisibility={toggleSidebar}
      />
    </div>
  );
}

export default App;
