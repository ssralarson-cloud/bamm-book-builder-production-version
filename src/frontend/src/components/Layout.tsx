import { Outlet } from "@tanstack/react-router";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ isolation: "isolate" }}
    >
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
