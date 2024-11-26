# React Native Bluetooth Control App

This React Native app allows users to enable and disable Bluetooth on their mobile device programmatically with a simple toggle button.

## Features

- **Enable/Disable Bluetooth**: Toggle Bluetooth on and off programmatically.
- **UI**: A simple home screen with a button to control Bluetooth.
- **Permissions**: Automatically handles necessary permissions for Bluetooth access.

## Requirements

- **Node.js** (v16 or later)
- **React Native** (latest stable version)
- **Android Studio** (for Android app development)
- **Xcode** (for iOS development, if needed)

## Implementations and Modifications

1. **Native Bluetooth Integration**:

   - **Android**: We created a native module in **Kotlin** that interacts with the Bluetooth APIs. This native module allows us to enable or disable Bluetooth on Android programmatically.
   - **iOS**: Bluetooth functionality for iOS is handled using the **react-native-bluetooth-status** library, which allows us to check the Bluetooth status and toggle it.

2. **React Native Bridge**:

   - A custom **React Native Bridge** was implemented to communicate between the React Native JavaScript code and the native Kotlin (Android) code.
   - We defined a custom `BluetoothModule` in Kotlin and exposed its functionality using `ReactContextBaseJavaModule` to interact with the React Native JavaScript code.

3. **Permissions Handling**:

   - For **Android**, Bluetooth permissions (`BLUETOOTH`, `BLUETOOTH_ADMIN`, and `BLUETOOTH_CONNECT`) were added to the `AndroidManifest.xml` file.
   - For **iOS**, Bluetooth permissions were added in `Info.plist`, ensuring that the app has the necessary access to Bluetooth functionalities.

4. **UI Implementation**:
   - A simple **toggle button** is added to the home screen of the app to enable/disable Bluetooth.
   - After toggling Bluetooth, a message is displayed on the screen to confirm whether Bluetooth was enabled or disabled successfully.
