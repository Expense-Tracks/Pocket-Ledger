# Expense Ledger

A modern, intuitive expense tracking application built with React, TypeScript, and Tailwind CSS.

## Features

- 💰 **Track Income & Expenses** - Easily record all your financial transactions
- 📊 **Visual Analytics** - Beautiful charts and graphs to understand your spending
- 🎯 **Budget Management** - Set and track budgets for different categories
- 💱 **Multi-Currency Support** - 15+ currencies with automatic formatting
- 🌓 **Dark Mode** - Light, dark, and system theme options
- 📱 **Mobile-First Design** - Responsive and works great on all devices
- 🎨 **Customizable Categories** - Create custom categories with emoji picker
- 💳 **Payment Methods** - Track different payment methods
- 💾 **Local Storage** - All data stored securely in your browser
- ⚙️ **Comprehensive Settings** - Customize currency, theme, categories, and more

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd expense-ledger

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build for Production

```sh
npm run build
```

### Run Tests

```sh
npm test
```

## Technologies Used

- **Vite** - Fast build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Recharts** - Charting library for analytics
- **emoji-picker-react** - Emoji selection component
- **date-fns** - Date manipulation
- **React Router** - Client-side routing
- **Sonner** - Toast notifications

## Project Structure

```
expense-ledger/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Finance, Settings)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and storage
│   ├── pages/          # Page components (Dashboard, Transactions, etc.)
│   ├── types/          # TypeScript type definitions
│   └── App.tsx         # Main app component
├── public/             # Static assets
└── index.html          # HTML entry point
```

## Features Documentation

- [Settings Feature](./SETTINGS_FEATURE.md) - Comprehensive settings documentation
- [Emoji Picker Feature](./EMOJI_PICKER_FEATURE.md) - Emoji picker usage guide

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
