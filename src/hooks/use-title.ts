import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/budgets": "Budgets",
  "/recurring": "Recurring",
  "/savings": "Savings Goals",
  "/debts": "Debts",
  "/investments": "Investments",
  "/split-bill": "Split Bill",
  "/split-bill/new": "New Split Bill",
  "/settings": "Settings"
};

export const useTitle = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle dynamic routes like /split-bill/:id
    let title = titles[location.pathname];
    
    if (!title && location.pathname.startsWith('/split-bill/')) {
      title = "View Split Bill";
    }
    
    if (!title) {
      title = "Page Not Found";
    }
    
    document.title = `${title} | Pocket Ledger`;
    
    // Update meta description if needed (though more complex with vanilla JS)
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", `${title} - Manage your finances efficiently with Pocket Ledger.`);
    }
  }, [location]);
};
