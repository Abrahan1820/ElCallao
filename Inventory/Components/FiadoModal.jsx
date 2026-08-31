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
  const [step, setStep] = useState('search');
  const [searchCedula, setSearchCedula] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundClient, setFoundClient] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchContactText, setSearchContactText] = useState('');
  
  const [newClient, setNewClient] = useState({
    cedula: '',
    nombre: '',
    telefono: ''
  });
  
  const supa = SupaClient();

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible, step]);

  useEffect(() => {
    if (searchContactText.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const searchLower = searchContactText.toLowerCase();
      const filtered = contacts.filter(contact => 
        contact.nombre.toLowerCase().includes(searchLower) ||
        contact.cedula.toLowerCase().includes(searchLower)
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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFoundClient(data);
        setStep('confirm');
      } else {
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
      const { data: existing } = await supa
        .from('contact')
        .select('cedula')
        .eq('cedula', newClient.cedula)
        .maybeSingle();

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
        text2: `No se pudo registrar el cliente: ${error.message}`,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setSearching(false);
    }
  };

  const confirmarFiado = async () => {
  // Validar que haya productos
  if (cart.length === 0) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'No hay productos en el carrito',
      position: 'top',
      visibilityTime: 3000,
    });
    return;
  }

  // Validar que haya un cliente seleccionado
  if (!foundClient) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'No hay un cliente seleccionado',
      position: 'top',
      visibilityTime: 3000,
    });
    return;
  }

  // Validar que no haya avances o recargas
  const hasSpecialItems = cart.some(item => item.isAdvance || item.isRecharge);
  if (hasSpecialItems) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'No se pueden fiar avances de efectivo o recargas',
      position: 'top',
      visibilityTime: 3000,
    });
    return;
  }

  setSearching(true);
  
  try {
    let registrados = 0;
    let errores = [];

    // Filtrar solo productos normales (no avances, no recargas, no de agenda)
    const productosParaFiar = cart.filter(item => 
      !item.isAdvance && 
      !item.isRecharge && 
      !item.isFromAgenda
    );

    if (productosParaFiar.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No hay productos válidos para fiar en el carrito',
        position: 'top',
        visibilityTime: 3000,
      });
      setSearching(false);
      return;
    }

    console.log('📝 Productos a fiar:', productosParaFiar.map(i => ({
      nombre: i.nombre,
      originalId: i.originalId,
      id: i.id,
      quantity: i.quantity,
      stockActual: i.stockActual
    })));

    // 🔥 IMPORTANTE: Crear UN SOLO registro por producto, usando la cantidad total
    for (const item of productosParaFiar) {
      try {
        const productId = item.originalId || item.id;
        const cantidad = item.quantity; // Ya incluye la cantidad total
        
        console.log(`  → Insertando ${item.nombre} (ID: ${productId}) x${cantidad} unidades`);

        // Insertar UN SOLO registro en productMovementWaitList
        const { data, error } = await supa
          .from('productMovementWaitList')
          .insert({
            productoID: productId,
            cantidad: cantidad, // Usar la cantidad total
            cedulaCliente: foundClient.cedula,
            pagado: false,
            created_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error(`❌ Error insertando ${item.nombre}:`, error);
          errores.push(`${item.nombre}: ${error.message}`);
          continue;
        }

        console.log(`  ✅ Insertado ${item.nombre} x${cantidad}, ID: ${data?.[0]?.id}`);

        // Actualizar stock del producto (descontar la cantidad total)
        const { error: updateError } = await supa
          .from('product')
          .update({ stockActual: item.stockActual - cantidad })
          .eq('id', productId);

        if (updateError) {
          console.error(`❌ Error actualizando stock de ${item.nombre}:`, updateError);
          errores.push(`${item.nombre}: Error de stock`);
          continue;
        }

        console.log(`  ✅ Stock actualizado para ${item.nombre} (${item.stockActual} - ${cantidad} = ${item.stockActual - cantidad})`);
        registrados++;

      } catch (itemError) {
        console.error(`❌ Error procesando ${item.nombre}:`, itemError);
        errores.push(`${item.nombre}: ${itemError.message}`);
      }
    }

    console.log(`📊 Resumen: ${registrados} registrados, ${errores.length} errores`);

    if (registrados === 0 && errores.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `fiado: ${errores[0]}`,
        position: 'top',
        visibilityTime: 5000,
      });
      setSearching(false);
      return;
    }

    if (errores.length > 0) {
      Toast.show({
        type: 'warning',
        text1: 'Parcialmente exitoso',
        text2: `${registrados} producto(s) registrados, ${errores.length} fallaron`,
        position: 'top',
        visibilityTime: 5000,
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: `Venta fiada registrada para ${foundClient.nombre} (${registrados} producto${registrados > 1 ? 's' : ''})`,
        position: 'top',
        visibilityTime: 4000,
      });
    }

    // Si al menos un producto se registró, llamar al onConfirm
    if (registrados > 0) {
      // 🔥 Pasar el cliente para que BillingScreen limpie el carrito
      onConfirm(foundClient);
      resetModal();
    }

  } catch (error) {
    console.error('❌ Error general en confirmarFiado:', error);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: `Error al registrar fiado: ${error.message || 'Error desconocido'}`,
      position: 'top',
      visibilityTime: 5000,
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

  // Calcular total de la orden (solo productos normales)
  const ordenTotal = cart.reduce((sum, item) => {
    if (item.isAdvance || item.isRecharge || item.isFromAgenda) return sum;
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

          {step === 'search' && (
            <View style={styles.stepContainer}>
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

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.contactsSection}>
                <Text style={styles.sectionTitle}>Seleccionar de la lista</Text>
                
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
                    if (item.isAdvance || item.isRecharge || item.isFromAgenda) return null;
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '95%',
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    padding: 16,
    maxHeight: '100%',
  },
  searchSection: {
    marginBottom: 16,
  },
  contactsSection: {
    flex: 1,
    minHeight: 250,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10,
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
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: '#45c0e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
  },
  registerButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
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
    fontSize: 15,
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
    marginVertical: 16,
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
    maxHeight: 350,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
    fontSize: 15,
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
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 15,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#27ae60',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  clientInfo: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#45c0e8',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  orderSummary: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  orderItemName: {
    fontSize: 13,
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
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#cbd5e1',
  },
  orderTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27ae60',
  },
});

export default FiadoModal;