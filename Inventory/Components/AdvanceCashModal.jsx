import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const AdvanceCashModal = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [monto, setMonto] = useState("");

  const handleConfirm = () => {
    const montoNumerico = parseFloat(monto) || 0;
    
    if (montoNumerico <= 0) {
      // Mostrar error
      return;
    }

    onConfirm(montoNumerico);
    setMonto("");
  };

  const handleCancel = () => {
    setMonto("");
    onClose();
  };

  const montoConInteres = monto ? Math.ceil(parseFloat(monto) * 1.2) : 0;
  const interes = montoConInteres - (parseFloat(monto) || 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Avance de Efectivo</Text>
            <TouchableOpacity onPress={handleCancel}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <MaterialCommunityIcons name="information" size={20} color="#45c0e8" />
            <Text style={styles.infoText}>
              El avance incluye un 20% de interés
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Monto a entregar (Bs.)</Text>
            <TextInput
              style={styles.input}
              value={monto}
              onChangeText={setMonto}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              autoFocus={true}
            />
          </View>

          {monto && parseFloat(monto) > 0 && (
            <View style={styles.resumenContainer}>
              <Text style={styles.resumenTitle}>Resumen del avance:</Text>
              
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Monto entregado:</Text>
                <Text style={styles.resumenValue}>Bs. {parseFloat(monto).toFixed(2)}</Text>
              </View>
              
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Interés 20%:</Text>
                <Text style={styles.resumenValue}>Bs. {interes}</Text>
              </View>
              
              <View style={[styles.resumenRow, styles.totalRow]}>
                <Text style={styles.resumenLabel}>Total a débito:</Text>
                <Text style={styles.totalValue}>Bs. {montoConInteres}</Text>
              </View>
              
              <View style={styles.notaRow}>
                
              </View>
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.confirmButton,
                (!monto || parseFloat(monto) <= 0) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!monto || parseFloat(monto) <= 0}
            >
              <Text style={styles.confirmButtonText}>Agregar</Text>
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
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#45c0e8',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
  },
  resumenContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resumenTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  resumenLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  resumenValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27ae60',
  },
  notaRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  notaText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
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
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#e67e22',
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

export default AdvanceCashModal;