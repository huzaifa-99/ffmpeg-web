import type { NextPage } from 'next';
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
