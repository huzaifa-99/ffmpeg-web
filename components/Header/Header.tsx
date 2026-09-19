import Link from 'next/link';
import { FC, ReactElement, ReactNode } from 'react';
import { BsGithub } from 'react-icons/bs';
import styles from './Header.module.css';

interface IHeader {
  actions?: ReactNode;
}

const Header: FC<IHeader> = ({ actions }: IHeader): ReactElement => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <Link href="/">FFmpeg web</Link>
      </h1>

      <div className={styles.actions}>
        {actions}
        <a
          href="https://github.com/huzaifa-99/ffmpeg-web"
          target="_blank"
          rel="noreferrer"
        >
          <button aria-label="github-link" className={styles.githubLogo}>
            <BsGithub />
          </button>
        </a>
      </div>
    </header>
  );
};

export default Header;
