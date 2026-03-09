import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  SafeAreaView
} from "react-native";
import { SupaClient } from "../Supabase/supabase";
import NavBar from "../NavBar/Components/NavBar";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const AdminProvider = () => {
  const supa = SupaClient();
  const navigation = useNavigation();

  // Estados para los campos del formulario
  const [proveedorID, setProveedorID] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [editando, setEditando] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [empresaID, setEmpresaID] = useState("");

  // Función helper para mostrar toasts
  const showToast = (type, title, message) => {
    Toast.show({
      type: type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  };

  // Verificar acceso de administrador
  useEffect(() => {
    const verificarAcceso = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        const user = session ? JSON.parse(session) : null;

        if (!user || !user.esActivo ) {
          await AsyncStorage.removeItem("userSession");
          showToast("error", "Usuario no encontrado", "Cerrando Sesión.");
          navigation.navigate("Log_in");
          return;
        }
        setEmpresaID(user.empresaID);
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
          showToast("error", "Sesión Inactiva", "Cerrando Sesión.");
          navigation.navigate("Log_in");
        }
        if (!data?.esAdministrador) {
          showToast("error", "No Administrador", "Acceso no autorizado.");
          navigation.navigate("PaginaPrincipal");
        }
      } catch (error) {
        console.error("Error verificando acceso:", error);
        navigation.navigate("PaginaPrincipal");
      }
    };

    verificarAcceso();
  }, []);

  // Cargar proveedores al iniciar y cuando cambia el filtro
  useEffect(() => {
    obtenerProveedores();
  }, [filtro]);

  const obtenerProveedores = async () => {
    setLoading(true);
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

      // Aplicar búsqueda local
      if (busqueda.trim()) {
        const lower = busqueda.toLowerCase();
        resultados = resultados.filter(
          (p) =>
            p.nombre?.toLowerCase().includes(lower) ||
            p.proveedorID?.toLowerCase().includes(lower) ||
            p.contacto?.toLowerCase().includes(lower) ||
            p.telefono?.includes(lower)
        );
      }

      setProveedores(resultados);
    } catch (error) {
      console.error("Error obteniendo proveedores:", error);
      showToast("error", "Error", "No se pudieron obtener los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setProveedorID("");
    setNombre("");
    setContacto("");
    setTelefono("");
    setDireccion("");
    setEditando(null);
  };

  const guardarProveedor = async () => {
    // Validaciones
    if (!proveedorID.trim()) {
      showToast("error", "Error", "El ID del proveedor es obligatorio");
      return;
    }

    if (!nombre.trim()) {
      showToast("error", "Error", "El nombre de la empresa es obligatorio");
      return;
    }

    try {
      if (editando) {
        // Actualizar proveedor existente
        const { error } = await supa
          .from("provider")
          .update({
            proveedorID,
            nombre,
            contacto,
            telefono,
            direccion,
          })
          .eq("id", editando.id);

        if (error) throw error;

        showToast("success", "Éxito", "Proveedor actualizado correctamente");
      } else {
        // Verificar si ya existe un proveedor con ese ID
        const { data: existe, error: checkError } = await supa
          .from("provider")
          .select("proveedorID")
          .eq("proveedorID", proveedorID)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw checkError;
        }

        if (existe) {
          showToast("error", "Error", "Ya existe un proveedor con ese ID");
          return;
        }

        // Crear nuevo proveedor
        const { error } = await supa
          .from("provider")
          .insert([{
            proveedorID,
            nombre,
            contacto,
            telefono,
            direccion,
            empresaID,
            esActivo: true,
          }]);

        if (error) throw error;

        showToast("success", "Éxito", "Proveedor creado correctamente");
      }

      limpiarFormulario();
      obtenerProveedores();
    } catch (error) {
      console.error("Error guardando proveedor:", error);
      showToast("error", "Error", "No se pudo guardar el proveedor");
    }
  };

  const editarProveedor = (p) => {
    setEditando(p);
    setProveedorID(p.proveedorID);
    setNombre(p.nombre);
    setContacto(p.contacto || "");
    setTelefono(p.telefono || "");
    setDireccion(p.direccion || "");
  };

  const cambiarEstadoProveedor = async (id, nuevoEstado) => {
    // Usar Toast de confirmación personalizado
    Toast.show({
      type: 'customConfirm',
      text1: nuevoEstado ? "Activar proveedor" : "Desactivar proveedor",
      text2: `¿Estás seguro de ${nuevoEstado ? "activar" : "desactivar"} este proveedor?`,
      props: {
        buttons: [
          {
            text: 'Cancelar',
            onPress: () => Toast.hide(),
            style: { color: '#64748b' },
          },
          {
            text: 'Confirmar',
            onPress: async () => {
              Toast.hide();
              try {
                const { error } = await supa
                  .from("provider")
                  .update({ esActivo: nuevoEstado })
                  .eq("proveedorID", id);

                if (error) throw error;

                showToast(
                  "success",
                  nuevoEstado ? "Proveedor activado" : "Proveedor desactivado",
                  `El proveedor ha sido ${nuevoEstado ? "activado" : "desactivado"} correctamente`
                );

                obtenerProveedores();
              } catch (error) {
                console.error("Error cambiando estado:", error);
                showToast(
                  "error",
                  "Error",
                  `No se pudo ${nuevoEstado ? "activar" : "desactivar"} el proveedor`
                );
              }
            },
            style: { color: nuevoEstado ? '#27ae60' : '#e74c3c', fontWeight: 'bold' },
          },
        ],
      },
    });
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

  const renderProveedor = ({ item }) => (
    <View style={[styles.item, !item.esActivo && styles.itemInactivo]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemNombre}>{item.nombre}</Text>
        <View style={[styles.estadoBadge, item.esActivo ? styles.estadoActivo : styles.estadoInactivo]}>
          <Text style={[styles.estadoTexto, item.esActivo ? styles.textoActivo : styles.textoInactivo]}>
            {item.esActivo ? "ACTIVO" : "INACTIVO"}
          </Text>
        </View>
      </View>

      <View style={styles.itemContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="identifier" size={16} color="#64748b" />
          <Text style={styles.infoLabel}>ID:</Text>
          <Text style={styles.infoValue}>{item.proveedorID}</Text>
        </View>

        {item.contacto ? (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Contacto:</Text>
            <Text style={styles.infoValue}>{item.contacto}</Text>
          </View>
        ) : null}

        {item.telefono ? (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone" size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{item.telefono}</Text>
          </View>
        ) : null}

        {item.direccion ? (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Dirección:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{item.direccion}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editarProveedor(item)}
        >
          <MaterialCommunityIcons name="pencil" size={16} color="white" />
          <Text style={styles.actionText}>EDITAR</Text>
        </TouchableOpacity>

        {item.esActivo ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.deactivateButton]}
            onPress={() => cambiarEstadoProveedor(item.proveedorID, false)}
          >
            <MaterialCommunityIcons name="close" size={16} color="white" />
            <Text style={styles.actionText}>DESACTIVAR</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => cambiarEstadoProveedor(item.proveedorID, true)}
          >
            <MaterialCommunityIcons name="check" size={16} color="white" />
            <Text style={styles.actionText}>ACTIVAR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <NavBar />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Administrar Proveedores</Text>

        {/* Filtros */}
        <View style={styles.filtrosContainer}>
          <FiltroBoton estado="todos" label="Todos" />
          <FiltroBoton estado="activos" label="Activos" />
          <FiltroBoton estado="inactivos" label="Inactivos" />
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, ID, contacto o teléfono"
            value={busqueda}
            onChangeText={setBusqueda}
            onSubmitEditing={obtenerProveedores}
            placeholderTextColor="#94a3b8"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editando ? "✏️ EDITAR PROVEEDOR" : "➕ NUEVO PROVEEDOR"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="ID del proveedor *"
            value={proveedorID}
            onChangeText={setProveedorID}
            editable={!editando} // No permitir editar ID si ya existe
          />

          <TextInput
            style={styles.input}
            placeholder="Nombre de la empresa *"
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            style={styles.input}
            placeholder="Persona de contacto"
            value={contacto}
            onChangeText={setContacto}
          />

          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Dirección"
            value={direccion}
            onChangeText={setDireccion}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={limpiarFormulario}
            >
              <Text style={styles.buttonText}>CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                editando ? styles.updateButton : styles.addButton,
              ]}
              onPress={guardarProveedor}
            >
              <Text style={styles.buttonText}>
                {editando ? "ACTUALIZAR" : "GUARDAR"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de proveedores */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Lista de Proveedores</Text>
          <Text style={styles.listCount}>{proveedores.length} registros</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Cargando...</Text>
          </View>
        ) : (
          <FlatList
            data={proveedores}
            keyExtractor={(item) => item?.proveedorID?.toString() || Math.random().toString()}
            renderItem={renderProveedor}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="truck-off" size={50} color="#cbd5e1" />
                <Text style={styles.emptyText}>No hay proveedores</Text>
              </View>
            }
          />
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#45c0e8',
  },
  grande: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#45c0e8",
    textAlign: "center",
  },
  filtrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 8,
  },
  filtroBoton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#45c0e8",
    alignItems: "center",
    backgroundColor: "white",
  },
  filtroBotonActivo: {
    backgroundColor: "#45c0e8",
  },
  filtroBotonTexto: {
    color: "#45c0e8",
    fontWeight: "600",
    fontSize: 13,
  },
  filtroBotonTextoActivo: {
    color: "white",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: "#1e293b",
    marginLeft: 8,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 12,
    backgroundColor: "#f8fafc",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addButton: {
    backgroundColor: "#27ae60",
  },
  updateButton: {
    backgroundColor: "#45c0e8",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  listCount: {
    fontSize: 14,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  item: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInactivo: {
    backgroundColor: "#f8fafc",
    opacity: 0.8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemNombre: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoActivo: {
    backgroundColor: "#e3f7e3",
  },
  estadoInactivo: {
    backgroundColor: "#fde8e8",
  },
  estadoTexto: {
    fontSize: 11,
    fontWeight: "700",
  },
  textoActivo: {
    color: "#27ae60",
  },
  textoInactivo: {
    color: "#e74c3c",
  },
  itemContent: {
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    width: 65,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: "#1e293b",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: "#45c0e8",
  },
  activateButton: {
    backgroundColor: "#27ae60",
  },
  deactivateButton: {
    backgroundColor: "#e74c3c",
  },
  actionText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
  },
});

export default AdminProvider;