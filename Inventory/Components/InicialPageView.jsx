import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../Themes/Theme";
import { useNavigation } from "@react-navigation/native";

// Obtener dimensiones de pantalla
const { width, height } = Dimensions.get('window');
const IPHONE_MAX_WIDTH = 428; // Ancho máximo para dispositivos grandes

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
    <LinearGradient
      colors={[
        theme.colors.azulObscuro,
        theme.colors.blanco,
        theme.colors.blanco,
        theme.colors.blanco,
        theme.colors.azulClaro,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Image
        source={require("../Assets/logo911InicialPageView.png")}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%'
  },
  logoImage: {
    width: width * 0.8, // 80% del ancho de pantalla
    maxWidth: IPHONE_MAX_WIDTH * 0.8, // Máximo para iPhone Max (342px)
    height: undefined, // Altura automática
    aspectRatio: 1, // Mantiene relación cuadrada (ajusta si tu imagen no es 1:1)
  },
  tituloInventario: {
    position: "absolute",
    fontSize: theme.title.fontSize,
    fontWeight: theme.title.fontWeight,
    color: theme.colors.textPrimary,
    zIndex: 1,
  },
});

export default InitialPageView;