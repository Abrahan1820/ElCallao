import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import NavBar from "../NavBar/Components/NavBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { SupaClient } from "../Supabase/supabase";

const AdminPanel = () => {
  const navigation = useNavigation();
  const supa = SupaClient();

  useEffect(() => {
    const verificarAcceso = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        const user = session ? JSON.parse(session) : null;

        // Si no hay usuario o no está activo, redirigir
        if (!user || !user.esActivo) {
          await AsyncStorage.removeItem("userSession");
          Toast.show({
                            type: "error",
                            text1: "Usuario no encontrado",
                            text2: "Cerrando Sesión.",
                            position: "top",
                            visibilityTime: 3000,
                          });
          navigation.navigate("Log_in");
          return;
        }

        // Verificar si es administrador
        if (!user.esAdministrador) {
          navigation.navigate("PaginaPrincipal");
          return;
        }

        // Verificar en la base de datos el estado actual
        const { data, error } = await supa
          .from("user")
          .select("*")
          .eq("cedula", user.cedula)
          .eq("tipoDocumento", user.tipoDocumento)
          .single();

        if (error || !data?.esActivo) {
          await AsyncStorage.removeItem("userSession");
          Toast.show({
                            type: "error",
                            text1: "Sesión Inactiva",
                            text2: "Cerrando Sesión.",
                            position: "top",
                            visibilityTime: 3000,
                          });
          navigation.navigate("Log_in");
        };
        if (!data?.esAdministrador) {
          Toast.show({
                            type: "error",
                            text1: "No Administrador",
                            text2: "Acceso no autorizado.",
                            position: "top",
                            visibilityTime: 3000,
                          });
          navigation.navigate("PaginaPrincipal");
        };
      } catch (error) {
        console.error("Error verificando acceso:", error);
        navigation.navigate("PaginaPrincipal");
      }
    };

    verificarAcceso();
  }, []);
  

   

  // 📌 Función para manejar la opción seleccionada
  const handleOption = (option) => {
    switch (option) {
      case "manageUsers":
        navigation.navigate("AdminUsers");
        break;
      case "manageReports":
        navigation.navigate("AdminReport");
        break;
      case "manageProviders":
        navigation.navigate("AdminProvider");
        break;
      case "changeGlobalPassword":
        navigation.navigate("AdminPasswordChange");
        break;
      case "manageCategory":
        navigation.navigate("AdminCategory");
        break;
      default:
        Alert.alert("Opción no válida");
    }
  };

  // 📌 Función para cambiar la clave global
  const changeGlobalPassword = async () => {
    // Aquí puedes implementar la lógica para cambiar la clave global
    Alert.alert(
      "Cambiar clave global",
      "Esta funcionalidad está en desarrollo."
    );
  };

  return (
    <View style={styles.grande}>
      <NavBar />
      <View style={styles.container}>
        <Text style={styles.title}>Panel de Administración</Text>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleOption("manageUsers")}
        >
          <Text style={styles.optionText}>Administrar Usuarios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleOption("manageReports")}
        >
          <Text style={styles.optionText}>Administrar Reportes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleOption("manageCategory")}
        >
          <Text style={styles.optionText}>Administrar Categorias</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleOption("manageProviders")}
        >
          <Text style={styles.optionText}>Administrar Proveedores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleOption("changeGlobalPassword")}
        >
          <Text style={styles.optionText}>Cambiar Clave Administrador</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 📌 Estilos
const styles = StyleSheet.create({
  grande: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    color: "#45c0e8",
    marginBottom: 40,
    fontWeight: "bold",
  },
  optionButton: {
    backgroundColor: "#fe6b00",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "80%",
    alignItems: "center",
    maxWidth: 672,
  },
  optionText: {
    color: "white",
    fontSize: 18,
  },
});

export default AdminPanel;
