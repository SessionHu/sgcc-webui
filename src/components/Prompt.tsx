import React from 'react';
import { createRoot } from 'react-dom/client';
import styles from './Prompt.module.scss';

export interface PromptProps {
  title: string;
  label: string;
  type: 'text' | 'password' | 'multiline';
  onFinish: (value: string | null) => void;
}

const Prompt: React.FC<PromptProps> = ({ title, label, type, onFinish }) => {
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (type === 'multiline') {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [type]);

  const handleOk = () => {
    onFinish(value);
  };

  const handleCancel = () => {
    onFinish(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'multiline') {
      e.preventDefault();
      handleOk();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.prompt}>
        <h3 className={styles.title}>{title}</h3>
        <label className={styles.label} htmlFor="prompt-input">{label}</label>
        {type === 'multiline' ? (
          <textarea
            id="prompt-input"
            ref={textareaRef}
            className={`${styles.input} ${styles.textarea}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <input
            id="prompt-input"
            ref={inputRef}
            type={type}
            className={styles.input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}
        <div className={styles.buttons}>
          <button className={styles.button} onClick={handleCancel}>Cancel</button>
          <button className={styles.button} onClick={handleOk}>OK</button>
        </div>
      </div>
    </div>
  );
};

type PromptOptions = Omit<PromptProps, 'onFinish'>;

const promptQueue: {
  options: PromptOptions,
  resolve: (value: string | null) => void
}[] = [];
let isPromptActive = false;

const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);

const showNextPrompt = () => {
  if (promptQueue.length > 0 && !isPromptActive) {
    isPromptActive = true;
    const { options, resolve } = promptQueue.shift()!;

    const onFinish = (value: string | null) => {
      root.render(null);
      isPromptActive = false;
      resolve(value);
      showNextPrompt(); // Show next prompt in queue
    };

    root.render(<Prompt {...options} onFinish={onFinish} />);
  }
};

export const showPrompt = (options: PromptOptions): Promise<string | null> => {
  return new Promise((resolve) => {
    promptQueue.push({ options, resolve });
    showNextPrompt();
  });
};

export default Prompt;
