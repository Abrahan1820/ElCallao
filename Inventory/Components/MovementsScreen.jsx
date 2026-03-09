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
  
  // Filtros
  const [selectedTipo, setSelectedTipo] = useState("todos");
  const [selectedTransaccion, setSelectedTransaccion] = useState("todos");
  const [selectedPeriodo, setSelectedPeriodo] = useState("dia");
  const [searchText, setSearchText] = useState("");
  
  // Ingreso del día
  const [ingresoDia, setIngresoDia] = useState({
    usd: 0,
    vesDebito: 0,
    vesEfectivo: 0,
  });

  // -----------------------------
  // Funciones de fecha
  // -----------------------------
  const getFechaInicio = (periodo) => {
    const ahora = new Date();
    const inicio = new Date(ahora);
    
    switch (periodo) {
      case 'dia':
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        inicio.setDate(inicio.getDate() - 7);
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        inicio.setMonth(inicio.getMonth() - 1);
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'todo':
      default:
        return null;
    }
    return inicio;
  };

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
  // 📊 Calcular ingreso del día
  // -----------------------------
  const calcularIngresoDia = (movementsData) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    let usd = 0;
    let vesDebito = 0;
    let vesEfectivo = 0;
    
    movementsData.forEach(m => {
      const fechaMov = new Date(m.fecha);
      if (fechaMov >= hoy && m.tipoMovimiento === 'salida') {
        usd += m.precioVentaUSD || 0;
        vesDebito += m.precioVentaVES || 0;
        vesEfectivo += m.precioVentaVESEfectivo || 0;
      }
    });
    
    setIngresoDia({ usd, vesDebito, vesEfectivo });
  };

  // -----------------------------
  // 🔍 Aplicar filtros
  // -----------------------------
  const applyFilters = useCallback(() => {
    let filtered = [...movements];

    // Filtro por período
    const fechaInicio = getFechaInicio(selectedPeriodo);
    if (fechaInicio) {
      filtered = filtered.filter(m => new Date(m.fecha) >= fechaInicio);
    }

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
        const productName = products[m.productoID] || "";
        return productName.toLowerCase().includes(searchLower) ||
               m.observaciones?.toLowerCase().includes(searchLower);
      });
    }

    setFilteredMovements(filtered);
    
  }, [movements, selectedTipo, selectedTransaccion, selectedPeriodo, searchText, products]);

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
      calcularIngresoDia(movementsData);
      
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
  }, [movements, selectedTipo, selectedTransaccion, selectedPeriodo, searchText, products]);

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

const getTransactionAmount = (movement) => {
  switch (movement.tipoTransaccion) {
    case 'Debito':
      return `Bs. ${movement.precioVentaVES?.toFixed(2) || '0.00'}`;
    case 'Pago Movil': // NUEVO: Manejar pago móvil
    case 'PagoMóvil':
    case 'PagoMovil':
      return `Bs. ${movement.precioVentaVES?.toFixed(2) || '0.00'} (Ref: ${movement.pagoMovil || '****'})`;
    case 'Efectivo USD':
      return `$${movement.precioVentaUSD?.toFixed(2) || '0.00'}`;
    case 'Efectivo VES':
      return `Bs. ${movement.precioVentaVESEfectivo?.toFixed(2) || '0.00'}`;
    case 'Efectivo BS': // Por si acaso también manejas este
      return `Bs. ${movement.precioVentaVESEfectivo?.toFixed(2) || '0.00'}`;
    case 'Mixto':
      const partes = [];
      if (movement.precioVentaUSD > 0) partes.push(`$${movement.precioVentaUSD.toFixed(2)}`);
      if (movement.precioVentaVES > 0) partes.push(`Bs.${movement.precioVentaVES.toFixed(2)} (D)`);
      if (movement.precioVentaVESEfectivo > 0) partes.push(`Bs.${movement.precioVentaVESEfectivo.toFixed(2)} (E)`);
      return partes.join(' + ') || 'Monto no disponible';
    default:
      // Debug: mostrar qué tipo de transacción está llegando
      console.log('Tipo de transacción no manejado:', movement.tipoTransaccion);
      return 'Monto no disponible';
  }
};

  const PeriodoBoton = ({ periodo, label, icon }) => (
    <TouchableOpacity
      style={[
        styles.periodoBoton,
        selectedPeriodo === periodo && styles.periodoBotonActive
      ]}
      onPress={() => setSelectedPeriodo(periodo)}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={16} 
        color={selectedPeriodo === periodo ? "white" : "#64748b"} 
      />
      <Text style={[
        styles.periodoBotonText,
        selectedPeriodo === periodo && styles.periodoBotonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

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

          {/* Ingreso del día */}
          <View style={styles.incomeToday}>
            <Text style={styles.sectionTitle}>💰 Ingreso del día</Text>
            <View style={styles.incomeRow}>
              <View style={styles.incomeBox}>
                <Text style={styles.incomeLabel}>USD</Text>
                <Text style={styles.incomeValueUSD}>
                  {formatCurrency(ingresoDia.usd, 'USD')}
                </Text>
              </View>
              <View style={styles.incomeDivider} />
              <View style={styles.incomeBox}>
                <Text style={styles.incomeLabel}>VES Débito</Text>
                <Text style={styles.incomeValueVES}>
                  {formatCurrency(ingresoDia.vesDebito, 'VES')}
                </Text>
              </View>
              <View style={styles.incomeDivider} />
              <View style={styles.incomeBox}>
                <Text style={styles.incomeLabel}>VES Efectivo</Text>
                <Text style={styles.incomeValueVES}>
                  {formatCurrency(ingresoDia.vesEfectivo, 'VES')}
                </Text>
              </View>
            </View>
          </View>

          {/* Filtros de período */}
          <View style={styles.periodoContainer}>
            <Text style={styles.filterTitle}>Período:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <PeriodoBoton periodo="dia" label="Hoy" icon="calendar-today" />
              <PeriodoBoton periodo="semana" label="7 días" icon="calendar-week" />
              <PeriodoBoton periodo="mes" label="30 días" icon="calendar-month" />
              <PeriodoBoton periodo="todo" label="Todo" icon="calendar-blank" />
            </ScrollView>
          </View>

          {/* Filtros de tipo y transacción */}
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
    
    {/* NUEVO: Filtro para Pago Móvil */}
    <TouchableOpacity
      style={[styles.filterChip, selectedTransaccion === "Pago Movil" && styles.filterChipActive]}
      onPress={() => setSelectedTransaccion("Pago Movil")}
    >
      <MaterialCommunityIcons name="cellphone" size={16} color={selectedTransaccion === "Pago Movil" ? "white" : "#9b59b6"} />
      <Text style={[styles.filterChipText, selectedTransaccion === "Pago Movil" && styles.filterChipTextActive]}>
        Pago Móvil
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
    
    <TouchableOpacity
      style={[styles.filterChip, selectedTransaccion === "Mixto" && styles.filterChipActive]}
      onPress={() => setSelectedTransaccion("Mixto")}
    >
      <MaterialCommunityIcons name="swap-horizontal" size={16} color={selectedTransaccion === "Mixto" ? "white" : "#e67e22"} />
      <Text style={[styles.filterChipText, selectedTransaccion === "Mixto" && styles.filterChipTextActive]}>
        Mixto
      </Text>
    </TouchableOpacity>
  </ScrollView>
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
                          {products[movement.productoID] || "Producto desconocido"}
                        </Text>
                        <View style={styles.movementBadge}>
                          <Text style={[styles.movementType, { color }]}>
                            {movement.tipoMovimiento.toUpperCase()}
                          </Text>
                          <Text style={styles.movementQuantity}>
                            {movement.cantidad} unid
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

                    <View style={styles.movementAmount}>
                      <Text style={styles.movementAmountLabel}>Monto:</Text>
                      <Text style={styles.movementAmountValue}>
                        {getTransactionAmount(movement)}
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
  incomeToday: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    gap: 8,
  },
  incomeBox: {
    flex: 1,
    alignItems: 'center',
  },
  incomeLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  incomeValueUSD: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  incomeValueVES: {
    fontSize: 16,
    fontWeight: '700',
    color: '#45c0e8',
  },
  incomeDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  periodoContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  periodoBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  periodoBotonActive: {
    backgroundColor: '#45c0e8',
  },
  periodoBotonText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  periodoBotonTextActive: {
    color: 'white',
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
  movementAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  movementAmountLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 8,
    fontWeight: '500',
  },
  movementAmountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  movementObservaciones: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
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