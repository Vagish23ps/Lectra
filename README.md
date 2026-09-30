# Lectra

Lectra is a local-first personal capture and task management application built for Android and the web. It provides a lightweight space to quickly capture notes and thoughts, organize actionable tasks with deadlines, schedule custom reminders, and manage document and photo attachments entirely on your device.

## Overview

Lectra was originally designed as a class and lecture notebook, but has evolved into a general-purpose capture and organization tool. Rather than separating notes from tasks and reminders across multiple tools, Lectra brings them into a unified, distraction-free interface.

Everything in Lectra runs offline and is stored directly on your device. You can jot down thoughts with full context, attach photos or PDF documents, break items down into actionable tasks with deadlines, and configure one-time or recurring reminders without needing an account or external server.

## Features

### Capture and Entries
- **Quick Capture**: Fast entry creation with title, optional category/subject, and details.
- **Draft Auto-Saving**: An uncommitted entry draft is automatically preserved in local storage so you do not lose progress when navigating away.
- **Interactive Modals**: Dialog-based creation, editing, and detailed viewing with smooth animations.
- **Tags and Categories**: Custom color-coded tags for organizing and filtering entries.

### Tasks and Pending Work
- **Entry-Linked Tasks**: Add multiple work items to any entry, each with an optional deadline and importance flag.
- **One-Tap Completion**: Mark tasks done directly from the dashboard, pending list, or entry view, with an instant Undo action.
- **Inline Task Creation**: Add tasks directly while viewing an entry without opening the full edit dialog.
- **Urgency Classification**: Tasks are automatically grouped into Overdue, Due Today, Tomorrow, Upcoming, and Other.
- **Dedicated Pending View**: A focused screen for reviewing and completing pending tasks across all entries.

### Reminders and Notifications
- **Custom Reminders**: Set one-time alerts for specific dates and times, or recurring reminders that repeat daily, weekly on chosen days, or monthly.
- **Reminder Controls**: Pause and resume individual reminders, skip the next scheduled occurrence, or snooze alerts for preset durations (15 min, 1 hour, tomorrow) or custom intervals.
- **Automated Task Reminders**: Optional system alerts for overdue tasks, tasks due today, tasks due tomorrow, and a weekly summary.
- **Notification History**: In-app notification center that logs delivered reminders with unread tracking and direct deep-linking to the referenced entry or task.

### Search and Calendar
- **Real-Time Search**: Instant search matching entry titles, categories, notes, tags, and individual task text.
- **Calendar Timeline**: Month and day views to browse notes and tasks logged on specific dates.
- **Status Heatmap**: Calendar indicators that show completed, pending, and important items by day.

### Attachments and Storage
- **Photo and PDF Support**: Attach images and PDF documents directly to entries (up to 20 MB per file).
- **In-App Previews**: Embedded image viewer with zoom controls and PDF document reader powered by PDF.js.
- **Native File Export**: Save attached files back to the device's local file system.
- **Storage Management**: Storage dashboard showing exact disk usage for app data and attachments, with tools to remove files or purge orphaned attachments.

### Backup and Restore
- **JSON Backup**: Lightweight export of all entries, tags, notification settings, and notification history.
- **Full ZIP Archive**: Complete backup packaging app data alongside binary attachment files.
- **Restore Support**: Seamless restoration from either JSON or ZIP backup files.

### Android and Mobile Experience
- **Capacitor Integration**: Native Android wrapper supporting hardware Back navigation, status bar theming, and local notifications.
- **Safe-Area Insets**: Proper padding for system status and navigation bars.
- **Theme Support**: Light, Dark, and System theme modes.

## Screenshots

| Dashboard | Add Entry |
| :---: | :---: |
| ![Lectra Dashboard](Screenshots/dashboard.png) | ![Add Entry Dialog](Screenshots/add-entry.png) |

| Entry Details | Pending Tasks |
| :---: | :---: |
| ![View Entry Dialog](Screenshots/view-entry.png) | ![Pending Tasks](Screenshots/important-tasks.png) |

| Notification Center | Calendar View |
| :---: | :---: |
| ![Notification Center](Screenshots/notifications.png) | ![Calendar](Screenshots/calendar-ui.png) |

| Real-Time Search |
| :---: |
| ![Search Screen](Screenshots/search.png) |

## How Lectra Works

Lectra is built around a local-first, offline-only architecture:

1. **State Persistence**: Application state (entries, tags, notification settings, drafts, and theme) is managed using Zustand stores with `persist` middleware, storing structured JSON in `localStorage` under `lectra-*` keys.
2. **Binary Attachment Storage**: To prevent exceeding `localStorage` quotas, file attachments (photos and PDFs) are stored as binary Blobs in **IndexedDB** (`lectra_attachments_db`, `files` store). The entry object in `localStorage` retains only lightweight metadata (`id`, `name`, `type`, `size`, `createdAt`).
3. **Notification Pipeline**: Native alarms are scheduled on Android through `@capacitor/local-notifications`. When a reminder triggers, tapping it routes the user directly to the linked entry or task via deep-linking logic, and an event is logged in the notification history store.
4. **Data Portability**: The backup service reads directly from `localStorage` and IndexedDB, producing a self-contained ZIP archive or JSON file that can be restored on another device without network dependencies.

## Tech Stack

- **Framework**: Next.js 16.2.9 (App Router, static export)
- **UI Library**: React 19.2.4
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4, Radix UI primitives, Lucide React icons, tw-animate-css
- **Mobile Engine**: Capacitor 8 (`@capacitor/core` 8.4.2, `@capacitor/android` 8.4.2, `@capacitor/cli` 8.4.2)
- **Native Plugins**: `@capacitor/local-notifications` 8.2.1, `@capacitor/filesystem` 8.1.3, `@capacitor/status-bar` 8.0.3, `@capacitor/app` 8.1.1
- **State Management**: Zustand 5.0.14
- **Local Database**: IndexedDB (native browser API)
- **Utilities**: date-fns 4.4.0, JSZip 3.10.1, PDF.js (`pdfjs-dist` 6.3.289), Sonner 2.0.7

## Project Structure

```text
├── android/            # Capacitor Android native project and Gradle configuration
├── app/                # Next.js App Router pages and layout
│   ├── calendar/       # Calendar view (/calendar)
│   ├── notifications/  # Notification center (/notifications)
│   ├── pending/        # Pending tasks hub (/pending)
│   ├── reminders/      # Reminders management (/reminders)
│   ├── search/         # Real-time search (/search)
│   ├── settings/       # Settings subpages (about, appearance, backup, notifications, storage, tags)
│   ├── not-found.tsx   # Custom branded 404 page
│   └── page.tsx        # Dashboard home (/)
├── components/         # Modular React UI components
│   ├── attachments/    # File pickers, thumbnails, photo & PDF viewers
│   ├── dashboard/      # Dashboard cards, stats, quick capture
│   ├── dialogs/        # Entry creation, edit, and view dialogs
│   ├── notifications/  # Notification bell and badge controls
│   ├── reminders/      # Reminder cards, snooze modal, config dialogs
│   ├── shared/         # Header, bottom navigation, Android back handler
│   ├── tags/           # Tag badges and selectors
│   ├── theme/          # Theme provider
│   └── ui/             # Reusable UI primitives (buttons, dialogs, cards)
├── hooks/              # Custom hooks (active reminders, upcoming items, media queries)
├── public/             # Static web assets (icons, manifest, PDF.js worker)
├── Screenshots/        # Documentation screenshots
├── src/                # Core business logic and native services
│   ├── lib/            # Attachment storage (IndexedDB), backup service, storage metrics
│   └── notifications/  # Notification scheduler, service, history, and channel config
├── store/              # Zustand state stores (entries, tags, notifications, theme, drafts)
└── types/              # TypeScript interfaces (entry, reminder, tag, notification)
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm (bundled with Node.js)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Vagish23ps/Lectra.git
cd Lectra
npm install
```

### Development Server

Run the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check and Linting

Verify TypeScript types:

```bash
npx tsc --noEmit
```

Run the ESLint suite:

```bash
npm run lint
```

### Production Web Build

Compile and generate the static export in the `out/` directory:

```bash
npm run build
```

## Android Development

Lectra uses Capacitor to compile the static Next.js export into a native Android application.

### Prerequisites

- Android Studio (Jellyfish or newer recommended)
- Android SDK Platform 34 or 35
- JDK 17 or 21

### Build and Synchronize

1. Build the static web assets:

```bash
npm run build
```

2. Sync web assets and plugins to the Android project:

```bash
npx cap sync android
```

3. Open the Android project in Android Studio:

```bash
npx cap open android
```

From Android Studio, you can run the app on an Android Emulator or connected physical device, or generate a release APK via **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## Verification

The latest pre-release audit performed on the codebase verified the following engineering state:

| Check | Current Result |
| :--- | :--- |
| TypeScript | Passed (`npx tsc --noEmit`, 0 errors) |
| ESLint | Passed (`npm run lint`, 0 errors, non-blocking warnings) |
| Production Build | Passed (`next build`, exit code 0) |
| Static Route Prerender | 16/16 routes successfully generated |
| Android / Capacitor Sync | Verified with Capacitor 8.4.2 |
| Android Back Navigation | Verified across all settings subpages |
| React Purity / Hydration | Verified (date presets memoized, no impure renders) |
| Development Logging | Cleaned (verbose debug logs removed) |

*Note: While automated builds and emulator tests pass, testing scheduled native alarms under Android Doze mode and battery-saving conditions requires ongoing physical-device QA prior to public release.*

## Privacy and Data Handling

- **100% On-Device**: All notes, tasks, tags, attachments, and reminders reside locally on your device.
- **No External Servers**: Lectra does not connect to external tracking servers, analytics platforms, or cloud databases.
- **Offline Capable**: The app operates without an active internet connection.
- **User-Controlled Backups**: Backups are generated as standard `.json` or `.zip` files directly on your local device storage. You decide if and where to transfer them.

## Current Status and Roadmap

Lectra is currently in the **pre-release / QA phase**.

### Current Stage
- Core functionality, responsive design, storage management, and local notification scheduling are fully implemented.
- P1 and P2 UX improvements (inline task creation, undo toast, snooze options, backup export/restore) are settled.

### Next Steps
- Finalize physical-device testing for background reminder alarms across manufacturer-specific battery-saving policies.
- Configure release signing configurations for Android APK/AAB distribution.

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature-name`).
3. Commit your changes (`git commit -m "feat: add descriptive feature summary"`).
4. Push to your branch (`git push origin feature/your-feature-name`).
5. Open a Pull Request.

Please ensure `npx tsc --noEmit` and `npm run build` pass before submitting your PR.

## License

This repository does not currently specify an explicit open-source license. All rights are reserved by the author unless stated otherwise.

## Author & Version

- **Author**: Vagish (`Vagish23ps`)
- **Version Discrepancy Note**: The project configuration currently reflects:
  - `package.json`: `0.1.0`
  - `android/app/build.gradle`: `versionName "1.0"` (`versionCode 1`)
  - In-app About screen: `v1.0.0`git diff --stat