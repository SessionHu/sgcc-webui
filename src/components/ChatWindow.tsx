import React from 'react';
import ChatMessage from './ChatMessage';
import styles from './ChatWindow.module.scss';
import type { Chat } from '../chat';
import type { WindowMessage, DecryptedChatMessageRecord } from '../typings';
import * as keystore from '../keystore';

interface ChatWindowProps {
  chat: Chat | null;
  isVisible: boolean;
  toggleVisibility: () => void;
}

const MESSAGE_PAGE_SIZE = 30;

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat, isVisible, toggleVisibility,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  
  const [prevScrollHeight, setPrevScrollHeight] = React.useState<number | null>(0);

  const [messages, setMessages] = React.useState<DecryptedChatMessageRecord[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  const handleSendMessage = async () => {
    if (!chat || !inputValue.trim()) return;
    const message = await keystore.doEncrypt(chat.key, inputValue);
    const msgrecord = await chat.sendMessage(message);
    setMessages(prev => [...prev, { ...msgrecord, message: inputValue }]);
    setInputValue('');
    setPrevScrollHeight(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  React.useEffect(() => {
    if (!chat || !messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop < clientHeight + 100;
    if (messages.length && isAtBottom && !isInitialLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length && messagesContainerRef.current && isInitialLoading) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight,
      setIsInitialLoading(false);
    }
  }, [messages]);

  const fetchDecryptedMessages = async (chat: Chat, offset: bigint, limit: number) => {
    const msgs = (await chat.fetchMessage(offset, limit)).reverse();
    return Promise.all(msgs.map(async (e) => {
      return {
        ...e,
        message: (await keystore.doDecrypt(e.message)).data
      };
    }));
  };

  // Handle incoming messages
  React.useEffect(() => {
    const handleMessage = async (e: MessageEvent<WindowMessage>) => {
      if (e.data.type === 'chat-recv') {
        const currfp = chat?.key.getFingerprint().toUpperCase();
        if (e.data.data.keyfp === currfp) {
          setMessages(prev => [...prev, e.data.data]);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [chat]);

  React.useEffect(() => {
    if (!chat) return;
    setHasMore(true);
    setIsInitialLoading(true);
    (async () => {
      setIsLoadingMore(true);
      const history = await fetchDecryptedMessages(chat, BigInt(Date.now() + '000000000'), MESSAGE_PAGE_SIZE);
      setMessages(history);
      if (history.length < MESSAGE_PAGE_SIZE) {
        setHasMore(false);
      }
      setIsLoadingMore(false);
    })();
  }, [chat]);

  const handleLoadMore = async () => {
    if (!chat || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const oldestMessageId = messages[0]?.msgid;
    if (!oldestMessageId) {
      setIsLoadingMore(false);
      return;
    }
    const olderMessages = await fetchDecryptedMessages(chat, oldestMessageId, MESSAGE_PAGE_SIZE);
    if (olderMessages.length > 0) {
      // Prepend older messages
      setMessages(prev => [...olderMessages, ...prev]);
    }
    if (olderMessages.length < MESSAGE_PAGE_SIZE) {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  };

  const handleScroll = () => {
    if (chat && messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop < 5 && hasMore && !isLoadingMore) {
        setPrevScrollHeight(messagesContainerRef.current.scrollHeight);
        handleLoadMore();
      }
    }
  };

  React.useEffect(() => {
    if (chat && messagesContainerRef.current && prevScrollHeight !== null)
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevScrollHeight;
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
