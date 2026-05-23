import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { StatusBar } from 'expo-status-bar';
import Logo from '../assets/icon.png'

// Native-wind allows you to use tailwind components in react native
// Use rnfes to create a new screen, this snippet can be used because I have ES7 plugin installed
const Home = () => {
  return (
    <View style={styles.container}>
      {/* <Image source={Logo} style={styles.img}/> */}
      {/* <Image source={{uri: 'https://reactnative.dev/img/tiny-logo.png'}} /> */}
      <Text style={styles.title}>The Number 1</Text>
      <Text style={[styles.title, {color: 'red'}]}>The Number 2</Text>
      {/* Styles are applied from left to right, the rightmost style will override the left ones */}
      {/* Specify style as a reference */}
      <Text style={{marginTop: 10, marginBottom: 30}}>Reading List App</Text> 
      {/* Specify style directly */}

      <View style={styles.card}>
        <Text>Hello, this is a card</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  )
}

export default Home

// const styles = StyleSheet.create({})

const styles = StyleSheet.create({
  container: {
    flex: 1, // grows to take the entire height of the screen
    backgroundColor: '#fff',
    alignItems: 'center', // On the x axis
    justifyContent: 'center', // On the y axis
  },
  title:{
    fontWeight: 'bold',
    fontSize:18
  },
  card:{
    backgroundColor: '#eee',
    padding: 20,
    borderRadius: 10,
    boxShadow: '4px 4px rgba(0, 0, 0, 0.1)'

  },
  img: {
    marginVertical: 20,

  }
});
