import React from 'react';
import pLimit from 'p-limit';
import { doDecrypt } from '../keystore';
import type { ChatMessageRecord } from '../idbutils';
import styles from './ChatMessage.module.scss';

interface ChatMessageProps {
  message: ChatMessageRecord;
}

const limit = pLimit(navigator.hardwareConcurrency || 4);

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  const [content, setContent] = React.useState('...');

  React.useEffect(() => {
    let isMounted = true;

    limit(async () => {
      try {
        const d = await doDecrypt(message.message);
        if (isMounted)
          setContent(d.data);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        if (isMounted)
          setContent(String(message.message));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [message.message]);

  return (
    <div className={styles.messageContainer}>
      <div className={`${styles.message} ${styles[message.type]}`}>
        <span className={styles.messageContent}>
          {content}
        </span>
      </div>
    </div>
  );
});

export default ChatMessage;
