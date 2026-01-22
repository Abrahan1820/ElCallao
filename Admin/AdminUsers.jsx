import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SupaClient } from "../Supabase/supabase";
import NavBar from "../NavBar/Components/NavBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";


const AdminUsers = () => {
  const supa = SupaClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
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

  // 📌 Función para buscar usuarios
  const fetchUsers = async () => {
    try {
      let query = supa.from("user").select("*");

      // Si hay un término de búsqueda, filtrar por cédula, nombre o tipoDocumento
      if (searchTerm.trim() !== "") {
        query = query.or(`cedula.eq.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {}
  };

  const cambiarEstadoUsuario = async (cedula, tipoDocumento, nuevoEstado) => {
    Toast.show({
      type: 'customConfirm',
      text1: 'Cambiar estado de cuenta',
      text2: `¿Estás seguro de que deseas ${nuevoEstado ? 'activar' : 'desactivar'} esta cuenta?`,
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
            text: nuevoEstado ? 'Activar' : 'Desactivar',
            onPress: async () => {
              Toast.hide();
              try {
                // Mostrar loader
                Toast.show({
                  type: 'info',
                  text1: 'Procesando...',
                  position: 'top',
                  autoHide: false
                });
  
                const { error } = await supa
                  .from("user")
                  .update({ esActivo: nuevoEstado })
                  .eq("cedula", cedula)
                  .eq("tipoDocumento", tipoDocumento);
  
                Toast.hide(); // Ocultar loader
  
                if (error) throw error;
  
                // Mostrar confirmación de éxito
                Toast.show({
                  type: 'success',
                  text1: nuevoEstado ? 'Usuario activado' : 'Usuario desactivado',
                  text2: `El usuario ha sido ${nuevoEstado ? 'activado' : 'desactivado'}`,
                  position: 'top',
                  visibilityTime: 3000,
                  onHide: () => {
                    fetchUsers(); // Actualizar lista de usuarios
                    
                    // Verificar si es la cuenta actual
                    const currentUser = JSON.parse(AsyncStorage.getItem("userSession"));
                    if (currentUser && 
                        currentUser.cedula === cedula && 
                        currentUser.tipoDocumento === tipoDocumento && 
                        !nuevoEstado) {
                      AsyncStorage.removeItem("userSession");
                      navigation.navigate("Log_in");
                    }
                  }
                });
  
              } catch (error) {
                console.error("Error cambiando estado:", error);
                Toast.hide();
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: `No se pudo ${nuevoEstado ? 'activar' : 'desactivar'} el usuario`,
                  position: 'top',
                  visibilityTime: 3000
                });
              }
            },
            style: { 
              color: nuevoEstado ? '#4CAF50' : '#ff4444', 
              fontWeight: 'bold' 
            }
          }
        ]
      }
    });
  };

  // 📌 Cargar todos los usuarios al inicio
  useEffect(() => {
    fetchUsers();
  }, []);

  // 📌 Manejo de selección de usuario
  const handleSelectUser = (user) => {
    navigation.navigate("Sign_up", { user });
  };

  return (
    <View style={styles.grande}>
      <NavBar />
      <View style={styles.container}>
        <Text style={styles.title}>Administrar Usuarios</Text>

        {/* Campo de búsqueda */}
        <TextInput
          style={styles.input}
          placeholder="Buscar por cédula"
          onChangeText={setSearchTerm}
          value={searchTerm}
          keyboardType="numeric"
        />

        {/* Botón de búsqueda */}
        <TouchableOpacity style={styles.button} onPress={fetchUsers}>
          <Text style={styles.buttonText}>Buscar</Text>
        </TouchableOpacity>

        <FlatList
          data={users}
          keyExtractor={(item) => `${item.tipoDocumento}-${item.cedula}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, !item.esActivo && styles.itemInactivo]}
              onPress={() => handleSelectUser(item)}
            >
              <Text style={styles.userText}>
                Tipo: {item.tipoDocumento} - Cédula: {item.cedula}
              </Text>
              <Text style={styles.userText}>Nombre: {item.nombre}</Text>

              <View style={styles.actions}>
                {item.esActivo ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.desactivarButton]}
                    onPress={() =>
                      cambiarEstadoUsuario(
                        item.cedula,
                        item.tipoDocumento,
                        false
                      )
                    }
                  >
                    <Text style={styles.actionText}>Desactivar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activarButton]}
                    onPress={() =>
                      cambiarEstadoUsuario(
                        item.cedula,
                        item.tipoDocumento,
                        true
                      )
                    }
                  >
                    <Text style={styles.actionText}>Activar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

export default AdminUsers;

// 📌 Estilos
const styles = StyleSheet.create({
  grande: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#45c0e8",
  },
  input: {
    borderWidth: 1,
    borderColor: "#004b9a",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#fe6b00",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  userText: {
    fontSize: 16,
  },
  itemInactivo: {
    backgroundColor: "#f0f0f0",
    opacity: 0.8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  activarButton: {
    backgroundColor: "#e8f5e9",
  },
  desactivarButton: {
    backgroundColor: "#ffebee",
  },
  actionText: {
    color: "#007BFF",
    fontSize: 14,
  },
});
