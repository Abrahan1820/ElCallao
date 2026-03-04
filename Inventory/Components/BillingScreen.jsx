import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import ProductSelectionModal from "./ProductSelectionModal";
import PaymentMethodModal from "./PaymentMethodModal";

const BillingScreen = () => {
  const navigation = useNavigation();
  const supa = SupaClient();

  // Estados
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoriasMap, setCategoriasMap] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [empresaId, setEmpresaId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [tempQuantity, setTempQuantity] = useState("1");
  const [selectedCategoria, setSelectedCategoria] = useState("todas");
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  
  // Estados para método de pago
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [mixedPayment, setMixedPayment] = useState({
    usd: "",
    ves: "",
    vesEfectivo: "",
  });
  
  // Resumen de factura (solo monto del producto, sin IVA)
  const [subtotalUSD, setSubtotalUSD] = useState(0);
  const [subtotalVES, setSubtotalVES] = useState(0);
  // Agrega este estado junto a los demás estados
const [TASA_CAMBIO, setTASA_CAMBIO] = useState(60); // Valor por defecto mientras carga

// Agrega esta función para cargar la tasa del BCV
const loadTasaBCV = async () => {
  try {
    const { data, error } = await supa
      .from("tasaBCV")
      .select("precioVESUSD")
      .eq("id", 1)
      .single();

    if (error) throw error;
    
    if (data) {
      // El campo se llama "precioVES/USD" - puede tener un nombre especial
      // Dependiendo de cómo se llame exactamente en tu BD
      const tasa = data["precioVESUSD"];
      setTASA_CAMBIO(tasa || 60);
    }
  } catch (error) {
    console.error("Error cargando tasa BCV:", error);
    // Mantener valor por defecto si hay error
  }
};

 

  // -----------------------------
  // 👤 Obtener usuario desde AsyncStorage
  // -----------------------------
  const getUserFromStorage = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (session) {
        const user = JSON.parse(session);
        setUserData(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      return null;
    }
  };

  // -----------------------------
  // 📦 Obtener empresaID a partir del usuario
  // -----------------------------
  const getEmpresaIdFromUser = async (user) => {
    if (!user || !user.empresaID) return null;
    return user.empresaID;
  };

  // -----------------------------
  // 📦 Cargar categorías
  // -----------------------------
  const loadCategorias = async () => {
    try {
      const { data, error } = await supa
        .from("productCategory")
        .select("id, nombre")
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
    }
  };

  // -----------------------------
  // 📥 Cargar productos activos de la empresa
  // -----------------------------
  const fetchProducts = async (empId) => {
    if (!empId) return [];
    
    try {
      let query = supa
        .from("product")
        .select("*")
        .eq("empresaID", empId)
        .eq("esActivo", true);
      
      // Aplicar filtro por categoría si no es "todas"
      if (selectedCategoria !== "todas") {
        query = query.eq("categoriaID", selectedCategoria);
      }
      
      const { data, error } = await query.order("nombre", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
      return [];
    }
  };

  // -----------------------------
  // 🔄 Cargar todos los datos
  // -----------------------------
  const loadAllData = async () => {
    setLoading(true);
    try {
      const user = await getUserFromStorage();
      if (!user) {
        Alert.alert("Error", "No hay usuario en sesión");
        navigation.navigate("Log_in");
        return;
      }

      const empId = await getEmpresaIdFromUser(user);
      if (!empId) {
        Alert.alert("Error", "No se pudo determinar la empresa del usuario");
        return;
      }
      
      setEmpresaId(user.empresaID);
      await loadCategorias();
      await loadTasaBCV();
      const productsData = await fetchProducts(user.empresaID);
      
      // Filtrar productos con stock > 0
      const availableProducts = productsData.filter(p => p.stockActual > 0);
      setProducts(availableProducts);
      setFilteredProducts(availableProducts);
      
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recargar productos cuando cambia el filtro de categoría
  useEffect(() => {
    if (empresaId) {
      const reloadProducts = async () => {
        const productsData = await fetchProducts(empresaId);
        const availableProducts = productsData.filter(p => p.stockActual > 0);
        setProducts(availableProducts);
        setFilteredProducts(availableProducts);
      };
      reloadProducts();
    }
  }, [selectedCategoria]);

  // -----------------------------
  // 🔄 Cargar al iniciar
  // -----------------------------
  useEffect(() => {
    loadAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
      setCart([]);
      setPaymentMethod(null);
      setMixedPayment({ usd: "", ves: "", vesEfectivo: "" });
    }, [])
  );

  // -----------------------------
  // 🧮 Calcular totales (solo monto del producto)
  // -----------------------------
  useEffect(() => {
    const usd = cart.reduce((sum, item) => sum + (item.precioVentaUSD * item.quantity), 0);
    const ves = cart.reduce((sum, item) => sum + (item.precioVentaVES * item.quantity), 0);

    setSubtotalUSD(usd);
    setSubtotalVES(ves);
  }, [cart]);

  // -----------------------------
  // 🔍 Búsqueda de productos
  // -----------------------------
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

  // -----------------------------
  // 🛒 Agregar producto al carrito
  // -----------------------------
  const addToCart = (product, quantity) => {
    if (quantity > product.stockActual) {
      Alert.alert(
        "Stock insuficiente", 
        `Solo hay ${product.stockActual} unidades disponibles`
      );
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stockActual) {
        Alert.alert(
          "Stock insuficiente", 
          `Solo hay ${product.stockActual} unidades disponibles`
        );
        return;
      }
      
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
    
    setQuantityModalVisible(false);
    setTempQuantity("1");
  };

  // -----------------------------
  // ❌ Eliminar producto del carrito
  // -----------------------------
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // -----------------------------
  // 🔄 Actualizar cantidad de un producto en el carrito
  // -----------------------------
  const updateCartQuantity = (productId, newQuantity) => {
    const product = cart.find(item => item.id === productId);
    
    if (newQuantity > product.stockActual) {
      Alert.alert(
        "Stock insuficiente", 
        `Solo hay ${product.stockActual} unidades disponibles`
      );
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  // -----------------------------
  // 💰 Manejar pago
  // -----------------------------
  const handlePayment = () => {
    if (cart.length === 0) {
      Alert.alert("Error", "No hay productos en el carrito");
      return;
    }
    setPaymentModalVisible(true);
  };

  // -----------------------------
  // ✅ Finalizar venta con método de pago
  // -----------------------------
  const finalizeSaleWithPayment = async () => {
    if (!paymentMethod) {
      Alert.alert("Error", "Selecciona un método de pago");
      return;
    }

    // Validar pago mixto
    if (paymentMethod === "mixto") {
      const usdAmount = parseFloat(mixedPayment.usd) || 0;
      const vesAmount = parseFloat(mixedPayment.ves) || 0;
      const vesEfectivoAmount = parseFloat(mixedPayment.vesEfectivo) || 0;
      
      // Convertir todo a USD para comparar
      const totalPaidUSD = usdAmount + (vesAmount / TASA_CAMBIO) + (vesEfectivoAmount / TASA_CAMBIO);
      
      if (Math.abs(totalPaidUSD - subtotalUSD) > 0.01) {
        Alert.alert("Error", "La suma de los pagos no coincide con el total en USD");
        return;
      }
    }

    setProcessing(true);
    try {
      // 1. Verificar stock nuevamente
      for (const item of cart) {
        const { data, error } = await supa
          .from("product")
          .select("stockActual")
          .eq("id", item.id)
          .single();

        if (error) throw error;

        if (data.stockActual < item.quantity) {
          Alert.alert(
            "Error", 
            `Stock insuficiente para ${item.nombre}. Stock actual: ${data.stockActual}`
          );
          setProcessing(false);
          return;
        }
      }

      // 2. Actualizar stock y crear movimientos para cada producto
      for (const item of cart) {
        // Actualizar stock
        const { error: updateError } = await supa
          .from("product")
          .update({ stockActual: item.stockActual - item.quantity })
          .eq("id", item.id);

        if (updateError) throw updateError;

        // Determinar valores según método de pago
        let precioVentaUSD = 0;
        let precioVentaVES = 0;
        let precioVentaVESEfectivo = 0;
        let tipoTransaccion = "";

        switch (paymentMethod) {
          case "debito":
            precioVentaVES = item.precioVentaVES * item.quantity;
            tipoTransaccion = "Debito";
            break;
          case "efectivoUSD":
            precioVentaUSD = item.precioVentaUSD * item.quantity;
            tipoTransaccion = "Efectivo USD";
            break;
          case "efectivoVES":
            precioVentaVESEfectivo = item.precioVentaVES * item.quantity;
            tipoTransaccion = "Efectivo VES";
            break;
          case "mixto":
            // Distribuir proporcionalmente el pago mixto
            const usdProportion = (parseFloat(mixedPayment.usd) || 0) / subtotalUSD;
            const vesProportion = (parseFloat(mixedPayment.ves) || 0) / subtotalUSD;
            const vesEfectivoProportion = (parseFloat(mixedPayment.vesEfectivo) || 0) / subtotalUSD;
            
            precioVentaUSD = (item.precioVentaUSD * item.quantity) * usdProportion;
            precioVentaVES = (item.precioVentaVES * item.quantity) * vesProportion;
            precioVentaVESEfectivo = (item.precioVentaVES * item.quantity) * vesEfectivoProportion;
            tipoTransaccion = "Mixto";
            break;
        }

        // Crear movimiento
        const { error: movementError } = await supa
          .from("productMovement")
          .insert({
            productoID: item.id,
            tipoMovimiento: "salida",
            cantidad: item.quantity,
            precioCompraUSD: item.precioCompraUSD,
            precioVentaUSD: precioVentaUSD,
            precioCompraVES: item.precioCompraVES,
            precioVentaVES: precioVentaVES,
            precioVentaVESEfectivo: precioVentaVESEfectivo,
            empresaID: empresaId,
            tipoTransaccion: tipoTransaccion,
            observaciones: `Venta realizada por ${userData?.nombre || "usuario"}`,
            usuarioCedula: userData?.cedula
          });

        if (movementError) throw movementError;
      }

      // 3. Limpiar todo
      setCart([]);
      setPaymentMethod(null);
      setMixedPayment({ usd: "", ves: "", vesEfectivo: "" });
      setPaymentModalVisible(false);
      
      Alert.alert(
        "Éxito", 
        "Venta realizada correctamente",
        [
          { 
            text: "OK", 
            onPress: () => {
              loadAllData();
            }
          }
        ]
      );

    } catch (error) {
      console.error("Error finalizando venta:", error);
      Alert.alert("Error", "No se pudo completar la venta");
    } finally {
      setProcessing(false);
    }
  };

  // -----------------------------
  // 🎨 Render
  // -----------------------------
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
        <NavBar />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#45c0e8" />
          <Text style={styles.loadingText}>Cargando facturación...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
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
            <Text style={styles.headerTitle}>Facturación</Text>
            <Text style={styles.headerSubtitle}>Nueva venta</Text>
          </LinearGradient>

          {/* Selector de categoría - VERTICAL */}
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

          {/* Botón para agregar productos */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
            <Text style={styles.addButtonText}>Agregar Producto</Text>
          </TouchableOpacity>

          {/* Carrito de compras */}
          <View style={styles.cartContainer}>
            <Text style={styles.sectionTitle}>
              Carrito ({cart.length} {cart.length === 1 ? 'producto' : 'productos'})
            </Text>

            {cart.length > 0 ? (
              cart.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.nombre}</Text>
                    <Text style={styles.cartItemPrice}>
                      ${item.precioVentaUSD} / Bs.{item.precioVentaVES} c/u
                    </Text>
                  </View>
                  
                  <View style={styles.cartItemControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateCartQuantity(item.id, item.quantity - 1)}
                    >
                      <MaterialCommunityIcons name="minus" size={16} color="#45c0e8" />
                    </TouchableOpacity>
                    
                    <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateCartQuantity(item.id, item.quantity + 1)}
                    >
                      <MaterialCommunityIcons name="plus" size={16} color="#45c0e8" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <MaterialCommunityIcons name="trash-can" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.cartItemTotals}>
                    <Text style={styles.cartItemTotalUSD}>
                      USD: ${(item.precioVentaUSD * item.quantity).toFixed(2)}
                    </Text>
                    <Text style={styles.cartItemTotalVES}>
                      VES: Bs. {(item.precioVentaVES * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCart}>
                <MaterialCommunityIcons name="cart-outline" size={60} color="#cbd5e1" />
                <Text style={styles.emptyCartText}>Carrito vacío</Text>
                <Text style={styles.emptyCartSubtext}>Agrega productos para comenzar</Text>
              </View>
            )}
          </View>

          {/* Resumen de factura (sin IVA) */}
          {cart.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>Resumen</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total USD:</Text>
                <Text style={styles.summaryValueUSD}>${subtotalUSD.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total VES:</Text>
                <Text style={styles.summaryValueVES}>Bs. {subtotalVES.toFixed(2)}</Text>
              </View>

              {/* Botón para seleccionar método de pago */}
              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={handlePayment}
              >
                <MaterialCommunityIcons name="cash" size={24} color="white" />
                <Text style={styles.paymentButtonText}>
                  {paymentMethod ? "Cambiar método de pago" : "Seleccionar método de pago"}
                </Text>
              </TouchableOpacity>

              {paymentMethod && (
                <View style={styles.selectedPayment}>
                  <Text style={styles.selectedPaymentText}>
                    Método seleccionado: {
                      paymentMethod === "debito" ? "Débito" :
                      paymentMethod === "efectivoUSD" ? "Efectivo USD" :
                      paymentMethod === "efectivoVES" ? "Efectivo VES" : "Mixto"
                    }
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.finalizeButton, !paymentMethod && styles.finalizeButtonDisabled]}
                onPress={finalizeSaleWithPayment}
                disabled={processing || !paymentMethod}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                    <Text style={styles.finalizeButtonText}>Finalizar Venta</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

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
                    onPress={() => addToCart(selectedProduct, parseInt(tempQuantity) || 1)}
                  >
                    <Text style={styles.modalConfirmText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de método de pago */}
      <PaymentMethodModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        subtotalUSD={subtotalUSD}
        subtotalVES={subtotalVES}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        mixedPayment={mixedPayment}
        setMixedPayment={setMixedPayment}
        tasaCambio={TASA_CAMBIO}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#45c0e8',
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
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
  // Nuevos estilos para categorías verticales
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
  addButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
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
  cartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  cartItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  cartItemInfo: {
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  cartItemPrice: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemQuantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  cartItemTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartItemTotalUSD: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  cartItemTotalVES: {
    fontSize: 14,
    fontWeight: '600',
    color: '#45c0e8',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValueUSD: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  summaryValueVES: {
    fontSize: 16,
    fontWeight: '700',
    color: '#45c0e8',
  },
  paymentButton: {
    backgroundColor: '#45c0e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedPayment: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#45c0e8',
  },
  selectedPaymentText: {
    color: '#45c0e8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  finalizeButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  finalizeButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.5,
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

export default BillingScreen;