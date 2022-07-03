import 'rc-tooltip/assets/bootstrap.css';
import Tooltip from 'rc-tooltip';
import { FC, ReactElement, ReactNode } from 'react';
import { IoMdHelpCircleOutline } from 'react-icons/io';
import File, { IFileProps } from './File/File';
import styles from './FileTree.module.css';

export interface IFileTreeActionButtons {
  onClick: () => void;
  text: string;
}

export interface IFileTree {
  name: string;
  tooltip?: ReactNode;
  files?: Array<IFileProps>;
  actionButtons?: Array<IFileTreeActionButtons>;
}

const FileTree: FC<IFileTree> = ({
  name,
  tooltip,
  files = [],
  actionButtons = [],
}: IFileTree): ReactElement => {
  return (
    <div className={styles.fileTree}>
      <div className={styles.header}>
        {name}
        {tooltip && (
          <button className={styles.tooltip} aria-label="tooltip">
            <Tooltip
              overlayStyle={{ opacity: '1', maxWidth: '300px' }}
              overlayInnerStyle={{ backgroundColor: '#000000' }}
              placement="bottom"
              trigger={['hover']}
              overlay={tooltip}
            >
              <IoMdHelpCircleOutline size={18} />
            </Tooltip>
          </button>
        )}
      </div>

      <div className={styles.files}>
        {files?.map((x, index) => (
          <File key={index} name={x.name} actionButtons={x.actionButtons} />
        ))}
      </div>

      {actionButtons.map((x, index) => (
        <button key={index} className={styles.actionButton} onClick={x.onClick}>
          {x.text}
        </button>
      ))}
    </div>
  );
};

export default FileTree;
