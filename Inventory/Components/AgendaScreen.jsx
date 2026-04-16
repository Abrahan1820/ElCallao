import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SupaClient } from '../../Supabase/supabase';
import NavBar from '../../NavBar/Components/NavBar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const AgendaScreen = () => {
  const navigation = useNavigation();
  const supa = SupaClient();
  
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [tasaCambio, setTasaCambio] = useState(60);

  // Cargar tasa de cambio desde la tabla tasaBCV
  const loadTasaCambio = async () => {
    try {
      const { data, error } = await supa
        .from('tasaBCV')
        .select('precioVESUSD')
        .eq('id', 1)
        .single();

      if (error) throw error;
      if (data) {
        const tasa = data.precioVESUSD || 60;
        console.log('💰 Tasa de cambio cargada:', tasa);
        setTasaCambio(tasa);
        return tasa;
      }
      return 60;
    } catch (error) {
      console.error('Error cargando tasa:', error);
      return 60;
    }
  };

  // Cargar TODOS los contactos con sus deudas totales
  const loadAllContacts = async () => {
    setLoading(true);
    try {
      // Primero cargar la tasa de cambio actual
      const tasaActual = await loadTasaCambio();
      console.log('📊 Usando tasa para cálculos:', tasaActual);
      
      // Obtener TODOS los contactos
      const { data: contactsData, error: contactsError } = await supa
        .from('contact')
        .select('*')
        .order('nombre', { ascending: true });

      if (contactsError) throw contactsError;

      // Obtener productos fiados NO pagados
      const { data: debtsData, error: debtsError } = await supa
        .from('productMovementWaitList')
        .select(`
          id,
          cantidad,
          cedulaCliente,
          productoID
        `)
        .eq('pagado', false);

      if (debtsError) throw debtsError;

      // Obtener precios actuales de todos los productos involucrados
      const productIds = [...new Set(debtsData.map(d => d.productoID))];
      let productsPriceMap = {};
      
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supa
          .from('product')
          .select('id, nombre, precioVentaVES, precioVentaUSD')
          .in('id', productIds);

        if (productsError) throw productsError;
        
        productsData.forEach(product => {
          productsPriceMap[product.id] = product;
        });
      }

      // Calcular deuda por cliente usando precios ACTUALES y la tasa correcta
      const debtsByClient = {};
      debtsData.forEach(debt => {
        const product = productsPriceMap[debt.productoID];
        if (!product) return;

        const totalVES = debt.cantidad * product.precioVentaVES;
        // Usar la tasa actual para convertir a USD
        const totalUSD = totalVES / tasaActual;
        
        console.log(`💰 Deuda: ${product.nombre} x${debt.cantidad} = Bs. ${totalVES.toFixed(2)} / $${totalUSD.toFixed(2)} (tasa: ${tasaActual})`);
        
        if (!debtsByClient[debt.cedulaCliente]) {
          debtsByClient[debt.cedulaCliente] = {
            totalVES: 0,
            totalUSD: 0,
            cantidadProductos: 0,
            productos: []
          };
        }
        
        debtsByClient[debt.cedulaCliente].totalVES += totalVES;
        debtsByClient[debt.cedulaCliente].totalUSD += totalUSD;
        debtsByClient[debt.cedulaCliente].cantidadProductos += debt.cantidad;
        debtsByClient[debt.cedulaCliente].productos.push({
          waitListId: debt.id,
          productID: debt.productoID,
          nombre: product.nombre,
          cantidad: debt.cantidad,
          precioActualVES: product.precioVentaVES,
          precioActualUSD: product.precioVentaUSD,
          totalVES: totalVES,
          totalUSD: totalUSD
        });
      });

      // Combinar con TODOS los contactos
      const allContacts = contactsData.map(contact => ({
        ...contact,
        deuda: debtsByClient[contact.cedula] || {
          totalVES: 0,
          totalUSD: 0,
          cantidadProductos: 0,
          productos: []
        }
      }));

      setContacts(allContacts);
      setFilteredContacts(allContacts);
    } catch (error) {
      console.error('Error cargando contactos:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `${error.message || 'No se pudieron cargar los contactos'}`,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Navegar a BillingScreen con los productos precargados
  const handlePayDebts = (contact) => {
    if (contact.deuda.productos.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Sin deudas',
        text2: `${contact.nombre} no tiene productos fiados pendientes`,
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    // Preparar los productos para precargar en BillingScreen
    const productsToPreload = contact.deuda.productos.map(producto => ({
      waitListId: producto.waitListId,
      id: producto.productID,
      nombre: producto.nombre,
      cantidad: producto.cantidad,
      precioVentaVES: producto.precioActualVES,
      precioVentaUSD: producto.precioActualUSD,
      isFromAgenda: true,
      cedulaCliente: contact.cedula,
      nombreCliente: contact.nombre
    }));

    // Navegar a BillingScreen con los parámetros
    navigation.navigate('Billing', {
      preloadedProducts: productsToPreload,
      clientInfo: {
        cedula: contact.cedula,
        nombre: contact.nombre,
        telefono: contact.telefono
      },
      isPayingDebt: true
    });
  };

  // Renderizar cada contacto en la lista
  const renderContactItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactCard}
      onPress={() => handlePayDebts(item)}
    >
      <View style={styles.contactAvatar}>
        <LinearGradient
          colors={['#45c0e8', '#3aa5c9']}
          style={styles.avatarGradient}
        >
          <Text style={styles.avatarText}>
            {item.nombre.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
      </View>
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.nombre}</Text>
        <Text style={styles.contactDetail}>
          Cédula: {item.cedula}
        </Text>
        {item.telefono && (
          <Text style={styles.contactDetail}>
            📞 {item.telefono}
          </Text>
        )}
      </View>
      
      <View style={styles.debtInfo}>
        {item.deuda.cantidadProductos > 0 ? (
          <>
            <Text style={styles.debtLabel}>Deuda pendiente:</Text>
            <Text style={styles.debtValueVES}>
              Bs. {item.deuda.totalVES.toFixed(2)}
            </Text>
            <Text style={styles.debtValueUSD}>
              ${item.deuda.totalUSD.toFixed(2)}
            </Text>
            <View style={styles.productCountBadge}>
              <Text style={styles.productCountText}>
                {item.deuda.cantidadProductos} producto{item.deuda.cantidadProductos !== 1 ? 's' : ''}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.noDebtBadge}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#27ae60" />
            <Text style={styles.noDebtText}>Sin deudas</Text>
          </View>
        )}
      </View>
      
      {item.deuda.cantidadProductos > 0 && (
        <MaterialCommunityIcons name="chevron-right" size={24} color="#45c0e8" />
      )}
    </TouchableOpacity>
  );

  // Filtrar contactos por búsqueda
  useEffect(() => {
    if (!contacts || contacts.length === 0) {
      setFilteredContacts([]);
      return;
    }
    
    if (searchText.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const searchLower = searchText.toLowerCase().trim();
      const filtered = contacts.filter(contact => {
        const nombre = contact.nombre || '';
        const cedula = contact.cedula ? String(contact.cedula) : '';
        return nombre.toLowerCase().includes(searchLower) || cedula.includes(searchText);
      });
      setFilteredContacts(filtered);
    }
  }, [searchText, contacts]);

  useFocusEffect(
    useCallback(() => {
      loadAllContacts();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#45c0e8" />
      <NavBar />
      
      <View style={styles.container}>
        <LinearGradient
          colors={['#45c0e8', '#3aa5c9']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Agenda de Clientes</Text>
          <Text style={styles.headerSubtitle}>
            {contacts.length} clientes registrados
          </Text>
        </LinearGradient>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o cédula..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#45c0e8" />
            <Text style={styles.loadingText}>Cargando agenda...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item, index) => item.cedula || index.toString()}
            renderItem={renderContactItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-off" size={60} color="#cbd5e1" />
                <Text style={styles.emptyText}>No hay clientes registrados</Text>
                <Text style={styles.emptySubtext}>
                  Los clientes aparecerán aquí después de registrar un fiado
                </Text>
              </View>
            }
          />
        )}
      </View>

      <Toast />
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    marginRight: 12,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 12,
    color: '#64748b',
  },
  debtInfo: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  debtLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  debtValueVES: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e74c3c',
  },
  debtValueUSD: {
    fontSize: 12,
    color: '#059669',
  },
  productCountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  productCountText: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '600',
  },
  noDebtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noDebtText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AgendaScreen;