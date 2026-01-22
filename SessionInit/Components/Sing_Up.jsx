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

  // 📌 Estados para los datos del usuario
  const [cedula, setCedula] = useState(user?.cedula || "");
  const [tipoDocumento, setTipoDocumento] = useState(
    user?.tipoDocumento || "V"
  );
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [email, setEmail] = useState(user?.email || "");
  const [msds, setMsds] = useState(user?.["M.S.D.S"] || "");
  const [contrasena, setContrasena] = useState(user?.contraseña || "");
  const [imageUri, setImageUri] = useState(user?.["Sello y firma"] || null);
  const [especialidad, setEspecialidad] = useState(user?.especialidad || "");
  const [CM, setCM] = useState(user?.CM || "");
  const [esAdministrador, setEsAdministrador] = useState(false);
  const [claveAdministrador, setClaveAdministrador] = useState("");
  const [proveedor1, setProveedor1] = useState(user?.proveedor1 || "");
  const [proveedor2, setProveedor2] = useState(user?.proveedor2 || "");
  const [proveedor3, setProveedor3] = useState(user?.proveedor3 || "");
  const [estado1, setEstado1] = useState(user?.estado1 || "");
  const [estado2, setEstado2] = useState(user?.estado2 || "");
  const [estado3, setEstado3] = useState(user?.estado3 || "");



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

        // Solo aplicar restricciones si estamos editando (hay user en la pantalla)
        if (user) {
          // Si el usuario no está activo, redirigir
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
            return;
          }
        }

        // Si llegamos aquí, o estamos en signUp (sin user) o pasó todas las validaciones
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
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      setter(String(value)); // 🔹 Asegura que siempre sea un string y evita "null"
    }
  };

  // 📌 Precargar los datos si el objeto user existe
  useEffect(() => {
    if (user) {
      safeSetState(setCedula, user.cedula);
      safeSetState(setTipoDocumento, user.tipoDocumento);
      safeSetState(setNombre, user.nombre);
      safeSetState(setMsds, user["M.S.D.S"]);
      safeSetState(setContrasena, user.contraseña);
      safeSetState(setImageUri, user["Sello y firma"]);
      safeSetState(setEspecialidad, user.especialidad);
      safeSetState(setCM, user.CM);
      safeSetState(setProveedor1, user.proveedor1);
      safeSetState(setProveedor2, user.proveedor2);
      safeSetState(setProveedor3, user.proveedor3);
      safeSetState(setEstado1, user.estado1);
      safeSetState(setEstado2, user.estado2);
      safeSetState(setEstado3, user.estado3);
    }
  }, [user]);

  // 📌 1. Seleccionar imagen de la galería
  // Modifica la función pickImageFromGallery:
  const pickImageFromGallery = async () => {
    if (Platform.OS === "web") {
      // Solución alternativa para web
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUri(event.target.result);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      // Código original para móvil
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
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
      setImageUri(result.assets[0].uri);
    }
  };

  // 📌 Función para validar la contraseña de administrador
  const validateAdminPassword = async (password) => {
    try {
      // 📌 Asegúrate de que 'supa' esté definido
      if (!supa) {
        return false;
      }

      // 📌 Buscar la contraseña en la tabla 'adminPassword' con id = 1
      const { data, error } = await supa
        .from("adminPassword")
        .select("password")
        .eq("id", 1)
        .single();

      if (error) {
        return false;
      }

      // 📌 Comparar la contraseña ingresada con la de la base de datos
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
        // 🔹 Si la imagen es mayor a 500KB, reducir calidad
        const compressedImage = await ImageManipulator.manipulateAsync(
          uri,
          [],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        return compressedImage.uri;
      }
      return uri; // 🔹 Si ya es menor a 500KB, subirla sin cambios
    } catch (error) {
      return uri;
    }
  };

  // 📌 Función para validar si un código de proveedor existe y está activo
  const validateProviderCode = async (codigo) => {
    try {
      if (!supa || !codigo) {
        return false;
      }

      const { data, error } = await supa
        .from("provider")
        .select("codigo")
        .eq("codigo", codigo)
        .eq("esActivo", true)
        .single();

      console.log(data);
      return !error && !!data;
    } catch (error) {
      console.log("no tengo proveedor");
      return false;
    }
  };

  // 📌 Función para validar si un código de proveedor existe y está activo
  const validateEstado = async (estado) => {
    try {
      if (!supa || !estado) {
        return false;
      }

      const { data, error } = await supa
        .from("estado")
        .select("ZonaAtencionID")
        .eq("ZonaAtencionID", estado)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  };



  const uploadImageAndCreateUser = async () => {

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Por favor, ingrese un email válido.",
      position: "top",
      visibilityTime: 3000,
    });
    return;
  }

    if (
      !cedula ||
      !tipoDocumento ||
      !nombre ||
      !msds ||
      !contrasena ||
      !especialidad ||
      !CM ||
      !proveedor1 || !estado1
    ) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Por favor, complete todos los campos.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (!imageUri) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Por favor, seleccione una imagen.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    // 📌 Validar contraseña antes de continuar
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.])[A-Za-z\d!@#$%^&*.]{7,}$/;
    if (!passwordRegex.test(contrasena)) {
      Toast.show({
        type: "error",
        text1: "Contraseña débil",
        text2:
          "La contraseña debe tener al menos 7 caracteres, incluir una mayúscula, un número y un carácter especial (!@#$%^&*.).",
        position: "top",
        visibilityTime: 3000,
      });
      return; // 🔹 Detiene la ejecución si la contraseña no es válida
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

    const isValidProv1 = await validateProviderCode(proveedor1);
    const isValidProv2 = proveedor2 ? await validateProviderCode(proveedor2) : true;
    const isValidProv3 = proveedor3 ? await validateProviderCode(proveedor3) : true;

    if (!isValidProv1 || !isValidProv2 || !isValidProv3) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          "Uno o más códigos de proveedor no son válidos o están inactivos.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    const isValidEst1 = await validateEstado(estado1);
    const isValidEst2 = estado2 ? await validateEstado(estado2) : true;
    const isValidEst3 = estado3 ? await validateEstado(estado3) : true;

    if (!isValidEst1 || !isValidEst2 || !isValidEst3) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          "Uno o más códigos de estado no son válidos.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }
    

    let imageUrl = imageUri;
    const isNewImage =
      imageUri &&
      !imageUri.startsWith(
        "https://wdcipvbcdrijezexqufg.supabase.co/storage/v1/object/public/signs/"
      );

    if (isNewImage) {
      try {
        if (Platform.OS === "web") {
          // Lógica para web
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const fileName = `signs/${Date.now()}.jpg`;

          const { error: uploadError } = await supa.storage
            .from("Signs")
            .upload(fileName, blob, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supa.storage
            .from("Signs")
            .getPublicUrl(fileName);

          imageUrl = publicUrlData.publicUrl;
        } else {
          // Lógica para móvil
          const compressedUri = await compressImage(imageUri);
          const fileName = `signs/${Date.now()}.jpg`;
          const file = {
            uri: compressedUri,
            name: fileName,
            type: "image/jpeg",
          };

          const { error: uploadError } = await supa.storage
            .from("Signs")
            .upload(file.name, file, { contentType: file.type });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supa.storage
            .from("Signs")
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
        const esAdminValue = esAdministrador ? true : false;
        // 📌 Actualizar usuario
        const { data: updatedUser, error: updateError } = await supa
          .from("user")
          .update({
            cedula,
            tipoDocumento,
            nombre,
            "M.S.D.S": parseInt(msds),
            "Sello y firma": isNewImage ? imageUrl : user["Sello y firma"], // 📌 Mantiene la imagen si no se cambió
            contraseña: contrasena,
            esAdministrador: esAdminValue,
            especialidad,
            CM,
            proveedor1,
            proveedor2,
            proveedor3,
            email,
            estado1,
            estado2,
            estado3,
          })
          .eq("cedula", user.cedula)
          .eq("tipoDocumento", user.tipoDocumento)
          .select()
          .single();

        if (updateError) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Ocurrió un problema al actualizar el usuario..",
            position: "top",
            visibilityTime: 3000,
          });
          return; // Detener la ejecución
        }

        // 📌 Si el usuario se modifica a sí mismo, actualizar sesión
        if (currentUser && currentUser.cedula === user.cedula) {
          await AsyncStorage.setItem(
            "userSession",
            JSON.stringify(updatedUser)
          );
        }

        navigation.navigate("PaginaPrincipal");
      } else {
        // 📌 Crear nuevo usuario
        const { data: newUser, error: userError } = await supa
          .from("user")
          .insert([
            {
              tipoDocumento,
              cedula: parseInt(cedula),
              nombre,
              "M.S.D.S": parseInt(msds),
              "Sello y firma": imageUrl, // 📌 Solo se sube si el usuario la seleccionó
              contraseña: contrasena,
              esAdministrador,
              especialidad,
              CM,
              proveedor1,
              proveedor2,
              proveedor3,
              email,
              estado1,
              estado2,
              estado3,
            },
          ])
          .select()
          .single();

        if (userError) {
          if (userError.code === "23505") {
            // Código de error UNIQUE VIOLATION en PostgreSQL
            const errorMessage = userError.message.toLowerCase();

            if (errorMessage.includes("user_pkey")) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  "Ya existe un usuario con esta cédula y tipo de documento.",
                position: "top",
                visibilityTime: 3000,
              });
            } else if (errorMessage.includes("m.s.d.s")) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "El M.S.D.S ingresado ya está registrado.",
                position: "top",
                visibilityTime: 3000,
              });
            } else if (errorMessage.includes("cm")) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "El número de Colegio de Médicos ya está registrado.",
                position: "top",
                visibilityTime: 3000,
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Ya existe un usuario con estos datos.",
                position: "top",
                visibilityTime: 3000,
              });
            }
          } else {
  console.error("❌ Error creando usuario:", userError);

  Toast.show({
    type: "error",
    text1: `Error ${userError.code || ""}`,
    text2: userError.message || JSON.stringify(userError),
    position: "top",
    visibilityTime: 6000,
  });
}

          return; // Detener la ejecución
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
      text2:
        "¿Estás seguro de que deseas desactivar esta cuenta? Esta acción no se puede deshacer.",
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
                  type: "info", // Asegúrate que este tipo está en tu toastConfig
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
                  type: "success", // Asegúrate que este tipo está en tu toastConfig
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
                  type: "error", // Asegúrate que este tipo está en tu toastConfig
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
    const numeros = texto.replace(/[^0-9]/g, ""); // 🔹 Elimina cualquier carácter que no sea número
    setValor(numeros);
  };

  const handleNombreChange = (text, setStatus) => {
    // Expresión regular que permite solo letras (con tildes) y espacios
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;

    if (regex.test(text) || text === "") {
      setStatus(text);
    }
  };

  const [showProveedor2, setShowProveedor2] = useState(false);
  const [showProveedor3, setShowProveedor3] = useState(false);
  const [showEstado2, setShowEstado2] = useState(false);
  const [showEstado3, setShowEstado3] = useState(false);


  return (
    <View style={styles.grande}>
      {user && <NavBar />}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          data={[{ key: "form" }]} // Solo un elemento para renderizar todo el formulario
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
                placeholder="Nombre"
                placeholderTextColor="grey"
                onChangeText={(text) => handleNombreChange(text, setNombre)}
                value={nombre}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="grey"
                onChangeText={setEmail}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="M.S.D.S"
                placeholderTextColor="grey"
                onChangeText={(text) => soloNumeros(text, setMsds)}
                value={msds}
                keyboardType="numeric"
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
                placeholder="Especialidad"
                placeholderTextColor="grey"
                onChangeText={(text) =>
                  handleNombreChange(text, setEspecialidad)
                }
                value={especialidad}
              />

              <TextInput
                style={styles.input}
                placeholder="Colegio de Medicos"
                placeholderTextColor="grey"
                onChangeText={(text) => soloNumeros(text, setCM)}
                value={CM}
                keyboardType="numeric"
              />

              {/* Campo Proveedor 1 */}
              <View style={styles.inputWithButtonContainer}>
                <TextInput
                  style={[styles.input, styles.inputWithButton]}
                  placeholder="Código de proveedor 1"
                  value={proveedor1}
                  onChangeText={setProveedor1}
                  placeholderTextColor="grey"
                />
                <TouchableOpacity
                  onPress={() => setShowProveedor2(!showProveedor2)}
                  style={styles.inputButton}
                >
                  <Text style={styles.inputButtonText}>
                    {showProveedor2 ? "−" : "+"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showProveedor2 && (
                <>
                  {/* Campo Proveedor 2 */}
                  <View style={styles.inputWithButtonContainer}>
                    <TextInput
                      style={[styles.input, styles.inputWithButton]}
                      placeholder="Código de proveedor 2"
                      value={proveedor2}
                      onChangeText={setProveedor2}
                      placeholderTextColor="grey"
                    />
                    <TouchableOpacity
                      onPress={() => setShowProveedor3(!showProveedor3)}
                      style={styles.inputButton}
                    >
                      <Text style={styles.inputButtonText}>
                        {showProveedor3 ? "−" : "+"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {showProveedor3 && (
                /* Campo Proveedor 3 (sin botón) */
                <TextInput
                  style={styles.input}
                  placeholder="Código de proveedor 3"
                  value={proveedor3}
                  onChangeText={setProveedor3}
                  placeholderTextColor="grey"
                />
              )}

              {/* Campo Proveedor 1 */}
              <View style={styles.inputWithButtonContainer}>
                <TextInput
                  style={[styles.input, styles.inputWithButton]}
                  placeholder="Código de Estado"
                  value={estado1}
                  onChangeText={setEstado1}
                  placeholderTextColor="grey"
                />
                <TouchableOpacity
                  onPress={() => setShowEstado2(!showEstado2)}
                  style={styles.inputButton}
                >
                  <Text style={styles.inputButtonText}>
                    {showEstado2 ? "−" : "+"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showEstado2 && (
                <>
                  {/* Campo Proveedor 2 */}
                  <View style={styles.inputWithButtonContainer}>
                    <TextInput
                      style={[styles.input, styles.inputWithButton]}
                      placeholder="Código de Estado 2"
                      value={estado2}
                      onChangeText={setEstado2}
                      placeholderTextColor="grey"
                    />
                    <TouchableOpacity
                      onPress={() => setShowEstado3(!showEstado3)}
                      style={styles.inputButton}
                    >
                      <Text style={styles.inputButtonText}>
                        {showEstado3 ? "−" : "+"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {showEstado3 && (
                /* Campo Proveedor 3 (sin botón) */
                <TextInput
                  style={styles.input}
                  placeholder="Código de Estado 3"
                  value={estado3}
                  onChangeText={setEstado3}
                  placeholderTextColor="grey"
                />
              )}  

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

              {/* Botones de imagen */}
              <TouchableOpacity
                style={styles.button}
                onPress={pickImageFromGallery}
              >
                <Text style={styles.buttonText}>Seleccionar de la galería</Text>
              </TouchableOpacity>

              {Platform.OS !== "web" && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={takePhotoWithCamera}
                >
                  <Text style={styles.buttonText}>Tomar una foto</Text>
                </TouchableOpacity>
              )}

              {/* Vista previa de imagen */}
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.image} />
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
    </View>
  );
};

// Estilos actualizados
const styles = StyleSheet.create({
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
  inputWithButtonContainer: {
    flexDirection: "row",
    width: "90%",
    maxWidth: 672,
    marginBottom: 15,
    alignItems: "center",
  },
  inputWithButton: {
    flex: 1,
    paddingRight: 50, // Espacio para el botón
    marginBottom: 0,
  },
  inputButton: {
    position: "absolute",
    right: 10,
    backgroundColor: "#004b9a",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  inputButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 20,
  },
});

export default Sign_up;
