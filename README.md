<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Look Away

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c127550e-b3c8-4a9f-a6e0-f9fb0efd6bd5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Report Email Delivery

The primary report email is saved as the user's default and remains prefilled until changed. The optional secondary email is used only for the current report and starts blank on the next report.

Automatic delivery uses the local Express API at `/api/send-report` and GMass SMTP. Configure these environment variables in `.env`:

- `GMASS_API_KEY`: Your GMass API key, used as the SMTP password
- `REPORT_FROM_EMAIL`: The GMass account email and sender address
- `GMASS_SMTP_PORT`: Optional SMTP port; defaults to `2525` (GMass also supports `587`)

When a report is created, its contents are sent to the primary address and, when provided, the secondary address. Each email includes a formatted HTML report and a PDF attachment. The server must run on a host that allows outbound connections to `smtp.gmass.co`; some development containers block SMTP traffic.

## Android and iOS

The native apps use Capacitor and share the same mobile React experience as the web app.

1. Install dependencies: `npm install`
2. Build and sync native projects: `npm run cap:sync`
3. Open Android Studio: `npm run cap:android`
4. Open Xcode on macOS: `npm run cap:ios`

To build an Android debug APK from the command line:

`cd android && ./gradlew assembleDebug`

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Android Studio should use its bundled JDK 21 and have an Android SDK installed. iOS builds require macOS, Xcode, and CocoaPods.
