import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deactivateKeepAwake } from "expo-keep-awake";
import Toast from "react-native-toast-message";
import { SupaClient } from "../../Supabase/supabase";


// 📌 Funciones auxiliares
function generarDiametro() {
  return Math.floor(Math.random() * (125 - 75 + 1)) + 75;
}

function generarNumerosAleatorios() {
  return [
    Math.floor(Math.random() * 101),
    Math.floor(Math.random() * 101),
    Math.floor(Math.random() * (340 - 195 + 1)) + 130,
  ];
}

// 📌 Componente de Tarjeta Reutilizable
const Tarjeta = ({ imagen, texto, pagina, onPress }) => {
  const diametro = generarDiametro();
  const [numeroTop, numeroRight] = generarNumerosAleatorios();
  const dynamicStyles = StyleSheet.create({
    circle: {
      ...Styles.circle,
      width: diametro,
      height: diametro,
      top: numeroTop,
      right: numeroRight,
    },
  });

  return (
    <TouchableOpacity style={Styles.cuadro} onPress={onPress}>
      <Image source={imagen} style={Styles.settingsImg} resizeMode="contain" />
      <Text style={Styles.normalText}>{texto}</Text>
      <View style={dynamicStyles.circle} />
    </TouchableOpacity>
  );
};

// 📌 Función para determinar el saludo según la hora del día
const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12
    ? "Buenos días"
    : hour < 18
    ? "Buenas tardes"
    : "Buenas noches";
};

// 📌 Componente Principal: Página de Inicio
const MainMenu = () => {
  const navigation = useNavigation();
  const supa = SupaClient();
  const [userName, setUserName] = useState("");
  const [esAdministrador, setEsAdministrador] = useState(false);
  const [userData, setUserData] = useState(null); // Estado para almacenar los datos del usuario

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
        
      } catch (error) {
        console.error("Error verificando acceso:", error);
        navigation.navigate("PaginaPrincipal");
      }
    };
  
    verificarAcceso();
  }, []);

  useEffect(() => {
    deactivateKeepAwake(); // Deja que la pantalla se apague como siempre
  }, []);

  // 📌 Obtener los datos del usuario desde AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        if (session) {
          const userData = JSON.parse(session);
          setUserName(userData.nombre || "Usuario");
          setEsAdministrador(Boolean(userData.esAdministrador));
          setUserData(userData); // Guardar los datos del usuario
        }
      } catch (error) {}
    };

    fetchUserData();
  }, []);

  // 📌 Función para manejar la navegación a Sign_up con los datos del usuario
  const handleEditProfile = () => {
    if (userData) {
      navigation.navigate("Sign_up", { user: userData }); // Pasar los datos del usuario
    } else {
      Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "No se pudieron cargar los datos del usuario.",
                  position: "top",
                  visibilityTime: 3000,
                });
    }
  };

  // 📌 Función para cerrar sesión
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userSession");
      Toast.show({
              type: "success",
              text1: "Sesión cerrada",
              text2: "Redirigiendo al inicio.",
              position: "top",
              visibilityTime: 3000,
            });
      navigation.navigate("Log_in");
    } catch (error) {}
  };

 
  

  return (
    <LinearGradient
      colors={["#45c0e8", "#ffffff", "#ffffff"]}
      style={Styles.ContenedorGlobal}
    >
      <ScrollView>
        <View style={Styles.contenedorInicio}>
          <Text style={Styles.tituloInicio}>Inicio</Text>
        </View>

        {/* 📌 Sección de bienvenida con el nombre del usuario */}
        <View style={Styles.contenedorSaludo}>
          <Text style={Styles.Maintitle}>
            Hola {userName ? userName : "Usuario"}
          </Text>
          <Text style={Styles.tituloInicio}>{getGreeting()}</Text>
        </View>

        {/* 📌 Tarjetas para Generar PDF, Ver Lista de PDFs y Editar Perfil */}
        <View style={Styles.contenedorTarjetas}>
          <View style={Styles.contenedorFilas}>
            <Tarjeta
              imagen={require("../Assets/documento.png")}
              texto="Generar Informe"
              pagina="PDFGenerator"
              onPress={() => navigation.navigate("PDFGenerator")}
            />
            <Tarjeta
              imagen={require("../Assets/listIcon.png")}
              texto="Lista de Informes"
              pagina="PDFModify"
              onPress={() => navigation.navigate("PDFModify")}
            />
            <Tarjeta
              imagen={require("../Assets/usuario.png")} // Cambia la imagen según tu diseño
              texto="Editar Perfil"
              pagina="Sign_up"
              onPress={handleEditProfile} // Navegar a Sign_up con los datos del usuario
            />
            {esAdministrador && (
              <Tarjeta
                imagen={require("../Assets/editar.png")} // Cambia la imagen según tu diseño
                texto="Administrar"
                pagina="AdminPanel"
                onPress={() => navigation.navigate("AdminPanel")}
              />
            )}
            {esAdministrador && (
              <Tarjeta
                imagen={require("../Assets/graph.png")} // Cambia la imagen según tu diseño
                texto="Estadisticas"
                pagina="StatisticsScreen"
                onPress={() => navigation.navigate("StatisticsScreen")}
              />
              )}

              {esAdministrador && (
              <Tarjeta
                imagen={require("../Assets/graph.png")} // Cambia la imagen según tu diseño
                texto="Gestion Administrativa"
                pagina="AdminManagment"
                onPress={() => navigation.navigate("AdminManagment")}
              />
              )}
          </View>
        </View>

        {/* 📌 Botón para cerrar sesión */}
        <View style={Styles.logoutContainer}>
          <TouchableOpacity onPress={logout} style={Styles.button}>
            <Text style={Styles.buttonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default MainMenu;

// 📌 Estilos Generales
const Styles = StyleSheet.create({
  settingsImg: {
    width: 30, // Ajusta el tamaño según la resolución de la imagen
    height: 30,
    resizeMode: "contain", // Evita la distorsión
  },
  ContenedorGlobal: {
    flex: 1,
  },
  contenedorInicio: {
    marginTop: Constants.statusBarHeight + 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  contenedorSaludo: {
    marginLeft: 30,
    marginVertical: 10,
  },
  contenedorTarjetas: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 20,
    backgroundColor: "white",
    position: "absolute",
    right: 2,
  },
  tituloInicio: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  Maintitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  normalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  contenedorFilas: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  cuadro: {
    width: 160, // ancho fijo de cada tarjeta
    height: 160, // alto fijo
    backgroundColor: "#004b9a", // color uniforme
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  button: {
    backgroundColor: "#fe6b00",
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: "85%",
    alignItems: "center",
    maxWidth: 672,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 30,
  },
});
