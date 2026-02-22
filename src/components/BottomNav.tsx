import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, RefreshCw, MoreHorizontal, BarChart3, Target, PiggyBank, Settings, HandCoins } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const primaryItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budgets', icon: Target, label: 'Budgets' },
];

const moreItems = [
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { to: '/savings', icon: PiggyBank, label: 'Savings' },
  { to: '/debts', icon: HandCoins, label: 'Debts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some(i => i.to === pathname);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg bottom-nav-safe">
        <div className="mx-auto flex max-w-lg items-center justify-evenly px-0 py-1">
          {primaryItems.map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className={`truncate max-w-full px-1 ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] transition-colors ${
              isMoreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={isMoreActive ? 2.5 : 2} />
            <span className={`truncate max-w-full px-1 ${isMoreActive ? 'font-semibold' : 'font-medium'}`}>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {moreItems.map(({ to, icon: Icon, label }) => {
              const active = pathname === to;
              return (
                <button
                  key={to}
                  onClick={() => { navigate(to); setMoreOpen(false); }}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                  <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
