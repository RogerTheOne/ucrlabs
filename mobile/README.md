# Mobile POC Setup

Follow these steps if the Expo project refuses to start because of dependency conflicts:

1. **Clean previous installs**
   ```bash
   rm -rf node_modules package-lock.json
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start Expo**
   ```bash
   npm run start
   ```

The repository tracks the package manifest (`package.json`) only, so your local `npm install` will generate a fresh `package-lock.json` that is guaranteed to match the installed Expo SDK patch release (`~54.0.23`) and React 19 bindings required by the CLI. Expo Go should then load the development bundle without the "problem running the requested app" error.
