import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SupaClient } from "../../Supabase/supabase";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropDownPicker from "react-native-dropdown-picker";

const Log_in = () => {
  const supa = SupaClient();
  const navigation = useNavigation();

  const [cedula, setCedula] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("V");
  const [password, setPassword] = useState("");

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("V");
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

      const { data, error } = await supa
        .from("user")
        .select("*")
        .eq("cedula", userData.cedula)
        .eq("tipoDocumento", userData.tipoDocumento)
        .single();

      if (error || !data) {
        await AsyncStorage.removeItem("userSession");
        navigation.navigate("Log_in");
        return;
      }

      navigation.navigate("PaginaPrincipal");
    } catch (error) {}
  };

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
              <Text style={styles.appTitle}>KIOSKO</Text>
              <Text style={styles.appSubtitle}>EL CALLAO</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.Welcome}>Bienvenido</Text>
              <Text style={styles.sign_in}>Ingresa tus credenciales</Text>

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
                  placeholder="Tipo de documento"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  zIndex={1000}
                />
              </View>

              <TextInput
                style={styles.inputField}
                placeholder="Cédula"
                placeholderTextColor="#94a3b8"
                onChangeText={setCedula}
                value={cedula}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.inputField}
                placeholder="Contraseña"
                placeholderTextColor="#94a3b8"
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
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "300",
    color: "#367120",
    letterSpacing: 2,
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 42,
    fontWeight: "700",
    color: "#367120",
    letterSpacing: 3,
    textTransform: "uppercase",
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
    borderColor: "#367120",
    borderRadius: 25,
    height: 50,
    backgroundColor: "white",
    maxWidth: 672,
    alignSelf: "center",
  },
  dropdownContainer: {
    borderColor: "#367120",
    borderRadius: 15,
    alignSelf: "center",
  },
  dropdownText: {
    color: "#367120",
    fontWeight: "500",
    fontSize: 16,
    maxWidth: 672,
  },
  inputField: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    fontWeight: "500",
    borderColor: "#367120",
    color: "#367120",
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
  },
  sign_in: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    width: "100%",
    backgroundColor: "#367120",
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 10,
    alignItems: "center",
    maxWidth: 672,
  },
  secondaryButton: {
    backgroundColor: "#45c0e8",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Log_in;