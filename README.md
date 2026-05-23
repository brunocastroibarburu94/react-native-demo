# react-native-demo
Learning some React Native to develop app, this code was produced following the example from [notJust.dev](https://www.youtube.com/watch?v=ewW6_baBXko) and [Net Ninja](https://github.com/iamshaunjp/Complete-React-Native-Tutorial)


# Set up instructions


1. Have `NodeJS` installed, `NodeJS` is the runtime you use to generate the javascript files. It also provides the webserver services to serve the files at a specified port.

2. Have `Expo` installed, expo is a javascript package that allows your application to be installed in multiple devices using a single codebase (it offers a single interface that allows your application to access the resources of different devices using the same functions)

3. Install Expo Go in your Android or iOS device, follow [Expo documentation](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=physical)

Markdown to write the site content Content

Expo router version free




## Step 1: Create Expo Project
```bash
# Step 1: Create Expo project
# npx create-exp-app@<expo-version> <app-dir>
# npx create-exp-app@latest RNBlog

npx create-expo-app@latest --template blank-typescript ./
npx create-expo-app@latest --template=blank-typescript app
```

`npx expo start`

### Notes
If this is the first time or there is a  new expo version available you may be prompted to install expo's latest version.

```log
Need to install the following packages:
create-exp-app@1.1.1
Ok to proceed? (y) y
...
```

This will create a directory named after your application, in this case `NRBlog` with you `

## Step 2:Install Dependencies


Now with the project created, change the working directory to `<Project-Name>` in this case `RNBlog`.


Following the recommendations from [Expo Manual Installation Documentation](https://docs.expo.dev/router/installation/)

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```
### Troubleshooting: NPM version needs to be upgraded
Go to Node's [official website](https://nodejs.org/en/download) and install a suitable version.

Once you do that, you may need to refresh your terminal (usually by re-starting VSCode if you are using VSCode Terminals). You may be asked to to re-install expo

```bash
# If you are told that your Node version is not compatible with Expo you may need to re-install node use the command below to do it.
npm install expo@latest
```

If you have `npm warn deprecated` warnings you may want to update the packages

```bash
npm update
npm audit fix
npm audit fix --force
```

### Addressing vulnerabilities
Following this [Medium Article](https://medium.com/insiderengineering/dont-use-npm-audit-fix-063219b3cefc).

Use `npm audit` to identify all vulnerabilities
```log
npm audit
# npm audit report

postcss  <8.5.10
Severity: moderate
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output - https://github.com/advisories/GHSA-qx2v-qp2m-jg93
fix available via `npm audit fix --force`
Will install expo@49.0.23, which is a breaking change
node_modules/postcss
  @expo/metro-config  <=0.0.1-canary-20240418-8d74597 || >=0.1.49-alpha.0
  Depends on vulnerable versions of @expo/config
  Depends on vulnerable versions of postcss
  node_modules/@expo/metro-config
    @expo/cli  <=0.0.0-canary-20231123-1b19f96-4 || >=0.0.1-canary-20231125-d600e44     
    Depends on vulnerable versions of @expo/config
    Depends on vulnerable versions of @expo/config-plugins
    Depends on vulnerable versions of @expo/metro-config
    Depends on vulnerable versions of @expo/prebuild-config
    node_modules/@expo/cli
      expo  46.0.5 || >=47.0.0-alpha.1
      Depends on vulnerable versions of @expo/cli
      Depends on vulnerable versions of @expo/config
      Depends on vulnerable versions of @expo/config-plugins
      Depends on vulnerable versions of @expo/local-build-cache-provider
      Depends on vulnerable versions of @expo/metro-config
      node_modules/expo

uuid  <14.0.0
Severity: moderate
uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided - https://github.com/advisories/GHSA-w5hq-g745-h8pq
fix available via `npm audit fix --force`
Will install expo@49.0.23, which is a breaking change
node_modules/uuid
  xcode  >=0.9.2
  Depends on vulnerable versions of uuid
  node_modules/xcode
    @expo/config-plugins  *
    Depends on vulnerable versions of xcode
    node_modules/@expo/config-plugins
      @expo/config  <=0.0.1-canary-20240418-8d74597 || >=3.3.23-alpha.0
      Depends on vulnerable versions of @expo/config-plugins
      node_modules/@expo/config
        @expo/local-build-cache-provider  *
        Depends on vulnerable versions of @expo/config
        node_modules/@expo/local-build-cache-provider
      @expo/prebuild-config  *
      Depends on vulnerable versions of @expo/config
      Depends on vulnerable versions of @expo/config-plugins
      node_modules/@expo/prebuild-config

10 moderate severity vulnerabilities

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force
```

**Runnning suggested npm audit fix --force.** will install an earlier version of Expo and actually introduce a higher number and more severe vulnerabilities.


> It is unclear how to remove (or even if its possible to remove) all vulnerabilities.
## Step: Move entrypoint to ./app
Create an `app` directory, and create a `index.ts` inside it. You can use the ES7 `rnfes` snippet for it.

Then modify the `package.json` to use `expo-router` to handle the entrypoint of the application, which will look under the `app` directory.

Also modify the `package.json` to add a scheme so that deep linking can be used. 


## Step: Configure package.json entrypoint
Go to the `RNBlog/package.json` and modify the `main` key of the JSON file.
```json
{
  "main": "expo-router/entry"
}
```


## Step: Install Dependencies for Web applications
For web applications:

```bash
npx expo install react-native-web react-dom
```
## Install Typescript

According to [React Native Docs](https://reactnative.dev/docs/typescript)You may find that node cannot recognize the extended typescript extension tpx. To add Typescript to your Node project run.
```bash
npm install -D typescript @react-native/typescript-config @types/jest @types/react @types/react-test-renderer
```

```bash
npm i --save-dev @types/node
```
## Step: Configure "expo" key at 
For further information around the `expo` configuration under the `<appName>/app.json` directory follow [Expo's official documentation](https://docs.expo.dev/versions/latest/config/app/).

At this point the `app.json` should look like:

```json
{
  "plugins": [
    "expo-router"
  ]
}

```

However you can modify it to:

```json
// Example 
{
    "expo":{
        "scheme":"test_scheme"
    },
    "ios":{
        "supportsTablet":true
    },
    "android":{
        "adaptiveIcon":{
            "foregroundImage": "./assets/BC_Logo_green.PNG",
            "backgroundColor": "#ffffff"
        } 
    },
    "web":{
        "favicon": "./assets/BC_Logo_green.PNG"
    },
    "plugins": [
    "expo-router"
    ]
}
```


**Deep-linking:** Setting the `scheme` key of expo allow us to do deep-linking.

## Step: Specify Expo configuration
A lot of configuration files are not present by default when creating a new expo project, this can hide the configuration of `expo` dependencies. In order to make these default configurations explicit into the project you can use the following command to generate the default configuration files. 

```bash
npx expo customize
```

Once you run that command a prompt asking you which configuration files you want to generate will appear, select all the files and generate them.



## Step: Configure .env
The `.env` file can be used to configure the launch of the application.

In this file, among other things, you can specify the port the application will be using in your system

for a quick start you can copy the `.env.template` file into your `.env` file. 

## Start Application

```
npm start
```

# Other references
### Web dependencies:
For the web application we will require to have **Static rendering** [see Expo's documentation](https://docs.expo.dev/router/web/static-rendering/). 

On 2024 this required a certain version of Expo API, however there is no reference of it as of 2026.

## Expo:
- [React native get started page](https://reactnative.dev/docs/environment-setup)

> Expo provides developer tooling that makes developing apps easier, such as file-based routing, a standard library of native modules, and much more.

The Expo team works in close collaboration with the React Native team at Meta to bring the latest React Native features to the Expo SDK.

### Expo, React, Node, React Native & React Native Web match

[Expo Docs](https://docs.expo.dev/versions/latest/#each-expo-sdk-version-depends-on-a-react-native-version)

![](./assets/Expo%20SDK%20version%20match.png)

Use the command `npm show expo version` to see which version of expo you are using.

For this demo the version in `55.0.19`.

```bash
npm show expo version
```

```log
55.0.19
```

Check your node version using `node -v`
```bash 
# Verify the Node.js version:
node -v # Should print "v24.15.0".
# Verify npm version:
npm -v # Should print "11.12.1".
```
### Accessing Camera, contacts and sensors from devices using Expo

```bash
# Install relevant expo modules
npx expo install expo-camera expo-contacts expo-sensors
```


```ts
// Now you can import the objects to interface with camera, contacts and sensors of the devices (iOS, Android)
import { CameraView } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import { Gyroscope } from 'expo-sensors';
```