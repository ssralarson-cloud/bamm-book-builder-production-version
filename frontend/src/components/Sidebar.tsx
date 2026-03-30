import './Sidebar.css';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="simple-sidebar">
      <div className="simple-sidebar-content">
        {children}
      </div>
    </aside>
  );
}
