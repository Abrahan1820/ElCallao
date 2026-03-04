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
  Alert,
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import DropDownPicker from "react-native-dropdown-picker";

const PurchaseScreen = () => {
  const navigation = useNavigation();
  const supa = SupaClient();

  const [products, setProducts] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [userData, setUserData] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);

  const [purchaseItems, setPurchaseItems] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantity, setQuantity] = useState("1");

  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [observations, setObservations] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [totalItems, setTotalItems] = useState(0);
  const [totalCostUSD, setTotalCostUSD] = useState(0);
  const [totalCostVES, setTotalCostVES] = useState(0);

  // Dropdown states
  const [openProveedor, setOpenProveedor] = useState(false);
  const [proveedorItems, setProveedorItems] = useState([]);

  const [openProducto, setOpenProducto] = useState(false);
  const [productItems, setProductItems] = useState([]);

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
        .order("nombre");

      setProducts(productsData || []);
      setProveedores(proveedoresData || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Actualizar items de dropdowns cuando cambian los datos
  useEffect(() => {
    setProductItems(
      products.map(product => ({
        label: `${product.nombre} - $${product.precioCompraUSD} / Bs.${product.precioCompraVES}`,
        value: product.id.toString(),
      }))
    );

    setProveedorItems(
      proveedores.map(prov => ({
        label: prov.nombre,
        value: prov.proveedorID.toString(),
      }))
    );
  }, [products, proveedores]);

  // Agregar producto a la compra
  const addProduct = () => {
    if (!selectedProductId) {
      Alert.alert("Error", "Selecciona un producto");
      return;
    }

    const product = products.find(
      p => p.id === parseInt(selectedProductId)
    );

    const qty = parseInt(quantity) || 1;
    if (qty <= 0) {
      Alert.alert("Error", "La cantidad debe ser mayor a 0");
      return;
    }

    const existingItem = purchaseItems.find(
      item => item.id === product.id
    );

    if (existingItem) {
      setPurchaseItems(
        purchaseItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
    } else {
      setPurchaseItems([...purchaseItems, { ...product, quantity: qty }]);
    }

    setSelectedProductId(null);
    setQuantity("1");
    setOpenProducto(false);
  };

  // Eliminar producto de la compra
  const removeItem = (productId) => {
    setPurchaseItems(purchaseItems.filter(item => item.id !== productId));
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
      Alert.alert("Error", "No hay productos en la compra");
      return;
    }

    if (!selectedProveedor) {
      Alert.alert("Error", "Selecciona un proveedor");
      return;
    }

    const proveedor = proveedores.find(
      p => p.proveedorID.toString() === selectedProveedor
    );
    const proveedorNombre = proveedor ? proveedor.nombre : "Proveedor desconocido";

    Alert.alert(
      "Confirmar compra",
      `¿Registrar esta compra?\n\nProveedor: ${proveedorNombre}\nTotal USD: $${totalCostUSD.toFixed(2)}\nTotal VES: Bs. ${totalCostVES.toFixed(2)}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
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
              
              Alert.alert("Éxito", "Compra registrada correctamente");

            } catch (error) {
              console.error("Error:", error);
              Alert.alert("Error", "No se pudo registrar la compra");
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
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
      <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
      <NavBar />

      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#45c0e8", "#3aa5c9"]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Ingreso de Mercancía</Text>
          <Text style={styles.headerSubtitle}>
            Registrar nueva compra
          </Text>
        </LinearGradient>

        {/* PROVEEDOR */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏢 Proveedor</Text>

          <DropDownPicker
            open={openProveedor}
            value={selectedProveedor}
            items={proveedorItems}
            setOpen={setOpenProveedor}
            setValue={setSelectedProveedor}
            setItems={setProveedorItems}
            placeholder="Selecciona un proveedor..."
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={3000}
            zIndexInverse={1000}
            listMode="SCROLLVIEW"
          />

          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            value={observations}
            onChangeText={setObservations}
            placeholder="Observaciones..."
            multiline
            numberOfLines={2}
          />
        </View>

        {/* PRODUCTO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>➕ Agregar producto</Text>

          <DropDownPicker
            open={openProducto}
            value={selectedProductId}
            items={productItems}
            setOpen={setOpenProducto}
            setValue={setSelectedProductId}
            setItems={setProductItems}
            placeholder="Buscar producto..."
            searchable={true}
            searchPlaceholder="Escribe para buscar..."
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2000}
            zIndexInverse={2000}
            listMode="SCROLLVIEW"
          />

          <View style={styles.productAddRow}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(prev => Math.max(1, parseInt(prev) - 1).toString())}
              >
                <MaterialCommunityIcons name="minus" size={20} color="#45c0e8" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                textAlign="center"
              />
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(prev => (parseInt(prev) + 1).toString())}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#45c0e8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={addProduct}
            >
              <MaterialCommunityIcons name="plus" size={20} color="white" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LISTA DE PRODUCTOS */}
        {purchaseItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🛒 Productos ({purchaseItems.length})</Text>
            
            {purchaseItems.map((item) => (
              <View key={item.id} style={styles.purchaseItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.nombre}</Text>
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

                  <View style={styles.itemPrices}>
                    <Text style={styles.itemPriceUSD}>
                      ${(item.precioCompraUSD * item.quantity).toFixed(2)}
                    </Text>
                    <Text style={styles.itemPriceVES}>
                      Bs. {(item.precioCompraVES * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* RESUMEN Y BOTÓN FINALIZAR */}
        {purchaseItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📊 Resumen</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total unidades:</Text>
              <Text style={styles.summaryValue}>{totalItems}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total USD:</Text>
              <Text style={styles.summaryValueUSD}>${totalCostUSD.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total VES:</Text>
              <Text style={styles.summaryValueVES}>Bs. {totalCostVES.toFixed(2)}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#45c0e8" 
  },
  header: { 
    padding: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerTitle: { 
    fontSize: 24, 
    color: "white", 
    fontWeight: "bold" 
  },
  headerSubtitle: { 
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { 
    fontSize: 16,
    fontWeight: "600", 
    color: '#1e293b',
    marginBottom: 12 
  },
  dropdown: {
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  dropdownContainer: {
    borderColor: "#e2e8f0",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
  },
  productAddRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: "#45c0e8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  purchaseItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
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
  itemPrices: {
    alignItems: 'flex-end',
  },
  itemPriceUSD: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  itemPriceVES: {
    fontSize: 13,
    color: '#45c0e8',
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
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
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
  finalizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
});

export default PurchaseScreen;