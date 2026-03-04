import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const MovementsScreen = () => {
  const navigation = useNavigation();
  const supa = SupaClient();

  // Estados
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  
  // Filtros (directamente en la pantalla)
  const [selectedTipo, setSelectedTipo] = useState("todos");
  const [selectedTransaccion, setSelectedTransaccion] = useState("todos");
  const [searchText, setSearchText] = useState("");
  
  const [stats, setStats] = useState({
    totalMovements: 0,
    totalIngresosUSD: 0,
    totalIngresosVES: 0,
  });

  // -----------------------------
  // 👤 Obtener usuario
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
  // 📦 Obtener empresaID
  // -----------------------------
  const getEmpresaIdFromUser = async (user) => {
    if (!user || !user.empresaID) return null;
    return user.empresaID;
  };

  // -----------------------------
  // 📥 Cargar productos
  // -----------------------------
  const loadProducts = async (empId) => {
    try {
      const { data, error } = await supa
        .from("product")
        .select("id, nombre")
        .eq("empresaID", empId);

      if (error) throw error;

      const productMap = {};
      data.forEach((product) => {
        productMap[product.id] = product.nombre;
      });
      setProducts(productMap);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  // -----------------------------
  // 📥 Cargar movimientos
  // -----------------------------
  const loadMovements = async (empId) => {
    try {
      const { data, error } = await supa
        .from("productMovement")
        .select("*")
        .eq("empresaID", empId)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error cargando movimientos:", error);
      return [];
    }
  };

  // -----------------------------
  // 🔍 Aplicar filtros
  // -----------------------------
  const applyFilters = useCallback(() => {
    let filtered = [...movements];

    // Filtro por tipo de movimiento
    if (selectedTipo !== "todos") {
      filtered = filtered.filter(m => m.tipoMovimiento === selectedTipo);
    }

    // Filtro por tipo de transacción
    if (selectedTransaccion !== "todos") {
      filtered = filtered.filter(m => m.tipoTransaccion === selectedTransaccion);
    }

    // Filtro por búsqueda
    if (searchText.trim() !== "") {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(m => {
        const productName = products[m.productID] || "";
        return productName.toLowerCase().includes(searchLower) ||
               m.observaciones?.toLowerCase().includes(searchLower);
      });
    }

    setFilteredMovements(filtered);
    
    // Calcular ingresos
    let totalUSD = 0;
    let totalVES = 0;
    filtered.forEach(m => {
      if (m.tipoMovimiento === 'salida') {
        if (m.tipoTransaccion === 'Efectivo USD' || m.tipoTransaccion === 'USD') {
          totalUSD += m.precioVentaUSD * m.cantidad;
        } else {
          totalVES += m.precioVentaVES * m.cantidad;
        }
      }
    });
    
    setStats({
      totalMovements: filtered.length,
      totalIngresosUSD: totalUSD,
      totalIngresosVES: totalVES,
    });
  }, [movements, selectedTipo, selectedTransaccion, searchText, products]);

  // -----------------------------
  // 🔄 Cargar datos
  // -----------------------------
  const loadAllData = async () => {
    setLoading(true);
    try {
      const user = await getUserFromStorage();
      if (!user) {
        navigation.navigate("Log_in");
        return;
      }

      const empId = await getEmpresaIdFromUser(user);
      setEmpresaId(empId);
      
      await loadProducts(empId);
      const movementsData = await loadMovements(empId);
      
      setMovements(movementsData);
      setFilteredMovements(movementsData);
      
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [movements, selectedTipo, selectedTransaccion, searchText, products]);

  const formatCurrency = (amount, currency) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else {
      return `Bs. ${amount.toFixed(2)}`;
    }
  };

  const getMovementIcon = (tipo) => {
    switch (tipo) {
      case 'entrada': return 'arrow-down';
      case 'salida': return 'arrow-up';
      case 'ajuste': return 'sync';
      case 'merma': return 'trash';
      case 'devolucion': return 'return-up-back';
      default: return 'swap-horizontal';
    }
  };

  const getMovementColor = (tipo) => {
    switch (tipo) {
      case 'entrada': return '#27ae60';
      case 'salida': return '#e74c3c';
      case 'ajuste': return '#f39c12';
      case 'merma': return '#95a5a6';
      case 'devolucion': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
        <NavBar />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#45c0e8" />
          <Text style={styles.loadingText}>Cargando movimientos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
      <NavBar />
      
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <LinearGradient colors={['#45c0e8', '#3aa5c9']} style={styles.header}>
            <Text style={styles.headerTitle}>Movimientos</Text>
            
            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar producto..."
                placeholderTextColor="#94a3b8"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </LinearGradient>

          {/* FILTROS - Ahora visibles directamente */}
          <View style={styles.filtersContainer}>
            <Text style={styles.filterTitle}>Filtrar por tipo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, selectedTipo === "todos" && styles.filterChipActive]}
                onPress={() => setSelectedTipo("todos")}
              >
                <Text style={[styles.filterChipText, selectedTipo === "todos" && styles.filterChipTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterChip, selectedTipo === "entrada" && styles.filterChipActive]}
                onPress={() => setSelectedTipo("entrada")}
              >
                <MaterialCommunityIcons name="arrow-down" size={16} color={selectedTipo === "entrada" ? "white" : "#27ae60"} />
                <Text style={[styles.filterChipText, selectedTipo === "entrada" && styles.filterChipTextActive]}>
                  Entradas
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterChip, selectedTipo === "salida" && styles.filterChipActive]}
                onPress={() => setSelectedTipo("salida")}
              >
                <MaterialCommunityIcons name="arrow-up" size={16} color={selectedTipo === "salida" ? "white" : "#e74c3c"} />
                <Text style={[styles.filterChipText, selectedTipo === "salida" && styles.filterChipTextActive]}>
                  Salidas
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterChip, selectedTipo === "ajuste" && styles.filterChipActive]}
                onPress={() => setSelectedTipo("ajuste")}
              >
                <MaterialCommunityIcons name="sync" size={16} color={selectedTipo === "ajuste" ? "white" : "#f39c12"} />
                <Text style={[styles.filterChipText, selectedTipo === "ajuste" && styles.filterChipTextActive]}>
                  Ajustes
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <Text style={[styles.filterTitle, { marginTop: 10 }]}>Forma de pago:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, selectedTransaccion === "todos" && styles.filterChipActive]}
                onPress={() => setSelectedTransaccion("todos")}
              >
                <Text style={[styles.filterChipText, selectedTransaccion === "todos" && styles.filterChipTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterChip, selectedTransaccion === "Debito" && styles.filterChipActive]}
                onPress={() => setSelectedTransaccion("Debito")}
              >
                <MaterialCommunityIcons name="credit-card" size={16} color={selectedTransaccion === "Debito" ? "white" : "#3498db"} />
                <Text style={[styles.filterChipText, selectedTransaccion === "Debito" && styles.filterChipTextActive]}>
                  Débito
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterChip, selectedTransaccion === "Efectivo BS" && styles.filterChipActive]}
                onPress={() => setSelectedTransaccion("Efectivo BS")}
              >
                <MaterialCommunityIcons name="cash" size={16} color={selectedTransaccion === "Efectivo BS" ? "white" : "#27ae60"} />
                <Text style={[styles.filterChipText, selectedTransaccion === "Efectivo BS" && styles.filterChipTextActive]}>
                  Efectivo BS
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterChip, selectedTransaccion === "Efectivo USD" && styles.filterChipActive]}
                onPress={() => setSelectedTransaccion("Efectivo USD")}
              >
                <MaterialCommunityIcons name="cash-usd" size={16} color={selectedTransaccion === "Efectivo USD" ? "white" : "#f39c12"} />
                <Text style={[styles.filterChipText, selectedTransaccion === "Efectivo USD" && styles.filterChipTextActive]}>
                  Efectivo USD
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Resumen de ingresos */}
          <View style={styles.incomeSummary}>
            <Text style={styles.sectionTitle}>Ingresos del período</Text>
            <View style={styles.incomeRow}>
              <View style={styles.incomeBox}>
                <Text style={styles.incomeLabel}>USD</Text>
                <Text style={styles.incomeValueUSD}>
                  {formatCurrency(stats.totalIngresosUSD, 'USD')}
                </Text>
              </View>
              <View style={styles.incomeDivider} />
              <View style={styles.incomeBox}>
                <Text style={styles.incomeLabel}>VES</Text>
                <Text style={styles.incomeValueVES}>
                  {formatCurrency(stats.totalIngresosVES, 'VES')}
                </Text>
              </View>
            </View>
          </View>

          {/* Lista de movimientos */}
          <View style={styles.movementsContainer}>
            <Text style={styles.sectionTitle}>
              {filteredMovements.length} movimientos encontrados
            </Text>

            {filteredMovements.length > 0 ? (
              filteredMovements.map((movement) => {
                const color = getMovementColor(movement.tipoMovimiento);
                return (
                  <View key={movement.id} style={styles.movementCard}>
                    <View style={styles.movementHeader}>
                      <View style={[styles.movementIcon, { backgroundColor: color + '20' }]}>
                        <MaterialCommunityIcons 
                          name={getMovementIcon(movement.tipoMovimiento)} 
                          size={24} 
                          color={color} 
                        />
                      </View>
                      <View style={styles.movementInfo}>
                        <Text style={styles.productName}>
                          {products[movement.productID] || "Producto desconocido"}
                        </Text>
                        <View style={styles.movementBadge}>
                          <Text style={[styles.movementType, { color }]}>
                            {movement.tipoMovimiento.toUpperCase()}
                          </Text>
                          <Text style={styles.movementQuantity}>
                            {movement.tipoMovimiento === 'entrada' ? '+' : '-'}{movement.cantidad} unid
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.movementDetails}>
                      <Text style={styles.movementDate}>{formatDate(movement.fecha)}</Text>
                      <Text style={styles.movementTransaction}>
                        {movement.tipoTransaccion || 'No especificado'}
                      </Text>
                    </View>

                    {movement.observaciones ? (
                      <Text style={styles.movementObservaciones}>{movement.observaciones}</Text>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="swap-horizontal" size={60} color="#cbd5e1" />
                <Text style={styles.emptyText}>No hay movimientos</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
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
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 10,
  },
  filtersContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#45c0e8',
  },
  filterChipText: {
    fontSize: 13,
    color: '#64748b',
  },
  filterChipTextActive: {
    color: 'white',
  },
  incomeSummary: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  incomeBox: {
    flex: 1,
    alignItems: 'center',
  },
  incomeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  incomeValueUSD: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  incomeValueVES: {
    fontSize: 20,
    fontWeight: '700',
    color: '#45c0e8',
  },
  incomeDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  movementsContainer: {
    paddingHorizontal: 16,
  },
  movementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  movementHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  movementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  movementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  movementType: {
    fontSize: 12,
    fontWeight: '700',
  },
  movementQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  movementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  movementDate: {
    fontSize: 12,
    color: '#64748b',
  },
  movementTransaction: {
    fontSize: 12,
    fontWeight: '500',
    color: '#45c0e8',
  },
  movementObservaciones: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
  bottomSpace: {
    height: 20,
  },
});

export default MovementsScreen;