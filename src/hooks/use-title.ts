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
  "/settings": "Settings"
};

export const useTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const title = titles[location.pathname] || "Page Not Found";
    document.title = `${title} | Pocket Ledger`;
    
    // Update meta description if needed (though more complex with vanilla JS)
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", `${title} - Manage your finances efficiently with Pocket Ledger.`);
    }
  }, [location]);
};
