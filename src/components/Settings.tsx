import React from 'react';
import styles from './Settings.module.scss';
import { dbutil, myinfo } from '../idbutils';
import { showAlert } from './Alert';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const backendInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    myinfo.backendUrl().then(url => {
     if (backendInputRef.current && url)
       backendInputRef.current.placeholder = url;
    });
  }, []);

  const handleExport = async () => {
    const b = new Blob([await dbutil.exportDB()]);
    const a = document.createElement('a');
    a.download = Date.now() + '.json';
    a.href = URL.createObjectURL(b);
    a.onclick = () => setTimeout(() => {
      URL.revokeObjectURL(a.href);
    });
    a.click();
    //onClose();
  };

  const handleImport = () => {
    const e = document.createElement('input');
    e.type = 'file';
    e.accept = 'application/json';
    e.onchange = async () => {
      const file = e.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = async () => {
        await dbutil.importDB(reader.result as string);
        location.reload();
      };
    };
    e.click();
    //onClose();
  };

  const handleSave = async () => {
    const val = backendInputRef.current?.value;
    if (!val) {
      onClose();
    } else if (/^https?:\/\/.+$/.test(val)) {
      const n = await myinfo.backendUrl(val);
      await showAlert({
        title: 'Switch SGCC Backend',
        message: 'Backend has been successfully switched to: ' + n
      });
      onClose();
    } else {
      await showAlert({
        title: 'Switch SGCC Backend',
        message: 'Invalid URL: ' + val
      });
    }
  };

  return (
    <div className={styles.settingsOverlay} onClick={onClose}>
      <div className={styles.settings} onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>
        <div className={styles.formGroup}>
          <label>Data Management</label>
          <div className={styles.buttonGroup}>
            <button onClick={handleExport} className={styles.secondaryButton}>Export Data</button>
            <button onClick={handleImport} className={styles.secondaryButton}>Import Data</button>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="backend-url">SGCC Backend URL</label>
          <input
            type="url"
            id="backend-url"
            placeholder="https://sgcc.xhustudio.eu.org/"
            ref={backendInputRef}
          />
        </div>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.secondaryButton}>Close</button>
          <button onClick={handleSave} className={styles.primaryButton}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
