import React from 'react';
import styles from './Menu.module.scss';

import { dbutil, myinfo } from '../idbutils';
import { showPrompt } from './Prompt';
import { showAlert } from './Alert';

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
        <li><button onClick={async () => {
          onClose();
          const curr = await myinfo.backendUrl() || 'https://sgcc.xhustudio.eu.org';
          const ires = await showPrompt({
            title: 'Switch SGCC Backend',
            label: 'Enter the new SGCC backend base URL:',
            type: 'text',
            placeholder: curr
          });
          if (ires && /^https?:\/\/.+$/.test(ires)) {
            const n = await myinfo.backendUrl(ires);
            await showAlert({
              title: 'Switch SGCC Backend',
              message: 'Backend has been successfully switched to: ' + n
            });
          } else if (ires !== null) {
            await showAlert({
              title: 'Switch SGCC Backend',
              message: 'Invalid URL: ' + ires
            });
          }
        }}>Backend</button></li>
      </ul>
    </div>
  );
};

export default Menu;
