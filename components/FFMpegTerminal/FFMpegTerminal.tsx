import 'xterm/css/xterm.css';
import { FC, ReactElement, useEffect } from 'react';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'react-contextmenu';
import styles from './FFMpegTerminal.module.css';
import { IFFMpegFileSystem } from './Terminal';
import useFFMpegTerminal from './useFFMpegTerminal';

let isMounted = false; // stores the mounted state of the terminal

interface IFFMpegTerminal {
  systemFiles: Array<IFFMpegFileSystem>;
  onGeneratedFiles: (files: Array<IFFMpegFileSystem>) => Promise<void>;
}

const FFMpegTerminal: FC<IFFMpegTerminal> = ({
  systemFiles = [],
  onGeneratedFiles,
}: IFFMpegTerminal): ReactElement => {
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

  return (
    <>
      <div className={styles.terminalContainer}>
        <ContextMenuTrigger
          /**
           * NOTE-
           * The context menu related components gave me an error if i tried to pass props as id="id"
           *
           * Error-
           * Type '{ children: Element; id: string; }' is not assignable to type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<ContextMenuTriggerProps, any, any>> & Readonly<...>'
           *
           * Reason-
           * This is a package related issue, the components in the package are not defined correctly
           *
           * Fix-
           * skip the block (executed by typescript) where the IntrinsicAttributes assignment is made, done by passing props with spread operator
           */
          {...{ id: 'context-menu' }}
        >
          <div
            id="terminal"
            className={styles.terminal}
            ref={terminalElRef}
          ></div>
        </ContextMenuTrigger>
      </div>
      <div className={styles.contextMenu}>
        <ContextMenu
          /**
           * NOTE-
           * The context menu related components gave me an error if i tried to pass props as id="id"
           *
           * Error-
           * Type '{ children: Element; id: string; }' is not assignable to type 'IntrinsicAttributes & IntrinsicClassAttributes<Component<ContextMenuTriggerProps, any, any>> & Readonly<...>'
           *
           * Reason-
           * This is a package related issue, the components in the package are not defined correctly
           *
           * Fix-
           * skip the block (exec by typescript) where the IntrinsicAttributes assignment is made, done by passing props with spread operator
           */
          {...{ id: 'context-menu', hideOnLeave: true }}
        >
          <MenuItem {...{ onClick: copySelectedTextToClipboard }}>
            Copy
          </MenuItem>
          <MenuItem {...{ onClick: pasteClipboardTextToTerminal }}>
            Paste
          </MenuItem>
          <MenuItem {...{ onClick: clearTerminal }}>Clear</MenuItem>
          <MenuItem {...{ onClick: runHelpCommand }}>Help</MenuItem>
        </ContextMenu>
      </div>
    </>
  );
};

export default FFMpegTerminal;
