import { FC, ReactElement, useEffect, useState } from 'react';
import { EXAMPLE_COMMANDS } from './exampleCommands';
import styles from './Examples.module.css';

interface IExamplesModal {
  open: boolean;
  onClose: () => void;
  onPasteIntoTerminal: (command: string) => void;
}

const ExamplesModal: FC<IExamplesModal> = ({
  open,
  onClose,
  onPasteIntoTerminal,
}: IExamplesModal): ReactElement | null => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const copyCommand = async (id: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore clipboard errors (insecure context, permissions, etc.)
    }
  };

  const pasteCommand = (command: string) => {
    onPasteIntoTerminal(command);
    setCopiedId(null);
    onClose();
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="examples-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <h2 id="examples-modal-title" className={styles.heading}>
              Examples
            </h2>
            <p className={styles.intro}>
              Sample commands using the bundled media files. Copy or paste into
              the terminal.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close examples"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <ul className={styles.list}>
          {EXAMPLE_COMMANDS.map((example) => (
            <li key={example.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <h3 className={styles.title}>{example.title}</h3>
                <p className={styles.description}>{example.description}</p>
              </div>
              <pre className={styles.command} title={example.command}>
                <code>{example.command}</code>
              </pre>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => copyCommand(example.id, example.command)}
                >
                  {copiedId === example.id ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  className={styles.actionButtonPrimary}
                  onClick={() => pasteCommand(example.command)}
                >
                  Paste into terminal
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExamplesModal;
