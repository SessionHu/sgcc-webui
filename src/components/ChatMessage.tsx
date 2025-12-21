import React from 'react';
import { showAlert } from './Alert';
import type { DecryptedChatMessageRecord } from '../typings';
import styles from './ChatMessage.module.scss';

interface ChatMessageProps {
  message: DecryptedChatMessageRecord;
}

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  return (
    <div className={styles.messageContainer}>
      <div className={`${styles.message} ${styles[message.type]}`}>
        <span className={styles.messageContent} onDoubleClick={() => showAlert({
          title: 'Message Time',
          message: new Date(Number(message.msgid / 1000000n)).toLocaleString()
        })}>
          {message.message}
        </span>
      </div>
    </div>
  );
});

export default ChatMessage;
