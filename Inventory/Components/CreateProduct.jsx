import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { SupaClient } from "../../Supabase/supabase";
import * as FileSystem from "expo-file-system";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavBar from "../../NavBar/Components/NavBar";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Componente InputField memoizado para evitar re-renders
const InputField = React.memo(({ label, icon, ...props }) => (
  <View style={styles.inputWrapper}>
    <View style={styles.labelContainer}>
      <MaterialCommunityIcons name={icon} size={18} color="#45c0e8" />
      <Text style={styles.labelText}>{label}</Text>
    </View>
    <TextInput
      style={styles.input}
      placeholderTextColor="#94a3b8"
      {...props}
    />
  </View>
));

// Componente para mostrar stock como texto no editable
const StockLabel = ({ label, icon, value }) => (
  <View style={styles.inputWrapper}>
    <View style={styles.labelContainer}>
      <MaterialCommunityIcons name={icon} size={18} color="#45c0e8" />
      <Text style={styles.labelText}>{label}</Text>
    </View>
    <View style={styles.stockLabelContainer}>
      <Text style={styles.stockLabelText}>{value}</Text>
    </View>
  </View>
);

const CreateProduct = () => {
  const supa = SupaClient();
  const navigation = useNavigation();
  const route = useRoute();
  const { product, empresaId } = route.params || {};

  // 📌 Estados para los datos del producto
  const [nombre, setNombre] = useState(product?.nombre || "");
  const [descripcion, setDescripcion] = useState(product?.descripcion || "");
  const [categoriaID, setCategoriaID] = useState(product?.categoriaID ? String(product.categoriaID) : "");
  const [stockActual, setStockActual] = useState(product?.stockActual ? String(product.stockActual) : "");
  const [stockMinimo, setStockMinimo] = useState(product?.stockMinimo ? String(product.stockMinimo) : "");
  const [stockMaximo, setStockMaximo] = useState(product?.stockMaximo ? String(product.stockMaximo) : "");
  const [unidadMedida, setUnidadMedida] = useState(product?.unidadMedida || "UNIDAD");
  const [proveedorID, setProveedorID] = useState(product?.proveedorID ? String(product.proveedorID) : "");
  const [imagen, setImagen] = useState(product?.imagen || null);
  
  // 📌 Precios en USD
  const [precioCompraUSD, setPrecioCompraUSD] = useState(product?.precioCompraUSD ? String(product.precioCompraUSD) : "");
  const [precioVentaUSD, setPrecioVentaUSD] = useState(product?.precioVentaUSD ? String(product.precioVentaUSD) : "");
  
  // 📌 Precio congelado en Bs
  const [precioCongelado, setPrecioCongelado] = useState(product?.precioCongelado);
  const [tasaBCV, setTasaBCV] = useState(null);
  const [precioVentaVESCalculado, setPrecioVentaVESCalculado] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [empresaIdUser, setEmpresaIdUser] = useState(empresaId || null);
  
  // Estados para dropdowns - siguiendo el patrón de Login
  const [openCategoria, setOpenCategoria] = useState(false);
  const [itemsCategoria, setItemsCategoria] = useState([]);
  
  const [openProveedor, setOpenProveedor] = useState(false);
  const [itemsProveedor, setItemsProveedor] = useState([]);

  const [openUnidad, setOpenUnidad] = useState(false);
  const [itemsUnidad, setItemsUnidad] = useState([
    { label: "Unidad", value: "UNIDAD" },
    { label: "Kilogramo", value: "KILO" },
    { label: "Litro", value: "LITRO" },
    { label: "Gramo", value: "GRAMO" },
    { label: "Caja", value: "CAJA" },
    { label: "Paquete", value: "PAQUETE" },
  ]);

  // Control de zIndex - similar a Login
  const [zIndexCategoria, setZIndexCategoria] = useState(5000);
  const [zIndexProveedor, setZIndexProveedor] = useState(4000);
  const [zIndexUnidad, setZIndexUnidad] = useState(3000);

  // Funciones memoizadas para manejo de textos
  const handleNombreChange = useCallback((text) => {
    setNombre(text);
  }, []);

  const handleDescripcionChange = useCallback((text) => {
    setDescripcion(text);
  }, []);

  const handleStockActualChange = useCallback((text) => {
    const numeros = text.replace(/[^0-9]/g, "");
    setStockActual(numeros);
  }, []);

  const handleStockMinimoChange = useCallback((text) => {
    const numeros = text.replace(/[^0-9]/g, "");
    setStockMinimo(numeros);
  }, []);

  const handleStockMaximoChange = useCallback((text) => {
    const numeros = text.replace(/[^0-9]/g, "");
    setStockMaximo(numeros);
  }, []);

  const handlePrecioCompraChange = useCallback((text) => {
    const numeros = text.replace(/[^0-9.]/g, "");
    const partes = numeros.split('.');
    if (partes.length > 2) return;
    setPrecioCompraUSD(numeros);
  }, []);

  const handlePrecioVentaChange = useCallback((text) => {
    const numeros = text.replace(/[^0-9.]/g, "");
    const partes = numeros.split('.');
    if (partes.length > 2) return;
    setPrecioVentaUSD(numeros);
  }, []);

  // 📌 Cargar tasa BCV
  useEffect(() => {
    const loadTasaBCV = async () => {
      try {
        const { data, error } = await supa
          .from("tasaBCV")
          .select("precioVESUSD")
          .eq("id", 1)
          .single();

        if (error) throw error;
        setTasaBCV(data?.precioVESUSD || null);
      } catch (error) {
        console.error("Error cargando tasa BCV:", error);
      }
    };

    loadTasaBCV();
  }, []);

  // 📌 Calcular precio en Bs cuando cambia precioVentaUSD, tasa o la opción de congelado
  useEffect(() => {
    if (precioCongelado === true && precioVentaUSD && tasaBCV) {
      const precioUSD = parseFloat(precioVentaUSD) || 0;
      const calculado = precioUSD * tasaBCV;
      setPrecioVentaVESCalculado(calculado.toFixed(2));
    } else {
      setPrecioVentaVESCalculado(null);
    }
  }, [precioVentaUSD, tasaBCV, precioCongelado]);

  useEffect(() => {
    const verificarAcceso = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        const user = session ? JSON.parse(session) : null;

        if (user) {
          setCurrentUser(user);
          
          if (!empresaIdUser) {
            setEmpresaIdUser(user.empresaID);
          }

          if (!user.esActivo) {
            await AsyncStorage.removeItem("userSession");
            Toast.show({
              type: "error",
              text1: "Usuario no encontrado",
              text2: "Cerrando Sesión.",
              position: "top",
              visibilityTime: 3000,
            });
            navigation.navigate("Log_in");
            return;
          }
        }
      } catch (error) {
        console.error("Error verificando acceso:", error);
      }
    };

    verificarAcceso();
  }, []);

  // 📌 Cargar categorías
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const { data, error } = await supa
          .from("productCategory")
          .select("id, nombre")
          .eq("esActivo", true)
          .order("nombre");

        if (error) throw error;

        setItemsCategoria([
          { label: "Sin categoría", value: "" },
          ...data.map(cat => ({ label: cat.nombre, value: String(cat.id) }))
        ]);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    };

    loadCategorias();
  }, []);

  // 📌 Cargar proveedores
  useEffect(() => {
    const loadProveedores = async () => {
      if (!empresaIdUser) return;

      try {
        const { data, error } = await supa
          .from("provider")
          .select("proveedorID, nombre")
          .eq("empresaID", empresaIdUser)
          .eq("esActivo", true)
          .order("nombre");

        if (error) throw error;

        setItemsProveedor([
          { label: "Sin proveedor", value: "" },
          ...data.map(prov => ({ label: prov.nombre, value: String(prov.proveedorID) }))
        ]);
      } catch (error) {
        console.error("Error cargando proveedores:", error);
      }
    };

    loadProveedores();
  }, [empresaIdUser]);

  // 📌 Manejar zIndex de dropdowns - similar a Login
  useEffect(() => {
    if (openCategoria) {
      setZIndexCategoria(5000);
      setZIndexProveedor(4000);
      setZIndexUnidad(3000);
    } else if (openProveedor) {
      setZIndexCategoria(4000);
      setZIndexProveedor(5000);
      setZIndexUnidad(3000);
    } else if (openUnidad) {
      setZIndexCategoria(4000);
      setZIndexProveedor(3000);
      setZIndexUnidad(5000);
    } else {
      setZIndexCategoria(5000);
      setZIndexProveedor(4000);
      setZIndexUnidad(3000);
    }
  }, [openCategoria, openProveedor, openUnidad]);

  // 📌 Permisos de cámara
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permisos necesarios",
          text2: "Se necesitan permisos para acceder a la galería.",
          position: "top",
          visibilityTime: 3000,
        });
      }
    })();
  }, []);

  // 📌 Precargar datos para edición
  useEffect(() => {
    if (product) {
      setNombre(product.nombre || "");
      setDescripcion(product.descripcion || "");
      setCategoriaID(product.categoriaID ? String(product.categoriaID) : "");
      setStockActual(product.stockActual ? String(product.stockActual) : "");
      setStockMinimo(product.stockMinimo ? String(product.stockMinimo) : "");
      setStockMaximo(product.stockMaximo ? String(product.stockMaximo) : "");
      setUnidadMedida(product.unidadMedida || "UNIDAD");
      setProveedorID(product.proveedorID ? String(product.proveedorID) : "");
      setPrecioCompraUSD(product.precioCompraUSD ? String(product.precioCompraUSD) : "");
      setPrecioVentaUSD(product.precioVentaUSD ? String(product.precioVentaUSD) : "");
      setPrecioCongelado(product.precioCongelado);
      setImagen(product.imagen || null);
    }
  }, [product]);

  // 📌 Seleccionar imagen
  const pickImageFromGallery = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagen(event.target.result);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImagen(result.assets[0].uri);
      }
    }
  };

  // 📌 Tomar foto
  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permisos necesarios",
        text2: "Se necesitan permisos para acceder a la cámara.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImagen(result.assets[0].uri);
    }
  };

  // 📌 Comprimir imagen
  const compressImage = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.size > 500000) {
        const compressedImage = await ImageManipulator.manipulateAsync(
          uri,
          [],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        return compressedImage.uri;
      }
      return uri;
    } catch (error) {
      return uri;
    }
  };

  // 📌 Guardar producto
  const saveProduct = async () => {
    if (!nombre.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "El nombre del producto es obligatorio.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (!empresaIdUser) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo determinar la empresa.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    let imageUrl = imagen;
    const isNewImage = imagen &&
      !imagen.startsWith(
        "https://wuyodajpxeoydzmulgkm.supabase.co/storage/v1/object/public/product/"
      );

    if (isNewImage && imagen) {
      try {
        if (Platform.OS === "web") {
          const response = await fetch(imagen);
          const blob = await response.blob();
          const fileName = `product/${Date.now()}.jpg`;

          const { error: uploadError } = await supa.storage
            .from("product")
            .upload(fileName, blob, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supa.storage
            .from("product")
            .getPublicUrl(fileName);

          imageUrl = publicUrlData.publicUrl;
        } else {
          const compressedUri = await compressImage(imagen);
          const fileName = `product/${Date.now()}.jpg`;
          const file = {
            uri: compressedUri,
            name: fileName,
            type: "image/jpeg",
          };

          const { error: uploadError } = await supa.storage
            .from("product")
            .upload(file.name, file, { contentType: file.type });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supa.storage
            .from("product")
            .getPublicUrl(file.name);

          imageUrl = publicUrlData.publicUrl;
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudo subir la imagen.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }
    }

    try {
      if (product) {
        // Actualizar producto existente (NO actualizar stockActual)
        const { error: updateError } = await supa
          .from("product")
          .update({
            nombre,
            descripcion: descripcion || null,
            categoriaID: categoriaID ? parseInt(categoriaID) : null,
            // stockActual NO se actualiza aquí
            stockMinimo: parseInt(stockMinimo) || 0,
            stockMaximo: parseInt(stockMaximo) || 0,
            unidadMedida,
            proveedorID: proveedorID ? parseInt(proveedorID) : null,
            imagen: isNewImage ? imageUrl : product.imagen,
            precioCompraUSD: parseFloat(precioCompraUSD) || 0,
            precioVentaUSD: parseFloat(precioVentaUSD) || 0,
            precioCongelado: precioCongelado, // Guardar el valor del precio congelado
            // precioCompraVES y precioVentaVES se actualizan con trigger
          })
          .eq("id", product.id);

        if (updateError) throw updateError;

        Toast.show({
          type: "success",
          text1: "Éxito",
          text2: "Producto actualizado correctamente.",
          position: "top",
          visibilityTime: 3000,
        });

        navigation.goBack();
      } else {
        // Crear nuevo producto
        const { error: insertError } = await supa
          .from("product")
          .insert([
            {
              nombre,
              descripcion: descripcion || null,
              categoriaID: categoriaID ? parseInt(categoriaID) : null,
              stockActual: parseInt(stockActual) || 0,
              stockMinimo: parseInt(stockMinimo) || 0,
              stockMaximo: parseInt(stockMaximo) || 0,
              unidadMedida,
              empresaID: empresaIdUser,
              proveedorID: proveedorID ? parseInt(proveedorID) : null,
              esActivo: true,
              imagen: imageUrl || null,
              precioCompraUSD: parseFloat(precioCompraUSD) || 0,
              precioVentaUSD: parseFloat(precioVentaUSD) || 0,
              precioCongelado: precioCongelado, // Guardar el valor del precio congelado
              precioCompraVES: 0,
              precioVentaVES: 0,
            },
          ]);

        if (insertError) {
          console.error("Error insertando producto:", insertError);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Ocurrió un problema al crear el producto.",
            position: "top",
            visibilityTime: 3000,
          });
          return;
        }

        Toast.show({
          type: "success",
          text1: "Éxito",
          text2: "Producto creado correctamente.",
          position: "top",
          visibilityTime: 3000,
        });

        navigation.goBack();
      }
    } catch (error) {
      console.error("Error guardando producto:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Ocurrió un problema inesperado.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#45c0e8" />
      <NavBar />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {product ? "Editar Producto" : "Nuevo Producto"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.formCard}>
            {/* Información básica */}
            <Text style={styles.sectionTitle}>📦 Información básica</Text>
            
            <InputField
              label="Nombre del producto"
              icon="tag-text"
              placeholder="Ej: Coca-Cola 2L"
              value={nombre}
              onChangeText={handleNombreChange}
            />

            <View style={styles.inputWrapper}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="text" size={18} color="#45c0e8" />
                <Text style={styles.labelText}>Descripción (opcional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ej: Bebida gaseosa sabor cola 2 litros"
                placeholderTextColor="#94a3b8"
                value={descripcion}
                onChangeText={handleDescripcionChange}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Categoría y Unidad */}
            <Text style={styles.sectionTitle}>🏷️ Clasificación</Text>
            
            <View style={styles.rowContainer}>
              {/* Categoría */}
              <View
                style={[
                  styles.dropdownSection,
                  {
                    zIndex: zIndexCategoria,
                    marginBottom: openCategoria ? 200 : 8,
                  },
                ]}
              >
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="folder" size={18} color="#45c0e8" />
                  <Text style={styles.labelText}>Categoría</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <View style={styles.dropdownInnerContainer}>
                    <DropDownPicker
                      open={openCategoria}
                      value={categoriaID}
                      items={itemsCategoria}
                      setOpen={setOpenCategoria}
                      setValue={setCategoriaID}
                      setItems={setItemsCategoria}
                      placeholder="Seleccionar categoría"
                      style={styles.dropdownAligned}
                      dropDownContainerStyle={styles.dropdownContainerAligned}
                      textStyle={styles.dropdownTextAligned}
                      placeholderStyle={styles.placeholderStyle}
                      listMode="SCROLLVIEW"
                      zIndex={zIndexCategoria}
                      zIndexInverse={3000}
                      dropDownDirection="BOTTOM"
                      closeAfterSelecting={true}
                      showTickIcon={true}
                    />
                  </View>
                </View>
              </View>

              {/* Unidad */}
              <View
                style={[
                  styles.dropdownSection,
                  {
                    zIndex: zIndexUnidad,
                    marginBottom: openUnidad ? 200 : 8,
                  },
                ]}
              >
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="scale" size={18} color="#45c0e8" />
                  <Text style={styles.labelText}>Unidad</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <View style={styles.dropdownInnerContainer}>
                    <DropDownPicker
                      open={openUnidad}
                      value={unidadMedida}
                      items={itemsUnidad}
                      setOpen={setOpenUnidad}
                      setValue={setUnidadMedida}
                      setItems={setItemsUnidad}
                      placeholder="Seleccionar unidad"
                      style={styles.dropdownAligned}
                      dropDownContainerStyle={styles.dropdownContainerAligned}
                      textStyle={styles.dropdownTextAligned}
                      placeholderStyle={styles.placeholderStyle}
                      listMode="SCROLLVIEW"
                      zIndex={zIndexUnidad}
                      zIndexInverse={3000}
                      dropDownDirection="BOTTOM"
                      closeAfterSelecting={true}
                      showTickIcon={true}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Stock */}
            <Text style={styles.sectionTitle}>📊 Control de stock</Text>
            
            <View style={styles.rowContainer}>
              {/* Stock actual - condicional según sea creación o edición */}
              {product ? (
                <StockLabel
                  label="Stock actual"
                  icon="package-variant"
                  value={stockActual}
                />
              ) : (
                <View style={styles.halfWrapper}>
                  <View style={styles.labelContainer}>
                    <MaterialCommunityIcons name="package-variant" size={18} color="#45c0e8" />
                    <Text style={styles.labelText}>Stock actual</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Ingrese cantidad"
                    placeholderTextColor="#94a3b8"
                    value={stockActual}
                    onChangeText={handleStockActualChange}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.halfWrapper}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="arrow-down" size={18} color="#45c0e8" />
                  <Text style={styles.labelText}>Stock mínimo</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese cantidad"
                  placeholderTextColor="#94a3b8"
                  value={stockMinimo}
                  onChangeText={handleStockMinimoChange}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.rowContainer}>
              <View style={styles.halfWrapper}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="arrow-up" size={18} color="#45c0e8" />
                  <Text style={styles.labelText}>Stock máximo</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese cantidad"
                  placeholderTextColor="#94a3b8"
                  value={stockMaximo}
                  onChangeText={handleStockMaximoChange}
                  keyboardType="numeric"
                />
              </View>

              {/* Proveedor */}
              <View
                style={[
                  styles.dropdownSection,
                  {
                    zIndex: zIndexProveedor,
                    marginBottom: openProveedor ? 200 : 8,
                  },
                ]}
              >
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="truck" size={18} color="#45c0e8" />
                  <Text style={styles.labelText}>Proveedor</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <View style={styles.dropdownInnerContainer}>
                    <DropDownPicker
                      open={openProveedor}
                      value={proveedorID}
                      items={itemsProveedor}
                      setOpen={setOpenProveedor}
                      setValue={setProveedorID}
                      setItems={setItemsProveedor}
                      placeholder="Seleccionar proveedor"
                      style={styles.dropdownAligned}
                      dropDownContainerStyle={styles.dropdownContainerAligned}
                      textStyle={styles.dropdownTextAligned}
                      placeholderStyle={styles.placeholderStyle}
                      listMode="SCROLLVIEW"
                      zIndex={zIndexProveedor}
                      zIndexInverse={3000}
                      dropDownDirection="BOTTOM"
                      closeAfterSelecting={true}
                      showTickIcon={true}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Precios en USD */}
            <Text style={styles.sectionTitle}>💰 Precios en USD</Text>
            
            <View style={styles.rowContainer}>
              <View style={styles.halfWrapper}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="currency-usd" size={18} color="#45c0e8" />
                  <Text style={styles.labelText}>Precio compra</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 1.50"
                  placeholderTextColor="#94a3b8"
                  value={precioCompraUSD}
                  onChangeText={handlePrecioCompraChange}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfWrapper}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="cash" size={18} color="#45c0e8" />
                  <Text style={styles.labelText}>Precio venta</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 2.50"
                  placeholderTextColor="#94a3b8"
                  value={precioVentaUSD}
                  onChangeText={handlePrecioVentaChange}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Precio Congelado en Bs */}
            <Text style={styles.sectionTitle}>🔒 Precio en Bolívares</Text>
            
            <View style={styles.precioCongeladoContainer}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="lock" size={18} color="#45c0e8" />
                <Text style={styles.labelText}>¿Este precio se congela en Bs?</Text>
              </View>
              
              <View style={styles.precioCongeladoButtons}>
                <TouchableOpacity
                  style={[
                    styles.precioCongeladoButton,
                    precioCongelado === true && styles.precioCongeladoButtonActive
                  ]}
                  onPress={() => setPrecioCongelado(true)}
                >
                  <Text style={[
                    styles.precioCongeladoButtonText,
                    precioCongelado === true && styles.precioCongeladoButtonTextActive
                  ]}>Sí</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.precioCongeladoButton,
                    precioCongelado === false && styles.precioCongeladoButtonActive
                  ]}
                  onPress={() => setPrecioCongelado(false)}
                >
                  <Text style={[
                    styles.precioCongeladoButtonText,
                    precioCongelado === false && styles.precioCongeladoButtonTextActive
                  ]}>No</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.precioCongeladoButton,
                    precioCongelado === null && styles.precioCongeladoButtonActive
                  ]}
                  onPress={() => setPrecioCongelado(null)}
                >
                  <Text style={[
                    styles.precioCongeladoButtonText,
                    precioCongelado === null && styles.precioCongeladoButtonTextActive
                  ]}>Vacío</Text>
                </TouchableOpacity>
              </View>

              {precioCongelado === true && precioVentaVESCalculado && (
                <View style={styles.precioCalculadoContainer}>
                  <MaterialCommunityIcons name="calculator" size={20} color="#27ae60" />
                  <Text style={styles.precioCalculadoText}>
                    Precio en Bs: Bs. {precioVentaVESCalculado}
                  </Text>
                  <Text style={styles.precioCalculadoSubtext}>
                    (Tasa BCV: Bs. {tasaBCV?.toFixed(2)} por USD)
                  </Text>
                </View>
              )}
            </View>

            {/* Imagen */}
            <Text style={styles.sectionTitle}>📷 Imagen del producto</Text>
            
            <View style={styles.imageButtons}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickImageFromGallery}
              >
                <MaterialCommunityIcons name="image" size={24} color="white" />
                <Text style={styles.imageButtonText}>Galería</Text>
              </TouchableOpacity>

              {Platform.OS !== "web" && (
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={takePhotoWithCamera}
                >
                  <MaterialCommunityIcons name="camera" size={24} color="white" />
                  <Text style={styles.imageButtonText}>Cámara</Text>
                </TouchableOpacity>
              )}
            </View>

            {imagen && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imagen }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImagen(null)}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            )}

            {/* Botón guardar */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveProduct}
            >
              <MaterialCommunityIcons name="content-save" size={24} color="white" />
              <Text style={styles.saveButtonText}>
                {product ? "Actualizar Producto" : "Crear Producto"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#45c0e8",
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 12,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  labelText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
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
    height: 80,
    paddingTop: 14,
    paddingBottom: 14,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  halfWrapper: {
    flex: 1,
    marginBottom: 8,
  },
  dropdownSection: {
    flex: 1,
    marginBottom: 8,
  },
  dropdownInnerContainer: {
    flex: 1,
  },
  dropdownAligned: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    height: 50,
    paddingLeft: 0,
  },
  dropdownContainerAligned: {
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 4,
    zIndex: 5000,
    elevation: 5000,
    width: '100%',
  },
  dropdownTextAligned: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
    paddingLeft: 0,
  },
  placeholderStyle: {
    color: '#94a3b8',
    fontSize: 14,
  },
  stockLabelContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
  },
  stockLabelText: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  // Nuevos estilos para precio congelado
  precioCongeladoContainer: {
    marginBottom: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  precioCongeladoButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  precioCongeladoButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  precioCongeladoButtonActive: {
    backgroundColor: "#45c0e8",
    borderColor: "#45c0e8",
  },
  precioCongeladoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  precioCongeladoButtonTextActive: {
    color: "white",
  },
  precioCalculadoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27ae60",
    alignItems: "center",
  },
  precioCalculadoText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#27ae60",
    marginTop: 4,
  },
  precioCalculadoSubtext: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  imageButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    backgroundColor: "#45c0e8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  imageButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    position: "relative",
    alignSelf: "center",
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#45c0e8",
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "white",
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateProduct;