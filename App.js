import { NavigationContainer } from '@react-navigation/native';
import Main from './App/Main';
import { StatusBar } from 'expo-status-bar';




export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Main />
      </NavigationContainer>
    </>
  );
}