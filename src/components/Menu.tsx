import React from 'react';
import styles from './Menu.module.scss';

import { dbutil } from '../idbutils';

interface MenuProps {
  onClose: () => void;
}

const Menu: React.FC<MenuProps> = ({ onClose }) => {
  return (
    <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
      <div className={styles.menuOverlay} onClick={onClose}></div>
      <ul>
        <li><button onClick={async () => {
          const b = new Blob([await dbutil.exportDB()]);
          const a = document.createElement('a');
          a.download = Date.now() + '.json';
          a.href = URL.createObjectURL(b);
          a.onclick = () => setTimeout(() => {
            URL.revokeObjectURL(a.href);
            onClose();
          });
          a.click();
        }}>Export Data</button></li>
        <li><button onClick={() => {
          const e = document.createElement('input');
          e.type = 'file';
          e.accept = 'application/json';
          e.onchange = async () => {
            const file = e.files?.[0];
            if (!file) return onClose();
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = async () => {
              await dbutil.importDB(reader.result as string);
              location.reload();
            };
          };
          e.click();
        }}>Import Data</button></li>
      </ul>
    </div>
  );
};

export default Menu;
