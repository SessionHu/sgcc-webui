import React from 'react';
import type { Key } from 'openpgp';
import { Chat } from '../chat';
import styles from './ContactItem.module.scss';

interface ContactItemProps {
  contact: Key;
  isActive: boolean;
  onSelect: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ contact, isActive, onSelect }) => {
  // In a real app, you'd fetch last message asynchronously, maybe in a higher component
  const [lastMessage, setLastMessage] = React.useState('Loading...');
  const chat = new Chat(contact);
  const contactName = chat.name;
  const avatar = chat.avatar;

  React.useEffect(() => {
    // This is a simplified async operation inside useEffect
    const fetchLastMessage = async () => {
      const msg = await chat.lastMessage();
      // TODO: Decrypt if necessary
      setLastMessage(msg?.message as string || 'No messages yet');
    };
    fetchLastMessage();
  }, [contact]);

  return (
    <li
      className={`${styles.contactItem} ${isActive ? styles.active : ''}`}
      onClick={onSelect}
      tabIndex={0}
      role="button"
    >
      <div className={styles.avatar}>
        <img src={avatar} alt={`${contactName}'s avatar`} />
      </div>
      <div className={styles.contactInfo}>
        <span className={styles.contactName}>{contactName}</span>
        <span className={styles.lastMessage}>{lastMessage}</span>
      </div>
    </li>
  );
};

export default ContactItem;
