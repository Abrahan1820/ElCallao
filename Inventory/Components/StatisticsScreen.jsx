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
  Dimensions,
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get('window');

const StatisticsScreen = () => {
  const navigation = useNavigation();
  const supa = SupaClient();

  // Estados
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState({});
  const [productsList, setProductsList] = useState([]);
  const [productPrices, setProductPrices] = useState({}); // Nuevo: precios de venta de productos
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  
  // Filtro de período para estadísticas
  const [selectedPeriodo, setSelectedPeriodo] = useState("semana");
  
  // Datos de estadísticas
  const [stats, setStats] = useState({
    totalVentas: 0,
    ingresosUSD: 0,
    ingresosVESDebito: 0,
    ingresosVESEfectivo: 0,
    gananciaUSD: 0,
    gananciaVES: 0,
  });
  
  // Datos para los gráficos
  const [chartDataUSD, setChartDataUSD] = useState(null);
  const [chartDataVES, setChartDataVES] = useState(null);
  const [chartDataGanancia, setChartDataGanancia] = useState(null);
  
  // Top 30 productos más vendidos
  const [topProducts, setTopProducts] = useState([]);
  
  // Bottom 30 productos menos vendidos
  const [bottomProducts, setBottomProducts] = useState([]);

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
  // 📥 Cargar productos y sus precios
  // -----------------------------
  const loadProducts = async (empId) => {
    try {
      const { data, error } = await supa
        .from("product")
        .select("id, nombre, precioVentaUSD, precioVentaVES") // Incluimos los precios de venta
        .eq("empresaID", empId);

      if (error) throw error;

      const productMap = {};
      const productList = [];
      const priceMap = {};
      
      data.forEach((product) => {
        productMap[product.id] = product.nombre;
        productList.push({ id: product.id, nombre: product.nombre });
        // Guardamos los precios de venta del producto
        priceMap[product.id] = {
          precioVentaUSD: product.precioVentaUSD || 0,
          precioVentaVES: product.precioVentaVES || 0
        };
      });
      
      setProducts(productMap);
      setProductsList(productList);
      setProductPrices(priceMap);
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

// 📊 Procesar estadísticas
const processStatistics = useCallback(() => {
  const fechaInicio = getFechaInicio(selectedPeriodo);
  
  // Filtrar movimientos del período
  const movimientosPeriodo = fechaInicio 
    ? movements.filter(m => new Date(m.fecha) >= fechaInicio)
    : movements;
  
  // Calcular totales
  let totalVentas = 0;
  let ingresosUSD = 0;
  let ingresosVESDebito = 0;
  let ingresosVESEfectivo = 0;
  let gananciaTotalUSD = 0;
  let gananciaTotalVES = 0;
  let ultimaTasa = 60; // Valor por defecto
  
  // Obtener la última tasa del período para conversiones
  const movimientosConTasa = movimientosPeriodo.filter(m => m.tasaBCV && m.tasaBCV > 0);
  if (movimientosConTasa.length > 0) {
    ultimaTasa = movimientosConTasa[movimientosConTasa.length - 1].tasaBCV;
  }
  
  // Calcular ventas por producto
  const ventasPorProducto = {};
  
  movimientosPeriodo.forEach(m => {
    // Solo procesamos movimientos de salida
    if (m.tipoMovimiento === 'salida') {
      totalVentas++;
      
      // Sumar ingresos según el tipo de pago
      ingresosUSD += m.precioVentaUSD || 0;
      ingresosVESDebito += m.precioVentaVES || 0;
      ingresosVESEfectivo += m.precioVentaVESEfectivo || 0;
      
      // OBTENER GANANCIA REAL usando precioCompraUSD y precioVendido
      // Para productos normales, recargas y avances, tenemos precioCompraUSD y precioVendido
      let gananciaPorVentaUSD = 0;
      
      if (m.precioVendido && m.precioCompraUSD !== undefined) {
        // Usar los nuevos campos si están disponibles
        gananciaPorVentaUSD = (((m.precioVendido))- ((m.precioCompraUSD) * (m.cantidad)));
        console.log(`💰 ${products[m.productoID] || 'Producto'} - Vendido: $${m.precioVendido} | Costo: $${m.precioCompraUSD} | Ganancia: $${gananciaPorVentaUSD}`);
      } else {
        // Fallback: usar precioVentaReal del producto
        const precioVentaRealUSD = productPrices[m.productoID]?.precioVentaUSD || 0;
        gananciaPorVentaUSD = (precioVentaRealUSD - (m.precioCompraUSD || 0)) * (m.cantidad || 1);
      }
      
      gananciaTotalUSD += gananciaPorVentaUSD;
      
      // Calcular ganancia en VES usando la tasa del movimiento o la última tasa
      const tasa = m.tasaBCV || ultimaTasa;
      if (tasa > 0) {
        gananciaTotalVES += gananciaPorVentaUSD * tasa;
      }
      
      // Acumular ventas por producto
      const prodId = m.productoID;
      if (!ventasPorProducto[prodId]) {
        ventasPorProducto[prodId] = {
          cantidad: 0,
          nombre: products[prodId] || "Producto desconocido",
          ingresos: 0,
          ganancia: 0,
          costoTotal: 0,
          ventaTotal: 0
        };
      }
      
      const cantidad = m.cantidad || 1;
      const ventaTotal = m.precioVendido || (m.precioVentaUSD || 0);
      const costoTotal = (m.precioCompraUSD || 0) * cantidad;
      
      ventasPorProducto[prodId].cantidad += cantidad;
      ventasPorProducto[prodId].ingresos += ventaTotal;
      ventasPorProducto[prodId].ganancia += gananciaPorVentaUSD;
      ventasPorProducto[prodId].costoTotal += costoTotal;
      ventasPorProducto[prodId].ventaTotal += ventaTotal;
    }
  });
  
  setStats({
    totalVentas,
    ingresosUSD,
    ingresosVESDebito,
    ingresosVESEfectivo,
    gananciaUSD: gananciaTotalUSD,
    gananciaVES: gananciaTotalVES,
  });
  
  // Top 30 productos más vendidos (orden descendente por cantidad)
  const top = Object.entries(ventasPorProducto)
    .map(([id, data]) => ({
      id,
      nombre: data.nombre,
      cantidad: data.cantidad,
      ingresos: data.ingresos,
      ganancia: data.ganancia,
      costoTotal: data.costoTotal,
      ventaTotal: data.ventaTotal,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 30);
  
  setTopProducts(top);
  
  // Bottom 30 productos menos vendidos
  const productosConVentas = Object.entries(ventasPorProducto)
    .map(([id, data]) => ({
      id,
      nombre: data.nombre,
      cantidad: data.cantidad,
      ingresos: data.ingresos,
      ganancia: data.ganancia,
      costoTotal: data.costoTotal,
      ventaTotal: data.ventaTotal,
    }))
    .filter(p => p.cantidad > 0);
  
  // Orden ascendente (menos vendidos primero) y tomar los primeros 30
  const bottom = [...productosConVentas]
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, 30);
  
  setBottomProducts(bottom);
  
  // Procesar datos para gráficos
  processChartData(movimientosPeriodo, ultimaTasa);
  
}, [movements, selectedPeriodo, products, productPrices]);

// 📊 Procesar datos para gráficos
const processChartData = (movementsData, tasaReferencia) => {
  const salidas = movementsData.filter(m => m.tipoMovimiento === 'salida');
  
  if (salidas.length === 0) {
    setChartDataUSD(null);
    setChartDataVES(null);
    setChartDataGanancia(null);
    return;
  }

  const groupedByDate = {};
  
  salidas.forEach(m => {
    const date = new Date(m.fecha);
    const dateKey = `${date.getDate()}/${date.getMonth() + 1}`;
    
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = { 
        usd: 0, 
        ves: 0,
        ganancia: 0,
        cantidadVentas: 0
      };
    }
    
    // Sumar ingresos según tipo
    groupedByDate[dateKey].usd += m.precioVentaUSD || 0;
    groupedByDate[dateKey].ves += (m.precioVentaVES || 0) + (m.precioVentaVESEfectivo || 0);
    groupedByDate[dateKey].cantidadVentas += m.cantidad || 1;
    
    // Calcular ganancia usando precioCompraUSD y precioVendido
    let gananciaPorVenta = 0;
    
    if (m.precioVendido && m.precioCompraUSD !== undefined) {
      // Usar los nuevos campos
      gananciaPorVenta = (m.precioVendido - (m.precioCompraUSD || 0)) * (m.cantidad || 1);
    } else {
      // Fallback: usar precio de venta real del producto
      const precioVentaRealUSD = productPrices[m.productoID]?.precioVentaUSD || 0;
      gananciaPorVenta = (precioVentaRealUSD - (m.precioCompraUSD || 0)) * (m.cantidad || 1);
    }
    
    groupedByDate[dateKey].ganancia += gananciaPorVenta;
  });

  const dates = Object.keys(groupedByDate).sort((a, b) => {
    const [dayA, monthA] = a.split('/');
    const [dayB, monthB] = b.split('/');
    return new Date(2024, monthA - 1, dayA) - new Date(2024, monthB - 1, dayB);
  });

  const usdData = dates.map(date => groupedByDate[date].usd);
  const vesData = dates.map(date => groupedByDate[date].ves);
  const gananciaData = dates.map(date => groupedByDate[date].ganancia);

  const lastDates = dates.slice(-10);
  const lastUSD = usdData.slice(-10);
  const lastVES = vesData.slice(-10);
  const lastGanancia = gananciaData.slice(-10);

  if (lastUSD.some(v => v > 0)) {
    setChartDataUSD({
      labels: lastDates,
      datasets: [{
        data: lastUSD,
        color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
        strokeWidth: 2,
      }],
    });
  }

  if (lastVES.some(v => v > 0)) {
    setChartDataVES({
      labels: lastDates,
      datasets: [{
        data: lastVES,
        color: (opacity = 1) => `rgba(69, 192, 232, ${opacity})`,
        strokeWidth: 2,
      }],
    });
  }

  if (lastGanancia.some(v => v > 0)) {
    setChartDataGanancia({
      labels: lastDates,
      datasets: [{
        data: lastGanancia,
        color: (opacity = 1) => `rgba(240, 178, 50, ${opacity})`,
        strokeWidth: 2,
      }],
    });
  }
};

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
      
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (movements.length > 0 && Object.keys(products).length > 0 && Object.keys(productPrices).length > 0) {
      processStatistics();
    }
  }, [movements, selectedPeriodo, products, productPrices]);

  const formatCurrency = (amount, currency) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else {
      return `Bs. ${amount.toFixed(2)}`;
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

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <View style={styles.statCardContent}>
        <Text style={styles.statCardValue}>{value}</Text>
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
        <NavBar />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#45c0e8" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
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
            <Text style={styles.headerTitle}>Estadísticas</Text>
          </LinearGradient>

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

          {/* Tarjetas de estadísticas */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Ventas totales"
              value={stats.totalVentas.toString()}
              icon="cart"
              color="#45c0e8"
            />
            <StatCard
              title="Ingresos USD"
              value={formatCurrency(stats.ingresosUSD, 'USD')}
              icon="currency-usd"
              color="#059669"
            />
            <StatCard
              title="Ingresos VES (Débito)"
              value={formatCurrency(stats.ingresosVESDebito, 'VES')}
              icon="credit-card"
              color="#3498db"
            />
            <StatCard
              title="Ingresos VES (Efectivo)"
              value={formatCurrency(stats.ingresosVESEfectivo, 'VES')}
              icon="cash"
              color="#f39c12"
            />
            <StatCard
              title="Ganancia USD"
              value={formatCurrency(stats.gananciaUSD, 'USD')}
              icon="chart-line"
              color="#f0b232"
            />
            
          </View>

          {/* Gráfico USD */}
          {chartDataUSD && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <MaterialCommunityIcons name="currency-usd" size={20} color="#059669" />
                <Text style={styles.chartTitle}>Evolución de ingresos en USD</Text>
              </View>
              <LineChart
                data={chartDataUSD}
                width={width - 64}
                height={200}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '4', strokeWidth: '2', stroke: '#059669' },
                  formatYLabel: (value) => `$${parseFloat(value).toFixed(0)}`,
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Gráfico VES */}
          {chartDataVES && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <MaterialCommunityIcons name="currency-btc" size={20} color="#45c0e8" />
                <Text style={styles.chartTitle}>Evolución de ingresos en VES</Text>
              </View>
              <LineChart
                data={chartDataVES}
                width={width - 64}
                height={200}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(69, 192, 232, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '4', strokeWidth: '2', stroke: '#45c0e8' },
                  formatYLabel: (value) => `Bs.${parseFloat(value).toFixed(0)}`,
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Gráfico de Ganancia */}
          {chartDataGanancia && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <MaterialCommunityIcons name="chart-line" size={20} color="#f0b232" />
                <Text style={styles.chartTitle}>Evolución de ganancia en USD</Text>
              </View>
              <LineChart
                data={chartDataGanancia}
                width={width - 64}
                height={200}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(240, 178, 50, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '4', strokeWidth: '2', stroke: '#f0b232' },
                  formatYLabel: (value) => `$${parseFloat(value).toFixed(0)}`,
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Top 30 productos más vendidos */}
<View style={styles.topProductsContainer}>
  <Text style={styles.sectionTitle}>🏆 Top 30 productos más vendidos</Text>
  
  {topProducts.length > 0 ? (
    topProducts.map((product, index) => (
      <View key={product.id} style={styles.productRankItem}>
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rankText,
            index === 0 && styles.rankGold,
            index === 1 && styles.rankSilver,
            index === 2 && styles.rankBronze,
          ]}>
            #{index + 1}
          </Text>
        </View>
        <View style={styles.productRankInfo}>
          <Text style={styles.productRankName} numberOfLines={1}>
            {product.nombre}
          </Text>
          <Text style={styles.productRankQuantity}>
            {product.cantidad} und
          </Text>
        </View>
        <View style={styles.productRankDetails}>
          <Text style={styles.productRankRevenue}>
            💰 {formatCurrency(product.ganancia, 'USD')}
          </Text>
          
        </View>
        <View style={styles.productRankBar}>
          <View 
            style={[
              styles.productRankBarFill,
              { width: `${Math.min((product.cantidad / topProducts[0]?.cantidad) * 100, 100)}%` }
            ]} 
          />
        </View>
      </View>
    ))
  ) : (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="chart-bar" size={50} color="#cbd5e1" />
      <Text style={styles.emptyText}>No hay datos de ventas en este período</Text>
    </View>
  )}
</View>

          {/* Bottom 30 productos menos vendidos */}
<View style={styles.bottomProductsContainer}>
  <Text style={styles.sectionTitle}>📉 Top 30 productos menos vendidos</Text>
  
  {bottomProducts.length > 0 ? (
    bottomProducts.map((product, index) => (
      <View key={product.id} style={styles.productRankItem}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankBottomText}>
            #{index + 1}
          </Text>
        </View>
        <View style={styles.productRankInfo}>
          <Text style={styles.productRankName} numberOfLines={1}>
            {product.nombre}
          </Text>
          <Text style={styles.productRankBottomQuantity}>
            {product.cantidad} und
          </Text>
        </View>
        <View style={styles.productRankDetails}>
          <Text style={styles.productRankRevenue}>
            💰 {formatCurrency(product.ganancia, 'USD')}
          </Text>
          
        </View>
        <View style={styles.productRankBar}>
          <View 
            style={[
              styles.productRankBarFillBottom,
              { width: `${Math.min((product.cantidad / (bottomProducts[0]?.cantidad || 1)) * 100, 100)}%` }
            ]} 
          />
        </View>
      </View>
    ))
  ) : (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="chart-bar" size={50} color="#cbd5e1" />
      <Text style={styles.emptyText}>No hay suficientes datos en este período</Text>
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
  },
  periodoContainer: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statCardContent: {
    flex: 1,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  statCardTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  topProductsContainer: {
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
  bottomProductsContainer: {
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
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  productRankItem: {
    marginBottom: 12,
  },
  rankContainer: {
    marginBottom: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  rankGold: {
    color: '#f39c12',
  },
  rankSilver: {
    color: '#95a5a6',
  },
  rankBronze: {
    color: '#cd7f32',
  },
  rankBottomText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e74c3c',
  },
  productRankInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productRankName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  productRankQuantity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#45c0e8',
  },
  productRankBottomQuantity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e74c3c',
  },
  productRankBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  productRankBarFill: {
    height: '100%',
    backgroundColor: '#45c0e8',
    borderRadius: 3,
  },
  productRankBarFillBottom: {
    height: '100%',
    backgroundColor: '#e74c3c',
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
    textAlign: 'center',
  },
  bottomSpace: {
    height: 20,
  },
  productRankDetails: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
  gap: 8,
},
productRankRevenue: {
  fontSize: 12,
  fontWeight: '600',
  color: '#27ae60',
},
productRankMargin: {
  fontSize: 11,
  fontWeight: '500',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 10,
},
marginHigh: {
  backgroundColor: '#d4edda',
  color: '#155724',
},
marginMedium: {
  backgroundColor: '#fff3cd',
  color: '#856404',
},
marginLow: {
  backgroundColor: '#f8d7da',
  color: '#721c24',
},
});

export default StatisticsScreen;