import React from 'react';
import ChatMessage from './ChatMessage';
import styles from './ChatWindow.module.scss';
import type { Chat } from '../chat';
import type { ChatMessageRecord } from '../typings';

interface ChatWindowProps {
  chat: Chat | null;
  messages: ChatMessageRecord[];
  onSendMessage: (message: string) => void;
  isVisible: boolean;
  toggleVisibility: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat, messages, onSendMessage, isVisible, toggleVisibility
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  //useEffect(() => {
  //  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  //}, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setInputValue('');
  };

  return (
    <div className={`${styles.chatMain} ${isVisible ? styles.visible : ''}`}>
      <header className={styles.mainHeader}>
        <button className={styles.toggleButton} onClick={toggleVisibility}>
          <span className="emoji-icon">&lt;</span>
        </button>
        <h3>{chat ? chat.name : 'Select a contact'}</h3>
      </header>
      <div className={styles.chatMessages}>
        {messages.map((msg) => (
          <ChatMessage key={msg.msgid.toString()} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <footer className={styles.chatInputArea}>
        <textarea
          placeholder="输入消息..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            e.target.style.height = e.target.value.split('\n').length * 15 + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={!chat}
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSendMessage}
          disabled={!chat || !inputValue.trim()}
        >
          发送
        </button>
      </footer>
    </div>
  );
};

export default ChatWindow;
