import cn from 'classnames';
import { FC, ReactElement, ReactNode } from 'react';
import styles from './File.module.css';

export interface IFileActionButtons {
  onClick: () => void;
  icon: ReactNode;
}

export interface IFileProps {
  name: string;
  actionButtons?: Array<IFileActionButtons>;
}

const File: FC<IFileProps> = ({
  name,
  actionButtons = [],
}: IFileProps): ReactElement => {
  return (
    <div className={cn(styles.fileContainer, 'group')}>
      <span title={name} className={styles.fileName}>
        {name}
      </span>

      {actionButtons?.length > 0 && (
        <div className={cn(styles.actionButtons, 'group-hover:flex')}>
          {actionButtons.map((x, index) => (
            <button key={index} onClick={x.onClick}>
              {x.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default File;
