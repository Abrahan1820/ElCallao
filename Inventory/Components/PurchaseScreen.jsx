import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import ProductSelectionModal from "./ProductSelectionModal";
import Toast from 'react-native-toast-message';

const PurchaseScreen = () => {
  const navigation = useNavigation();
  const supa = SupaClient();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categoriasMap, setCategoriasMap] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [userData, setUserData] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);

  const [purchaseItems, setPurchaseItems] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [tempQuantity, setTempQuantity] = useState("1");
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [observations, setObservations] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [totalItems, setTotalItems] = useState(0);
  const [totalCostUSD, setTotalCostUSD] = useState(0);
  const [totalCostVES, setTotalCostVES] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("todas");
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);

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

  // Cargar datos iniciales
  const loadAllData = async () => {
    setLoading(true);
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (!session) {
        navigation.navigate("Log_in");
        return;
      }

      const user = JSON.parse(session);
      setUserData(user);
      setEmpresaId(user.empresaID);

      // Cargar categorías
      await loadCategorias();

      // Cargar productos activos de la empresa
      const { data: productsData } = await supa
        .from("product")
        .select("*")
        .eq("empresaID", user.empresaID)
        .eq("esActivo", true)
        .order("nombre");

      // Cargar proveedores de la empresa
      const { data: proveedoresData } = await supa
        .from("provider")
        .select("proveedorID, nombre")
        .eq("empresaID", user.empresaID)
        .eq("esActivo", true)
        .order("nombre");

      setProducts(productsData || []);
      setFilteredProducts(productsData || []);
      setProveedores(proveedoresData || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías
  const loadCategorias = async () => {
    try {
      const { data, error } = await supa
        .from("productCategory")
        .select("id, nombre")
        .eq("esActivo", true)
        .order("nombre");

      if (error) throw error;

      const map = {};
      const lista = [{ id: "todas", nombre: "Todas las categorías" }];
      
      data.forEach((cat) => {
        map[cat.id] = cat.nombre;
        lista.push({ id: cat.id, nombre: cat.nombre });
      });
      
      setCategoriasMap(map);
      setCategorias(lista);
    } catch (error) {
      console.error("❌ Error cargando categorías:", error);
      showToast('error', 'Error', 'No se pudieron cargar las categorías');
    }
  };

  // Recargar productos cuando cambia el filtro de categoría
  useEffect(() => {
    if (empresaId) {
      const reloadProducts = async () => {
        let query = supa
          .from("product")
          .select("*")
          .eq("empresaID", empresaId)
          .eq("esActivo", true);
        
        if (selectedCategoria !== "todas") {
          query = query.eq("categoriaID", selectedCategoria);
        }
        
        const { data } = await query.order("nombre", { ascending: true });
        setProducts(data || []);
        setFilteredProducts(data || []);
      };
      reloadProducts();
    }
  }, [selectedCategoria]);

  useEffect(() => {
    loadAllData();
  }, []);

  // Calcular totales cuando cambia purchaseItems
  useEffect(() => {
    let items = 0;
    let usd = 0;
    let ves = 0;

    purchaseItems.forEach(item => {
      items += item.quantity;
      usd += item.precioCompraUSD * item.quantity;
      ves += item.precioCompraVES * item.quantity;
    });

    setTotalItems(items);
    setTotalCostUSD(usd);
    setTotalCostVES(ves);
  }, [purchaseItems]);

  // Búsqueda de productos
  const handleSearch = (text) => {
    setSearchText(text);
    
    if (text.trim() === "") {
      setFilteredProducts(products);
      return;
    }

    const searchLower = text.toLowerCase();
    const filtered = products.filter(product => {
      const categoriaNombre = categoriasMap[product.categoriaID] || "";
      
      return (
        product.nombre.toLowerCase().includes(searchLower) ||
        (product.descripcion && product.descripcion.toLowerCase().includes(searchLower)) ||
        categoriaNombre.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredProducts(filtered);
  };

  // Agregar producto a la compra
  const addToPurchase = (product, quantity) => {
    const existingItem = purchaseItems.find(item => item.id === product.id);

    if (existingItem) {
      setPurchaseItems(
        purchaseItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
      showToast('success', 'Producto agregado', `Se agregaron ${quantity} unidades más de ${product.nombre}`);
    } else {
      setPurchaseItems([...purchaseItems, { ...product, quantity }]);
      showToast('success', 'Producto agregado', `${product.nombre} agregado a la compra`);
    }

    setQuantityModalVisible(false);
    setTempQuantity("1");
  };

  // Eliminar producto de la compra
  const removeItem = (productId) => {
    const product = purchaseItems.find(item => item.id === productId);
    setPurchaseItems(purchaseItems.filter(item => item.id !== productId));
    showToast('info', 'Producto eliminado', `${product?.nombre} fue eliminado de la compra`);
  };

  // Actualizar cantidad de un producto
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      setPurchaseItems(purchaseItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  // Finalizar compra
  const finalizePurchase = async () => {
    if (purchaseItems.length === 0) {
      showToast('error', 'Error', 'No hay productos en la compra');
      return;
    }

    if (!selectedProveedor) {
      showToast('error', 'Error', 'Selecciona un proveedor');
      return;
    }

    const proveedor = proveedores.find(
      p => p.proveedorID.toString() === selectedProveedor
    );
    const proveedorNombre = proveedor ? proveedor.nombre : "Proveedor desconocido";

    // Usar Toast de confirmación personalizado
    Toast.show({
      type: 'customConfirm',
      text1: 'Confirmar compra',
      text2: `Proveedor: ${proveedorNombre}\nTotal USD: $${totalCostUSD.toFixed(2)}\nTotal VES: Bs. ${totalCostVES.toFixed(2)}`,
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
              setProcessing(true);
              try {
                for (const item of purchaseItems) {
                  // Obtener stock actual
                  const { data: currentProduct, error: fetchError } = await supa
                    .from("product")
                    .select("stockActual")
                    .eq("id", item.id)
                    .single();

                  if (fetchError) throw fetchError;

                  // Actualizar stock
                  const newStock = currentProduct.stockActual + item.quantity;
                  
                  const { error: updateError } = await supa
                    .from("product")
                    .update({ stockActual: newStock })
                    .eq("id", item.id);

                  if (updateError) throw updateError;

                  // Crear movimiento de entrada
                  const { error: movementError } = await supa
                    .from("productMovement")
                    .insert({
                      productoID: item.id,
                      tipoMovimiento: "entrada",
                      cantidad: item.quantity,
                      precioCompraUSD: item.precioCompraUSD,
                      precioVentaUSD: item.precioVentaUSD,
                      precioCompraVES: item.precioCompraVES,
                      precioVentaVES: item.precioVentaVES,
                      empresaID: empresaId,
                      tipoTransaccion: "Compra",
                      observaciones: `Compra de ${proveedorNombre} - ${observations}`,
                      usuarioCedula: userData?.cedula
                    });

                  if (movementError) throw movementError;
                }

                // Limpiar todo
                setPurchaseItems([]);
                setSelectedProveedor(null);
                setObservations("");
                
                showToast('success', 'Éxito', 'Compra registrada correctamente');

              } catch (error) {
                console.error("Error:", error);
                showToast('error', 'Error', 'No se pudo registrar la compra');
              } finally {
                setProcessing(false);
              }
            },
            style: { color: '#27ae60', fontWeight: 'bold' },
          },
        ],
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#f5f5f5"} />
        <NavBar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#45c0e8" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#f5f5f5"} />
      <NavBar />
      
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={['#45c0e8', '#3aa5c9']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Ingreso de Mercancía</Text>
            <Text style={styles.headerSubtitle}>Registrar nueva compra</Text>
          </LinearGradient>

          {/* Selector de categoría */}
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={styles.categoryHeader}
              onPress={() => setCategoriasExpandidas(!categoriasExpandidas)}
            >
              <View style={styles.categoryHeaderLeft}>
                <MaterialCommunityIcons name="tag-outline" size={20} color="#64748b" />
                <Text style={styles.categoryTitle}>
                  {selectedCategoria === "todas" 
                    ? "Todas las categorías" 
                    : categorias.find(c => c.id === selectedCategoria)?.nombre || "Seleccionar categoría"}
                </Text>
              </View>
              <MaterialCommunityIcons 
                name={categoriasExpandidas ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#64748b" 
              />
            </TouchableOpacity>

            {categoriasExpandidas && (
              <View style={styles.categoryList}>
                {categorias.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      selectedCategoria === cat.id && styles.categoryItemActive
                    ]}
                    onPress={() => {
                      setSelectedCategoria(cat.id);
                      setCategoriasExpandidas(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryItemText,
                      selectedCategoria === cat.id && styles.categoryItemTextActive
                    ]}>
                      {cat.nombre}
                    </Text>
                    {selectedCategoria === cat.id && (
                      <MaterialCommunityIcons name="check" size={18} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Proveedor */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="truck" size={24} color="#45c0e8" />
              <Text style={styles.cardTitle}>Proveedor</Text>
            </View>

            <View style={styles.proveedoresContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.proveedorChip,
                    !selectedProveedor && styles.proveedorChipActive
                  ]}
                  onPress={() => setSelectedProveedor(null)}
                >
                  <Text style={[
                    styles.proveedorChipText,
                    !selectedProveedor && styles.proveedorChipTextActive
                  ]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                
                {proveedores.map((prov) => (
                  <TouchableOpacity
                    key={prov.proveedorID}
                    style={[
                      styles.proveedorChip,
                      selectedProveedor === prov.proveedorID.toString() && styles.proveedorChipActive
                    ]}
                    onPress={() => setSelectedProveedor(prov.proveedorID.toString())}
                  >
                    <Text style={[
                      styles.proveedorChipText,
                      selectedProveedor === prov.proveedorID.toString() && styles.proveedorChipTextActive
                    ]}>
                      {prov.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.observacionesContainer}>
              <MaterialCommunityIcons name="text-box" size={20} color="#64748b" />
              <TextInput
                style={styles.observacionesInput}
                value={observations}
                onChangeText={setObservations}
                placeholder="Observaciones (opcional)"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Botón para agregar productos */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
            <Text style={styles.addButtonText}>Agregar Producto</Text>
          </TouchableOpacity>

          {/* Lista de productos en compra */}
          {purchaseItems.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="cart" size={24} color="#45c0e8" />
                <Text style={styles.cardTitle}>Productos ({purchaseItems.length})</Text>
              </View>
              
              {purchaseItems.map((item) => (
                <View key={item.id} style={styles.purchaseItem}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleContainer}>
                      <Text style={styles.itemName}>{item.nombre}</Text>
                      <Text style={styles.itemPrice}>
                        ${item.precioCompraUSD} / Bs.{item.precioCompraVES} c/u
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <MaterialCommunityIcons name="trash-can" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.itemQuantityControl}>
                      <TouchableOpacity 
                        style={styles.itemQuantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <MaterialCommunityIcons name="minus" size={16} color="#45c0e8" />
                      </TouchableOpacity>
                      <Text style={styles.itemQuantityText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.itemQuantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color="#45c0e8" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemTotals}>
                      <Text style={styles.itemTotalUSD}>
                        ${(item.precioCompraUSD * item.quantity).toFixed(2)}
                      </Text>
                      <Text style={styles.itemTotalVES}>
                        Bs. {(item.precioCompraVES * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Resumen y botón finalizar */}
          {purchaseItems.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="chart-box" size={24} color="#45c0e8" />
                <Text style={styles.cardTitle}>Resumen de compra</Text>
              </View>
              
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total unidades:</Text>
                  <Text style={styles.summaryValue}>{totalItems}</Text>
                </View>
                
                <View style={styles.summaryDivider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total USD:</Text>
                  <Text style={styles.summaryValueUSD}>${totalCostUSD.toFixed(2)}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total VES:</Text>
                  <Text style={styles.summaryValueVES}>Bs. {totalCostVES.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.finalizeButton}
                onPress={finalizePurchase}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                    <Text style={styles.finalizeButtonText}>Registrar Compra</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* Modal de selección de productos */}
      <ProductSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        products={filteredProducts}
        categoriasMap={categoriasMap}
        searchText={searchText}
        onSearch={handleSearch}
        onSelectProduct={(product) => {
          setSelectedProduct(product);
          setModalVisible(false);
          setQuantityModalVisible(true);
        }}
      />

      {/* Modal para ingresar cantidad */}
      <Modal
        visible={quantityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cantidad</Text>
            
            {selectedProduct && (
              <>
                <Text style={styles.modalProductName}>{selectedProduct.nombre}</Text>
                <Text style={styles.modalStock}>
                  Stock disponible: {selectedProduct.stockActual}
                </Text>
                
                <View style={styles.quantityInputContainer}>
                  <TouchableOpacity 
                    style={styles.quantityModalButton}
                    onPress={() => setTempQuantity(prev => Math.max(1, parseInt(prev) - 1).toString())}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color="#45c0e8" />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={styles.quantityInput}
                    value={tempQuantity}
                    onChangeText={setTempQuantity}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  
                  <TouchableOpacity 
                    style={styles.quantityModalButton}
                    onPress={() => setTempQuantity(prev => (parseInt(prev) + 1).toString())}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#45c0e8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => {
                      setQuantityModalVisible(false);
                      setTempQuantity("1");
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={() => addToPurchase(selectedProduct, parseInt(tempQuantity) || 1)}
                  >
                    <Text style={styles.modalConfirmText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    padding: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  categoryContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryList: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  categoryItemActive: {
    backgroundColor: '#45c0e8',
  },
  categoryItemText: {
    fontSize: 14,
    color: '#1e293b',
  },
  categoryItemTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  proveedoresContainer: {
    marginBottom: 12,
  },
  proveedorChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  proveedorChipActive: {
    backgroundColor: '#45c0e8',
    borderColor: '#45c0e8',
  },
  proveedorChipText: {
    fontSize: 14,
    color: '#64748b',
  },
  proveedorChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  observacionesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  observacionesInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  purchaseItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: '#64748b',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQuantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQuantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
    color: '#1e293b',
  },
  itemTotals: {
    alignItems: 'flex-end',
  },
  itemTotalUSD: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  itemTotalVES: {
    fontSize: 13,
    color: '#45c0e8',
  },
  summaryContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryValueUSD: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  summaryValueVES: {
    fontSize: 18,
    fontWeight: '700',
    color: '#45c0e8',
  },
  finalizeButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  finalizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalStock: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  quantityModalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 60,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#45c0e8',
  },
  modalConfirmText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PurchaseScreen;