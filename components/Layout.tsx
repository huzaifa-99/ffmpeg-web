import { FC, ReactElement, ReactNode } from 'react';
import SEO from './SEO';

interface ILayoutProps {
  children: ReactNode;
}

const Layout: FC<ILayoutProps> = ({ children }: ILayoutProps): ReactElement => {
  return (
    <>
      <SEO />
      {children}
    </>
  );
};

export default Layout;
