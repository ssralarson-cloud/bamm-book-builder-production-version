import { Outlet } from '@tanstack/react-router';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col" style={{ isolation: 'isolate' }}>
      <Header />
      <main className="flex-1" style={{ position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
