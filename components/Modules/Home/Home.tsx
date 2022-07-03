import dynamic from 'next/dynamic';
import { FC } from 'react';
import styles from './Home.module.css';

const FFMpegTerminal = dynamic(
  () => import('../../FFMpegTerminal/FFMpegTerminal'),
  /**
   * Note: its important to load this component on client side
   * Reason: the xterm terminal uses some browser apis
   */
  { ssr: false }
);

const Home: FC = () => {
  return (
    <main className={styles.container}>
      <div className={styles.ffmpegContainer}>
        <div className={styles.terminalContainer}>
          <FFMpegTerminal
            systemFiles={[]}
            onGeneratedFiles={async () => undefined}
          />
        </div>
      </div>
    </main>
  );
};

export default Home;
