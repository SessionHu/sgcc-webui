import React, { useState, useEffect } from 'react';
import type { Key } from 'openpgp';
import ContactItem from './ContactItem';
import Menu from './Menu';
import styles from './Sidebar.module.scss';
import { store, addKeysFromArmored } from '../keystore';
import { showPrompt } from './Prompt';

interface SidebarProps {
  activeContact: Key | null;
  onSelectContact: (key: Key) => void;
  toggleVisibility: () => void;
  onContactsLoaded: (contacts: Key[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeContact,
  onSelectContact,
  toggleVisibility,
  onContactsLoaded,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contacts, setContacts] = useState<Key[]>([]);

  // Load contacts on mount
  const loadContacts = async () => {
    try {
      const keys = await store.getAllKeys();
      setContacts(keys);
      onContactsLoaded(keys);
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
  };
  useEffect(() => {
    loadContacts();
  }, []);

  const handleAddContact = async () => {
    try {
      const armoredKeys = await showPrompt({
        label: 'Enter keys in ASCII-armored format:',
        title: 'Add contact',
        type: 'multiline'
      });
      if (armoredKeys) {
        await addKeysFromArmored(armoredKeys);
        await loadContacts();
      }
    } catch (e) {
      console.warn(e);
      alert('Invalid keys format: ' + e);
    }
  };

  const onMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={styles.chatSidebar}>
      <header className={styles.sidebarHeader}>
        <h3>Contacts</h3>
        <div>
          <button className={styles.menuButton} onClick={onMenuClick}>
            <span className="emoji-icon">≡</span>
          </button>
          {menuOpen && <Menu onClose={onMenuClick} />}
        </div>
        <button className={styles.addButton} onClick={handleAddContact}>
          <span className="emoji-icon">+</span>
        </button>
        <button className={styles.toggleButton} onClick={toggleVisibility}>
          <span className="emoji-icon">&gt;</span>
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
