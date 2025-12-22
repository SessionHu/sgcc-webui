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
        <span className={styles.messageContent} onDoubleClick={async () => {
          showAlert({
            title: 'Message Details',
            message:
              `ID: ${message.msgid}\n` +
              `Time: ${new Date(Number(message.msgid / 1000000n)).toISOString()}\n` +
              `Type: ${message.type}\n` +
              `Fingerprint: ${message.keyfp}\n` +
              `Verfied: ${'signatures' in message.message && (await Promise.all(message.message.signatures.map(async (v) => {
                return v.verified;
              }))).join(' ')}`
          });
        }}>
          {message.message.data}
        </span>
      </div>
    </div>
  );
});

export default ChatMessage;
