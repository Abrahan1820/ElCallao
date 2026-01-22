import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { SupaClient } from "../Supabase/supabase";
import NavBar from "../NavBar/Components/NavBar";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const AdminProviders = () => {
  const supa = SupaClient();
  const navigation = useNavigation();

  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [editando, setEditando] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // Función para generar código aleatorio de 10 dígitos
  const generarCodigoAleatorio = () => {
    const codigo = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setCodigo(codigo);
  };

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

        if (!user.esAdministrador) {
          navigation.navigate("PaginaPrincipal");
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
    obtenerProveedores();
  }, [filtro]);

  const obtenerProveedores = async () => {
    try {
      let query = supa
        .from("provider")
        .select("*")
        .order("nombre", { ascending: true });

      if (filtro === "activos") query = query.eq("esActivo", true);
      if (filtro === "inactivos") query = query.eq("esActivo", false);

      const { data, error } = await query;
      if (error) throw error;

      let resultados = data || [];

      if (busqueda.trim()) {
        const lower = busqueda.toLowerCase();
        resultados = resultados.filter(
          (p) =>
            p.nombre.toLowerCase().includes(lower) || p.codigo.includes(lower)
        );
      }

      setProveedores(resultados);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron obtener los proveedores",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const guardarProveedor = async () => {
    if (!nombre.trim() || !codigo.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Nombre y código son obligatorios",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (codigo.length !== 10 || isNaN(Number(codigo))) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "El código debe tener exactamente 10 dígitos numéricos",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      if (editando) {
        const { error } = await supa
          .from("provider")
          .update({ nombre, codigo })
          .eq("id", editando.id);

        if (error) throw error;

        Toast.show({
          type: "success",
          text1: "Éxito",
          text2: "Proveedor actualizado",
          position: "top",
          visibilityTime: 3000,
        });
        setEditando(null);
      } else {
        const { error } = await supa
          .from("provider")
          .insert([{ nombre, codigo, esActivo: true }]);

        if (error) throw error;

        Toast.show({
          type: "success",
          text1: "Éxito",
          text2: "Proveedor creado",
          position: "top",
          visibilityTime: 3000,
        });
      }

      setNombre("");
      setCodigo("");
      obtenerProveedores();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo guardar el proveedor",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const editarProveedor = (p) => {
    setEditando(p);
    setNombre(p.nombre);
    setCodigo(p.codigo);
  };

  const cambiarEstadoProveedor = async (id, nuevoEstado) => {
    try {
      const { error } = await supa
        .from("provider")
        .update({ esActivo: nuevoEstado })
        .eq("id", id);

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: nuevoEstado ? "Proveedor activado" : "Proveedor desactivado",
        text2: `El proveedor ha sido ${nuevoEstado ? "activado" : "desactivado"}`,
        position: "top",
        visibilityTime: 3000,
      });

      obtenerProveedores();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `No se pudo ${nuevoEstado ? "activar" : "desactivar"} el proveedor`,
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

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
    <View style={styles.grande}>
      <NavBar />
      <View style={styles.container}>
        <Text style={styles.title}>Administrar Proveedores</Text>

        {/* Filtros */}
        <View style={styles.filtrosContainer}>
          <FiltroBoton estado="todos" label="Todos" />
          <FiltroBoton estado="activos" label="Activos" />
          <FiltroBoton estado="inactivos" label="Inactivos" />
        </View>

        {/* Búsqueda */}
        <TextInput
          style={styles.input}
          placeholder="Buscar por nombre o código"
          value={busqueda}
          onChangeText={setBusqueda}
          onSubmitEditing={obtenerProveedores}
        />

        {/* Formulario compacto */}
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Nombre del proveedor"
              value={nombre}
              onChangeText={setNombre}
            />
            <View style={styles.codigoContainer}>
              <TextInput
                style={[styles.input, styles.codigoInput]}
                placeholder="Código (10 dígitos)"
                keyboardType="numeric"
                value={codigo}
                onChangeText={setCodigo}
                maxLength={10}
              />
              <TouchableOpacity 
                style={styles.generarButton}
                onPress={generarCodigoAleatorio}
              >
                <Text style={styles.generarButtonText}>Generar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              editando ? styles.updateButton : styles.addButton,
            ]}
            onPress={guardarProveedor}
          >
            <Text style={styles.buttonText}>
              {editando ? "ACTUALIZAR PROVEEDOR" : "AGREGAR PROVEEDOR"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        <FlatList
          data={proveedores}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.item, !item.esActivo && styles.itemInactivo]}>
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.nombre}</Text>
                <Text style={styles.itemCode}>Código: {item.codigo}</Text>
                <Text style={styles.itemStatus}>
                  Estado: {item.esActivo ? "Activo" : "Inactivo"}
                </Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => editarProveedor(item)}
                >
                  <Text style={styles.actionText}>EDITAR</Text>
                </TouchableOpacity>
                {item.esActivo ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deactivateButton]}
                    onPress={() => cambiarEstadoProveedor(item.id, false)}
                  >
                    <Text style={styles.actionText}>DESACTIVAR</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activateButton]}
                    onPress={() => cambiarEstadoProveedor(item.id, true)}
                  >
                    <Text style={styles.actionText}>ACTIVAR</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grande: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#45c0e8",
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#004b9a",
    borderRadius: 5,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  inputHalf: {
    width: "48%",
  },
  codigoContainer: {
    
    flexDirection: "row",
    width: "48%",
  },
  codigoInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  generarButton: {
    backgroundColor: "#004b9a",
    paddingHorizontal: 12,
    justifyContent: "center",
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: "#004b9a",
    borderLeftWidth: 0,
  },
  generarButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  addButton: {
    backgroundColor: "#fe6b00",
  },
  updateButton: {
    backgroundColor: "#004b9a",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  filtrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  filtroBoton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#004b9a",
    alignItems: "center",
  },
  filtroBotonActivo: {
    backgroundColor: "#004b9a",
  },
  filtroBotonTexto: {
    color: "#004b9a",
    fontWeight: "500",
  },
  filtroBotonTextoActivo: {
    color: "white",
  },
  listContainer: {
    paddingBottom: 20,
  },
  item: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemInactivo: {
    backgroundColor: "#f8f9fa",
    opacity: 0.8,
  },
  itemContent: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  itemCode: {
    fontSize: 14,
    color: "#555",
    marginBottom: 3,
  },
  itemStatus: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: "#004b9a",
  },
  activateButton: {
    backgroundColor: "#28a745",
  },
  deactivateButton: {
    backgroundColor: "#dc3545",
  },
  actionText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default AdminProviders;