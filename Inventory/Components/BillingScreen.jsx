import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import ProductSelectionModal from "./ProductSelectionModal";
import PaymentMethodModal from "./PaymentMethodModal";
import AdvanceCashModal from "./AdvanceCashModal";
import RechargeModal from "./RechargeModal"; // Nuevo modal para recargas
import FiadoModal from "./FiadoModal";
import Toast from "react-native-toast-message";

const BillingScreen = ({ navigation, route }) => {
  
  const supa = SupaClient();

  // Estados
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoriasMap, setCategoriasMap] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false); // Nuevo modal
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [empresaId, setEmpresaId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [tempQuantity, setTempQuantity] = useState("1");
  const [selectedCategoria, setSelectedCategoria] = useState("todas");
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  const [fiadoModalVisible, setFiadoModalVisible] = useState(false);
  const [isPayingDebt, setIsPayingDebt] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [hasPreloaded, setHasPreloaded] = useState(false);
  
  // Estados para método de pago
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [pagoMovilRef, setPagoMovilRef] = useState("");
  const [mixedPayment, setMixedPayment] = useState({
    usd: "",
    ves: "",
    vesEfectivo: "",
  });
  
  // Resumen de factura
  const [subtotalUSD, setSubtotalUSD] = useState(0);
  const [subtotalVES, setSubtotalVES] = useState(0);
  const [TASA_CAMBIO, setTASA_CAMBIO] = useState(60);

  

  // Cargar tasa del BCV
  const loadTasaBCV = async () => {
    try {
      const { data, error } = await supa
        .from("tasaBCV")
        .select("precioVESUSD")
        .eq("id", 1)
        .single();

      if (error) throw error;
      
      if (data) {
        const tasa = data["precioVESUSD"];
        setTASA_CAMBIO(tasa || 60);
      }
    } catch (error) {
      console.error("Error cargando tasa BCV:", error);
    }
  };

  // -----------------------------
  // 👤 Obtener usuario desde AsyncStorage
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
  // 📦 Obtener empresaID a partir del usuario
  // -----------------------------
  const getEmpresaIdFromUser = async (user) => {
    if (!user || !user.empresaID) return null;
    return user.empresaID;
  };

  // -----------------------------
  // 📦 Cargar categorías
  // -----------------------------

 


  const loadCategorias = async () => {
    try {
      const { data, error } = await supa
        .from("productCategory")
        .select("id, nombre")
        .eq("esActivo", true)
        .order("nombre");

      if (error) throw error;

      const map = {};
      const lista = [{ id: "todas", nombre: "Todas las categorías" }];
      
      data.forEach((cat) => {
        map[cat.id] = cat.nombre;
        lista.push({ id: cat.id, nombre: cat.nombre });
      });
      
      setCategoriasMap(map);
      setCategorias(lista);
    } catch (error) {
      console.error("❌ Error cargando categorías:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar las categorías",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  // -----------------------------
  // 📥 Cargar productos activos de la empresa
  // -----------------------------
  const fetchProducts = async (empId) => {
    if (!empId) return [];
    
    try {
      let query = supa
        .from("product")
        .select("*")
        .eq("empresaID", empId)
        .eq("esActivo", true)
        .neq("id", 48) // Excluir avance de efectivo
        .neq("id", 49); // Excluir recargas
      
      if (selectedCategoria !== "todas") {
        query = query.eq("categoriaID", selectedCategoria);
      }
      
      const { data, error } = await query.order("nombre", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudieron cargar los productos",
        position: "top",
        visibilityTime: 3000,
      });
      return [];
    }
  };

  // -----------------------------
  // 🔄 Cargar todos los datos
  // -----------------------------
  const loadAllData = async () => {
    setLoading(true);
    try {
      const user = await getUserFromStorage();
      if (!user) {
        Toast.show({
          type: "error",
          text1: "Sesión expirada",
          text2: "Por favor inicie sesión nuevamente",
          position: "top",
          visibilityTime: 3000,
        });
        navigation.navigate("Log_in");
        return;
      }

      const empId = await getEmpresaIdFromUser(user);
      if (!empId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudo determinar la empresa del usuario",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }
      
      setEmpresaId(user.empresaID);
      await loadCategorias();
      await loadTasaBCV();
      const productsData = await fetchProducts(user.empresaID);
      
      const availableProducts = productsData.filter(p => p.stockActual > 0);
      setProducts(availableProducts);
      setFilteredProducts(availableProducts);
      
    } catch (error) {
      console.error("Error cargando datos:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Ocurrió un problema al cargar los datos",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Recargar productos cuando cambia el filtro de categoría
  useEffect(() => {
    if (empresaId) {
      const reloadProducts = async () => {
        const productsData = await fetchProducts(empresaId);
        const availableProducts = productsData.filter(p => p.stockActual > 0);
        setProducts(availableProducts);
        setFilteredProducts(availableProducts);
      };
      reloadProducts();
    }
  }, [selectedCategoria]);

  // -----------------------------
  // 🔄 Cargar al iniciar
  // -----------------------------

  const handleFiadoConfirm = (cliente) => {
  setCart([]); // Limpiar carrito
  setFiadoModalVisible(false);
  setPaymentMethod(null);
  setPagoMovilRef("");
  setMixedPayment({ usd: "", ves: "", vesEfectivo: "" });
  
  // Recargar datos para actualizar stock
  loadAllData();
};


  const actualizarTasaBCV = async () => {
  try {
    const response = await fetch(
      "https://ve.dolarapi.com/v1/dolares/oficial"
    );

    const data = await response.json();

    const tasa = data?.promedio;

    if (!tasa) {
      console.log("⚠️ No se pudo obtener la tasa BCV");
      return;
    }

    console.log("📊 Nueva tasa BCV:", tasa);

    const { error } = await supa
      .from("tasaBCV")
      .update({
        precioVESUSD: tasa,
        fecha: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      console.log("❌ Error actualizando tasa:", error);
    }
  } catch (err) {
    console.log("❌ Error consultando API:", err);
  }
};

useEffect(() => {
  const init = async () => {
    await actualizarTasaBCV();
    await loadAllData();
  };

  init();
}, []);
  

  useFocusEffect(
    useCallback(() => {
      loadAllData();
      setCart([]);
      setPaymentMethod(null);
      setPagoMovilRef("");
      setMixedPayment({ usd: "", ves: "", vesEfectivo: "" });
    }, [])
  );


// PRECARGA DE PRODUCTOS - obtener precios actuales
useEffect(() => {
  const params = route?.params;
  console.log('🔍 useEffect precarga - params:', params);
  
  if (params?.preloadedProducts && params?.isPayingDebt && !hasPreloaded) {
    console.log('✅ PRECARGANDO productos desde agenda');
    
    const loadProductsWithCurrentPrices = async () => {
      try {
        const productsToAdd = [];
        
        for (const product of params.preloadedProducts) {
          // Obtener precio ACTUAL del producto
          const { data: currentProduct, error } = await supa
            .from("product")
            .select("precioVentaUSD, precioVentaVES, precioCompraUSD, precioCompraVES, stockActual, nombre")
            .eq("id", product.id)
            .single();
          
          if (error) {
            console.error('Error obteniendo producto:', error);
            continue;
          }
          
          productsToAdd.push({
            id: product.id,
            nombre: currentProduct.nombre,
            cantidad: product.cantidad,
            quantity: product.cantidad,
            precioVentaVES: currentProduct.precioVentaVES,
            precioVentaUSD: currentProduct.precioVentaUSD,
            precioCompraUSD: currentProduct.precioCompraUSD || 0,
            precioCompraVES: currentProduct.precioCompraVES || 0,
            isFromAgenda: true,
            waitListId: product.waitListId,
            stockActual: currentProduct.stockActual, // Stock actual real
          });
        }
        
        console.log('🛒 Productos a agregar con precios actuales:', productsToAdd);
        setCart(productsToAdd);
        setIsPayingDebt(true);
        setCurrentClient(params.clientInfo);
        setHasPreloaded(true);
        
        Toast.show({
          type: 'info',
          text1: 'Cobro de deuda',
          text2: `Procesando pago de ${params.clientInfo.nombre} - ${productsToAdd.length} producto(s)`,
          position: 'top',
          visibilityTime: 4000,
        });
      } catch (error) {
        console.error('Error cargando precios actuales:', error);
      }
    };
    
    loadProductsWithCurrentPrices();
  }
}, [route?.params, hasPreloaded]);

// -----------------------------
// 🧮 Calcular totales - VERSIÓN CORREGIDA
// -----------------------------
useEffect(() => {
  let totalVES = 0;
  
  cart.forEach(item => {
    if (item.isAdvance) {
      totalVES += item.precioVentaVES || 0;
    } 
    else if (item.isRecharge) {
      totalVES += item.rechargeDetails?.totalConRecargo || 0;
    } 
    else {
      totalVES += (item.precioVentaVES || 0) * (item.quantity || 1);
    }
  });

  const totalUSD = TASA_CAMBIO > 0 ? totalVES / TASA_CAMBIO : 0;

  console.log('💰 SUBTOTALES CALCULADOS:', {
    totalVES,
    totalUSD,
    tasa: TASA_CAMBIO,
    items: cart.map(i => ({
      nombre: i.nombre,
      montoVES: i.isRecharge ? i.rechargeDetails?.totalConRecargo : (i.precioVentaVES * (i.quantity || 1)),
      isAdvance: i.isAdvance,
      isRecharge: i.isRecharge
    }))
  });
  
  setSubtotalVES(totalVES);
  setSubtotalUSD(totalUSD);
}, [cart, TASA_CAMBIO]);
  // -----------------------------
  // 🔍 Búsqueda de productos
  // -----------------------------
  const handleSearch = (text) => {
    setSearchText(text);
    
    if (text.trim() === "") {
      setFilteredProducts(products);
      return;
    }

    const searchLower = text.toLowerCase();
    const filtered = products.filter(product => {
      const categoriaNombre = categoriasMap[product.categoriaID] || "";
      
      return (
        product.nombre.toLowerCase().includes(searchLower) ||
        (product.descripcion && product.descripcion.toLowerCase().includes(searchLower)) ||
        categoriaNombre.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredProducts(filtered);
  };

  // -----------------------------
  // 🛒 Agregar producto normal al carrito
  // -----------------------------
  const addToCart = (product, quantity) => {
    if (quantity > product.stockActual) {
      Toast.show({
        type: "error",
        text1: "Stock insuficiente",
        text2: `Solo hay ${product.stockActual} unidades disponibles`,
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stockActual) {
        Toast.show({
          type: "error",
          text1: "Stock insuficiente",
          text2: `Solo hay ${product.stockActual} unidades disponibles`,
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }
      
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
    
    setQuantityModalVisible(false);
    setTempQuantity("1");
  };

  // 💰 Agregar avance de efectivo al carrito
const addAdvanceCash = (monto) => {
  const montoConInteres = Math.ceil(monto * 1.2);
  const interes = montoConInteres - monto;
  
  // Calcular valores en USD
  const precioCompraUSD = monto / TASA_CAMBIO;           // Lo que entregamos en efectivo (costo en USD)
  const precioVendidoUSD = montoConInteres / TASA_CAMBIO; // Lo que cobramos por débito (venta en USD)
  
  const advanceProduct = {
    id: 'advance-cash',
    nombre: '💰 AVANCE DE EFECTIVO',
    descripcion: `Avance de efectivo - Monto entregado: Bs. ${monto}.`,
    
    // Precios para cálculo de ganancia en USD
    precioCompraUSD: precioCompraUSD,    // Costo en USD (lo que entregamos)
    precioVendidoUSD: precioVendidoUSD,  // Precio de venta en USD (lo que cobramos)
    
    // Mantener los campos existentes como estaban
    precioVentaUSD: 0,
    precioVentaVES: montoConInteres,
    precioVentaVESEfectivo: -monto,
    
    cantidad: 1,
    isAdvance: true,
    advanceDetails: {
      montoEntregado: monto,
      interes: interes,
      totalConInteres: montoConInteres,
      precioCompraUSD: precioCompraUSD,
      precioVendidoUSD: precioVendidoUSD
    }
  };

  console.log('💰 Agregando avance al carrito:', advanceProduct);
  console.log('📊 Cálculos avance:', {
    montoEntregado: monto,
    montoConInteres,
    tasa: TASA_CAMBIO,
    precioCompraUSD,
    precioVendidoUSD,
    gananciaUSD: precioVendidoUSD - precioCompraUSD
  });

  setCart([...cart, advanceProduct]);
  setAdvanceModalVisible(false);
  
  Toast.show({
    type: "success",
    text1: "Avance agregado",
    text2: `Monto: Bs. ${monto} + 20% (Bs. ${interes}) = Bs. ${montoConInteres}. Ganancia: $${(precioVendidoUSD - precioCompraUSD).toFixed(2)}`,
    position: "top",
    visibilityTime: 4000,
  });
};


// 📱 Agregar recarga al carrito
const addRecharge = (monto) => {
  const montoConRecargo = Math.ceil(monto * 1.2);
  const recargo = montoConRecargo - monto;
  
  // Calcular valores en USD
  const precioCompraUSD = monto / TASA_CAMBIO;      // Lo que cuesta la recarga en USD
  const precioVendidoUSD = montoConRecargo / TASA_CAMBIO;  // Lo que se vende en USD
  
  const rechargeProduct = {
    id: 'recharge-service',
    nombre: '📱 RECARGA DE SERVICIO',
    descripcion: `Recarga - Monto: Bs. ${monto} (Cliente paga: Bs. ${montoConRecargo})`,
    
    // Precios para cálculo de ganancia en USD
    precioCompraUSD: precioCompraUSD,    // Costo en USD
    precioVendidoUSD: precioVendidoUSD,  // Precio de venta en USD
    
    // Mantener los campos existentes como estaban
    precioVentaUSD: 0,
    precioVentaVES: -monto,
    precioVentaVESEfectivo: 0,
    
    rechargeDetails: {
      montoOriginal: monto,
      recargo: recargo,
      totalConRecargo: montoConRecargo,
      precioCompraUSD: precioCompraUSD,
      precioVendidoUSD: precioVendidoUSD
    },
    cantidad: 1,
    isRecharge: true
  };

  console.log('➕ Agregando recarga al carrito:', rechargeProduct);
  console.log('🛒 Carrito antes:', cart.length);
  
  setCart([...cart, rechargeProduct]);
  
  console.log('🛒 Carrito después (en teoría):', cart.length + 1);
  
  setRechargeModalVisible(false);
  
  Toast.show({
    type: "success",
    text1: "Recarga agregada",
    text2: `Monto: Bs. ${monto} + 20% (Bs. ${recargo}) = Bs. ${montoConRecargo}`,
    position: "top",
    visibilityTime: 4000,
  });
};

  // -----------------------------
  // ❌ Eliminar producto del carrito
  // -----------------------------
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // -----------------------------
  // 🔄 Actualizar cantidad de un producto en el carrito
  // -----------------------------
  const updateCartQuantity = (productId, newQuantity) => {
    if (productId === 'advance-cash' || productId === 'recharge-service') {
      Toast.show({
        type: "info",
        text1: "No disponible",
        text2: "Este servicio es único por transacción",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }

    const product = cart.find(item => item.id === productId);
    
    if (newQuantity > product.stockActual) {
      Toast.show({
        type: "error",
        text1: "Stock insuficiente",
        text2: `Solo hay ${product.stockActual} unidades disponibles`,
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  // -----------------------------
  // 💰 Manejar pago
  // -----------------------------
  const handlePayment = () => {
    if (cart.length === 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No hay productos en el carrito",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }
    
    setPaymentModalVisible(true);
  };

  // ✅ Finalizar venta con método de pago
  // ✅ Finalizar venta con método de pago
const finalizeSaleWithPayment = async () => {
  const tieneAvance = cart.some(item => item.isAdvance);
  const tieneRecarga = cart.some(item => item.isRecharge);
  
  // Validar método de pago
  if (!paymentMethod && !tieneRecarga) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Selecciona un método de pago",
      position: "top",
      visibilityTime: 3000,
    });
    return;
  }

  // Validar que el método de pago sea válido para avance de efectivo
  if (tieneAvance && paymentMethod !== "debito" && paymentMethod !== "pagoMovil") {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Para avance de efectivo solo puede usar Débito o Pago Móvil",
      position: "top",
      visibilityTime: 3000,
    });
    return;
  }

  // Validar pago móvil
  if (paymentMethod === "pagoMovil") {
    if (!pagoMovilRef || pagoMovilRef.length !== 4 || !/^\d+$/.test(pagoMovilRef)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Debe ingresar los últimos 4 dígitos de la referencia (solo números)",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }
  }

  // Validar pago mixto
  // Validar pago mixto
if (paymentMethod === "mixto") {
  if (isNaN(subtotalVES) || !isFinite(subtotalVES) || subtotalVES <= 0) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "No se puede calcular el total de la venta",
      position: "top",
      visibilityTime: 3000,
    });
    return;
  }
  
  const usdAmount = parseFloat(mixedPayment.usd) || 0;
  const vesAmount = parseFloat(mixedPayment.ves) || 0;
  const vesEfectivoAmount = parseFloat(mixedPayment.vesEfectivo) || 0;
  
  // Convertir USD a VES
  const usdEnVES = usdAmount * TASA_CAMBIO;
  const totalPagadoVES = usdEnVES + vesAmount + vesEfectivoAmount;
  
  console.log('🔍 VALIDACIÓN PAGO MIXTO:', {
    subtotalVES,
    usdAmount,
    vesAmount,
    vesEfectivoAmount,
    usdEnVES,
    totalPagadoVES,
    diferencia: Math.abs(totalPagadoVES - subtotalVES)
  });
  
  // Tolerancia de 1 Bs. por redondeos
  if (Math.abs(totalPagadoVES - subtotalVES) > 1) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: `La suma de los pagos (Bs. ${totalPagadoVES.toFixed(2)}) no coincide con el total (Bs. ${subtotalVES.toFixed(2)})`,
      position: "top",
      visibilityTime: 5000,
    });
    return;
  }
}

  setProcessing(true);
  try {
    // 1. Verificar stock para productos normales
    for (const item of cart) {
      if (item.isAdvance || item.isRecharge) continue;
      
      const { data, error } = await supa
        .from("product")
        .select("stockActual")
        .eq("id", item.id)
        .single();

      if (error) throw error;

      if (data.stockActual < item.quantity) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: `Stock insuficiente para ${item.nombre}. Stock actual: ${data.stockActual}`,
          position: "top",
          visibilityTime: 3000,
        });
        setProcessing(false);
        return;
      }
    }

    // 2. Actualizar stock y crear movimientos
    for (const item of cart) {
      if (item.isAdvance) {
  // Obtener valores en USD desde advanceDetails
  const precioCompraUSD = item.advanceDetails?.precioCompraUSD || (Math.abs(item.precioVentaVESEfectivo) / TASA_CAMBIO);
  const precioVendidoUSD = item.advanceDetails?.precioVendidoUSD || (item.precioVentaVES / TASA_CAMBIO);
  
  // Movimiento para avance de efectivo
  const movementData = {
    productoID: 48,
    tipoMovimiento: "salida",
    cantidad: 1,
    
    // NUEVOS CAMPOS: precioCompraUSD y precioVendido para calcular ganancia
    precioCompraUSD: precioCompraUSD,      // Lo que entregamos en efectivo (costo en USD)
    precioVendido: precioVendidoUSD,       // Lo que cobramos por débito (venta en USD)
    
    // Mantener los campos existentes como estaban
    precioVentaUSD: 0,
    precioCompraVES: 0,
    precioVentaVES: item.precioVentaVES,              // Monto a cobrar por débito
    precioVentaVESEfectivo: item.precioVentaVESEfectivo, // Monto entregado en efectivo (negativo)
    
    empresaID: empresaId,
    tipoTransaccion: "Avance Efectivo",
    pagoMovil: paymentMethod === "pagoMovil" ? parseInt(pagoMovilRef) : null,
    observaciones: `Avance de efectivo: Entrega Bs. ${Math.abs(item.precioVentaVESEfectivo)} + 20% = Cobro Bs. ${item.precioVentaVES}. Costo USD: $${precioCompraUSD.toFixed(2)} | Venta USD: $${precioVendidoUSD.toFixed(2)} | Ganancia USD: $${(precioVendidoUSD - precioCompraUSD).toFixed(2)}`,
    usuarioCedula: userData?.cedula
  };
  
  console.log('📝 INSERTANDO AVANCE CON GANANCIA:', movementData);
  console.log('💵 GANANCIA ESPERADA USD:', precioVendidoUSD - precioCompraUSD);
  
  const { error: movementError } = await supa
    .from("productMovement")
    .insert(movementData);

  if (movementError) throw movementError;
}
else if (item.isRecharge) {
  // Determinar valores según el método de pago seleccionado
  let precioVentaUSD = 0;
  let precioVentaVES = 0;
  let precioVentaVESEfectivo = 0;
  let tipoTransaccion = "";
  
  console.log('📱 Procesando recarga con método:', paymentMethod);
  console.log('📱 Detalles de recarga:', item.rechargeDetails);
  console.log('📱 mixedPayment actual:', mixedPayment);
  
  const totalConRecargo = item.rechargeDetails.totalConRecargo;
  const montoOriginal = item.rechargeDetails.montoOriginal;
  
  // Obtener valores en USD para guardar
  const precioCompraUSD = item.rechargeDetails.precioCompraUSD || (montoOriginal / TASA_CAMBIO);
  const precioVendidoUSD = item.rechargeDetails.precioVendidoUSD || (totalConRecargo / TASA_CAMBIO);
  
  switch (paymentMethod) {
    case "debito":
      // Todo el pago es en débito
      precioVentaVES = totalConRecargo - montoOriginal; // Se descuenta el monto original
      tipoTransaccion = "Recarga Débito";
      console.log('  → Débito: Bs.', precioVentaVES, '(descuento del monto original)');
      break;
      
    case "pagoMovil":
      // Todo el pago es en pago móvil
      precioVentaVES = totalConRecargo - montoOriginal; // Se descuenta el monto original
      tipoTransaccion = "Recarga Pago Móvil";
      console.log('  → Pago Móvil: Bs.', precioVentaVES, '(descuento del monto original)');
      break;
      
    case "efectivoUSD":
      // Pago en efectivo USD, no afecta débito
      precioVentaVES = -montoOriginal; // No hay egreso de débito
      precioVentaUSD = totalConRecargo / TASA_CAMBIO;
      tipoTransaccion = "Recarga Efectivo USD";
      console.log('  → Efectivo USD: $', precioVentaUSD);
      break;
      
    case "efectivoVES":
      // Pago en efectivo VES, no afecta débito
      precioVentaVES = -montoOriginal; // No hay egreso de débito
      precioVentaVESEfectivo = totalConRecargo;
      tipoTransaccion = "Recarga Efectivo VES";
      console.log('  → Efectivo VES: Bs.', precioVentaVESEfectivo);
      break;
      
    case "mixto":
      // Usar los valores de mixedPayment directamente
      const usdAmount = parseFloat(mixedPayment.usd) || 0;
      const vesAmount = parseFloat(mixedPayment.ves) || 0;
      const vesEfectivoAmount = parseFloat(mixedPayment.vesEfectivo) || 0;
      
      console.log('  → Valores mixtos recibidos:', {
        usdAmount,
        vesAmount,
        vesEfectivoAmount
      });
      
      // Convertir USD a VES
      const usdEnVES = usdAmount * TASA_CAMBIO;
      
      // Calcular total pagado en VES
      const totalPagadoVES = usdEnVES + vesAmount + vesEfectivoAmount;
      
      console.log('  → Cálculos:', {
        usdEnVES,
        vesAmount,
        vesEfectivoAmount,
        totalPagadoVES,
        subtotalVES,
        montoOriginal
      });
      
      // Para el débito: se descuenta el monto original MENOS lo que se pagó en débito
      precioVentaVES = -(montoOriginal - vesAmount);
      
      // El ingreso se distribuye según corresponda
      if (usdAmount > 0) {
        precioVentaUSD = (totalConRecargo * (usdEnVES / totalPagadoVES)) / TASA_CAMBIO;
      }
      
      if (vesEfectivoAmount > 0) {
        precioVentaVESEfectivo = totalConRecargo * (vesEfectivoAmount / totalPagadoVES);
      }
      
      tipoTransaccion = "Recarga Mixta";
      
      console.log('  → Resultado distribución:', {
        montoOriginal,
        pagadoEnDebito: vesAmount,
        egresoNetoDebito: precioVentaVES,
        precioVentaUSD,
        precioVentaVESEfectivo
      });
      break;
      
    default:
      console.log('  ⚠️ Método de pago no reconocido:', paymentMethod);
      precioVentaVES = -montoOriginal;
      tipoTransaccion = "Recarga";
      break;
  }
  
  const movementData = {
    productoID: 49,
    tipoMovimiento: "salida",
    cantidad: 1,
    
    // NUEVOS CAMPOS: precioCompraUSD y precioVendido (precioVentaUSD se mantiene para el método de pago)
    precioCompraUSD: precioCompraUSD,      // Costo de la recarga en USD
    precioVendido: precioVendidoUSD,    // Precio de venta en USD
    
    // Mantener los campos existentes como estaban
    precioVentaUSD: precioVentaUSD,        // Para pago en efectivo USD
    precioCompraVES: 0,
    precioVentaVES: precioVentaVES,        // Egreso neto del débito
    precioVentaVESEfectivo: precioVentaVESEfectivo, // Para pago en efectivo VES
    
    empresaID: empresaId,
    tipoTransaccion: tipoTransaccion,
    pagoMovil: paymentMethod === "pagoMovil" ? parseInt(pagoMovilRef) : null,
    observaciones: `Recarga: Bs. ${item.rechargeDetails.montoOriginal} + 20% = Bs. ${item.rechargeDetails.totalConRecargo}. Costo USD: $${precioCompraUSD.toFixed(2)} | Venta USD: $${precioVendidoUSD.toFixed(2)} | Ganancia USD: $${(precioVendidoUSD - precioCompraUSD).toFixed(2)}`,
    usuarioCedula: userData?.cedula
  };
  
  console.log('📝 INSERTANDO RECARGA:', movementData);
  
  const { error: movementError } = await supa
    .from("productMovement")
    .insert(movementData);

  if (movementError) throw movementError;
}


else {
  // 🚨 IMPORTANTE: Si es pago de deuda, NO actualizar stock
  if (!item.isFromAgenda) {
    // Solo actualizar stock si NO es de agenda (venta normal)
    const { error: updateError } = await supa
      .from("product")
      .update({ stockActual: item.stockActual - item.quantity })
      .eq("id", item.id);

    if (updateError) throw updateError;
  } else {
    console.log('💰 Pago de deuda - NO se descuenta stock para:', item.nombre);
  }

  let precioVentaUSD = 0;
  let precioVentaVES = 0;
  let precioVentaVESEfectivo = 0;
  let tipoTransaccion = "";
  let pagoMovil = null;
  let precioVendidoUSD = 0;

  // Obtener datos ACTUALES del producto para el movimiento
  const { data: currentProduct, error: productError } = await supa
    .from("product")
    .select("precioVentaUSD, precioVentaVES, precioCompraUSD, precioCompraVES")
    .eq("id", item.id)
    .single();

  if (productError) {
    console.error('Error obteniendo producto actual:', productError);
    throw productError;
  }

  // Usar precios ACTUALES del producto
  const itemTotalVES = (currentProduct.precioVentaVES || 0) * (item.quantity || 1);
  const itemTotalUSD = (currentProduct.precioVentaUSD || 0) * (item.quantity || 1);
  const precioCompraUSD = currentProduct.precioCompraUSD || 0;

  console.log('💰 Procesando producto:', {
    nombre: item.nombre,
    isFromAgenda: item.isFromAgenda,
    itemTotalVES,
    itemTotalUSD,
    precioCompraUSD,
    paymentMethod
  });

  switch (paymentMethod) {
    case "debito":
      precioVentaVES = itemTotalVES;
      precioVendidoUSD = itemTotalVES / TASA_CAMBIO;
      tipoTransaccion = item.isFromAgenda ? "Debito" : "Debito";
      console.log('  → Débito: Bs.', precioVentaVES, '| USD:', precioVendidoUSD);
      break;
      
    case "pagoMovil":
      precioVentaVES = itemTotalVES;
      precioVendidoUSD = itemTotalVES / TASA_CAMBIO;
      tipoTransaccion = item.isFromAgenda ? "Pago Movil" : "Pago Movil";
      pagoMovil = parseInt(pagoMovilRef);
      console.log('  → Pago Móvil: Bs.', precioVentaVES, '| USD:', precioVendidoUSD);
      break;
      
    case "efectivoUSD":
      precioVentaUSD = itemTotalUSD;
      precioVendidoUSD = itemTotalUSD;
      tipoTransaccion = item.isFromAgenda ? "Efectivo USD" : "Efectivo USD";
      console.log('  → Efectivo USD: $', precioVentaUSD);
      break;
      
    case "efectivoVES":
      precioVentaVESEfectivo = itemTotalVES;
      precioVendidoUSD = itemTotalVES / TASA_CAMBIO;
      tipoTransaccion = item.isFromAgenda ? "Efectivo VES" : "Efectivo VES";
      console.log('  → Efectivo VES: Bs.', precioVentaVESEfectivo, '| USD:', precioVendidoUSD);
      break;
      
    case "mixto":
      const usdAmount = parseFloat(mixedPayment.usd) || 0;
      const vesAmount = parseFloat(mixedPayment.ves) || 0;
      const vesEfectivoAmount = parseFloat(mixedPayment.vesEfectivo) || 0;
      
      const usdEnVES = usdAmount * TASA_CAMBIO;
      const totalPagadoVES = usdEnVES + vesAmount + vesEfectivoAmount;
      
      if (totalPagadoVES <= 0) {
        precioVentaVES = itemTotalVES;
        precioVendidoUSD = itemTotalVES / TASA_CAMBIO;
        tipoTransaccion = item.isFromAgenda ? "Debito" : "Debito (fallback)";
      } else {
        const proporcionUSD = usdEnVES / totalPagadoVES;
        const proporcionVESDebito = vesAmount / totalPagadoVES;
        const proporcionVESEfectivo = vesEfectivoAmount / totalPagadoVES;
        
        precioVentaUSD = (itemTotalVES * proporcionUSD) / TASA_CAMBIO;
        precioVentaVES = itemTotalVES * proporcionVESDebito;
        precioVentaVESEfectivo = itemTotalVES * proporcionVESEfectivo;
        
        precioVendidoUSD = (itemTotalVES * (usdEnVES / totalPagadoVES)) / TASA_CAMBIO + 
                           (itemTotalVES * (vesAmount / totalPagadoVES)) / TASA_CAMBIO + 
                           (itemTotalVES * (vesEfectivoAmount / totalPagadoVES)) / TASA_CAMBIO;
        
        tipoTransaccion = item.isFromAgenda ? "Mixto" : "Mixto";
      }
      break;
      
    default:
      precioVentaVES = itemTotalVES;
      precioVendidoUSD = itemTotalVES / TASA_CAMBIO;
      tipoTransaccion = item.isFromAgenda ? "Debito" : "Debito (default)";
      break;
  }

  const movementData = {
    productoID: item.id,
    tipoMovimiento: "salida",
    cantidad: item.quantity,
    precioCompraUSD: precioCompraUSD,
    precioVendido: precioVendidoUSD,
    precioVentaUSD: precioVentaUSD,
    precioCompraVES: currentProduct.precioCompraVES || 0,
    precioVentaVES: precioVentaVES,
    precioVentaVESEfectivo: precioVentaVESEfectivo,
    empresaID: empresaId,
    tipoTransaccion: tipoTransaccion,
    pagoMovil: pagoMovil,
    observaciones: item.isFromAgenda 
      ? `PAGO DE DEUDA - Cliente: ${currentClient?.nombre} (${currentClient?.cedula}) - ${item.nombre} x${item.quantity}`
      : `Venta: ${item.nombre} x${item.quantity}. Costo USD: $${precioCompraUSD.toFixed(2)} | Venta USD: $${precioVendidoUSD.toFixed(2)} | Ganancia USD: $${(precioVendidoUSD - precioCompraUSD).toFixed(2)}`,
    usuarioCedula: userData?.cedula
  };
  
  console.log('📝 INSERTANDO MOVIMIENTO:', movementData);

  const { error: movementError } = await supa
    .from("productMovement")
    .insert(movementData);

  if (movementError) {
    console.error('❌ Error insertando movimiento:', movementError);
    throw movementError;
  }
}
    }

    if (isPayingDebt && currentClient) {
  console.log('💰 Marcando deudas como pagadas para cliente:', currentClient.cedula);
  console.log('💰 Items a marcar:', cart.filter(item => item.isFromAgenda).map(i => ({ id: i.waitListId, nombre: i.nombre })));
  
  for (const item of cart) {
    if (item.isFromAgenda && item.waitListId) {
      const { error: updateError } = await supa
        .from('productMovementWaitList')
        .update({ 
          pagado: true, 
          fecha_pago: new Date().toISOString() 
        })
        .eq('id', item.waitListId);

      if (updateError) {
        console.error('❌ Error marcando como pagado:', updateError);
        throw updateError;
      } else {
        console.log('✅ Marcado como pagado ID:', item.waitListId);
      }
    }
  }
}

// Limpiar estados de agenda
setIsPayingDebt(false);
setCurrentClient(null);

    // 3. Limpiar todo
    setCart([]);
    setPaymentMethod(null);
    setPagoMovilRef("");
    setMixedPayment({ usd: "", ves: "", vesEfectivo: "" });
    setPaymentModalVisible(false);
    
    Toast.show({
      type: "success",
      text1: "Éxito",
      text2: "Venta realizada correctamente",
      position: "top",
      visibilityTime: 3000,
    });
    
    loadAllData();

  } catch (error) {
    console.error("❌ ERROR FINALIZANDO VENTA:", error);
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "No se pudo completar la venta",
      position: "top",
      visibilityTime: 3000,
    });
  } finally {
    setProcessing(false);
  }
};

  // -----------------------------
  // 🎨 Render
  // -----------------------------
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
        <NavBar />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#45c0e8" />
          <Text style={styles.loadingText}>Cargando facturación...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
      <NavBar />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header */}
          <LinearGradient
            colors={['#45c0e8', '#3aa5c9']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Facturación</Text>
            <Text style={styles.headerSubtitle}>Nueva venta</Text>
          </LinearGradient>

          {/* Selector de categoría */}
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={styles.categoryHeader}
              onPress={() => setCategoriasExpandidas(!categoriasExpandidas)}
            >
              <View style={styles.categoryHeaderLeft}>
                <MaterialCommunityIcons name="tag-outline" size={20} color="#64748b" />
                <Text style={styles.categoryTitle}>
                  {selectedCategoria === "todas" 
                    ? "Todas las categorías" 
                    : categorias.find(c => c.id === selectedCategoria)?.nombre || "Seleccionar categoría"}
                </Text>
              </View>
              <MaterialCommunityIcons 
                name={categoriasExpandidas ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#64748b" 
              />
            </TouchableOpacity>   

            {categoriasExpandidas && (
              <View style={styles.categoryList}>
                {categorias.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      selectedCategoria === cat.id && styles.categoryItemActive
                    ]}
                    onPress={() => {
                      setSelectedCategoria(cat.id);
                      setCategoriasExpandidas(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryItemText,
                      selectedCategoria === cat.id && styles.categoryItemTextActive
                    ]}>
                      {cat.nombre}
                    </Text>
                    {selectedCategoria === cat.id && (
                      <MaterialCommunityIcons name="check" size={18} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Botones de acción - Organizados en 2 filas */}
<View style={styles.actionButtonsContainer}>
  {/* Primera fila */}
  <View style={styles.actionButtonsRow}>
    <TouchableOpacity 
      style={[styles.actionButton, styles.productButton]}
      onPress={() => setModalVisible(true)}
    >
      <MaterialCommunityIcons name="package-variant" size={24} color="white" />
      <Text style={styles.actionButtonText}>Producto</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.actionButton, styles.advanceButton]}
      onPress={() => setAdvanceModalVisible(true)}
    >
      <MaterialCommunityIcons name="cash-plus" size={24} color="white" />
      <Text style={styles.actionButtonText}>Avance</Text>
    </TouchableOpacity>
  </View>

  {/* Segunda fila */}
  <View style={styles.actionButtonsRow}>
    <TouchableOpacity 
      style={[styles.actionButton, styles.rechargeButton]}
      onPress={() => setRechargeModalVisible(true)}
    >
      <MaterialCommunityIcons name="cellphone" size={24} color="white" />
      <Text style={styles.actionButtonText}>Recarga</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.actionButton, styles.fiadoButton]}
      onPress={() => {
        if (cart.length === 0) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Agregue productos al carrito primero",
            position: "top",
            visibilityTime: 3000,
          });
          return;
        }
        setFiadoModalVisible(true);
      }}
    >
      <MaterialCommunityIcons name="account-clock" size={24} color="white" />
      <Text style={styles.actionButtonText}>Fiado</Text>
    </TouchableOpacity>
  </View>
</View>

          {/* Carrito de compras */}
          <View style={styles.cartContainer}>
            <Text style={styles.sectionTitle}>
              Carrito ({cart.length} {cart.length === 1 ? 'ítem' : 'ítems'})
            </Text>

            {cart.length > 0 ? (
              cart.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={[
                      styles.cartItemName,
                      item.isAdvance && styles.advanceItemName,
                      item.isRecharge && styles.rechargeItemName
                    ]}>
                      {item.nombre}
                    </Text>
                    {item.isAdvance && item.advanceDetails && (
                      <Text style={styles.advanceDetails}>
                        Entrega: Bs. {item.advanceDetails.montoEntregado} | 
                        Interés: Bs. {item.advanceDetails.interes}
                      </Text>
                    )}
                    {item.isRecharge && item.rechargeDetails && (
                      <Text style={styles.rechargeDetails}>
                        Monto: Bs. {item.rechargeDetails.montoOriginal} | 
                        Recargo 20%: Bs. {item.rechargeDetails.recargo}
                      </Text>
                    )}
                    {!item.isAdvance && !item.isRecharge && (
                      <Text style={styles.cartItemPrice}>
                        ${item.precioVentaUSD} / Bs.{item.precioVentaVES} c/u
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.cartItemControls}>
                    {!item.isAdvance && !item.isRecharge && (
                      <>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          <MaterialCommunityIcons name="minus" size={16} color="#45c0e8" />
                        </TouchableOpacity>
                        
                        <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
                        
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          <MaterialCommunityIcons name="plus" size={16} color="#45c0e8" />
                        </TouchableOpacity>
                      </>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <MaterialCommunityIcons name="trash-can" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                  
               
{/* En la sección del carrito, dentro del mapeo de items */}
<View style={styles.cartItemTotals}>
  {item.isAdvance ? (
    // Avance de efectivo
    <>
      <Text style={styles.advanceTotalDebito}>
        Débito: +Bs. {item.precioVentaVES}
      </Text>
      <Text style={styles.advanceTotalEfectivo}>
        Efectivo: {item.precioVentaVESEfectivo > 0 ? '+' : ''}{item.precioVentaVESEfectivo} Bs.
      </Text>
    </>
  ) : item.isRecharge ? (
    // Recarga
    <>
      <Text style={styles.rechargeTotalDebito}>
        Débito: {item.precioVentaVES} Bs. (egreso)
      </Text>
      
    </>
  ) : (
    // Productos normales
    <>
      <Text style={styles.cartItemTotalUSD}>
        USD: ${(item.precioVentaUSD * item.quantity).toFixed(2)}
      </Text>
      <Text style={styles.cartItemTotalVES}>
        VES: Bs. {(item.precioVentaVES * item.quantity).toFixed(2)}
      </Text>
    </>
  )}
</View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCart}>
                <MaterialCommunityIcons name="cart-outline" size={60} color="#cbd5e1" />
                <Text style={styles.emptyCartText}>Carrito vacío</Text>
                <Text style={styles.emptyCartSubtext}>Agrega productos para comenzar</Text>
              </View>
            )}
          </View>

          {/* Resumen de factura */}
          {cart.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>Resumen</Text>
              
              {cart.some(item => item.isAdvance) ? (
                // Resumen para avance de efectivo
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Monto entregado en efectivo:</Text>
                    <Text style={styles.advanceTotalEfectivo}>
                      -Bs. {Math.abs(cart.reduce((sum, item) => sum + (item.precioVentaVESEfectivo || 0), 0))}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Monto a débito (+20%):</Text>
                    <Text style={styles.summaryValueVES}>
                      +Bs. {cart.reduce((sum, item) => sum + (item.precioVentaVES || 0), 0)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.summaryLabel}>Total a pagar (débito):</Text>
                    <Text style={styles.summaryValueVES}>
                      Bs. {cart.reduce((sum, item) => sum + (item.precioVentaVES || 0), 0)}
                    </Text>
                  </View>
                </>
              ) : cart.some(item => item.isRecharge) ? (
      // Resumen para recarga
      <>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Egreso de débito (para recarga):</Text>
          <Text style={styles.rechargeTotalDebito}>
            -Bs. {Math.abs(cart.reduce((sum, item) => sum + (item.precioVentaVES || 0), 0))}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ingreso del cliente (con recargo):</Text>
          <Text style={styles.summaryValueVES}>
            +Bs. {cart.reduce((sum, item) => sum + (item.rechargeDetails?.totalConRecargo || 0), 0)}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.summaryLabel}>Diferencia neta en débito:</Text>
          <Text style={styles.summaryValueVES}>
            Bs. {cart.reduce((sum, item) => sum + (item.rechargeDetails?.totalConRecargo || 0) + (item.precioVentaVES || 0), 0)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="information" size={16} color="#64748b" />
          <Text style={styles.infoText}>
            El ingreso se aplicará según el método de pago seleccionado
          </Text>
        </View>
      </>
    ) : (
      // Resumen normal
      <>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total USD:</Text>
          <Text style={styles.summaryValueUSD}>${subtotalUSD.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total VES:</Text>
          <Text style={styles.summaryValueVES}>Bs. {subtotalVES.toFixed(2)}</Text>
        </View>
      </>
    )}

              {/* Botón para seleccionar método de pago */}
              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={handlePayment}
              >
                <MaterialCommunityIcons name="cash" size={24} color="white" />
                <Text style={styles.paymentButtonText}>
                  {paymentMethod ? "Cambiar método de pago" : "Seleccionar método de pago"}
                </Text>
              </TouchableOpacity>

              {paymentMethod && (
                <View style={styles.selectedPayment}>
                  <Text style={styles.selectedPaymentText}>
                    Método seleccionado: {
                      paymentMethod === "debito" ? "Débito" :
                      paymentMethod === "pagoMovil" ? "Pago Móvil" :
                      paymentMethod === "efectivoUSD" ? "Efectivo USD" :
                      paymentMethod === "efectivoVES" ? "Efectivo VES" : "Mixto"
                    }
                  </Text>
                  {paymentMethod === "pagoMovil" && pagoMovilRef && (
                    <Text style={styles.selectedPaymentRef}>
                      Ref: ****{pagoMovilRef}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity 
                style={[
                  styles.finalizeButton, 
                  !paymentMethod && styles.finalizeButtonDisabled
                ]}
                onPress={finalizeSaleWithPayment}
                disabled={processing || !paymentMethod}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                    <Text style={styles.finalizeButtonText}>Finalizar Venta</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </View>

      {/* Modales */}
      <ProductSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        products={filteredProducts}
        categoriasMap={categoriasMap}
        searchText={searchText}
        onSearch={handleSearch}
        onSelectProduct={(product) => {
          setSelectedProduct(product);
          setModalVisible(false);
          setQuantityModalVisible(true);
        }}
      />

      <Modal
        visible={quantityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cantidad</Text>
            
            {selectedProduct && (
              <>
                <Text style={styles.modalProductName}>{selectedProduct.nombre}</Text>
                <Text style={styles.modalStock}>
                  Stock disponible: {selectedProduct.stockActual}
                </Text>
                
                <View style={styles.quantityInputContainer}>
                  <TouchableOpacity 
                    style={styles.quantityModalButton}
                    onPress={() => setTempQuantity(prev => Math.max(1, parseInt(prev) - 1).toString())}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color="#45c0e8" />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={styles.quantityInput}
                    value={tempQuantity}
                    onChangeText={setTempQuantity}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  
                  <TouchableOpacity 
                    style={styles.quantityModalButton}
                    onPress={() => setTempQuantity(prev => (parseInt(prev) + 1).toString())}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#45c0e8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => {
                      setQuantityModalVisible(false);
                      setTempQuantity("1");
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={() => addToCart(selectedProduct, parseInt(tempQuantity) || 1)}
                  >
                    <Text style={styles.modalConfirmText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <AdvanceCashModal
        visible={advanceModalVisible}
        onClose={() => setAdvanceModalVisible(false)}
        onConfirm={addAdvanceCash}
      />

      <RechargeModal
        visible={rechargeModalVisible}
        onClose={() => setRechargeModalVisible(false)}
        onConfirm={addRecharge}
        tasaCambio={TASA_CAMBIO}
      />

      <PaymentMethodModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        subtotalUSD={subtotalUSD}
        subtotalVES={subtotalVES}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        pagoMovilRef={pagoMovilRef}
        setPagoMovilRef={setPagoMovilRef}
        mixedPayment={mixedPayment}
        setMixedPayment={setMixedPayment}
        tasaCambio={TASA_CAMBIO}
        soloDebitoPagoMovil={cart.some(item => item.isAdvance)}
      />

      <FiadoModal
  visible={fiadoModalVisible}
  onClose={() => setFiadoModalVisible(false)}
  onConfirm={handleFiadoConfirm}
  cart={cart}
  userData={userData}
  empresaId={empresaId}
/>
      
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
    backgroundColor: "#f5f5f5",
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeButton: {
    backgroundColor: '#9b59b6',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rechargeItemName: {
    color: '#9b59b6',
  },
  rechargeDetails: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  rechargeTotalDebito: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c', // Rojo porque es un egreso
  },
  rechargeTotalIngreso: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60', // Verde porque es un ingreso
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
    padding: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  categoryContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryList: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  categoryItemActive: {
    backgroundColor: '#45c0e8',
  },
  categoryItemText: {
    fontSize: 14,
    color: '#1e293b',
  },
  categoryItemTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  rechargePendiente: {
  fontSize: 12,
  fontWeight: '600',
  color: '#f39c12',
  fontStyle: 'italic',
},
  actionButtonsContainer: {
  marginHorizontal: 16,
  marginBottom: 20,
  gap: 12,
},
actionButtonsRow: {
  flexDirection: 'row',
  gap: 12,
},
actionButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  borderRadius: 12,
  gap: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
productButton: {
  backgroundColor: '#27ae60',
},
advanceButton: {
  backgroundColor: '#e67e22',
},
rechargeButton: {
  backgroundColor: '#9b59b6',
},
fiadoButton: {
  backgroundColor: '#f39c12',
},
actionButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: '600',
},
  cartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  cartItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  cartItemInfo: {
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  advanceItemName: {
    color: '#e67e22',
  },
  advanceDetails: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemQuantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  cartItemTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartItemTotalUSD: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  cartItemTotalVES: {
    fontSize: 14,
    fontWeight: '600',
    color: '#45c0e8',
  },
  advanceTotalDebito: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
  },
  advanceTotalEfectivo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValueUSD: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  summaryValueVES: {
    fontSize: 16,
    fontWeight: '700',
    color: '#45c0e8',
  },
  paymentButton: {
    backgroundColor: '#45c0e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedPayment: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#45c0e8',
  },
  selectedPaymentText: {
    color: '#45c0e8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedPaymentRef: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  finalizeButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  finalizeButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.5,
  },
  finalizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
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
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalStock: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  quantityModalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 60,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
  flexDirection: 'row',
  backgroundColor: '#f0f9ff',
  padding: 12,
  borderRadius: 8,
  marginTop: 12,
  gap: 8,
  borderWidth: 1,
  borderColor: '#45c0e8',
},
infoText: {
  flex: 1,
  fontSize: 12,
  color: '#1e293b',
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
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#45c0e8',
  },
  modalConfirmText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fiadoButton: {
  backgroundColor: '#f39c12',
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  borderRadius: 12,
  gap: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
});

export default BillingScreen;