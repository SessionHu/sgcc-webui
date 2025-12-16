import React from 'react';
import { doDecrypt } from '../keystore';

interface MessageContentProps {
  message: Uint8Array;
}

const MessageContent: React.FC<MessageContentProps> = React.memo(({ message }) => {
  const [content, setContent] = React.useState('...');

  React.useEffect(() => {
    let isMounted = true;

    doDecrypt(message).then(decrypted => {
      if (isMounted) {
        setContent(decrypted.data);
      }
    }).catch(error => {
      console.error('Failed to decrypt message:', error);
      if (isMounted) {
        setContent(String(message));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [message]);

  return <>{content}</>;
});

export default MessageContent;
