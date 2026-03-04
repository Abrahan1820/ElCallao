import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TextInput,
  Image,
  RefreshControl,
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get('window');

// --------------------------------------------------
// 📊 Componente de Tarjeta de Producto (ahora es presionable)
// --------------------------------------------------
const ProductCard = ({ product, categoriaNombre, proveedorNombre, onPress }) => {
  const getStockStatus = (stock, min, max) => {
    if (stock === 0) return { label: 'AGOTADO', color: '#e74c3c', bgColor: '#fde8e8' };
    if (stock <= min) return { label: 'STOCK BAJO', color: '#f39c12', bgColor: '#fef5e7' };
    if (stock > max) return { label: 'EXCESO', color: '#3498db', bgColor: '#e8f0fe' };
    return { label: 'NORMAL', color: '#27ae60', bgColor: '#e3f7e3' };
  };

  const getUnidadLabel = (unidad) => {
    const unidades = {
      'UNIDAD': 'unid',
      'KILO': 'kg',
      'LITRO': 'L',
      'GRAMO': 'g',
      'CAJA': 'caja',
      'PAQUETE': 'pqte'
    };
    return unidades[unidad] || unidad;
  };

  const status = getStockStatus(product.stockActual, product.stockMinimo, product.stockMaximo);
  const unidadLabel = getUnidadLabel(product.unidadMedida);

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.7}>
      {/* Cabecera del producto */}
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.productName}>{product.nombre}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{categoriaNombre}</Text>
          <Text style={styles.proveedorText}> • {proveedorNombre}</Text>
        </View>
      </View>

      {/* Descripción (si existe) */}
      {product.descripcion ? (
        <Text style={styles.description} numberOfLines={2}>{product.descripcion}</Text>
      ) : null}

      {/* Detalles de stock y precio */}
      <View style={styles.detailsContainer}>
        <View style={styles.stockContainer}>
          <MaterialCommunityIcons name="package-variant" size={16} color="#7f8c8d" />
          <Text style={styles.stockText}>
            Stock: <Text style={styles.stockValue}>{product.stockActual} {unidadLabel}</Text>
          </Text>
        </View>

        <View style={styles.limitsContainer}>
          <Text style={styles.limitText}>Mín: {product.stockMinimo}</Text>
          <Text style={styles.limitDot}>•</Text>
          <Text style={styles.limitText}>Máx: {product.stockMaximo}</Text>
        </View>
      </View>

      {/* Barra de progreso de stock */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${Math.min((product.stockActual / product.stockMaximo) * 100, 100)}%`,
              backgroundColor: status.color 
            }
          ]} 
        />
      </View>

      {/* Precios en USD y VES */}
      <View style={styles.pricesContainer}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>USD</Text>
          <Text style={styles.priceValue}>${product.precioVentaUSD}</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>VES</Text>
          <Text style={styles.priceValue}>Bs. {product.precioVentaVES}</Text>
        </View>
      </View>

      {/* Flecha indicadora de que es presionable */}
      <View style={styles.arrowContainer}>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
};

// --------------------------------------------------
// ✔ Pantalla principal de Inventario
// --------------------------------------------------
const InventoryViewScreen = () => {
  const navigation = useNavigation();
  const supa = SupaClient();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoriasMap, setCategoriasMap] = useState({});
  const [proveedoresMap, setProveedoresMap] = useState({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValueUSD: 0,
    totalValueVES: 0
  });

  // -----------------------------
  // 👤 Obtener usuario desde AsyncStorage (igual que en MainPage)
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
    if (!user || !user.empresaID) {
      console.error("Usuario no tiene empresa asignada");
      return null;
    }

    try {
      // Si user.empresa ya es el ID, lo usamos directamente
      // Si es el nombre, buscamos el ID
      if (typeof user.empresaID === 'number' || !isNaN(parseInt(user.empresaID))) {
        return user.empresaID;
      } else {
        // Buscar empresa por nombre
        const { data, error } = await supa
          .from("company")
          .select("nombre")
          .eq("empresaID", user.empresaID)
          .single();

        if (error) throw error;
        return data?.nombre;
      }
    } catch (error) {
      console.error("Error obteniendo empresaID:", error);
      return null;
    }
  };

  // -----------------------------
  // 📦 Cargar categorías
  // -----------------------------
  const loadCategorias = async () => {
    try {
      const { data, error } = await supa
        .from("productCategory")
        .select("id, nombre");

      if (error) throw error;

      const map = {};
      data.forEach((cat) => {
        map[cat.id] = cat.nombre;
      });
      setCategoriasMap(map);
    } catch (error) {
      console.error("❌ Error cargando categorías:", error);
    }
  };

  // -----------------------------
  // 📥 Cargar productos (SOLO activos y de la empresa del usuario)
  // -----------------------------
  const fetchProducts = async (empId) => {
    if (!empId) return [];
    
    try {
      const { data, error } = await supa
        .from("product")
        .select("*")
        .eq("empresaID", empId)
        .eq("esActivo", true)
        .order("id", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
      return [];
    }
  };

  // -----------------------------
  // 📦 Cargar proveedores a partir de los productos
  // -----------------------------
  const loadProveedoresFromProducts = async (productsData) => {
    try {
      // Obtener IDs únicos de proveedores de los productos
      const proveedorIds = [...new Set(productsData.map(p => p.proveedorID).filter(id => id))];
      
      if (proveedorIds.length === 0) return {};

      // Cargar solo los proveedores que aparecen en los productos
      const { data, error } = await supa
        .from("provider")
        .select("proveedorID, nombre")
        .in("proveedorID", proveedorIds);

      if (error) throw error;

      const map = {};
      data.forEach((prov) => {
        map[prov.proveedorID] = prov.nombre;
      });
      return map;
    } catch (error) {
      console.error("❌ Error cargando proveedores:", error);
      return {};
    }
  };

  // -----------------------------
  // 📊 Calcular estadísticas
  // -----------------------------
  const calculateStats = (productsData) => {
    const total = productsData.length;
    const lowStock = productsData.filter(p => p.stockActual <= p.stockMinimo && p.stockActual > 0).length;
    const outOfStock = productsData.filter(p => p.stockActual === 0).length;
    const totalValueUSD = productsData.reduce((sum, p) => sum + (p.stockActual * p.precioVentaUSD), 0);
    const totalValueVES = productsData.reduce((sum, p) => sum + (p.stockActual * p.precioVentaVES), 0);

    setStats({
      total,
      lowStock,
      outOfStock,
      totalValueUSD: totalValueUSD.toFixed(2),
      totalValueVES: totalValueVES.toFixed(2)
    });
  };

  // -----------------------------
  // 🔄 Cargar todos los datos
  // -----------------------------
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Obtener usuario de AsyncStorage
      const user = await getUserFromStorage();
      
      if (!user) {
        console.error("No hay usuario en sesión");
        setLoading(false);
        return;
      }

      // 2. Obtener empresaID
      const empId = await getEmpresaIdFromUser(user);
      
      if (!empId) {
        console.error("No se pudo determinar la empresa del usuario");
        setLoading(false);
        return;
      }

      // 3. Cargar categorías (son globales)
      await loadCategorias();

      // 4. Cargar productos de la empresa
      const productsData = await fetchProducts(empId);
      
      // 5. Cargar proveedores basados en los productos
      const proveedoresMapData = await loadProveedoresFromProducts(productsData);
      setProveedoresMap(proveedoresMapData);

      // 6. Actualizar estados
      setProducts(productsData);
      setFilteredProducts(productsData);
      calculateStats(productsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // -----------------------------
  // 🔄 Pull to refresh
  // -----------------------------
  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // -----------------------------
  // 🔍 Búsqueda
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
      const proveedorNombre = proveedoresMap[product.proveedorID] || "";
      
      return (
        product.nombre.toLowerCase().includes(searchLower) ||
        (product.descripcion && product.descripcion.toLowerCase().includes(searchLower)) ||
        categoriaNombre.toLowerCase().includes(searchLower) ||
        proveedorNombre.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredProducts(filtered);
  };

  // -----------------------------
  // 📌 Navegar a detalle del producto
  // -----------------------------
  const handleProductPress = (product) => {
    navigation.navigate("ProductDetail", {
      productId: product.id,
      productName: product.nombre,
      empresaID: product.empresaID,
      // Pasamos todos los datos del producto para no tener que cargarlos de nuevo
      productData: {
        ...product,
        categoriaNombre: categoriasMap[product.categoriaID] || "Sin categoría",
        proveedorNombre: proveedoresMap[product.proveedorID] || "Sin proveedor"
      }
    });
  };

  // -----------------------------
  // 🔄 Cargar datos al iniciar y cuando la pantalla recibe foco
  // -----------------------------
  useEffect(() => {
    loadAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Recargar datos cuando la pantalla vuelve a tener foco
      loadAllData();
    }, [])
  );

  // -----------------------------
  // 🎨 Render
  // -----------------------------
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
        <NavBar />
        <View style={[styles.container, styles.centerContent]}>
          <MaterialCommunityIcons name="package-variant" size={60} color="#cbd5e1" />
          <Text style={styles.loadingText}>Cargando inventario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
      
      {/* NavBar FIJO */}
      <NavBar />
      
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#45c0e8"]} />
          }
        >
          {/* Header con estadísticas */}
          <View style={styles.headerContainer}>
            <View style={styles.statsOverview}>
              <View style={styles.totalCard}>
                <LinearGradient
                  colors={['#41B2F8', '#0ea5e9']}
                  style={styles.gradientBackground}
                />
                <MaterialCommunityIcons name="package-variant" size={32} color="#FFF" />
                <Text style={styles.totalNumber}>{stats.total}</Text>
                <Text style={styles.totalLabel}>Productos</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.miniCard, stats.lowStock > 0 && styles.warningCard]}>
                  <MaterialCommunityIcons name="alert" size={20} color={stats.lowStock > 0 ? "#f39c12" : "#94a3b8"} />
                  <Text style={styles.miniNumber}>{stats.lowStock}</Text>
                  <Text style={styles.miniLabel}>Stock Bajo</Text>
                </View>
                <View style={[styles.miniCard, stats.outOfStock > 0 && styles.dangerCard]}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={stats.outOfStock > 0 ? "#e74c3c" : "#94a3b8"} />
                  <Text style={styles.miniNumber}>{stats.outOfStock}</Text>
                  <Text style={styles.miniLabel}>Agotados</Text>
                </View>
              </View>
            </View>

            {/* Valor del inventario */}
            <View style={styles.valueContainer}>
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>USD</Text>
                <Text style={styles.valueAmount}>${stats.totalValueUSD}</Text>
              </View>
              <View style={styles.valueDivider} />
              <View style={styles.valueItem}>
                <Text style={styles.valueLabel}>VES</Text>
                <Text style={styles.valueAmount}>Bs. {stats.totalValueVES}</Text>
              </View>
            </View>

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar producto..."
                placeholderTextColor="#94a3b8"
                value={searchText}
                onChangeText={handleSearch}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Lista de productos */}
          <View style={styles.productsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
              </Text>
              <TouchableOpacity onPress={onRefresh}>
                <MaterialCommunityIcons name="refresh" size={20} color="#45c0e8" />
              </TouchableOpacity>
            </View>

            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoriaNombre={categoriasMap[product.categoriaID] || "Sin categoría"}
                  proveedorNombre={proveedoresMap[product.proveedorID] || "Sin proveedor"}
                  onPress={() => handleProductPress(product)}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="package-variant-closed" size={80} color="#cbd5e1" />
                <Text style={styles.emptyText}>No se encontraron productos</Text>
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearch("")}>
                    <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Espacio al final */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// --------------------------------------------------
// 🎨 Estilos (agregué nuevos estilos para el ProductCard)
// --------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#45c0e8',
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff"
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  headerContainer: {
    marginBottom: 24,
  },
  statsOverview: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  totalCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#41B2F8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  totalNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    marginTop: 4,
  },
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  warningCard: {
    borderColor: '#f39c12',
    backgroundColor: '#fef5e7',
  },
  dangerCard: {
    borderColor: '#e74c3c',
    backgroundColor: '#fde8e8',
  },
  miniNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  miniLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  valueItem: {
    alignItems: 'center',
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  valueDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 8,
  },
  productsContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  proveedorText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  description: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 18,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 6,
  },
  stockValue: {
    fontWeight: '700',
    color: '#1e293b',
  },
  limitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  limitDot: {
    fontSize: 12,
    color: '#94a3b8',
    marginHorizontal: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  pricesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceItem: {
    alignItems: 'center',
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  priceDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
    marginBottom: 12,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#45c0e8',
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});

export default InventoryViewScreen;