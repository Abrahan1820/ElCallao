import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const AdjustStock = ({ route }) => {
  const navigation = useNavigation();
  const supa = SupaClient();
  const { product } = route.params;

  // Estados
  const [userData, setUserData] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estado para la cantidad real
  const [cantidadReal, setCantidadReal] = useState(product?.stockActual?.toString() || "");
  const [observaciones, setObservaciones] = useState("");

  // Obtener usuario
  useEffect(() => {
    const getUser = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        if (session) {
          const user = JSON.parse(session);
          setUserData(user);
          setEmpresaId(user.empresaID);
        }
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
      }
    };
    getUser();
  }, []);

  const validateForm = () => {
    if (!cantidadReal || parseInt(cantidadReal) < 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Ingresa una cantidad válida",
        position: "top",
        visibilityTime: 3000,
      });
      return false;
    }

    if (!observaciones.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Las observaciones son obligatorias",
        position: "top",
        visibilityTime: 3000,
      });
      return false;
    }

    return true;
  };

  const handleAdjust = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const nuevaCantidad = parseInt(cantidadReal);
      const cantidadActual = product.stockActual;
      const diferencia = nuevaCantidad - cantidadActual;

      // 1. Actualizar stock en producto
      const { error: updateError } = await supa
        .from("product")
        .update({ stockActual: nuevaCantidad })
        .eq("id", product.id);

      if (updateError) throw updateError;

      // 2. Crear movimiento en productMovement (solo si hay diferencia)
      if (diferencia !== 0) {
        const movimientoData = {
          productoID: product.id,
          tipoMovimiento: "ajuste",
          cantidad: Math.abs(diferencia),
          precioCompraUSD: 0,
          precioVentaUSD: 0,
          precioCompraVES: 0,
          precioVentaVES: 0,
          precioVentaVESEfectivo: 0,
          empresaID: empresaId,
          tipoTransaccion: "ajuste",
          observaciones: observaciones.trim(),
          usuarioCedula: userData?.cedula
        };

        const { error: movementError } = await supa
          .from("productMovement")
          .insert(movimientoData);

        if (movementError) throw movementError;
      }

      Toast.show({
        type: "success",
        text1: "Éxito",
        text2: diferencia === 0 
          ? "No se realizaron cambios" 
          : "Stock ajustado correctamente",
        position: "top",
        visibilityTime: 3000,
      });

      navigation.goBack();

    } catch (error) {
      console.error("Error ajustando stock:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo ajustar el stock",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para validar solo números
  const soloNumeros = (texto) => {
    const numeros = texto.replace(/[^0-9]/g, "");
    setCantidadReal(numeros);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#45c0e8" />
      <NavBar />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <LinearGradient colors={['#45c0e8', '#3aa5c9']} style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ajustar Stock</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          {/* Información del producto */}
          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <MaterialCommunityIcons name="package-variant" size={24} color="#45c0e8" />
              <Text style={styles.productName}>{product.nombre}</Text>
            </View>
            
            <View style={styles.stockInfo}>
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>Stock actual</Text>
                <Text style={styles.stockValue}>{product.stockActual}</Text>
              </View>
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>Mínimo</Text>
                <Text style={styles.stockValue}>{product.stockMinimo}</Text>
              </View>
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>Máximo</Text>
                <Text style={styles.stockValue}>{product.stockMaximo}</Text>
              </View>
            </View>
          </View>

          {/* Formulario de ajuste */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>📝 Ajuste de inventario</Text>

            {/* Cantidad real */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cantidad real en inventario *</Text>
              <View style={styles.quantityContainer}>
                <MaterialCommunityIcons name="package-variant" size={20} color="#45c0e8" />
                <TextInput
                  style={styles.quantityInput}
                  placeholder="Ingrese la cantidad real"
                  placeholderTextColor="#94a3b8"
                  value={cantidadReal}
                  onChangeText={soloNumeros}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Observaciones (obligatorio) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Observaciones *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Indique el motivo del ajuste"
                placeholderTextColor="#94a3b8"
                value={observaciones}
                onChangeText={setObservaciones}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Resumen del cambio */}
            {cantidadReal && parseInt(cantidadReal) >= 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen del ajuste</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Stock actual:</Text>
                  <Text style={styles.summaryValue}>{product.stockActual}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Stock real:</Text>
                  <Text style={styles.summaryValue}>{cantidadReal}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Diferencia:</Text>
                  <Text style={[
                    styles.summaryValue,
                    { color: parseInt(cantidadReal) - product.stockActual > 0 ? '#27ae60' : '#e74c3c' }
                  ]}>
                    {parseInt(cantidadReal) - product.stockActual > 0 ? '+' : ''}
                    {parseInt(cantidadReal) - product.stockActual}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Nuevo stock:</Text>
                  <Text style={styles.totalValue}>{cantidadReal}</Text>
                </View>
              </View>
            )}

            {/* Botones */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                onPress={handleAdjust}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                    <Text style={styles.confirmButtonText}>Ajustar stock</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#45c0e8",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  productCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  stockInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
  },
  stockItem: {
    alignItems: "center",
  },
  stockLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#45c0e8",
  },
  formCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
    marginLeft: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
  },
  quantityInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
    color: "#1e293b",
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  textArea: {
    height: 100,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: "top",
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#45c0e8",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#45c0e8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: "#94a3b8",
    opacity: 0.7,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default AdjustStock;