import Head from 'next/head';
import { FC, ReactElement } from 'react';

interface ISeoProps {
  title?: string;
  description?: string;
}

const Seo: FC<ISeoProps> = ({
  title = 'FFmpeg Web',
  description = 'A browser based terminal to run ffmpeg',
}: ISeoProps): ReactElement => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta charSet="utf-8" />
      <link rel="icon" href="/favicon.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  );
};

export default Seo;
