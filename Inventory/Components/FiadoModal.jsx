import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SupaClient } from '../../Supabase/supabase';
import Toast from 'react-native-toast-message';

const FiadoModal = ({ visible, onClose, onConfirm, cart, userData, empresaId }) => {
  const [step, setStep] = useState('search'); // search, register, confirm, list
  const [searchCedula, setSearchCedula] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundClient, setFoundClient] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchContactText, setSearchContactText] = useState('');
  
  // Para registrar nuevo cliente
  const [newClient, setNewClient] = useState({
    cedula: '',
    nombre: '',
    telefono: ''
  });
  
  const supa = SupaClient();

  // Cargar contactos cuando se abre el modal
  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible, step]);

  // Filtrar contactos cuando cambia el texto de búsqueda
  useEffect(() => {
    if (searchContactText.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const searchLower = searchContactText.toLowerCase();
      const filtered = contacts.filter(contact => 
        contact.nombre.toLowerCase().includes(searchLower)
      );
      setFilteredContacts(filtered);
    }
  }, [searchContactText, contacts]);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const { data, error } = await supa
        .from('contact')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error cargando contactos:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los contactos',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  const buscarClientePorCedula = async () => {
    if (!searchCedula.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingrese una cédula',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supa
        .from('contact')
        .select('*')
        .eq('cedula', searchCedula)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFoundClient(data);
        setStep('confirm');
      } else {
        // Cliente no encontrado, pasar a registro
        setNewClient({ ...newClient, cedula: searchCedula });
        setStep('register');
      }
    } catch (error) {
      console.error('Error buscando cliente:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo buscar el cliente',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setSearching(false);
    }
  };

  const seleccionarClienteDeLista = (cliente) => {
    setFoundClient(cliente);
    setStep('confirm');
  };

  const registrarCliente = async () => {
    if (!newClient.cedula.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La cédula es obligatoria',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    if (!newClient.nombre.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'El nombre es obligatorio',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setSearching(true);
    try {
      // Verificar si ya existe
      const { data: existing } = await supa
        .from('contact')
        .select('cedula')
        .eq('cedula', newClient.cedula)
        .single();

      if (existing) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Ya existe un cliente con esa cédula',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }

      // Insertar nuevo cliente
      const { data, error } = await supa
        .from('contact')
        .insert({
          cedula: newClient.cedula,
          nombre: newClient.nombre,
          telefono: newClient.telefono || null,
        })
        .select()
        .single();

      if (error) throw error;

      setFoundClient(data);
      setStep('confirm');
      
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'Cliente registrado correctamente',
        position: 'top',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error('Error registrando cliente:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo registrar el cliente',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setSearching(false);
    }
  };

  const confirmarFiado = async () => {
    setSearching(true);
    try {
      // Verificar que no haya avances o recargas
      const hasSpecialItems = cart.some(item => item.isAdvance || item.isRecharge);
      if (hasSpecialItems) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se pueden fiar avances de efectivo o recargas',
          position: 'top',
          visibilityTime: 3000,
        });
        setSearching(false);
        return;
      }

      // Insertar cada producto en productMovementWaitList
      for (const item of cart) {
        const { error } = await supa
          .from('productMovementWaitList')
          .insert({
            productoID: item.id,
            cantidad: item.quantity,
            cedulaCliente: foundClient.cedula,
          });

        if (error) throw error;

        // Actualizar stock del producto
        const { error: updateError } = await supa
          .from('product')
          .update({ stockActual: item.stockActual - item.quantity })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: `Venta fiada registrada para ${foundClient.nombre}`,
        position: 'top',
        visibilityTime: 4000,
      });

      onConfirm(foundClient);
      resetModal();
    } catch (error) {
      console.error('Error registrando venta fiada:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo registrar la venta fiada',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setSearching(false);
    }
  };

  const resetModal = () => {
    setStep('search');
    setSearchCedula('');
    setSearchContactText('');
    setFoundClient(null);
    setNewClient({ cedula: '', nombre: '', telefono: '' });
    setContacts([]);
    setFilteredContacts([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderContactItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => seleccionarClienteDeLista(item)}
    >
      <View style={styles.contactAvatar}>
        <MaterialCommunityIcons name="account-circle" size={40} color="#45c0e8" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.nombre}</Text>
        <Text style={styles.contactDetail}>Cédula: {item.cedula}</Text>
        {item.telefono && (
          <Text style={styles.contactDetail}>Teléfono: {item.telefono}</Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
    </TouchableOpacity>
  );

  // Calcular total de la orden
  const ordenTotal = cart.reduce((sum, item) => {
    if (item.isAdvance || item.isRecharge) return sum;
    return sum + (item.precioVentaVES * item.quantity);
  }, 0);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons name="account-clock" size={28} color="#45c0e8" />
            <Text style={styles.modalTitle}>Venta a Crédito (Fiado)</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Pantalla de búsqueda/lista de contactos */}
          {step === 'search' && (
            <View style={styles.stepContainer}>
              {/* Búsqueda por cédula */}
              <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>Buscar por cédula</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="card-account-details" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="Número de cédula"
                    value={searchCedula}
                    onChangeText={setSearchCedula}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={buscarClientePorCedula}
                  disabled={searching}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="magnify" size={20} color="white" />
                      <Text style={styles.buttonText}>Buscar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Separador */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Lista de contactos existentes */}
              <View style={styles.contactsSection}>
                <Text style={styles.sectionTitle}>Seleccionar de la lista</Text>
                
                {/* Búsqueda en la lista */}
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="account-search" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="Buscar por nombre o cédula"
                    value={searchContactText}
                    onChangeText={setSearchContactText}
                  />
                </View>

                {loadingContacts ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#45c0e8" />
                    <Text style={styles.loadingText}>Cargando contactos...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item.cedula}
                    renderItem={renderContactItem}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="account-off" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No hay contactos registrados</Text>
                        <Text style={styles.emptySubtext}>
                          Puede registrar uno nuevo usando la búsqueda por cédula
                        </Text>
                      </View>
                    }
                    showsVerticalScrollIndicator={false}
                    style={styles.contactsList}
                  />
                )}
              </View>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pantalla de registro de nuevo cliente */}
          {step === 'register' && (
            <ScrollView style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                Registrar nuevo cliente
              </Text>
              <Text style={styles.stepSubtitle}>
                No se encontró un cliente con la cédula {newClient.cedula}
              </Text>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="card-account-details" size={20} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Cédula *"
                  value={newClient.cedula}
                  onChangeText={(text) => setNewClient({ ...newClient, cedula: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account" size={20} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo *"
                  value={newClient.nombre}
                  onChangeText={(text) => setNewClient({ ...newClient, nombre: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="phone" size={20} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono (opcional)"
                  value={newClient.telefono}
                  onChangeText={(text) => setNewClient({ ...newClient, telefono: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity 
                style={styles.registerButton}
                onPress={registrarCliente}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="account-plus" size={20} color="white" />
                    <Text style={styles.buttonText}>Registrar Cliente</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  setStep('search');
                  setNewClient({ cedula: '', nombre: '', telefono: '' });
                }}
              >
                <Text style={styles.backButtonText}>Volver a la lista</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Pantalla de confirmación */}
          {step === 'confirm' && (
  <ScrollView 
    style={styles.stepContainer}
    showsVerticalScrollIndicator={true}
    contentContainerStyle={{ paddingBottom: 20 }}
  >
    <MaterialCommunityIcons name="account-check" size={48} color="#27ae60" style={styles.confirmIcon} />
    <Text style={styles.confirmTitle}>Cliente seleccionado</Text>
    
    <View style={styles.clientInfo}>
      <Text style={styles.clientName}>{foundClient?.nombre}</Text>
      <Text style={styles.clientDetail}>Cédula: {foundClient?.cedula}</Text>
      {foundClient?.telefono && (
        <Text style={styles.clientDetail}>Teléfono: {foundClient?.telefono}</Text>
      )}
    </View>

    <View style={styles.orderSummary}>
      <Text style={styles.summaryTitle}>Resumen de la orden:</Text>
      <ScrollView 
        style={{ maxHeight: 200 }}
        showsVerticalScrollIndicator={true}
      >
        {cart.map((item, index) => {
          if (item.isAdvance || item.isRecharge) return null;
          return (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.orderItemName}>
                {item.nombre} x{item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>
                Bs. {(item.precioVentaVES * item.quantity).toFixed(2)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.orderTotal}>
        <Text style={styles.orderTotalLabel}>Total a pagar:</Text>
        <Text style={styles.orderTotalValue}>
          Bs. {ordenTotal.toFixed(2)}
        </Text>
      </View>
    </View>

    <TouchableOpacity 
      style={styles.confirmButton}
      onPress={confirmarFiado}
      disabled={searching}
    >
      {searching ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          <MaterialCommunityIcons name="check-circle" size={20} color="white" />
          <Text style={styles.buttonText}>Confirmar Fiado</Text>
        </>
      )}
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.cancelButton}
      onPress={() => setStep('search')}
    >
      <Text style={styles.cancelButtonText}>Volver a seleccionar cliente</Text>
    </TouchableOpacity>
  </ScrollView>
)}
        </View>
      </View>
    </Modal>
  );
};



const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start', // Cambiado de 'center' a 'flex-start'
    alignItems: 'center',
    paddingTop: 40, // Agregar padding superior
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '95%', // Aumentado de 90% a 95%
    height: '85%', // Aumentado de 85% a 90%
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // Reducido de 20 a 16
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  stepContainer: {
    padding: 16, // Reducido de 20 a 16
    maxHeight: '100%',
  },
  searchSection: {
    marginBottom: 16, // Reducido de 20 a 16
  },
  contactsSection: {
    flex: 1,
    minHeight: 250, // Aumentado de 200 a 250
    maxHeight: 400, // Agregado maxHeight
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10, // Reducido de 12 a 10
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16, // Reducido de 20 a 16
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10, // Reducido de 12 a 10
    marginBottom: 12, // Reducido de 16 a 12
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    paddingVertical: 10, // Reducido de 12 a 10
    paddingHorizontal: 8,
    fontSize: 15, // Reducido de 16 a 15
  },
  searchButton: {
    backgroundColor: '#45c0e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12, // Reducido de 14 a 12
    borderRadius: 10, // Reducido de 12 a 10
    marginTop: 6, // Reducido de 8 a 6
    gap: 8,
  },
  registerButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12, // Reducido de 14 a 12
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  backButton: {
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 15, // Reducido de 16 a 15
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#45c0e8',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16, // Reducido de 20 a 16
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 12,
  },
  contactsList: {
    maxHeight: 350, // Ajustado para que quepa mejor
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Reducido de 12 a 10
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  contactAvatar: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15, // Reducido de 16 a 15
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 12,
    color: '#64748b',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30, // Reducido de 40 a 30
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30, // Reducido de 40 a 30
  },
  emptyText: {
    fontSize: 15, // Reducido de 16 a 15
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 4,
  },
  confirmIcon: {
    textAlign: 'center',
  },
  confirmTitle: {
    fontSize: 18, // Reducido de 20 a 18
    fontWeight: '700',
    color: '#27ae60',
    textAlign: 'center',
    marginTop: 8, // Reducido de 12 a 8
    marginBottom: 12, // Reducido de 16 a 12
  },
  clientInfo: {
    backgroundColor: '#f0f9ff',
    padding: 12, // Reducido de 16 a 12
    borderRadius: 10, // Reducido de 12 a 10
    marginBottom: 16, // Reducido de 20 a 16
    borderWidth: 1,
    borderColor: '#45c0e8',
  },
  clientName: {
    fontSize: 16, // Reducido de 18 a 16
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 13, // Reducido de 14 a 13
    color: '#64748b',
    marginTop: 2,
  },
  orderSummary: {
    backgroundColor: '#f8fafc',
    padding: 12, // Reducido de 16 a 12
    borderRadius: 10,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15, // Reducido de 16 a 15
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10, // Reducido de 12 a 10
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6, // Reducido de 8 a 6
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  orderItemName: {
    fontSize: 13, // Reducido de 14 a 13
    color: '#1e293b',
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#45c0e8',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10, // Reducido de 12 a 10
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#cbd5e1',
  },
  orderTotalLabel: {
    fontSize: 15, // Reducido de 16 a 15
    fontWeight: '700',
    color: '#1e293b',
  },
  orderTotalValue: {
    fontSize: 16, // Reducido de 18 a 16
    fontWeight: '700',
    color: '#27ae60',
  },
});

export default FiadoModal;