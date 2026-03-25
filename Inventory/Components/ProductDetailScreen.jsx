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
  Dimensions,
  Image, // 👈 Importamos Image
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId, productData } = route.params;
  const supa = SupaClient();
  
  const [product, setProduct] = useState(productData || null);
  const [movements, setMovements] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(!productData);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [timeFilter, setTimeFilter] = useState('week'); // 'week', 'month', 'all'
  const [imageError, setImageError] = useState(false); // Para manejar errores de imagen

  useEffect(() => {
    if (!productData) {
      loadProductDetails();
    }
    loadProductMovements();
  }, []);

  useEffect(() => {
    if (movements.length > 0) {
      processChartData();
    }
  }, [movements, timeFilter]);

  const loadProductDetails = async () => {
    try {
      const { data, error } = await supa
        .from("product")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error("Error cargando producto:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para desactivar producto
const deactivateProduct = async () => {
  try {
    const { error } = await supa
      .from("product")
      .update({ esActivo: false })
      .eq("id", productId);

    if (error) throw error;

    // Mostrar toast de éxito
    Toast.show({
      type: 'success',
      text1: 'Producto desactivado',
      text2: `${product?.nombre} ha sido desactivado correctamente`,
      visibilityTime: 3000,
    });

    // Actualizar el estado local
    setProduct({ ...product, esActivo: false });
    
    // Opcional: regresar a la pantalla anterior después de 1.5 segundos
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
    
  } catch (error) {
    console.error("Error desactivando producto:", error);
    
    // Mostrar toast de error
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'No se pudo desactivar el producto. Intenta de nuevo.',
      visibilityTime: 3000,
    });
  }
};

// Función para mostrar confirmación antes de desactivar
const showDeactivateConfirmation = () => {
  // Usando tu customConfirm de Toast modificado
  Toast.show({
    type: 'customConfirm',
    text1: 'Desactivar producto',
    text2: `¿Estás seguro que deseas desactivar "${product?.nombre}"?\n\nEste producto dejará de estar disponible en el inventario.`,
    visibilityTime: 0, // No se cierra automáticamente
    autoHide: false, // No se oculta automáticamente
    props: {
      buttons: [
        {
          text: 'Cancelar',
          onPress: () => Toast.hide(),
          style: { color: '#64748b' }
        },
        {
          text: 'Desactivar',
          onPress: () => {
            Toast.hide();
            deactivateProduct();
          },
          style: { color: '#e74c3c', fontWeight: 'bold' }
        }
      ]
    }
  });
};



  const loadProductMovements = async () => {
    setLoadingMovements(true);
    try {
      const { data, error } = await supa
        .from("productMovement")
        .select("*")
        .eq("productoID", productId)
        .order("fecha", { ascending: true }); // Cambiado a ascendente para el gráfico

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Procesar datos para el gráfico
  const processChartData = () => {
    if (!product) return;

    // Filtrar movimientos según el rango de tiempo seleccionado
    const now = new Date();
    let filteredMovements = [...movements];
    
    if (timeFilter === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      filteredMovements = movements.filter(m => new Date(m.fecha) >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filteredMovements = movements.filter(m => new Date(m.fecha) >= monthAgo);
    }

    // Calcular stock acumulado
    let currentStock = product.stockActual;
    const stockHistory = [];
    const dates = [];

    // Ordenar movimientos de más antiguo a más reciente
    const sortedMovements = [...filteredMovements].sort((a, b) => 
      new Date(a.fecha) - new Date(b.fecha)
    );

    // Agregar punto inicial (stock actual menos movimientos futuros?)
    // Mejor: reconstruir el historial desde el principio
    if (sortedMovements.length > 0) {
      // Calcular stock inicial sumando/restado todos los movimientos
      let initialStock = currentStock;
      for (const mov of sortedMovements) {
        if (mov.tipoMovimiento === 'entrada' || mov.tipoMovimiento === 'devolucion') {
          initialStock -= mov.cantidad;
        } else {
          initialStock += mov.cantidad;
        }
      }

      // Reconstruir historial
      let runningStock = initialStock;
      
      // Agregar punto inicial
      const firstDate = new Date(sortedMovements[0].fecha);
      firstDate.setDate(firstDate.getDate() - 1);
      dates.push(formatDateForChart(firstDate));
      stockHistory.push(runningStock);

      // Agregar puntos por cada movimiento
      for (const mov of sortedMovements) {
        if (mov.tipoMovimiento === 'entrada' || mov.tipoMovimiento === 'devolucion') {
          runningStock += mov.cantidad;
        } else {
          runningStock -= mov.cantidad;
        }
        
        dates.push(formatDateForChart(mov.fecha));
        stockHistory.push(runningStock);
      }

      // Agregar punto final (stock actual)
      if (stockHistory[stockHistory.length - 1] !== currentStock) {
        dates.push(formatDateForChart(new Date()));
        stockHistory.push(currentStock);
      }
    } else {
      // Si no hay movimientos, solo mostrar el stock actual
      dates.push(formatDateForChart(new Date()));
      stockHistory.push(currentStock);
    }

    setChartData({
      labels: dates.slice(-10), // Mostrar últimos 10 puntos para no saturar
      datasets: [{
        data: stockHistory.slice(-10),
        color: (opacity = 1) => `rgba(69, 192, 232, ${opacity})`,
        strokeWidth: 2
      }]
    });
  };

  const formatDateForChart = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
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

  // Función para obtener la URL de la imagen
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // Si es una URL completa de Supabase Storage
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Si es solo el nombre del archivo, construimos la URL
    // Ajusta esto según cómo almacenes las imágenes en Supabase
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
        <NavBar />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#45c0e8" />
          <Text style={styles.loadingText}>Cargando producto...</Text>
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
          
          

          {/* Cabecera del producto con imagen */}
          <View style={styles.headerCard}>
            <View style={styles.productHeader}>
              {/* Contenedor de la imagen */}
              <View style={styles.imageContainer}>
                {product?.imagen && !imageError ? (
                  <Image 
                    source={{ uri: getImageUrl(product.imagen) }}
                    style={styles.productImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="image-off" size={40} color="#94a3b8" />
                  </View>
                )}
              </View>
              
              {/* Nombre y descripción */}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product?.nombre}</Text>
                {product?.descripcion && (
                  <Text style={styles.productDescription}>{product.descripcion}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Stats del producto */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Stock Actual</Text>
              <Text style={[styles.statValue, { color: '#2c3e50' }]}>{product?.stockActual}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Mínimo</Text>
              <Text style={styles.statValue}>{product?.stockMinimo}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Máximo</Text>
              <Text style={styles.statValue}>{product?.stockMaximo}</Text>
            </View>
          </View>

          {/* Gráfico de evolución del stock */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Evolución del Stock</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]}
                  onPress={() => setTimeFilter('week')}
                >
                  <Text style={[styles.filterText, timeFilter === 'week' && styles.filterTextActive]}>7d</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, timeFilter === 'month' && styles.filterButtonActive]}
                  onPress={() => setTimeFilter('month')}
                >
                  <Text style={[styles.filterText, timeFilter === 'month' && styles.filterTextActive]}>30d</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]}
                  onPress={() => setTimeFilter('all')}
                >
                  <Text style={[styles.filterText, timeFilter === 'all' && styles.filterTextActive]}>Todo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loadingMovements ? (
              <ActivityIndicator size="small" color="#45c0e8" style={styles.chartLoader} />
            ) : chartData && chartData.datasets[0].data.length > 1 ? (
              <LineChart
                data={chartData}
                width={width - 64}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(69, 192, 232, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#45c0e8'
                  }
                }}
                bezier
                style={styles.chart}
                formatYLabel={(value) => Math.round(value).toString()}
              />
            ) : (
              <View style={styles.noChartData}>
                <MaterialCommunityIcons name="chart-line" size={40} color="#cbd5e1" />
                <Text style={styles.noChartText}>No hay suficientes datos para mostrar el gráfico</Text>
              </View>
            )}
          </View>

          {/* Precios */}
          <View style={styles.pricesCard}>
            <Text style={styles.sectionTitle}>Precios</Text>
            <View style={styles.pricesRow}>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Venta USD</Text>
                <Text style={styles.priceValue}>${product?.precioVentaUSD}</Text>
                <Text style={styles.priceLabelSmall}>Compra: ${product?.precioCompraUSD}</Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Venta VES</Text>
                <Text style={styles.priceValue}>Bs. {product?.precioVentaVES}</Text>
                <Text style={styles.priceLabelSmall}>Compra: Bs. {product?.precioCompraVES}</Text>
              </View>
            </View>
          </View>

          {/* Información adicional */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Información adicional</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Unidad de medida:</Text>
              <Text style={styles.infoValue}>{product?.unidadMedida}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoría:</Text>
              <Text style={styles.infoValue}>{product?.categoriaNombre || "Sin categoría"}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID del producto:</Text>
              <Text style={styles.infoValue}>{product?.id}</Text>
            </View>
            
            

            
          </View>

          {/* Historial de movimientos */}
          <View style={styles.movementsCard}>
            <Text style={styles.sectionTitle}>Últimos movimientos</Text>
            
            {loadingMovements ? (
              <ActivityIndicator size="small" color="#45c0e8" style={styles.movementLoader} />
            ) : movements.length > 0 ? (
              movements.slice(0, 10).map((mov) => (
                <View key={mov.id} style={styles.movementItem}>
                  <View style={[styles.movementIcon, { backgroundColor: getMovementColor(mov.tipoMovimiento) + '20' }]}>
                    <MaterialCommunityIcons 
                      name={getMovementIcon(mov.tipoMovimiento)} 
                      size={20} 
                      color={getMovementColor(mov.tipoMovimiento)} 
                    />
                  </View>
                  <View style={styles.movementInfo}>
                    <View style={styles.movementHeader}>
                      <Text style={[styles.movementType, { color: getMovementColor(mov.tipoMovimiento) }]}>
                        {mov.tipoMovimiento.toUpperCase()}
                      </Text>
                      <Text style={styles.movementQuantity}>
                        {mov.tipoMovimiento === 'entrada' || mov.tipoMovimiento === 'devolucion' ? '+' : '-'}{mov.cantidad}
                      </Text>
                    </View>
                    <Text style={styles.movementDate}>{formatDate(mov.fecha)}</Text>
                    {mov.observaciones && (
                      <Text style={styles.movementReason}>{mov.observaciones}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noMovements}>No hay movimientos registrados</Text>
            )}
            
            {movements.length > 10 && (
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>Ver más movimientos</Text>
              </TouchableOpacity>
            )}
          </View>

         

{/* Botones de acción */}
<View style={styles.actionButtons}>
  <TouchableOpacity 
    style={[styles.actionButton, styles.adjustButton]}
    onPress={() => navigation.navigate("AdjustStock", { product })}
  >
    <MaterialCommunityIcons name="swap-horizontal" size={20} color="white" />
    <Text style={styles.actionButtonText}>Ajustar Stock</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={[styles.actionButton, styles.editButton]}
    onPress={() => navigation.navigate("CreateProduct", { product })}
  >
    <MaterialCommunityIcons name="pencil" size={20} color="white" />
    <Text style={styles.actionButtonText}>Editar</Text>
  </TouchableOpacity>
  
  {/* 👇 Nuevo botón de desactivar - solo mostrar si el producto está activo */}
  {product?.esActivo !== false && (
    <TouchableOpacity 
      style={[styles.actionButton, styles.deactivateButton]}
      onPress={showDeactivateConfirmation}
    >
      <MaterialCommunityIcons name="close-circle" size={20} color="white" />
      <Text style={styles.actionButtonText}>Desactivar</Text>
    </TouchableOpacity>
  )}
</View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  deactivateButton: {
  backgroundColor: '#e74c3c',
},
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#45c0e8',
    marginLeft: 4,
    fontWeight: '500',
  },
  headerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#45c0e8',
  },
  // Nuevos estilos para el gráfico
  chartCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#45c0e8',
    borderColor: '#45c0e8',
  },
  filterText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLoader: {
    marginVertical: 40,
  },
  noChartData: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noChartText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
    textAlign: 'center',
  },
  pricesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  priceLabelSmall: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  movementsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  movementLoader: {
    marginVertical: 20,
  },
  movementItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  movementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementInfo: {
    flex: 1,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  movementType: {
    fontSize: 14,
    fontWeight: '700',
  },
  movementQuantity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  movementDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  movementReason: {
    fontSize: 12,
    color: '#475569',
  },
  noMovements: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingTop: 12,
  },
  viewMoreText: {
    color: '#45c0e8',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  adjustButton: {
    backgroundColor: '#f39c12',
  },
  editButton: {
    backgroundColor: '#45c0e8',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;