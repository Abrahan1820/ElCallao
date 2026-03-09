import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView
} from "react-native";
import { SupaClient } from "../Supabase/supabase";
import NavBar from "../NavBar/Components/NavBar";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AdminPasswordChange = () => {
  const supa = SupaClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigation = useNavigation();

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

        // Opcional: Verificar en la base de datos el estado actual
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
        }
        if (!data?.esAdministrador) {
          Toast.show({
                            type: "error",
                            text1: "No Administrador",
                            text2: "Acceso no autorizado.",
                            position: "top",
                            visibilityTime: 3000,
                          });
          navigation.navigate("PaginaPrincipal");
        }
      } catch (error) {
        console.error("Error verificando acceso:", error);
        navigation.navigate("PaginaPrincipal");
      }
    };

    verificarAcceso();
  }, []);

  // 📌 Obtener la clave actual de la base de datos
  useEffect(() => {
    const fetchCurrentPassword = async () => {
      try {
        const { data, error } = await supa
          .from("adminPassword")
          .select("password")
          .eq("id", 1)
          .single();

        if (error) throw error;
        setCurrentPassword(data.password);
      } catch (error) {
        Toast.show({
                type: "error",
                text1: "Error",
                text2: `No se pudo obtener la clave actual.`,
                position: "top",
                visibilityTime: 3000,
              });
      }
    };

    fetchCurrentPassword();
  }, []);

  // 📌 Función para actualizar la clave
  const updatePassword = async () => {
    if (!newPassword.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `La nueva clave no puede estar vacía.`,
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    Toast.show({
      type: 'customConfirm',
      text1: 'Confirmación',
      text2: '¿Estás seguro de que quieres cambiar la clave de administrador?',
      position: 'top',
      autoHide: false,
      props: {
        buttons: [
          {
            text: 'Cancelar',
            onPress: () => Toast.hide(),
            style: { color: '#666' }
          },
          {
            text: 'Cambiar',
            onPress: async () => {
              Toast.hide();
              try {
                // Mostrar carga mientras se procesa
                Toast.show({
                  type: 'info',
                  text1: 'Procesando...',
                  position: 'top',
                  autoHide: false
                });
  
                const { error } = await supa
                  .from("adminPassword")
                  .update({ password: newPassword })
                  .eq("id", 1);
  
                // Ocultar toast de carga
                Toast.hide();
  
                if (error) throw error;
  
                // Mostrar confirmación de éxito
                Toast.show({
                  type: 'success',
                  text1: 'Éxito',
                  text2: 'La clave de administrador ha sido cambiada.',
                  position: 'top',
                  visibilityTime: 3000,
                });
  
                // Actualizar estado local
                setCurrentPassword(newPassword);
                setNewPassword("");
  
              } catch (error) {
                console.error("Error cambiando clave:", error);
                Toast.hide();
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'No se pudo actualizar la clave.',
                  position: 'top',
                  visibilityTime: 3000
                });
              }
            },
            style: { color: '#ff4444', fontWeight: 'bold' }
          }
        ]
      }
    })
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <NavBar />
      <View style={styles.container}>
        <Text style={styles.title}>Cambiar Clave de Administrador</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Clave Actual:</Text>
          <TextInput
            style={styles.inputDisabled}
            value={currentPassword}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nueva Clave:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese la nueva clave"
            placeholderTextColor="grey"
            onChangeText={setNewPassword}
            value={newPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={updatePassword}>
            <Text style={styles.buttonText}>Actualizar Clave</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AdminPasswordChange;

// 📌 Estilos actualizados
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#45c0e8',
  },
  grande: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#45c0e8",
  },
  inputGroup: {
    width: "100%",
    maxWidth: 672,
    marginBottom: 15,
    alignSelf: "center", // Centra el grupo pero mantiene alineación izquierda interna
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#004b9a",
    textAlign: "left", // Asegura alineación izquierda
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#004b9a",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    color: "#004b9a",
    backgroundColor: "#ffffff",
  },
  inputDisabled: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    color: "#666",
    backgroundColor: "#f0f0f0",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 672,
    alignSelf: "center",
    marginTop: 15,
  },
  button: {
    backgroundColor: "#fe6b00",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
