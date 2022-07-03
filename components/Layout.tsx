import { FC, ReactElement, ReactNode } from 'react';
import Header from './Header/Header';
import SEO from './SEO';

interface ILayoutProps {
  children: ReactNode;
}

const Layout: FC<ILayoutProps> = ({ children }: ILayoutProps): ReactElement => {
  return (
    <>
      <SEO />
      <Header />
      {children}
    </>
  );
};

export default Layout;
