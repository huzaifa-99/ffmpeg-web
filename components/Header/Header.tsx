import Link from 'next/link';
import { FC, ReactElement } from 'react';
import { BsGithub } from 'react-icons/bs';
import styles from './Header.module.css';

const Header: FC = (): ReactElement => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <Link href="/">
          <a>FFmpeg web</a>
        </Link>
      </h1>

      <a href="https://github.com/huzaifa-99/ffmpeg-web">
        <button aria-label="github-link" className={styles.githubLogo}>
          <BsGithub />
        </button>
      </a>
    </header>
  );
};

export default Header;
