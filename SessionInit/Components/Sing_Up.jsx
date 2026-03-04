import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { SupaClient } from "../../Supabase/supabase";
import * as FileSystem from "expo-file-system";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavBar from "../../NavBar/Components/NavBar";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";

const Sign_up = () => {
  const supa = SupaClient();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = route.params || {};

  // 📌 Estados para los datos del usuario (adaptados a tu nuevo modelo)
  const [cedula, setCedula] = useState(user?.cedula || "");
  const [tipoDocumento, setTipoDocumento] = useState(user?.tipoDocumento || "V");
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [contrasena, setContrasena] = useState(user?.contraseña || "");
  const [esAdministrador, setEsAdministrador] = useState(user?.esAdministrador || false);
  const [empresaID, setEmpresaID] = useState(user?.empresaID || "");
  const [fotoCedula, setFotoCedula] = useState(user?.fotoCedula || null);
  const [claveAdministrador, setClaveAdministrador] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados para el Dropdown
  const [openTipoDoc, setOpenTipoDoc] = useState(false);
  const [itemsTipoDoc, setItemsTipoDoc] = useState([
    { label: "Venezolano", value: "V" },
    { label: "Extranjero", value: "E" },
    { label: "Pasaporte", value: "P" },
  ]);

  useEffect(() => {
    const verificarAcceso = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        const user = session ? JSON.parse(session) : null;

        if (user) {
          if (!user.esActivo) {
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
            return;
          }
        }
      } catch (error) {
        console.error("Error verificando acceso:", error);
        navigation.navigate("PaginaPrincipal");
      }
    };

    verificarAcceso();
  }, []);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        if (session) {
          const userData = JSON.parse(session);
          setCurrentUser(userData);
          setIsAdmin(Boolean(userData.esAdministrador));
        }
      } catch (error) {}
    };

    fetchUserSession();
  }, []);

  // 📌 Solicitar permisos para la galería al cargar el componente
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permisos necesarios",
          text2: "Se necesitan permisos para acceder a la galería.",
          position: "top",
          visibilityTime: 3000,
        });
      }
    })();
  }, []);

  const safeSetState = (setter, value) => {
    if (value !== null && value !== undefined) {
      setter(String(value));
    }
  };

  // 📌 Precargar los datos si el objeto user existe
  useEffect(() => {
    if (user) {
      safeSetState(setCedula, user.cedula);
      safeSetState(setTipoDocumento, user.tipoDocumento);
      safeSetState(setNombre, user.nombre);
      safeSetState(setContrasena, user.contraseña);
      setEsAdministrador(user.esAdministrador || false);
      safeSetState(setEmpresaID, user.empresaID);
      safeSetState(setFotoCedula, user.fotoCedula);
    }
  }, [user]);

  // 📌 1. Seleccionar imagen de la galería
  const pickImageFromGallery = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          setFotoCedula(event.target.result);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setFotoCedula(result.assets[0].uri);
      }
    }
  };

  // 📌 2. Tomar foto con la cámara
  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permisos necesarios",
        text2: "Se necesitan permisos para acceder a la cámara.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFotoCedula(result.assets[0].uri);
    }
  };

  // 📌 Función para validar la contraseña de administrador
  const validateAdminPassword = async (password) => {
    try {
      if (!supa) {
        return false;
      }

      const { data, error } = await supa
        .from("adminPassword")
        .select("password")
        .eq("id", 1)
        .single();

      if (error) {
        return false;
      }

      return data && data.password === password;
    } catch (error) {
      return false;
    }
  };

  // 📌 Función para comprimir la imagen antes de subirla
  const compressImage = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.size > 500000) {
        const compressedImage = await ImageManipulator.manipulateAsync(
          uri,
          [],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        return compressedImage.uri;
      }
      return uri;
    } catch (error) {
      return uri;
    }
  };

  const uploadImageAndCreateUser = async () => {
    // Validaciones básicas
    if (!cedula || !tipoDocumento || !nombre || !contrasena || !empresaID) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Por favor, complete todos los campos obligatorios.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    // 📌 Validar contraseña
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.])[A-Za-z\d!@#$%^&*.]{7,}$/;
    if (!passwordRegex.test(contrasena)) {
      Toast.show({
        type: "error",
        text1: "Contraseña débil",
        text2: "La contraseña debe tener al menos 7 caracteres, incluir una mayúscula, un número y un carácter especial (!@#$%^&*.).",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (esAdministrador) {
      const isValid = await validateAdminPassword(claveAdministrador);
      if (!isValid) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Clave de administrador incorrecta.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }
    }

    let imageUrl = fotoCedula;
    const isNewImage = fotoCedula &&
      !fotoCedula.startsWith(
        "https://wuyodajpxeoydzmulgkm.supabase.co/storage/v1/object/public/user/"
      );

    if (isNewImage && fotoCedula) {
      try {
        if (Platform.OS === "web") {
          const response = await fetch(fotoCedula);
          const blob = await response.blob();
          const fileName = `user/${Date.now()}.jpg`;

          const { error: uploadError } = await supa.storage
            .from("user")
            .upload(fileName, blob, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supa.storage
            .from("user")
            .getPublicUrl(fileName);

          imageUrl = publicUrlData.publicUrl;
        } else {
          const compressedUri = await compressImage(fotoCedula);
          const fileName = `user/${Date.now()}.jpg`;
          const file = {
            uri: compressedUri,
            name: fileName,
            type: "image/jpeg",
          };

          const { error: uploadError } = await supa.storage
            .from("user")
            .upload(file.name, file, { contentType: file.type });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supa.storage
            .from("user")
            .getPublicUrl(file.name);

          imageUrl = publicUrlData.publicUrl;
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudo subir la imagen.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }
    }

    try {
      if (user) {
        // 📌 Actualizar usuario
        const { data: updatedUser, error: updateError } = await supa
          .from("user")
          .update({
            cedula: parseInt(cedula),
            tipoDocumento,
            nombre,
            contraseña: contrasena,
            esAdministrador,
            empresaID: parseInt(empresaID),
            fotoCedula: isNewImage ? imageUrl : user.fotoCedula,
          })
          .eq("cedula", user.cedula)
          .eq("tipoDocumento", user.tipoDocumento)
          .select()
          .single();

        if (updateError) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Ocurrió un problema al actualizar el usuario.",
            position: "top",
            visibilityTime: 3000,
          });
          return;
        }

        if (currentUser && currentUser.cedula === user.cedula) {
          await AsyncStorage.setItem("userSession", JSON.stringify(updatedUser));
        }

        navigation.navigate("PaginaPrincipal");
      } else {
        // 📌 Crear nuevo usuario
        const { data: newUser, error: userError } = await supa
          .from("user")
          .insert([
            {
              cedula: parseInt(cedula),
              tipoDocumento,
              nombre,
              contraseña: contrasena,
              esAdministrador,
              esActivo: true,
              empresaID: parseInt(empresaID),
              fotoCedula: imageUrl || null,
            },
          ])
          .select()
          .single();

        if (userError) {
          if (userError.code === "23505") {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Ya existe un usuario con esta cédula y tipo de documento.",
              position: "top",
              visibilityTime: 3000,
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Ocurrió un problema al registrar el usuario.",
              position: "top",
              visibilityTime: 3000,
            });
          }
          return;
        }

        await saveSession(newUser);
        navigation.navigate("PaginaPrincipal");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Ocurrió un problema inesperado.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handleDeleteAccount = async () => {
    Toast.show({
      type: "customConfirm",
      text1: "Eliminar cuenta",
      text2: "¿Estás seguro de que deseas desactivar esta cuenta? Esta acción no se puede deshacer.",
      position: "top",
      autoHide: false,
      props: {
        buttons: [
          {
            text: "Cancelar",
            onPress: () => Toast.hide(),
            style: { color: "#666" },
          },
          {
            text: "Desactivar",
            onPress: async () => {
              Toast.hide();
              try {
                Toast.show({
                  type: "info",
                  text1: "Procesando...",
                  position: "top",
                  autoHide: false,
                });

                const { error } = await supa
                  .from("user")
                  .update({ esActivo: false })
                  .eq("cedula", user.cedula)
                  .eq("tipoDocumento", user.tipoDocumento);

                Toast.hide();

                if (error) throw error;

                Toast.show({
                  type: "success",
                  text1: "Cuenta desactivada",
                  text2: "El usuario ha sido marcado como inactivo.",
                  position: "top",
                  visibilityTime: 3000,
                });

                if (currentUser && currentUser.cedula === user.cedula) {
                  await AsyncStorage.removeItem("userSession");
                  navigation.navigate("Log_in");
                }
              } catch (error) {
                console.error("Error desactivando cuenta:", error);
                Toast.hide();
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "No se pudo desactivar la cuenta.",
                  position: "top",
                  visibilityTime: 3000,
                });
              }
            },
            style: { color: "#ff4444", fontWeight: "bold" },
          },
        ],
      },
    });
  };

  // 📌 Guardar sesión en AsyncStorage
  const saveSession = async (userData) => {
    try {
      await AsyncStorage.setItem("userSession", JSON.stringify(userData));
    } catch (error) {}
  };

  const soloNumeros = (texto, setValor) => {
    const numeros = texto.replace(/[^0-9]/g, "");
    setValor(numeros);
  };

  const handleNombreChange = (text, setStatus) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (regex.test(text) || text === "") {
      setStatus(text);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#45c0e8" />
      <NavBar />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          data={[{ key: "form" }]}
          renderItem={() => (
            <View style={styles.innerContainer}>
              <Text style={styles.title}>
                {user ? "Editar Usuario" : "Registro de Usuario"}
              </Text>

              {/* Tipo de Documento Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo de Documento</Text>
                <DropDownPicker
                  open={openTipoDoc}
                  value={tipoDocumento}
                  items={itemsTipoDoc}
                  setOpen={setOpenTipoDoc}
                  setValue={setTipoDocumento}
                  setItems={setItemsTipoDoc}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholder="Seleccione el tipo"
                  zIndex={3000}
                  zIndexInverse={1000}
                />
              </View>

              {/* Campos del formulario */}
              <TextInput
                style={styles.input}
                placeholder="Número de Documento"
                placeholderTextColor="grey"
                onChangeText={(text) => soloNumeros(text, setCedula)}
                value={cedula}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Nombre Completo"
                placeholderTextColor="grey"
                onChangeText={(text) => handleNombreChange(text, setNombre)}
                value={nombre}
              />

              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="grey"
                onChangeText={setContrasena}
                value={contrasena}
                secureTextEntry
              />

              <TextInput
                style={styles.input}
                placeholder="ID de Empresa"
                placeholderTextColor="grey"
                onChangeText={(text) => soloNumeros(text, setEmpresaID)}
                value={empresaID}
                keyboardType="numeric"
              />

              {/* Botón Toggle Administrador */}
              <TouchableOpacity
                style={styles.button}
                onPress={() => setEsAdministrador(!esAdministrador)}
              >
                <Text style={styles.buttonText}>
                  {esAdministrador ? "Es Administrador" : "No es Administrador"}
                </Text>
              </TouchableOpacity>

              {/* Campo Clave Admin (condicional) */}
              {esAdministrador && (
                <TextInput
                  style={styles.input}
                  placeholder="Clave de Administrador"
                  placeholderTextColor="grey"
                  onChangeText={setClaveAdministrador}
                  value={claveAdministrador}
                  secureTextEntry
                />
              )}

              {/* Botones de imagen (opcional) */}
              <TouchableOpacity
                style={styles.button}
                onPress={pickImageFromGallery}
              >
                <Text style={styles.buttonText}>Seleccionar foto de cédula</Text>
              </TouchableOpacity>

              {Platform.OS !== "web" && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={takePhotoWithCamera}
                >
                  <Text style={styles.buttonText}>Tomar foto de cédula</Text>
                </TouchableOpacity>
              )}

              {/* Vista previa de imagen */}
              {fotoCedula && (
                <Image source={{ uri: fotoCedula }} style={styles.image} />
              )}

              {/* Botón principal */}
              <TouchableOpacity
                style={styles.button}
                onPress={uploadImageAndCreateUser}
              >
                <Text style={styles.buttonText}>
                  {user ? "Actualizar Usuario" : "Registrar Usuario"}
                </Text>
              </TouchableOpacity>

              {/* Botón eliminar (condicional) */}
              {user && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "red" }]}
                  onPress={handleDeleteAccount}
                >
                  <Text style={styles.buttonText}>Desactivar cuenta</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Estilos (se mantienen igual)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#45c0e8",
  },
  grande: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  innerContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  title: {
    fontSize: 20,
    color: "#45c0e8",
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  inputContainer: {
    width: "90%",
    maxWidth: 672,
    marginBottom: 15,
    zIndex: 1000,
  },
  label: {
    color: "#004b9a",
    marginBottom: 5,
    marginLeft: 10,
  },
  dropdown: {
    borderColor: "#004b9a",
    backgroundColor: "white",
    borderRadius: 25,
    height: 50,
    maxWidth: 672,
  },
  dropdownContainer: {
    borderColor: "#004b9a",
    borderRadius: 10,
    marginTop: 5,
  },
  dropdownText: {
    color: "#004b9a",
    fontSize: 16,
    maxWidth: 672,
  },
  input: {
    width: "90%",
    maxWidth: 672,
    height: 50,
    borderWidth: 1,
    borderColor: "#004b9a",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    color: "#004b9a",
  },
  button: {
    backgroundColor: "#fe6b00",
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: "90%",
    maxWidth: 672,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: "center",
  },
});

export default Sign_up;