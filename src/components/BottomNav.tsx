import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, BarChart3, Target, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/budgets', icon: Target, label: 'Budgets' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg bottom-nav-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 text-xs transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className={active ? 'font-semibold' : 'font-medium'}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
