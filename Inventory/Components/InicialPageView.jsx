import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Obtener dimensiones de pantalla
const { width, height } = Dimensions.get('window');

const InitialPageView = () => {
  const navigation = useNavigation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      navigation.navigate("Log_in");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.kioskoText}>KIOSKO</Text>
        <Text style={styles.callaoText}>EL CALLAO</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fondo blanco
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  kioskoText: {
    fontSize: 36, // Tamaño más pequeño
    fontWeight: '300', // Más delgado
    color: '#367120', // Color verde solicitado
    letterSpacing: 2, // Espaciado entre letras
    marginBottom: 5,
  },
  callaoText: {
    fontSize: 48, // Tamaño más grande
    fontWeight: '700', // Más grueso
    color: '#367120', // Color verde solicitado
    letterSpacing: 3, // Espaciado entre letras
    textTransform: 'uppercase', // Mayúsculas
  },
});

export default InitialPageView;