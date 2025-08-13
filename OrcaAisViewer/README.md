# AIS Vessel Tracking App

A real-time vessel tracking app that visualizes vessel positions on a Mapbox map using data from [aisstream.io](https://aisstream.io/) via a [Node.js backend](../backend/README.md) application.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Install Dependencies

To install all the dependencies run the following command from the root of your React Native project:

```sh
yarn install
```

## Step 2: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
yarn start
```

## Step 3: Build and Run Your App

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app.

### Android

```sh
yarn android
```

Follow the [rnmapbox installation instructions](https://rnmapbox.github.io/docs/install), acquire **Secret** and **Public** access tokens, and add the Secret token to `OrcaAisViewer/android/gradle.properties` as `MAPBOX_ACCESS_TOKEN` to allow Gradle to download Mapbox dependencies.
For example:

```gradle
MAPBOX_ACCESS_TOKEN=sk.ey...
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be done the first time you clone the repository or after updating native dependencies).

The first time you create a new project, run the Ruby Bundler to install CocoaPods:

```sh
bundle install
```

Then, every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, see the [CocoaPods Getting Started Guide](https://guides.cocoapods.org/using/getting-started.html).

To run the app:

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

### MapBox Public Token

Replace `<PUBLIC_MAPBOX_TOKEN>` in `OrcaAisViewer/src/App.tsx` with your actual public token.

If everything is set up correctly, you should see your app running in the Android Emulator, iOS Simulator, or on your connected device.

## Future Considerations

### Performance Optimization

In a production app with higher traffic and complexity, consider:

* [**Redux Toolkit**](https://redux-toolkit.js.org/): for state management
* [**Caching Layer**](https://redux-toolkit.js.org/rtk-query/overview): for networking, side-effect management, and advanced caching
* [**Socket.IO**](https://socket.io/how-to/use-with-react-native): for real-time updates
* [**Protocol Buffers**](https://protobuf.dev/): for efficient data transfer

Also consider clustering markers if it makes sense for the product.

## Quality Assurance

* [**Jest**](https://jestjs.io/): for unit and integration testing
* [**Appium**](https://appium.io/) or [**Detox**](https://wix.github.io/Detox/): for end-to-end testing
* [**RNTL**](https://github.com/callstack/react-native-testing-library): for component behavior testing

## CI/CD

* [**Fastlane**](https://fastlane.tools/): for app store management, provisioning, and automation
* Use some CI: CircleCI, GitHub Actions, Bitrise, etc.

## Developer Experience

* [**Bun**](https://bun.sh/): as a more performant Node.js runtime
* [**Styled Components**](https://styled-components.com/): instead of raw `StyleSheet` for separating view logic from styling

## Notes

Due to some Android build issues:

* I had to patch the `rnmapbox` package to fix Kotlin nullability issues.
