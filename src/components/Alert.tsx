import React from 'react';
import { createRoot } from 'react-dom/client';
import styles from './Alert.module.scss';

export interface AlertProps {
  title: string;
  message: string;
  onFinish: () => void;
}

const Alert: React.FC<AlertProps> = ({ title, message, onFinish }) => {
  const okButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    okButtonRef.current?.focus();
  }, []);

  const handleOk = () => {
    onFinish();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleOk();
    }
  };

  return (
    <div className={styles.overlay} onKeyDown={handleKeyDown}>
      <div className={styles.alert}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.message}>{message}</div>
        <div className={styles.buttons}>
          <button ref={okButtonRef} className={styles.buttonOK} onClick={handleOk}>OK</button>
        </div>
      </div>
    </div>
  );
};

type AlertOptions = Omit<AlertProps, 'onFinish'>;

const alertQueue: {
  options: AlertOptions,
  resolve: () => void
}[] = [];
let isAlertActive = false;

let root: ReturnType<typeof createRoot> | null = null;

const showNextAlert = () => {
  if (alertQueue.length > 0 && !isAlertActive) {
    if (!root) {
      const container = document.getElementById('alert');
      if (!container) {
        console.error('The element with id "alert" was not found in the DOM.');
        // Clear queue to prevent infinite loops on error
        alertQueue.length = 0;
        return;
      }
      root = createRoot(container);
    }

    isAlertActive = true;
    const { options, resolve } = alertQueue.shift()!;

    const onFinish = () => {
      root!.render(null);
      isAlertActive = false;
      resolve();
      showNextAlert();
    };

    root!.render(
      <React.StrictMode>
        <Alert {...options} onFinish={onFinish} />
      </React.StrictMode>
    );
  }
};

export const showAlert = async (options: AlertOptions | string): Promise<void> => {
  const alertOptions = typeof options === 'string' ? { title: 'Alert', message: options } : options;
  return new Promise((resolve) => {
    alertQueue.push({ options: alertOptions, resolve });
    showNextAlert();
  });
};

export default Alert;
