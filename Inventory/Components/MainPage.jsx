import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deactivateKeepAwake } from "expo-keep-awake";
import Toast from "react-native-toast-message";
import { SupaClient } from "../../Supabase/supabase";
import { Ionicons } from "@expo/vector-icons";

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


// 📌 Componente de notificación para stock bajo
const StockNotificationItem = ({ product, onPress, disabled }) => (
  <TouchableOpacity 
    style={[
      notificationStyles.item,
      disabled && notificationStyles.itemDisabled
    ]} 
    onPress={onPress}
    disabled={disabled}
    activeOpacity={disabled ? 1 : 0.7}
  >
    <View style={notificationStyles.iconContainer}>
      <Ionicons name="alert-circle" size={24} color="#f39c12" />
    </View>
    <View style={notificationStyles.content}>
      <Text style={notificationStyles.productName}>{product.nombre}</Text>
      <Text style={notificationStyles.stockText}>
        Stock actual: {product.stockActual} | Mínimo: {product.stockMinimo}
      </Text>
    </View>
    {!disabled && <Ionicons name="chevron-forward" size={20} color="#94a3b8" />}
  </TouchableOpacity>
);

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
  const [userData, setUserData] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  
  // Estados para notificaciones de stock bajo
  const [notificationCount, setNotificationCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  // Verificar acceso
  useEffect(() => {
    const verificarAcceso = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        const user = session ? JSON.parse(session) : null;
  
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

  // Obtener datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        if (session) {
          const userData = JSON.parse(session);
          setUserName(userData.nombre || "Usuario");
          setEsAdministrador(Boolean(userData.esAdministrador));
          setUserData(userData);
          setEmpresaId(userData.empresaID);
        }
      } catch (error) {}
    };

    fetchUserData();
  }, []);

  // Cargar productos con stock bajo
  const fetchLowStockProducts = async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supa
        .from("product")
        .select("*")
        .eq("empresaID", empresaId)
        .eq("esActivo", true);

      if (error) throw error;

      // Filtrar productos con stock bajo (stockActual <= stockMinimo)
      const lowStock = data.filter(
        product => product.stockActual <= product.stockMinimo && product.stockActual > 0
      );

      setLowStockProducts(lowStock);
      setNotificationCount(lowStock.length);
    } catch (error) {
      console.error("Error cargando productos con stock bajo:", error);
    }
  };

  // Recargar notificaciones cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      if (empresaId) {
        fetchLowStockProducts();
      }
    }, [empresaId])
  );

  // Recargar cuando cambia empresaId
  useEffect(() => {
    if (empresaId) {
      fetchLowStockProducts();
    }
  }, [empresaId]);

  useEffect(() => {
    deactivateKeepAwake();
  }, []);

  // Navegar a compra del producto
  const handleNotificationPress = (product) => {
    setNotificationsModalVisible(false);
    navigation.navigate("Purchase", {
      preselectedProduct: product,
      suggestedQuantity: product.stockMinimo - product.stockActual + 5, // Sugerencia de compra
    });
  };

  // Editar perfil
  const handleEditProfile = () => {
    if (userData) {
      navigation.navigate("Sign_up", { user: userData });
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

  // Cerrar sesión
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

        {/* 📌 Sección de bienvenida con notificaciones */}
        <View style={Styles.contenedorSaludo}>
          <View style={Styles.headerRow}>
            <Text style={Styles.Maintitle}>
              Hola {userName ? userName : "Usuario"}
            </Text>

            {/* Campana de notificaciones */}
            <TouchableOpacity
              onPress={() => setNotificationsModalVisible(true)}
              style={{ position: "relative" }}
            >
              <Ionicons name="notifications-outline" size={26} color="#fff" />
              {notificationCount > 0 && (
                <View style={Styles.badge}>
                  <Text style={Styles.badgeText}>
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={Styles.tituloInicio}>{getGreeting()}</Text>
        </View>

        {/* 📌 Tarjetas */}
        <View style={Styles.contenedorTarjetas}>
          <View style={Styles.contenedorFilas}>
            <Tarjeta
              imagen={require("../Assets/documento.png")}
              texto="Facturar"
              pagina="Billing"
              onPress={() => navigation.navigate("Billing")}
            />
            <Tarjeta
              imagen={require("../Assets/listIcon.png")}
              texto="Transacciones"
              pagina="Movements"
              onPress={() => navigation.navigate("Movements")}
            />
            <Tarjeta
              imagen={require("../Assets/usuario.png")}
              texto="Editar Perfil"
              pagina="Sign_up"
              onPress={handleEditProfile}
            />
            {esAdministrador && (
              <Tarjeta
                imagen={require("../Assets/editar.png")}
                texto="Administrar"
                pagina="AdminPanel"
                onPress={() => navigation.navigate("AdminPanel")}
              />
            )}
            {esAdministrador && (
              <Tarjeta
                imagen={require("../Assets/graph.png")}
                texto="Estadisticas"
                pagina="StatisticsScreen"
                onPress={() => navigation.navigate("StatisticsScreen")}
              />
            )}
            {esAdministrador && (
              <Tarjeta
                imagen={require("../Assets/tipo-de-cambio.png")}
                texto="Tasa BCV"
                pagina="TasaBCV"
                onPress={() => navigation.navigate("TasaBCV")}
              />
            )}
            {esAdministrador && (
              <Tarjeta
                imagen={require("../Assets/inventario-disponible.png")}
                texto="Manejo Inventario"
                pagina="Inventory"
                onPress={() => navigation.navigate("Inventory")}
              />
            )}
            {esAdministrador && (
              <Tarjeta
                imagen={require("../Assets/bolsa.png")}
                texto="Compras"
                pagina="Purchase"
                onPress={() => navigation.navigate("Purchase")}
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

      {/* Modal de notificaciones de stock bajo */}
<Modal
  visible={notificationsModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setNotificationsModalVisible(false)}
>
  <View style={notificationStyles.modalContainer}>
    <View style={notificationStyles.modalContent}>
      <View style={notificationStyles.modalHeader}>
        <Text style={notificationStyles.modalTitle}>
          Productos con stock bajo
        </Text>
        <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {lowStockProducts.length > 0 ? (
        <FlatList
          data={lowStockProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <StockNotificationItem
              product={item}
              onPress={() => esAdministrador ? handleNotificationPress(item) : null}
              disabled={!esAdministrador}
            />
          )}
          contentContainerStyle={notificationStyles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={notificationStyles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={60} color="#27ae60" />
          <Text style={notificationStyles.emptyText}>
            No hay productos con stock bajo
          </Text>
        </View>
      )}

      {/* Botón "Ver todos" solo visible para administradores */}
      {esAdministrador && lowStockProducts.length > 0 && (
        <TouchableOpacity
          style={notificationStyles.viewAllButton}
          onPress={() => {
            setNotificationsModalVisible(false);
            navigation.navigate("Inventory", { filterLowStock: true });
          }}
        >
          <Text style={notificationStyles.viewAllText}>
            Ver todos en inventario
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
</Modal>
    </LinearGradient>
  );
};

export default MainMenu;

// 📌 Estilos para notificaciones
const notificationStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef5e7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    color: "#64748b",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 12,
  },
  viewAllButton: {
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  viewAllText: {
    color: "#45c0e8",
    fontSize: 14,
    fontWeight: "600",
  },
});

// 📌 Estilos Generales (agregamos badge y headerRow)
const Styles = StyleSheet.create({
  settingsImg: {
    width: 30,
    height: 30,
    resizeMode: "contain",
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
    width: 160,
    height: 160,
    backgroundColor: "#004b9a",
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginRight: 20,
  },
  badge: {
    position: "absolute",
    right: -8,
    top: -4,
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
});