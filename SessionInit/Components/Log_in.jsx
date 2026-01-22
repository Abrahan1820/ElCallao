import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SupaClient } from "../../Supabase/supabase";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { ScrollView } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const Log_in = () => {
  const supa = SupaClient();
  const navigation = useNavigation();

  const [cedula, setCedula] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("V");
  const [password, setPassword] = useState("");

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("V"); // Valor seleccionado
  const [items, setItems] = useState([
    { label: "Venezolano", value: "V" },
    { label: "Extranjero", value: "E" },
    { label: "Pasaporte", value: "P" },
  ]);

  // 📌 Verifica si hay sesión guardada al abrir la app
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (!session) return;

      const userData = JSON.parse(session);

      // 📌 Buscar si el usuario aún existe en la base de datos
      const { data, error } = await supa
        .from("user")
        .select("*")
        .eq("cedula", userData.cedula)
        .eq("tipoDocumento", userData.tipoDocumento)
        .single();

      if (error || !data) {
        await AsyncStorage.removeItem("userSession"); // 🔹 Eliminar sesión guardada
        navigation.navigate("Log_in"); // 🔹 Redirigir al login
        return;
      }

      navigation.navigate("PaginaPrincipal"); // 🔹 Usuario existe, continuar normalmente
    } catch (error) {}
  };

  // 📌 Guarda la sesión en AsyncStorage
  const saveSession = async (userData) => {
    try {
      await AsyncStorage.setItem("userSession", JSON.stringify(userData));
    } catch (error) {}
  };

  async function logInWithCedula() {
    try {
      const cedulaInt = parseInt(cedula);
      if (isNaN(cedulaInt)) {
        Toast.show({
          type: "error",
          text1: "Error de inicio de sesión",
          text2: "Cédula debe ser numérica.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      const { data, error } = await supa
        .from("user")
        .select("*")
        .eq("cedula", cedulaInt)
        .eq("tipoDocumento", tipoDocumento)
        .eq("esActivo", true)
        .single();

      if (error || !data) {
        Toast.show({
          type: "error",
          text1: "Error de inicio de sesión",
          text2: error
            ? error.message
            : "Usuario no encontrado o cuenta desactivada.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      if (data.contraseña !== password) {
        Toast.show({
          type: "error",
          text1: "Error de inicio de sesión",
          text2: "Contraseña incorrecta.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      // 📌 Guardar usuario en AsyncStorage
      await saveSession(data);

      Toast.show({
        type: "success",
        text1: "Inicio de sesión exitoso",
        text2: "Bienvenido.",
        position: "top",
        visibilityTime: 3000,
      });

      navigation.navigate("PaginaPrincipal");
    } catch (error) {}
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <FlatList
        contentContainerStyle={styles.scrollContent}
        data={[{ key: "login-screen" }]}
        renderItem={() => (
          <View style={styles.innerContainer}>
            <View style={styles.header}>
              <Image
                style={styles.logo}
                source={require("../../Inventory/Assets/logo911.png")}
              />
            </View>

            <View style={styles.content}>
              <Text style={styles.Welcome}>Bienvenido</Text>
              <Text style={styles.sign_in}>Por favor ingrese su cuenta</Text>

              <View style={styles.inputContainer}>
                <DropDownPicker
                  open={open}
                  value={value}
                  items={items}
                  setOpen={setOpen}
                  setValue={(val) => {
                    setValue(val());
                    setTipoDocumento(val());
                  }}
                  setItems={setItems}
                  placeholder="Seleccione tipo de documento"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  zIndex={1000}
                />
              </View>

              <TextInput
                style={styles.inputField}
                placeholder="Cédula"
                placeholderTextColor="grey"
                onChangeText={setCedula}
                value={cedula}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.inputField}
                placeholder="Contraseña"
                placeholderTextColor="grey"
                onChangeText={setPassword}
                value={password}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.button}
                onPress={logInWithCedula}
                activeOpacity={0.5}
              >
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => navigation.navigate("Sign_up")}
                activeOpacity={0.5}
              >
                <Text style={styles.buttonText}>Crear cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      
    </KeyboardAvoidingView>
  );
};

// Estilos optimizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    width: "100%",
    height: 200, // Aumentamos la altura del contenedor
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  logo: {
    width: "80%", // Ocupará el 80% del ancho del contenedor
    height: 100, // Altura fija suficiente
    maxWidth: 300, // Límite máximo para dispositivos grandes
    marginTop: 100,
    marginBottom: 50
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
    maxWidth: 672,
  },
  dropdown: {
    borderColor: "#004b9a",
    borderRadius: 25,
    height: 50,
    backgroundColor: "white",
    maxWidth: 672,
    alignSelf: "center",
  },
  dropdownContainer: {
    borderColor: "#004b9a",
    borderRadius: 15,
    alignSelf: "center",
  },
  dropdownText: {
    color: "#004b9a",
    fontWeight: "bold",
    fontSize: 16,
    maxWidth: 672,
  },
  inputField: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    fontWeight: "bold",
    borderColor: "#004b9a",
    color: "#004b9a",
    height: 50,
    marginBottom: 20,
    borderRadius: 25,
    fontSize: 16,
    maxWidth: 672,
  },
  Welcome: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#45c0e8",
    textAlign: "center",
    marginBottom: 5,
    marginTop: 0,
  },
  sign_in: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#004b9a",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "#fe6b00",
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 20,
    alignItems: "center",
    maxWidth: 672,
  },
  secondaryButton: {
    backgroundColor: "#004b9a",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Log_in;
