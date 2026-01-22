import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { SupaClient } from "../Supabase/supabase";
import NavBar from "../NavBar/Components/NavBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

const AdminInsurance = () => {
  const [nombre, setNombre] = useState("");
  const [aseguradoras, setAseguradoras] = useState([]);
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState("todos"); // 'todos', 'activos', 'inactivos'
  const supa = SupaClient();
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



  useEffect(() => {
    obtenerAseguradoras();
  }, [filtro]);

  const obtenerAseguradoras = async () => {
    try {
      let query = supa
        .from("insurance")
        .select("*")
        .order("nombre", { ascending: true });

      if (filtro === "activos") {
        query = query.eq("esActivo", true);
      } else if (filtro === "inactivos") {
        query = query.eq("esActivo", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAseguradoras(data || []);
    } catch (error) {
      Toast.show({
                type: "error",
                text1: "Error",
                text2: "No se pudieron cargar las aseguradoras.",
                position: "top",
                visibilityTime: 3000,
              });
    }
  };

  const guardarAseguradora = async () => {
    try {
      if (!nombre.trim()) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Debes ingresar un nombre.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      if (editando) {
        const { error } = await supa
          .from("insurance")
          .update({ nombre })
          .eq("id", editando.id);

        if (error) throw error;
        Toast.show({
          type: "success",
          text1: "Éxito",
          text2: "Aseguradora actualizada correctamente.",
          position: "top",
          visibilityTime: 3000,
        });
        setEditando(null);
      } else {
        const { error } = await supa
          .from("insurance")
          .insert([{ nombre, esActivo: true }]);

        if (error) throw error;
        Toast.show({
          type: "success",
          text1: "Éxito",
          text2: "Aseguradora creada correctamente.",
          position: "top",
          visibilityTime: 3000,
        });
      }

      setNombre("");
      obtenerAseguradoras();
    } catch (error) {
      console.error("Error guardando aseguradora:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: editando 
          ? 'No se pudo actualizar la aseguradora' 
          : 'No se pudo crear la aseguradora',
        position: 'top', // o 'bottom' según tu preferencia
        visibilityTime: 3000, // 3 segundos
      });
    }
  };

  const cambiarEstadoAseguradora = async (id, nuevoEstado) => {
    try {
      const { error } = await supa
        .from("insurance")
        .update({ esActivo: nuevoEstado })
        .eq("id", id);

        if (error) throw error;

        Toast.show({
          type: 'success',
          text1: nuevoEstado ? 'Aseguradora activada' : 'Aseguradora desactivada',
          text2: `La aseguradora ha sido ${nuevoEstado ? 'activada' : 'desactivada'}`,
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
          onHide: () => obtenerAseguradoras(), // Ejecuta obtenerAseguradoras cuando el toast se oculta
        });
      
      } catch (error) {
        console.error('Error cambiando estado:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: `No se pudo ${nuevoEstado ? 'activar' : 'desactivar'} la aseguradora`,
          position: 'top',
          visibilityTime: 3000
        });
      }
  };

  const editarAseguradora = (aseguradora) => {
    setEditando(aseguradora);
    setNombre(aseguradora.nombre);
  };

  // Filtros visuales
  const FiltroBoton = ({ estado, label }) => (
    <TouchableOpacity
      style={[
        styles.filtroBoton,
        filtro === estado && styles.filtroBotonActivo,
      ]}
      onPress={() => setFiltro(estado)}
    >
      <Text
        style={[
          styles.filtroBotonTexto,
          filtro === estado && styles.filtroBotonTextoActivo,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <NavBar />
      <Text style={styles.title}>Administrar Aseguradoras</Text>
      <View style={styles.interContainer}>
        <View style={styles.filtrosContainer}>
          <FiltroBoton estado="todos" label="Todos" />
          <FiltroBoton estado="activos" label="Activos" />
          <FiltroBoton estado="inactivos" label="Inactivos" />
        </View>

        {/* Formulario */}
        <TextInput
          style={styles.input}
          placeholder="Nombre de aseguradora"
          value={nombre}
          onChangeText={setNombre}
        />

        <TouchableOpacity style={styles.button} onPress={guardarAseguradora}>
          <Text style={styles.buttonText}>
            {editando ? "Actualizar" : "Agregar"}
          </Text>
        </TouchableOpacity>

        {/* Lista */}
        <FlatList
          data={aseguradoras}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.item, !item.esActivo && styles.itemInactivo]}>
              <Text style={styles.itemText}>
                {item.nombre}
                {!item.esActivo && " (Inactivo)"}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => editarAseguradora(item)}
                >
                  <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>

                {item.esActivo ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.desactivarButton]}
                    onPress={() => cambiarEstadoAseguradora(item.id, false)}
                  >
                    <Text style={styles.actionText}>Desactivar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activarButton]}
                    onPress={() => cambiarEstadoAseguradora(item.id, true)}
                  >
                    <Text style={styles.actionText}>Activar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          style={styles.flatList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  interContainer: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#45c0e8",
    textAlign: "center",
    paddingTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#004b9a",
    padding: 15,
    marginBottom: 15,
    borderRadius: 25,
    fontSize: 16,
    width: "90%",
  },
  button: {
    backgroundColor: "#fe6b00",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
    width: "90%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 20,
    width: "100%",
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
  },
  itemInactivo: {
    backgroundColor: "#f0f0f0",
    opacity: 0.8,
  },
  itemText: {
    fontSize: 16,
    color: "#004b9a",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    width: "100%",
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
  filtrosContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    width: "90%",
  },
  filtroBoton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#004b9a",
  },
  filtroBotonActivo: {
    backgroundColor: "#004b9a",
  },
  filtroBotonTexto: {
    color: "#004b9a",
  },
  filtroBotonTextoActivo: {
    color: "white",
  },
  flatList: {
    width: "90%",
  },
});
export default AdminInsurance;
