import React from 'react';
import ChatMessage from './ChatMessage';
import { showAlert } from './Alert';
import styles from './ChatWindow.module.scss';
import type { Chat } from '../chat';
import type { WindowMessage, DecryptedChatMessageRecord, ChatMessageRecord } from '../typings';
import * as keystore from '../keystore';

interface ChatWindowProps {
  chat: Chat | null;
  isVisible: boolean;
  toggleVisibility: (isVisible?: boolean) => void;
}

const MESSAGE_PAGE_SIZE = 30;

const ChatWindow: React.FC<ChatWindowProps> = ({
  chat, isVisible, toggleVisibility,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const textaeraRef = React.useRef<HTMLTextAreaElement>(null);
  
  const [prevScrollHeight, setPrevScrollHeight] = React.useState<number | null>(0);

  const [messages, setMessages] = React.useState<DecryptedChatMessageRecord[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  let sendinglock = false;
  const handleSendMessage = async () => {
    if (!chat || !textaeraRef.current || sendinglock) return;
    const ival = textaeraRef.current.value;
    if (!ival.trim()) return;
    sendinglock = true;
    const message = await keystore.doEncrypt(chat.key, ival);
    let msgrecord: ChatMessageRecord;
    try {
      msgrecord = await chat.sendMessage(message);
    } catch (e) {
      sendinglock = false;
      console.error('Message send failed', e);
      return showAlert({
        title: 'Error',
        message: 'Message send failed: ' + e,
      });
    }
    setMessages(prev => [...prev, {
      ...msgrecord, message: { data: ival }
    }]);
    setPrevScrollHeight(null);
    textaeraRef.current.value = '';
    textaeraRef.current.style.height = '';
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
    sendinglock = false;
  };

  React.useEffect(() => {
    if (!chat || !messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop < clientHeight + 100;
    if (messages.length && isAtBottom && !isInitialLoading && isVisible) {
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
        message: await keystore.doDecrypt(e.message)
      } as DecryptedChatMessageRecord;
    }));
  };

  // Handle incoming messages
  React.useEffect(() => {
    const handleMessage = async (e: MessageEvent<WindowMessage>) => {
      if (e.data.type === 'chat-recv') {
        const res = await keystore.doDecrypt(e.data.data.message);
        const reskeyid = res.signatures[0]?.keyID.toHex();
        if (!reskeyid) return;
        const reskeyfp = (await keystore.store.getKey(reskeyid))?.getFingerprint().toUpperCase()
        const currfp = chat?.key.getFingerprint().toUpperCase();
        if (reskeyfp && reskeyfp === currfp) {
          setMessages(prev => [...prev, {
            ...e.data.data,
            message: res,
            keyfp: reskeyfp
          }]);
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
        <button className={styles.toggleButton} onClick={() => toggleVisibility(false)}>
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
          onChange={(e) => {
            e.target.style.height = e.target.value.split('\n').length * 15 + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={!chat}
          ref={textaeraRef}
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSendMessage}
          disabled={!chat}
        >
          发送
        </button>
      </footer>
    </div>
  );
};

export default ChatWindow;
