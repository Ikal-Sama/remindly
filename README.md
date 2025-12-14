# Remindly - Smart Task Reminder Application

Remindly is a powerful yet intuitive task reminder application designed to help you stay organized and never miss important deadlines. Built with modern web technologies, Remindly offers a seamless experience across all your devices.

## Features

- **Task Management**: Create, organize, and track your tasks efficiently
- **Smart Reminders**: Set timely notifications for important deadlines
- **Priority Organization**: Organize tasks by priority levels
- **Progress Tracking**: Monitor your task completion progress
- **Web-based**: Accessible from any device with a web browser
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **User Authentication**: Secure login and user profile management
- **Dark Mode**: Toggle between light and dark themes

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS for modern, responsive design
- **Fonts**: Custom typography with Audiowide font
- **Authentication**: Secure user authentication system
- **Icons**: Lucide React icons
- **Components**: Custom UI components with shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/remindly.git
cd remindly
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
remindly/
├── app/                    # Next.js app router pages
│   ├── about/            # About page
│   ├── dashboard/         # User dashboard
│   ├── pricing/           # Pricing page
│   ├── settings/          # User settings
│   └── page.tsx          # Home page
├── components/             # Reusable components
│   ├── shared/            # Shared components (navbar, etc.)
│   └── ui/               # UI components
├── lib/                   # Utility libraries
└── public/                 # Static assets
```

## Pages

- **Home**: Landing page with app overview and pricing
- **About**: Information about Remindly and the developer
- **Pricing**: Detailed pricing plans and feature comparison
- **Dashboard**: Main application interface for task management
- **Settings**: User profile and account settings

## Responsive Design

Remindly is fully responsive and optimized for:

- **Mobile devices** (320px+)
- **Tablets** (768px+)
- **Desktop** (1024px+)
- **Large screens** (1280px+)

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

Create a `.env.local` file for environment variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Contact the developer

---

**Built with ❤️ by [Daniel Jhon Bancale](https://github.com/ikalsama)**
