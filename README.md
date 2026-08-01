# RollCall 📊

RollCall is a modern, lightweight, offline-first mobile application built with **React Native** and **Expo**. Designed for students and professionals, RollCall allows you to easily track subject-wise class attendance, define recurring weekly schedules, analyze progress against target percentages, and back up data seamlessly.

---

## Key Features

- **Offline-First & zero lag**: Powered by an embedded SQLite database with Write-Ahead Logging (`WAL` mode) for instantaneous storage reads and writes.
- **Weekly Schedule Customization**: Define custom course lists, target attendance percentages, and specify how many times each subject occurs on each day of the week.
- **Visual Analytics**: Interactive color-coded progress indicators show exactly how many classes you can afford to miss or need to attend to hit your goals.
- **Safe Telemetry (Supabase)**: Silent, non-blocking telemetry tracking. Includes lazy database initialization and strict timeout protection (2.5 seconds) to ensure network delays never stall startup launch.
- **Data Portability**: Backup and export your complete attendance logs, schedules, and settings to standard JSON formatting.

---

## Tech Stack

* **Platform**: React Native, Expo (SDK 51+)
* **Database**: `expo-sqlite`, `expo-crypto` & AsyncStorage
* **Navigation**: `@react-native-navigation/native` & Native-Stack Navigator
* **Design & Icons**: `@expo-google-fonts/nunito`, `@expo/vector-icons` (Ionicons)
* **Cloud Analytics**: Supabase Client SDK

---

## Getting Started

### Prerequisites
Make sure you have Node.js and the Expo CLI installed. We recommend testing via **Expo Go** on an emulator or a physical device.

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Sumitc0de/RollCall.git
   cd RollCall
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *(Ensure you use the anonymous client key so telemetry sync succeeds without credentials)*

4. **Start the Bundler**
   ```bash
   npx expo start --clear
   ```
   *Press `a` for Android Emulator, `i` for iOS Simulator, or scan the QR code on your phone.*

---

## SQLite Shema & Migration
RollCall uses a SQLite database named `attendance.db`. Below is the logical layout:

- `subjects`: Stores Course details (`id`, `name`, `target_percent`, `semester_start_date`, `is_deleted`).
- `subject_schedule`: Specifies weekly days and class counts (`id`, `subject_id`, `day_of_week`, `lectures_count`).
- `lecture_records`: Tracks statuses like `present`, `absent`, `cancelled`, and `unmarked` per date.
- `user_settings`: Simple key-value config storage.

Migrations run automatically on app mounting via `runMigrations` in `App.tsx`.

---

## Supabase Analytics Configuration
Telemetry matches device details silently in the background once every 24 hours. To enable this table in your Supabase project, execute the following script in the SQL editor:

```sql
-- 1. Create analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
  device_id TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  app_version TEXT,
  platform TEXT
);

-- 2. Turn on Row Level Security (RLS)
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- 3. Policy to authorize anonymous client updates
CREATE POLICY "Allow anon upsert on analytics"
ON public.analytics
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Assign permissions
GRANT ALL ON public.analytics TO anon, authenticated;
```

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
