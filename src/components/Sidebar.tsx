import React from 'react';
import Menu from './Menu';
import styles from './Sidebar.module.scss';
import { showPrompt } from './Prompt';
import { showAlert } from './Alert';
import { Chat } from '../chat';
import { store, addKeysFromArmored } from '../keystore';
import { doDecrypt } from '../keystore';
import type { Key } from 'openpgp';
import type { WindowMessage } from '../typings';

interface SidebarProps {
  activeContact: Key | null;
  onSelectContact: (key: Key) => void;
  toggleVisibility: (isVisible?: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeContact,
  onSelectContact,
  toggleVisibility,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [contacts, setContacts] = React.useState<{
    avatar: string,
    name: string,
    active: boolean,
    msg: string,
    key: Key
  }[]>([]);

  // Load contacts on mount
  const loadContacts = React.useCallback(async () => {
    try {
      const keys = await store.getAllKeys();
      setContacts(await Promise.all(keys.map(async (key) => {
        const c = new Chat(key);
        const m = await c.lastMessage();
        return {
          avatar: c.avatar,
          name: c.name,
          active: key.getFingerprint() === activeContact?.getFingerprint(),
          key,
          msg: m ? (await doDecrypt(m.message)).data : ''
        };
      })));
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
  }, [activeContact]);
  React.useEffect(() => {
    loadContacts();
    const handleMessage = async (e: MessageEvent<WindowMessage>) => {
      if (e.data.type === 'idb-msg-update') {
        await loadContacts();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadContacts]);

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
      await showAlert({
        title: 'Error adding contact',
        message: 'Invalid keys format: ' + e
      });
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
        <button className={styles.toggleButton} onClick={() => toggleVisibility(true)}>
          <span className="emoji-icon">&gt;</span>
        </button>
      </header>
      <ul className={styles.contactList}>
        {contacts.map((e) => (
          <li
            key={e.key.getFingerprint()}
            className={`${styles.contactItem} ${e.active ? styles.active : ''}`}
            onClick={() => onSelectContact(e.key)}
            tabIndex={0}
            role="button"
          >
            <div className={styles.avatar}>
              <img src={e.avatar} alt={`${e.name}'s avatar`} />
            </div>
            <div className={styles.contactInfo}>
              <span className={styles.contactName}>{e.name}</span>
              <span className={styles.lastMessage}>{e.msg}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
