import type { NextPage, NextPageContext } from 'next';
import Layout from '../components/Layout';
import HomeModule from '../components/Modules/Home/Home';

const HomePage: NextPage = () => {
  return (
    <Layout>
      <HomeModule />
    </Layout>
  );
};

export default HomePage;

export async function getServerSideProps(context: NextPageContext) {
  /**
   * Why these headers?
   * - FFmpeg core (ffmpeg-core) uses SharedArrayBuffer, SharedArrayBuffer is disabled
   * in all major browsers from 2018, reason = Spectre (security vulnerability)
   * - FFmpeg core won't load, if these headers are not present
   */

  // prevent XS-leaks, don't load cross origin documents in the same browsing context
  context?.res?.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  // prevent docs from loading cross-origin resource, only load resources from the same origin
  context?.res?.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  return {
    props: {},
  };
}
