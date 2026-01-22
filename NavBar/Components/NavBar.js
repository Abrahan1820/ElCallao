import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const NavBar = ({ showBack = true, showHome = true }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#45c0e8" barStyle="light-content" />

      <View style={styles.navBar}>
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            <Image
              source={require("../Assets/flecha-pequena-izquierda.png")}
              style={{ height: 30, width: 30, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        )}

        {showHome && (
          <TouchableOpacity
            onPress={() => navigation.navigate("PaginaPrincipal")}
            style={styles.button}
          >
            <Image
              source={require("../Assets/hogar.png")}
              style={{ height: 24, width: 24, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#45c0e8",
    paddingTop: Platform.OS === "ios" ? 45 : StatusBar.currentHeight, // 📌 Respeta StatusBar en iOS y Android
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#45c0e8",
  },
  button: {
    padding: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});

export default NavBar;
