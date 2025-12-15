import React from 'react';
import type { Key } from 'openpgp';
import ContactItem from './ContactItem';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  contacts: Key[];
  activeContact: Key | null;
  onSelectContact: (key: Key) => void;
  onAddContact: () => Promise<void>;
  toggleVisibility: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  contacts, 
  activeContact,
  onSelectContact, 
  onAddContact,
  toggleVisibility
}) => {

  return (
    <div className={styles.chatSidebar}>
      <header className={styles.sidebarHeader}>
        <h3>Contacts</h3>
        <button className={styles.addButton} onClick={onAddContact}>
          <span className="emoji-icon">+</span>
        </button>
        <button className={styles.toggleButton} onClick={toggleVisibility}>
          <span className="emoji-icon">＞</span>
        </button>
      </header>
      <ul className={styles.contactList}>
        {contacts.map((contact) => (
          <ContactItem
            key={contact.getFingerprint()}
            contact={contact}
            isActive={activeContact?.getFingerprint() === contact.getFingerprint()}
            onSelect={() => onSelectContact(contact)}
          />
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
