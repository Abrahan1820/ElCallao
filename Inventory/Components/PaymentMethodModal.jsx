import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PaymentMethodModal = ({
  visible,
  onClose,
  subtotalUSD,
  subtotalVES,
  paymentMethod,
  setPaymentMethod,
  pagoMovilRef,
  setPagoMovilRef,
  mixedPayment,
  setMixedPayment,
  tasaCambio,
  soloDebitoPagoMovil, // Prop para filtrar opciones
}) => {
  
  const handleSelectMethod = (method) => {
    setPaymentMethod(method);
    if (method !== "mixto") {
      setMixedPayment({ usd: "", ves: "", vesEfectivo: "" });
    }
    if (method !== "pagoMovil") {
      setPagoMovilRef("");
    }
  };

  const handleConfirm = () => {
    if (!paymentMethod) {
      return;
    }
    onClose();
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "debito": return "credit-card";
      case "pagoMovil": return "cellphone";
      case "efectivoUSD": return "cash-usd";
      case "efectivoVES": return "cash";
      case "mixto": return "swap-horizontal";
      default: return "cash";
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "debito": return "#3498db";
      case "pagoMovil": return "#9b59b6";
      case "efectivoUSD": return "#f39c12";
      case "efectivoVES": return "#27ae60";
      case "mixto": return "#e67e22";
      default: return "#64748b";
    }
  };

  // Definir opciones según el contexto
  const opcionesPago = soloDebitoPagoMovil 
    ? [
        { value: "debito", label: "Débito", icon: "credit-card", color: "#3498db", subtitle: "Pago con tarjeta de débito (Bs.)" },
        { value: "pagoMovil", label: "Pago Móvil", icon: "cellphone", color: "#9b59b6", subtitle: "Pago por transferencia (Bs.)" }
      ]
    : [
        { value: "debito", label: "Débito", icon: "credit-card", color: "#3498db", subtitle: "Pago con tarjeta de débito (Bs.)" },
        { value: "pagoMovil", label: "Pago Móvil", icon: "cellphone", color: "#9b59b6", subtitle: "Pago por transferencia (Bs.)" },
        { value: "efectivoUSD", label: "Efectivo USD", icon: "cash-usd", color: "#f39c12", subtitle: "Pago en efectivo en dólares" },
        { value: "efectivoVES", label: "Efectivo VES", icon: "cash", color: "#27ae60", subtitle: "Pago en efectivo en bolívares" },
        { value: "mixto", label: "Mixto", icon: "swap-horizontal", color: "#e67e22", subtitle: "Combinación de USD y VES" }
      ];

  // Validar si el pago mixto es correcto
  const isMixedPaymentValid = () => {
    const usd = parseFloat(mixedPayment.usd) || 0;
    const ves = parseFloat(mixedPayment.ves) || 0;
    const vesEfectivo = parseFloat(mixedPayment.vesEfectivo) || 0;
    
    const totalUSD = usd + (ves / tasaCambio) + (vesEfectivo / tasaCambio);
    return Math.abs(totalUSD - subtotalUSD) <= 0.01;
  };

  // Validar referencia de pago móvil
  const isPagoMovilValid = () => {
    return pagoMovilRef && pagoMovilRef.length === 4 && /^\d+$/.test(pagoMovilRef);
  };

  // Calcular faltante para pago mixto
  const calcularFaltante = () => {
    const usd = parseFloat(mixedPayment.usd) || 0;
    const ves = parseFloat(mixedPayment.ves) || 0;
    const vesEfectivo = parseFloat(mixedPayment.vesEfectivo) || 0;
    
    const totalPagadoUSD = usd + (ves / tasaCambio) + (vesEfectivo / tasaCambio);
    const diferenciaUSD = subtotalUSD - totalPagadoUSD;
    
    if (Math.abs(diferenciaUSD) <= 0.01) return null;
    
    if (usd > 0 && ves === 0 && vesEfectivo === 0) {
      const vesFaltante = diferenciaUSD * tasaCambio;
      return {
        mensaje: `Faltan Bs. ${vesFaltante.toFixed(2)} en VES`,
        monto: vesFaltante,
        moneda: 'VES'
      };
    } else if ((ves > 0 || vesEfectivo > 0) && usd === 0) {
      return {
        mensaje: `Faltan $${diferenciaUSD.toFixed(2)} en USD`,
        monto: diferenciaUSD,
        moneda: 'USD'
      };
    } else {
      if (diferenciaUSD > 0) {
        return {
          mensaje: `Faltan $${diferenciaUSD.toFixed(2)} en USD o Bs. ${(diferenciaUSD * tasaCambio).toFixed(2)} en VES`,
          monto: diferenciaUSD,
          moneda: 'CUALQUIERA'
        };
      } else {
        return {
          mensaje: `Sobran $${Math.abs(diferenciaUSD).toFixed(2)}`,
          monto: Math.abs(diferenciaUSD),
          moneda: 'SOBRA'
        };
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Método de Pago</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.totalContainer}>
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total USD</Text>
                <Text style={styles.totalValueUSD}>${subtotalUSD.toFixed(2)}</Text>
              </View>
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total VES</Text>
                <Text style={styles.totalValueVES}>Bs. {subtotalVES.toFixed(2)}</Text>
              </View>
            </View>

            {/* Opciones de pago - AHORA USANDO opcionesPago */}
            <View style={styles.optionsContainer}>
              {opcionesPago.map((opcion) => (
                <TouchableOpacity
                  key={opcion.value}
                  style={[
                    styles.paymentOption,
                    paymentMethod === opcion.value && styles.paymentOptionActive,
                  ]}
                  onPress={() => handleSelectMethod(opcion.value)}
                >
                  <View style={[styles.optionIcon, { backgroundColor: opcion.color + '20' }]}>
                    <MaterialCommunityIcons 
                      name={opcion.icon} 
                      size={24} 
                      color={opcion.color} 
                    />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{opcion.label}</Text>
                    <Text style={styles.optionSubtitle}>{opcion.subtitle}</Text>
                  </View>
                  {paymentMethod === opcion.value && (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#27ae60" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Campo para referencia de pago móvil */}
            {paymentMethod === "pagoMovil" && (
              <View style={styles.pagoMovilContainer}>
                <Text style={styles.pagoMovilTitle}>Referencia de Pago Móvil</Text>
                <Text style={styles.pagoMovilSubtitle}>Ingrese los últimos 4 dígitos:</Text>
                
                <TextInput
                  style={styles.pagoMovilInput}
                  value={pagoMovilRef}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9]/g, "");
                    if (numeric.length <= 4) {
                      setPagoMovilRef(numeric);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="1234"
                  placeholderTextColor="#94a3b8"
                  maxLength={4}
                />
                
                {pagoMovilRef.length === 4 && (
                  <Text style={styles.pagoMovilSuccess}>
                    ✓ Referencia válida
                  </Text>
                )}
                
                {pagoMovilRef.length > 0 && pagoMovilRef.length < 4 && (
                  <Text style={styles.pagoMovilWarning}>
                    ⚠ Deben ser 4 dígitos
                  </Text>
                )}
              </View>
            )}

            {/* Campos para pago mixto - solo mostrar si está disponible */}
            {paymentMethod === "mixto" && !soloDebitoPagoMovil && (
              <View style={styles.mixedContainer}>
                <Text style={styles.mixedTitle}>Distribuir pago:</Text>
                
                <View style={styles.mixedRow}>
                  <Text style={styles.mixedLabel}>USD:</Text>
                  <TextInput
                    style={styles.mixedInput}
                    value={mixedPayment.usd}
                    onChangeText={(text) => setMixedPayment({ ...mixedPayment, usd: text })}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.mixedRow}>
                  <Text style={styles.mixedLabel}>VES (Débito):</Text>
                  <TextInput
                    style={styles.mixedInput}
                    value={mixedPayment.ves}
                    onChangeText={(text) => setMixedPayment({ ...mixedPayment, ves: text })}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.mixedRow}>
                  <Text style={styles.mixedLabel}>VES (Efectivo):</Text>
                  <TextInput
                    style={styles.mixedInput}
                    value={mixedPayment.vesEfectivo}
                    onChangeText={(text) => setMixedPayment({ ...mixedPayment, vesEfectivo: text })}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <Text style={styles.mixedHint}>
                  * Total USD: ${subtotalUSD.toFixed(2)} (tasa: 1 USD = {tasaCambio} VES)
                </Text>
                
                {(() => {
                  const faltante = calcularFaltante();
                  if (!faltante) {
                    return (
                      <Text style={styles.mixedSuccess}>
                        ✓ Pago completo
                      </Text>
                    );
                  }
                  
                  if (faltante.moneda === 'SOBRA') {
                    return (
                      <Text style={styles.mixedWarning}>
                        ⚠ Sobran ${faltante.monto.toFixed(2)} USD
                      </Text>
                    );
                  }
                  
                  return (
                    <Text style={styles.mixedInfo}>
                      💡 {faltante.mensaje}
                    </Text>
                  );
                })()}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                (!paymentMethod || 
                 (paymentMethod === "mixto" && !isMixedPaymentValid()) ||
                 (paymentMethod === "pagoMovil" && !isPagoMovilValid())) && 
                styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!paymentMethod || 
                       (paymentMethod === "mixto" && !isMixedPaymentValid()) ||
                       (paymentMethod === "pagoMovil" && !isPagoMovilValid())}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 450,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalBox: {
    alignItems: 'center',
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  totalValueUSD: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  totalValueVES: {
    fontSize: 18,
    fontWeight: '700',
    color: '#45c0e8',
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 15,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    gap: 12,
  },
  paymentOptionActive: {
    borderColor: '#45c0e8',
    backgroundColor: '#f0f9ff',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  pagoMovilContainer: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pagoMovilTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  pagoMovilSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  pagoMovilInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: 'white',
    textAlign: 'center',
    letterSpacing: 2,
  },
  pagoMovilSuccess: {
    fontSize: 13,
    color: '#27ae60',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#e3f7e3',
    borderRadius: 8,
  },
  pagoMovilWarning: {
    fontSize: 13,
    color: '#e74c3c',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#fde8e8',
    borderRadius: 8,
  },
  mixedContainer: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mixedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  mixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mixedLabel: {
    width: 100,
    fontSize: 14,
    color: '#64748b',
  },
  mixedInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: 'white',
  },
  mixedHint: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 8,
  },
  mixedSuccess: {
    fontSize: 13,
    color: '#27ae60',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#e3f7e3',
    borderRadius: 8,
  },
  mixedWarning: {
    fontSize: 13,
    color: '#e74c3c',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#fde8e8',
    borderRadius: 8,
  },
  mixedInfo: {
    fontSize: 13,
    color: '#45c0e8',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#45c0e8',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentMethodModal;