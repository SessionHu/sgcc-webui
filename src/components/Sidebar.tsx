import React from 'react';
import type { Key } from 'openpgp';
import ContactItem from './ContactItem';
import Menu from './Menu';
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
  toggleVisibility,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

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
        <button className={styles.addButton} onClick={onAddContact}>
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
