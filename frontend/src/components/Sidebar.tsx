import './Sidebar.css';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="forest-sidebar">
      <div className="forest-sidebar-header">
        <img 
          src="/assets/generated/border-twig.dim_512x512.png" 
          alt="Border Twig" 
          className="forest-sidebar-ornament"
        />
      </div>
      <div className="forest-sidebar-content">
        {children}
      </div>
    </aside>
  );
}
