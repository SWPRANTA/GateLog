# GateLog 📱

A modern attendance tracking app for Android, built with React Native and Expo. Track your entry/exit times, manage leaves, and generate detailed reports.

![GateLog](https://img.shields.io/badge/Platform-Android-green) ![React Native](https://img.shields.io/badge/React%20Native-0.81-blue) ![Expo](https://img.shields.io/badge/Expo-SDK%2054-purple)

---

## ✨ Features

### 🕐 Time Tracking
- **Punch In/Out** - Simple one-tap entry and exit logging
- **Real-time Duration** - See your daily and weekly hours in real-time
- **Goal Tracking** - Set daily and weekly hour goals

### 📊 Reports
- **Monthly Calendar View** - Visual overview with color-coded days
- **Date Range Reports** - Generate PDF reports for any period
- **Weekly Grouping** - Reports organized by week for easy reading
- **CSV Export** - Export all data for backup or analysis
- **Data Import** - Restore data from JSON backup

### 🏖️ Leave Management
- **Sick & Casual Leaves** - Track different leave types
- **Holidays** - Mark public/office holidays
- **Leave Limits** - Set yearly limits for each leave type

### ⚙️ Settings
- **Weekly Holidays** - Configure which days are weekly off (supports multiple days)
- **Time Goals** - Customize daily, Friday, and weekly hour targets
- **Dark/Light Mode** - Choose your preferred theme
- **Data Backup** - Export before clearing with save-to-folder option

---

## 📥 Installation

### Option 1: Download APK (Recommended)

1. Download the latest APK from the [Releases](../../releases) page
2. On your Android device, enable **Install from Unknown Sources**:
   - Go to **Settings → Security → Unknown Sources** (or **Install Unknown Apps**)
3. Open the downloaded APK file and tap **Install**
4. Launch **GateLog** from your app drawer

### Option 2: Build from Source

**Prerequisites:**
- Node.js 18+ 
- npm or yarn
- Android SDK (for building APK)
- Java JDK 17+

```bash
# Clone the repository
git clone https://github.com/SWPRANTA/GateLog.git
cd GateLog

# Install dependencies
npm install

# Start development server
npx expo start

# Build APK locally
npm run build:local
```

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📖 Usage Guide

### Getting Started

1. **Open the app** - You'll see the Dashboard with today's date and time
2. **Punch In** - Tap the main button when you arrive
3. **Punch Out** - Tap again when you leave
4. Your hours are automatically calculated!

### Dashboard

The home screen shows:
- Current date and time
- Today's logged hours
- Weekly progress towards your goal
- Quick punch in/out button

### Leave Management

1. Go to the **Leaves** tab
2. Select a date using the date picker
3. Choose leave type: **Sick**, **Casual**, or **Holiday**
4. Add an optional note
5. Tap **Submit**

### Generating Reports

1. Go to the **Reports** tab
2. View the monthly calendar with color-coded days:
   - 🟢 Green = Goal met
   - 🔴 Red = Goal not met
   - ⚪ Gray = Weekly holiday
   - 🟠 Orange = Leave
   - 🔵 Blue = Holiday
3. Set **Start Date** and **End Date** for your report period
4. Tap **Generate Report (PDF)** to create a shareable PDF
5. Use **Export CSV** to backup all your data

### Exporting Data

When exporting, you have two options:
- **Save to Folder** - Choose a folder on your device to save the files
- **Share** - Send via email, cloud storage, or other apps

### Importing Data

1. Tap **Import Data** in the Reports tab
2. Select a previously exported `.json` backup file
3. Confirm to restore your data

### Configuring Settings

Go to the **Settings** tab to:

| Setting | Description |
|---------|-------------|
| **Daily Min (Mon-Thu)** | Required hours for regular days |
| **Daily Min (Friday)** | Required hours for Fridays |
| **Weekly Min** | Total weekly hour target |
| **Sick/Casual Leave Limits** | Yearly allocation for each type |
| **Weekly Holidays** | Select days that are weekly off (e.g., Fri, Sat) |
| **Dark Mode** | Toggle dark/light theme |
| **Clear All Data** | Reset app (with export option) |

---

## 🔧 Technical Details

### Tech Stack
- **Framework**: React Native 0.81 with Expo SDK 54
- **Language**: TypeScript
- **Styling**: styled-components
- **Storage**: AsyncStorage
- **Navigation**: React Navigation

### Project Structure

```
GateLog/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers
│   │   ├── ThemeContext.tsx
│   │   └── TimeContext.tsx
│   ├── screens/        # App screens
│   │   ├── DashboardScreen.tsx
│   │   ├── LeaveScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/     # Navigation setup
│   ├── utils/          # Helper functions
│   └── types.ts        # TypeScript interfaces
├── android/            # Android native code
├── App.tsx             # App entry point
└── package.json
```

### Data Storage

All data is stored locally on your device using AsyncStorage:
- `attendance_logs` - Entry/exit timestamps
- `leave_records` - Leave entries
- `holiday_records` - Holiday entries
- `weekly_holidays` - Weekly off days configuration
- `time_goals` - Hour targets
- `leave_limits` - Yearly leave limits

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Made with ❤️ by Swapnil**

[![GitHub](https://img.shields.io/badge/GitHub-Swapnil-black?logo=github)](https://github.com/Swapnil-Pranta)
