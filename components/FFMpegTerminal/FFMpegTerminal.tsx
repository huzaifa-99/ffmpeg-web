import '@xterm/xterm/css/xterm.css';
import { FC, ReactElement, useEffect, useState } from 'react';
import styles from './FFMpegTerminal.module.css';
import { IFFMpegFileSystem } from './Terminal';
import useFFMpegTerminal from './useFFMpegTerminal';

let isMounted = false; // stores the mounted state of the terminal

interface IFFMpegTerminal {
  systemFiles: Array<IFFMpegFileSystem>;
  onGeneratedFiles: (files: Array<IFFMpegFileSystem>) => Promise<void>;
}

interface IContextMenuState {
  x: number;
  y: number;
}

const FFMpegTerminal: FC<IFFMpegTerminal> = ({
  systemFiles = [],
  onGeneratedFiles,
}: IFFMpegTerminal): ReactElement => {
  const [contextMenu, setContextMenu] = useState<IContextMenuState | null>(
    null
  );
  const {
    terminalElRef,
    mountTerminalToContainer,
    updateFFMpegSystemFiles,
    copySelectedTextToClipboard,
    pasteClipboardTextToTerminal,
    clearTerminal,
    runHelpCommand,
  } = useFFMpegTerminal({
    onGeneratedFiles,
  });

  // update terminal system files on props update
  useEffect(() => {
    updateFFMpegSystemFiles(systemFiles);
  }, [systemFiles, updateFFMpegSystemFiles]);

  // mount terminal to container on container ref load
  useEffect(() => {
    if (terminalElRef.current && !isMounted) {
      isMounted = true;
      mountTerminalToContainer(terminalElRef.current);
    }
  }, [terminalElRef, mountTerminalToContainer]);

  useEffect(() => {
    if (!contextMenu) return;

    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [contextMenu]);

  const runMenuAction = async (action: () => void | Promise<void>) => {
    setContextMenu(null);
    await action();
  };

  return (
    <>
      <div className={styles.terminalContainer}>
        <div
          id="terminal"
          className={styles.terminal}
          ref={terminalElRef}
          onContextMenu={(event) => {
            event.preventDefault();
            setContextMenu({ x: event.clientX, y: event.clientY });
          }}
        />
      </div>
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => runMenuAction(copySelectedTextToClipboard)}
          >
            Copy
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runMenuAction(pasteClipboardTextToTerminal)}
          >
            Paste
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              runMenuAction(() => {
                clearTerminal();
              })
            }
          >
            Clear
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              runMenuAction(() => {
                runHelpCommand();
              })
            }
          >
            Help
          </button>
        </div>
      )}
    </>
  );
};

export default FFMpegTerminal;
