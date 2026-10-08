# I Got Breached — mobile app

A native iOS and Android version of the breach checklist, built with [Expo](https://expo.dev) (React Native, SDK 57).

It works like the website: search for a company, pick which breach if there were several, and tick off the steps in order.

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On your computer, with Node.js 20 or newer installed:
   ```sh
   cd mobile
   npm install
   npm start
   ```
3. Scan the QR code in the terminal: with the Camera app on iPhone, or from inside Expo Go on Android.

The app reloads when you save a file. Press `w` in the terminal to open it in a web browser instead.

## Where the breach list comes from

- On launch, the app fetches `breaches.json` from https://breach-checklist.vercel.app, so breaches added on the website show up without updating the app.
- It also ships with a built-in copy in `src/data/breaches.json`, used when there's no connection. The footer on the search screen says which list is showing.
- After adding breaches, refresh the built-in copy with `npm run sync-data`. It isn't required, because the app fetches the live list anyway.

## Code layout

| Path | What it is |
|---|---|
| `src/app/index.tsx` | Search screen |
| `src/app/company/[name].tsx` | Checklist screen for one company, with the "Which breach?" picker and completion card |
| `src/app/_layout.tsx` | Fonts, splash screen and dark navigation theme |
| `src/lib/checklist.ts` | Data types and checklist steps. **Keep in sync with `index.html` on the website.** |
| `src/lib/breaches.ts` | Loading, validating and searching the breach list |
| `src/theme.ts` | Colors, fonts and links |

Checks: `npm run typecheck` and `npm run lint`. Both run on GitHub for every change under `mobile/`.

## Publishing to the App Store and Google Play

Expo's EAS service builds and submits the app in the cloud; no Xcode or Android Studio is needed:

```sh
npx eas-cli@latest build --platform all
npx eas-cli@latest submit
```

You'll need an Expo account, an Apple Developer account ($99/year) and a Google Play developer account ($25 once). Before the first build, set `ios.bundleIdentifier` and `android.package` in `app.json`.
