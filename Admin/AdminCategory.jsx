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

const AdminCategory = () => {
  const supa = SupaClient();
  const navigation = useNavigation();

  // Estados para los campos del formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editando, setEditando] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

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

        if (!user || !user.esActivo) {
          await AsyncStorage.removeItem("userSession");
          showToast("error", "Usuario no encontrado", "Cerrando Sesión.");
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

  // Cargar categorías al iniciar y cuando cambia el filtro
  useEffect(() => {
    obtenerCategorias();
  }, [filtro]);

  const obtenerCategorias = async () => {
    setLoading(true);
    try {
      let query = supa
        .from("productCategory")
        .select("*")
        .order("nombre", { ascending: true });

      if (filtro === "activas") query = query.eq("esActivo", true);
      if (filtro === "inactivas") query = query.eq("esActivo", false);

      const { data, error } = await query;
      if (error) throw error;

      let resultados = data || [];

      // Aplicar búsqueda local
      if (busqueda.trim()) {
        const lower = busqueda.toLowerCase();
        resultados = resultados.filter(
          (c) =>
            c.nombre?.toLowerCase().includes(lower) ||
            c.descripcion?.toLowerCase().includes(lower)
        );
      }

      setCategorias(resultados);
    } catch (error) {
      console.error("Error obteniendo categorías:", error);
      showToast("error", "Error", "No se pudieron obtener las categorías");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setEditando(null);
  };

  const guardarCategoria = async () => {
    // Validaciones
    if (!nombre.trim()) {
      showToast("error", "Error", "El nombre de la categoría es obligatorio");
      return;
    }

    try {
      if (editando) {
        // Actualizar categoría existente
        const { error } = await supa
          .from("productCategory")
          .update({
            nombre,
            descripcion,
          })
          .eq("id", editando.id);

        if (error) throw error;

        showToast("success", "Éxito", "Categoría actualizada correctamente");
      } else {
        // Verificar si ya existe una categoría con ese nombre
        const { data: existe, error: checkError } = await supa
          .from("productCategory")
          .select("nombre")
          .eq("nombre", nombre)
          .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
          throw checkError;
        }

        if (existe) {
          showToast("error", "Error", "Ya existe una categoría con ese nombre");
          return;
        }

        // Crear nueva categoría
        const { error } = await supa
          .from("productCategory")
          .insert([{
            nombre,
            descripcion: descripcion || null,
            esActivo: true,
          }]);

        if (error) throw error;

        showToast("success", "Éxito", "Categoría creada correctamente");
      }

      limpiarFormulario();
      obtenerCategorias();
    } catch (error) {
      console.error("Error guardando categoría:", error);
      showToast("error", "Error", "No se pudo guardar la categoría");
    }
  };

  const editarCategoria = (c) => {
    if (!c) return;
    
    setEditando(c);
    setNombre(c.nombre || "");
    setDescripcion(c.descripcion || "");
  };

  const cambiarEstadoCategoria = async (id, nuevoEstado) => {
    if (!id) {
      showToast("error", "Error", "ID de categoría no válido");
      return;
    }

    // Usar Toast de confirmación personalizado
    Toast.show({
      type: 'customConfirm',
      text1: nuevoEstado ? "Activar categoría" : "Desactivar categoría",
      text2: `¿Estás seguro de ${nuevoEstado ? "activar" : "desactivar"} esta categoría?`,
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
                  .from("productCategory")
                  .update({ esActivo: nuevoEstado })
                  .eq("id", id);

                if (error) throw error;

                showToast(
                  "success", 
                  nuevoEstado ? "Categoría activada" : "Categoría desactivada",
                  `La categoría ha sido ${nuevoEstado ? "activada" : "desactivada"} correctamente`
                );

                obtenerCategorias();
              } catch (error) {
                console.error("Error cambiando estado:", error);
                showToast(
                  "error", 
                  "Error", 
                  `No se pudo ${nuevoEstado ? "activar" : "desactivar"} la categoría`
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

  const renderCategoria = ({ item }) => {
    if (!item) return null;
    
    return (
      <View style={[styles.item, !item.esActivo && styles.itemInactivo]}>
        <View style={styles.itemHeader}>
          <View style={styles.tituloContainer}>
            <Text style={styles.itemNombre}>{item.nombre || "Sin nombre"}</Text>
            {item.descripcion ? (
              <Text style={styles.itemDescripcion} numberOfLines={2}>
                {item.descripcion}
              </Text>
            ) : null}
          </View>
          <View style={[styles.estadoBadge, item.esActivo ? styles.estadoActivo : styles.estadoInactivo]}>
            <Text style={[styles.estadoTexto, item.esActivo ? styles.textoActivo : styles.textoInactivo]}>
              {item.esActivo ? "ACTIVA" : "INACTIVA"}
            </Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <Text style={styles.itemId}>ID: {item.id}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => item?.id && editarCategoria(item)}
            >
              <MaterialCommunityIcons name="pencil" size={14} color="white" />
              <Text style={styles.actionText}>EDITAR</Text>
            </TouchableOpacity>

            {item.esActivo ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.deactivateButton]}
                onPress={() => item?.id && cambiarEstadoCategoria(item.id, false)}
              >
                <MaterialCommunityIcons name="close" size={14} color="white" />
                <Text style={styles.actionText}>DESACTIVAR</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.activateButton]}
                onPress={() => item?.id && cambiarEstadoCategoria(item.id, true)}
              >
                <MaterialCommunityIcons name="check" size={14} color="white" />
                <Text style={styles.actionText}>ACTIVAR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <NavBar />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Administrar Categorías</Text>

        {/* Filtros */}
        <View style={styles.filtrosContainer}>
          <FiltroBoton estado="todas" label="Todas" />
          <FiltroBoton estado="activas" label="Activas" />
          <FiltroBoton estado="inactivas" label="Inactivas" />
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o descripción"
            value={busqueda}
            onChangeText={setBusqueda}
            onSubmitEditing={obtenerCategorias}
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
            {editando ? "✏️ EDITAR CATEGORÍA" : "➕ NUEVA CATEGORÍA"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre de la categoría *"
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={limpiarFormulario}
            >
              <Text style={styles.cancelButtonText}>CANCELAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                editando ? styles.updateButton : styles.addButton,
              ]}
              onPress={guardarCategoria}
            >
              <Text style={styles.buttonText}>
                {editando ? "ACTUALIZAR" : "GUARDAR"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de categorías */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Lista de Categorías</Text>
          <Text style={styles.listCount}>{categorias.length} registros</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Cargando...</Text>
          </View>
        ) : (
          <FlatList
            data={categorias}
            keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
            renderItem={renderCategoria}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="tag-off" size={50} color="#cbd5e1" />
                <Text style={styles.emptyText}>No hay categorías</Text>
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
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 14,
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
    marginBottom: 12,
  },
  tituloContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  itemDescripcion: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
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
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  itemId: {
    fontSize: 11,
    color: "#94a3b8",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    fontSize: 11,
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

export default AdminCategory;