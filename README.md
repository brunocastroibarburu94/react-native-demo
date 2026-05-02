# react-native-demo
Learning some React Native to develop app, this code was produced following the example from [notJust.dev](https://www.youtube.com/watch?v=ewW6_baBXko)


# Set up instructions

Expo 

Markdown to write the site content Content

Expo router version free



## Step 1: Create Expo Project
```bash
# Step 1: Create Expo project
# npx create-exp-app@<expo-version> <app-name>
npx create-exp-app@latest RNBlog
```

If this is the first time or there is a  new expo version available you may be prompted to install expo's latest version.

```log
Need to install the following packages:
create-exp-app@1.1.1
Ok to proceed? (y) y
...
```

This will create a directory named after your application, in this case `NRBlog` with you `

## Step 2:Install Dependencies


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