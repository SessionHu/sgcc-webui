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
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat, messages, onSendMessage, isVisible, toggleVisibility,
  onLoadMore, hasMore, isLoadingMore
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  const [prevScrollHeight, setPrevScrollHeight] = React.useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    setInputValue('');
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    setIsInitialLoad(true);
  }, [chat]);

  React.useEffect(() => {
    if (isInitialLoad && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      setIsInitialLoad(false);
    } else if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop < clientHeight + 100;
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isInitialLoad]);


  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop < 5 && hasMore && !isLoadingMore) {
        setPrevScrollHeight(messagesContainerRef.current.scrollHeight);
        onLoadMore();
      }
    }
  };

  React.useLayoutEffect(() => {
    if (prevScrollHeight !== null && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevScrollHeight;
      setPrevScrollHeight(null);
    }
  }, [messages, prevScrollHeight]);


  return (
    <div className={`${styles.chatMain} ${isVisible ? styles.visible : ''}`}>
      <header className={styles.mainHeader}>
        <button className={styles.toggleButton} onClick={toggleVisibility}>
          <span className="emoji-icon">&lt;</span>
        </button>
        <h3>{chat && chat.name}</h3>
      </header>
      <div className={styles.chatMessages} ref={messagesContainerRef} onScroll={handleScroll}>
        {isLoadingMore && <div className={styles.loader}>Loading older messages...</div>}
        {!hasMore && messages.length > 0 && <div className={styles.loader}>No more messages</div>}
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
