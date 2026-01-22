import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Accordion,
  FlatList,
  Animated,
  Image,
  Switch,
} from "react-native";
import { Card, List, TextInput } from "react-native-paper";
import * as Sharing from "expo-sharing";
import { printToFileAsync } from "expo-print";
import { Picker } from "@react-native-picker/picker"; // Para lista desplegable
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupaClient } from "../Supabase/supabase";
import NavBar from "../NavBar/Components/NavBar";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import SignaturePadWeb from "../Context/SignaturePadWeb";
import * as ImageManipulator from "expo-image-manipulator";
import generateRecipeHTML from "./RecipeGenerator";
import generateRecipeSvastyHTML from "./RecipeGeneratorSvasty";
import generateMedicalReportHTML from "./MedicalReportGenerator";
import generateMedicalReportSvastyHTML from "./MedicalReportGeneratorSvasty";
import generateInterconsultHTML from "./InterconsultGenerator";
import generateInterconsultSvastyHTML from "./InterconsultGeneratorSvasty";
import generateParaclinicosHTML from "./GenerateParaclinicosHTML";
import generateParaclinicosSvastyHTML from "./GenerateParaclinicosSvastyHTML";
import generateRechazoTrasladoHTML from "./GenerateRechazoTrasladoHTML";
import generateRechazoTrasladoSvastyHTML from "./GenerateRechazoTrasladoSvastyHTML";
import generateMedicineReportHTML from "./GenerateMedicineReportHTML";

import { PDFDocument } from "pdf-lib";
import * as FileSystem from "expo-file-system";
import { useDatabase } from "../Context/DatabaseContext";

const PDFGenerator = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const reporte = route.params?.reporte || {};
  // 📌 Estados para almacenar los datos ingresados
  const [seguro, setSeguro] = useState("");
  const [fecha, setFecha] = useState("");
  const [poliza, setPoliza] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [caso, setCaso] = useState("");
  const [nombre, setNombre] = useState("");
  const [ci, setCi] = useState("");
  const [tipoDocumentoPaciente, setTipoDocumentoPaciente] = useState("V");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [titular, setTitular] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciTitular, setciTitular] = useState("");
  const [tipoDocumentoTitular, setTipoDocumentoTitular] = useState("V");
  const [hogar, setHogar] = useState("");
  const [direccion, setDireccion] = useState("");
  const [edificio, setEdificio] = useState("");
  const [piso, setPiso] = useState("");
  const [apto, setApto] = useState("");
  const [urbanizacion, setUrbanizacion] = useState("");
  const [ZonaAtencionID, setZonaAtencionID] = useState(null);
  const [estado, setEstado] = useState(null);
  const [ciudad, setCiudad] = useState(null);
  const [ZonaCiudadID, setZonaCiudadID] = useState("");
  const [referencia, setReferencia] = useState("");
  const [tabaquicos, setTabaquicos] = useState(""); // Nuevo estado
  const [unidadesDias, setUnidadesDias] = useState(""); // Nuevo estado
  const [bebidasAlcoholicas, setBebidasAlcoholicas] = useState(""); // Nuevo estado
  const [otros, setOtros] = useState(""); // Nuevo estado
  const [alergias, setAlergias] = useState(""); // Nuevo estado
  const [medicacionActual, setMedicacionActual] = useState(""); // Nuevo estado
  const [intervencionesOx, setIntervencionesOx] = useState(""); // Nuevo estado
  const [antecedentesMedicos, setAntecedentesMedicos] = useState("");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [enfermedadActual, setEnfermedadActual] = useState("");
  const [horaInicial, setHoraInicial] = useState("");
  const [TA1Inicial, setTA1Inicial] = useState("");
  const [FC1Inicial, setFC1Inicial] = useState("");
  const [FR1Inicial, setFR1Inicial] = useState("");
  const [TemperaturaInicial, setTemperaturaInicial] = useState("");
  const [GlicemiaInicial, setGlicemiaInicial] = useState("");
  const [GlasgowInicial, setGlasgowInicial] = useState("");
  const [SatInicial, setSatInicial] = useState("");
  const [horaFinal, setHoraFinal] = useState("");
  const [TA2Final, setTA2Final] = useState("");
  const [FC2Final, setFC2Final] = useState("");
  const [FR2Final, setFR2Final] = useState("");
  const [TemperaturaFinal, setTemperaturaFinal] = useState("");
  const [GlicemiaFinal, setGlicemiaFinal] = useState("");
  const [GlasgowFinal, setGlasgowFinal] = useState("");
  const [SatFinal, setSatFinal] = useState("");
  const [General, setGeneral] = useState("");
  const [PielMucosas, setPielMucosas] = useState("");
  const [CabezaORL, setCabezaORL] = useState("");
  const [Cardiopulmonar, setCardiopulmonar] = useState("");
  const [Abdomen, setAbdomen] = useState("");
  const [Miembros, setMiembros] = useState("");
  const [Pulsos, setPulsos] = useState("");
  const [Neurológicos, setNeurológicos] = useState("");
  const [Observaciones, setObservaciones] = useState("");
  const [IDX, setIDX] = useState("");
  const [TratamientoAdministrado, setTratamientoAdministrado] = useState("");
  const [TratamientoAplicado, setTratamientoAplicado] = useState("");
  const [TratamientoAmbulatorio, setTratamientoAmbulatorio] = useState("");
  const [
    EspecificaciónTratamientoAmbulatorio,
    setEspecificaciónTratamientoAmbulatorio,
  ] = useState("");
  const [Paraclinicos, setParaclinicos] = useState("");
  const [ExLaboratorio, setExLaboratorio] = useState("");
  const [ExRadiologia, setExRadiologia] = useState("");
  const [Referido, setReferido] = useState("");
  const [HoraInicioAT, setHoraInicioAT] = useState("");
  const [HoraFinAT, setHoraFinAT] = useState("");
  const [Traslado, setTraslado] = useState("");
  const [NombreParamédico, setNombreParamédico] = useState("");
  const [MédicoRecibe, setMédicoRecibe] = useState("");
  const [EstadoClinicoFinal, setEstadoClinicoFinal] = useState("");
  const [Recipe, setRecipe] = useState("");
  const [Indicaciones, setIndicaciones] = useState("");
  const [especialidadMedica, setEspecialidadMedica] = useState("");
  const [expandedRechazo, setExpandedRechazo] = useState(false);
  const [expandedMedicamentos, setExpandedMedicamentos] = useState(false);
  const [primeraVezGeneradoPDF, setPrimeraVezGeneradoPDF] = useState(true);

  const [quienLlena, setQuienLlena] = useState(null);
  const [quienLlenaOpen, setQuienLlenaOpen] = useState(false);

  const [nombreRepresentante, setNombreRepresentante] = useState("");
  const [ciRepresentante, setCiRepresentante] = useState("");

  const [firmaRechazo, setFirmaRechazo] = useState("");

  const [selectedPdfTypes, setSelectedPdfTypes] = useState({
    reporte: true, // Por defecto seleccionado
    recipe: false,
    interconsulta: false,
    rechazoTraslado: false,
  });

  const [pdfUri, setPdfUri] = useState(null);
  const supa = SupaClient();
  const timeoutRef = useRef(null);

  const [photos, setPhotos] = useState([]); // Para almacenar las fotos seleccionadas
  const [photoUri, setPhotoUri] = useState(null); // Para la vista previa

  const [inputTimer, setInputTimer] = useState(null); // Guardar el temporizador

  const [medicamentosItems, setMedicamentosItems] = useState([]);
  const [medicamentosOpen, setMedicamentosOpen] = useState(false);
  const [medicamentosSeleccionados, setMedicamentosSeleccionados] = useState(
    []
  );
  const [medicamentosLoading, setMedicamentosLoading] = useState(false);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState(null);
  const [cantidadMedicamento, setCantidadMedicamento] = useState("");
  const [medicamentosEntregar, setMedicamentosEntregar] = useState([]);
  const [recibeConforme, setRecibeConforme] = useState(true);
  let ciTimer = null;
  const [useSvastyFormat, setUseSvastyFormat] = useState(false);

  const buscarPaciente = async (cedula) => {
    const { data, error } = await supa
      .from("medicalReport")
      .select("*")
      .eq("ciPaciente", cedula)
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      console.error("❌ Error buscando paciente:", error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    const p = data[0];

    // --- AUTORELLENO ---
    if (p.compañiaSeguro) setSeguro(() => p.compañiaSeguro);
    if (p.empresa) setEmpresa(p.empresa);
    if (p.nombrePaciente) setNombre(p.nombrePaciente);
    if (p.sexo) setSexo(p.sexo);
    if (p.titularPoliza) setTitular(p.titularPoliza);
    if (p.telefono) setTelefono(p.telefono);
    if (p.ciTitular) setciTitular(String(p.ciTitular));
    if (p.direccion) setHogar(() => p.direccion);
    if (p.avenida) setDireccion(p.avenida);
    if (p.edificio) setEdificio(p.edificio);
    if (p.piso) setPiso(String(p.piso));
    if (p.apt) setApto(p.apt);
    if (p.urb) setUrbanizacion(p.urb);
    if (p.tabaquicos) setTabaquicos(p.tabaquicos);
    if (p.unidadesDias) setUnidadesDias(p.unidadesDias);
    if (p.bebidasAlcoholicas) setBebidasAlcoholicas(p.bebidasAlcoholicas);
    if (p.otros) setOtros(p.otros);
    if (p.alergias) setAlergias(p.alergias);
    if (p.intervencionesOx) setIntervencionesOx(p.intervencionesOx);
    if (p.antecedentesMedicos) setAntecedentesMedicos(p.antecedentesMedicos);
    if (p.estado) setEstado(() => p.estado);
    if (p.ciudad) setCiudad(() => p.ciudad);
    if (p.puntoReferencia) setReferencia(p.puntoReferencia);
    if (p.tipoDocumentoPaciente)
      setTipoDocumentoPaciente(() => p.tipoDocumentoPaciente);
    if (p.tipoDocumentoTitular)
      setTipoDocumentoTitular(() => p.tipoDocumentoTitular);
  };

  useEffect(() => {
    if (ciTimer) clearTimeout(ciTimer);

    // No buscar si tiene menos de 6 dígitos
    if (!ci || ci.length < 6) return;

    // Esperar 5 segundos desde que el usuario deja de escribir
    ciTimer = setTimeout(() => {
      buscarPaciente(ci);
    }, 5000);

    return () => clearTimeout(ciTimer);
  }, [ci]);

  const procesarFirma = async (uri) => {
    try {
      // Puedes ajustar el crop aquí si sabes la región de firma
      const cropResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: 0,
              originY: 0,
              width: 800, // Ajusta según tus necesidades
              height: 300, // Firma tipo horizontal
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG, base64: true }
      );

      return `data:image/png;base64,${cropResult.base64}`;
    } catch (error) {
      console.error("Error procesando firma:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchMedicamentos = async () => {
      setMedicamentosLoading(true);
      const { data, error } = await supa
        .from("medicine")
        .select("MedicamentoBarCode, Nombre")
        .eq("Status", true);

      if (!error && data) {
        setMedicamentosItems(
          data.map((m) => ({
            label: m.Nombre,
            value: m.MedicamentoBarCode,
          }))
        );
      }
      setMedicamentosLoading(false);
    };
    fetchMedicamentos();
  }, []);

  const formatTime12Hour = (input) => {
    let cleanedInput = input.replace(/[^0-9:]/g, "");

    if (cleanedInput.length <= 2) return cleanedInput;
    if (!cleanedInput.includes(":") && cleanedInput.length >= 3) {
      cleanedInput = `${cleanedInput.slice(0, 2)}:${cleanedInput.slice(2)}`;
    }

    let [hours, minutes] = cleanedInput
      .split(":")
      .map((num) => parseInt(num, 10));

    if (isNaN(hours) || hours < 0 || hours > 23) return "";
    if (isNaN(minutes) || minutes < 0 || minutes > 59) return "";

    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const generatePhotosHTML = (photos) => {
    return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .photo {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            page-break-after: always;
          }
          img {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        ${photos
          .map((photo) => {
            const isPng =
              photo.type === "image/png" ||
              photo.uri?.toLowerCase().endsWith(".png");
            const mimeType = isPng ? "image/png" : "image/jpeg";

            return `
              <div class="photo">
                <img src="data:${mimeType};base64,${photo.base64}" />
              </div>
            `;
          })
          .join("")}
      </body>
    </html>
  `;
  };

  const obtenerNombreCiudad = async (ciudad) => {
    try {
      if (!ciudad) return ""; // Ahora retorna string vacío en lugar de null

      const { data, error } = await supa
        .from("ciudad") // Asegúrate que el nombre de la tabla es correcto
        .select("CiudadNombre")
        .eq("ZonaCiudadID", ciudad) // Filtramos por ZonaCiudadID
        .single(); // Obtenemos solo un registro

      if (error) throw error;

      // Verificamos si existe data y si tiene CiudadNombre
      const nombre = data?.CiudadNombre || "";

      return nombre; // Siempre retorna string (incluso vacío si no se encontró)
    } catch (error) {
      console.error("Error al obtener el nombre de la ciudad:", error);
      return ""; // Ahora retorna string vacío en caso de error
    }
  };

  useEffect(() => {
    const verificarAcceso = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        const user = session ? JSON.parse(session) : null;

        // Si no hay usuario o no está activo, redirigir
        if (!user || !user.esActivo) {
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

        // Verificar en la base de datos el estado actual
        const { data, error } = await supa
          .from("user")
          .select("*")
          .eq("cedula", user.cedula)
          .eq("tipoDocumento", user.tipoDocumento)
          .single();

        if (error || !data?.esActivo) {
          await AsyncStorage.removeItem("userSession");
          Toast.show({
            type: "error",
            text1: "Sesión Inactiva",
            text2: "Cerrando Sesión.",
            position: "top",
            visibilityTime: 3000,
          });
          navigation.navigate("Log_in");
        }
      } catch (error) {
        console.error("Error verificando acceso:", error);
        navigation.navigate("PaginaPrincipal");
      }
    };

    verificarAcceso();
  }, []);

  const handleHoraChange = (text, setHora) => {
    setHora(text); // Mostrar el texto sin formatear mientras el usuario escribe

    // Cancelar cualquier temporizador anterior
    if (inputTimer) clearTimeout(inputTimer);

    // Configurar un nuevo temporizador de 3 segundos antes de formatear
    const newTimer = setTimeout(() => {
      setHora(formatTime12Hour(text));
    }, 3000); // ⏳ Espera 3 segundos antes de formatear

    setInputTimer(newTimer); // Guardar el temporizador actual
  };

  useEffect(() => {
    const fetchProviders = async () => {
      const session = await AsyncStorage.getItem("userSession");
      const user = session ? JSON.parse(session) : null;

      if (!user) return;

      const codes = [user.proveedor1, user.proveedor2, user.proveedor3].filter(
        Boolean
      );

      if (codes.length === 0) return;

      const { data, error } = await supa
        .from("provider")
        .select("nombre, codigo, esActivo")
        .in("codigo", codes)
        .eq("esActivo", true);

      if (error) {
        console.error("Error al cargar proveedores:", error);
        return;
      }

      const formatted = data.map((p) => ({ label: p.nombre, value: p.nombre }));
      setProviderOptions(formatted);

      // 👉 Detectar proveedor único
      if (formatted.length === 1) {
        setSelectedProvider(formatted[0].value); // código
        setSelectedProviderName(formatted[0].label); // nombre
      }
    };

    fetchProviders();
  }, []);

  const MyAccordion = ({ title, children }) => {
    const [expanded, setExpanded] = React.useState(false);

    return (
      <Card style={{ margin: 10 }}>
        <Card.Title title={title} onPress={() => setExpanded(!expanded)} />
        {expanded && <Card.Content>{children}</Card.Content>}
      </Card>
    );
  };

  const addImageToPDF = async (pdf, imageUri) => {
    if (Platform.OS === "web") {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          // Calcular dimensiones manteniendo relación de aspecto
          const imgRatio = img.width / img.height;
          let width = pageWidth * 0.8;
          let height = width / imgRatio;

          if (height > pageHeight * 0.8) {
            height = pageHeight * 0.8;
            width = height * imgRatio;
          }

          const x = (pageWidth - width) / 2;
          const y = (pageHeight - height) / 2;

          pdf.addPage([pageWidth, pageHeight]);
          pdf.addImage(img, "JPEG", x, y, width, height);
          resolve();
        };
        img.onerror = (error) => {
          console.error("Error loading image:", error);
          resolve();
        };
        img.src = imageUri;
      });
    } else {
      // Mantén la implementación móvil existente
      // ...
    }
  };

  const createPhotosPDF = async () => {
    try {
      if (photos.length === 0) return null;

      // Crear un nuevo PDF para las fotos
      const pdfDoc = await PDFDocument.create();

      for (const photo of photos) {
        let imageBytes;

        if (Platform.OS === "web") {
          imageBytes = Uint8Array.from(atob(photo.base64), (c) =>
            c.charCodeAt(0)
          );
        } else {
          const fileContent = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          imageBytes = Uint8Array.from(
            fileContent.split("").map((char) => char.charCodeAt(0))
          );
        }

        let image;
        try {
          if (
            photo.type === "image/png" ||
            photo.uri.toLowerCase().endsWith(".png")
          ) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            // Por defecto intenta con JPG
            image = await pdfDoc.embedJpg(imageBytes);
          }
        } catch (e) {
          console.error("No se pudo cargar la imagen:", e);
          continue;
        }

        // Añadir página con la imagen centrada
        const page = pdfDoc.addPage([595, 842]); // Tamaño A4
        const { width, height } = image.scale(0.8); // Reducir tamaño al 80%
        const x = (595 - width) / 2; // Centrar horizontalmente
        const y = (842 - height) / 2; // Centrar verticalmente

        page.drawImage(image, {
          x,
          y,
          width,
          height,
        });
      }

      // Guardar el PDF temporal
      const pdfBytes = await pdfDoc.save();
      const base64String = btoa(String.fromCharCode(...pdfBytes));
      const tempUri = `${FileSystem.documentDirectory}photos_${Date.now()}.pdf`;

      await FileSystem.writeAsStringAsync(tempUri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return tempUri;
    } catch (error) {
      console.error("Error creando PDF de fotos:", error);
      return null;
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === "web") {
        return new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.multiple = true;

          input.onchange = (e) => {
            const files = Array.from(e.target.files);
            const newPhotos = [];

            files.forEach((file) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                const newPhoto = {
                  uri: event.target.result,
                  base64: event.target.result.split(",")[1],
                  name: file.name,
                  type: file.type,
                  file: file,
                };
                newPhotos.push(newPhoto);

                if (newPhotos.length === files.length) {
                  setPhotos([...photos, ...newPhotos]);
                  resolve();
                }
              };
              reader.readAsDataURL(file);
            });
          };

          input.click();
        });
      } else {
        // Solo en App: mostrar opciones
        Alert.alert(
          "Agregar imagen",
          "¿Cómo deseas obtener la imagen?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Desde galería",
              onPress: async () => {
                const { status } =
                  await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert(
                    "Permisos requeridos",
                    "Necesitamos acceso a la galería"
                  );
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: false,
                  base64: true,
                  quality: 1,
                });

                if (!result.canceled && result.assets) {
                  const newPhoto = {
                    uri: result.assets[0].uri,
                    base64: result.assets[0].base64,
                    name: `photo_${Date.now()}.jpg`,
                    type: result.assets[0].type || "image/jpeg",
                  };

                  setPhotos((prev) => [...prev, newPhoto]);

                  Toast.show({
                    type: "success",
                    text1: "Foto agregada",
                    text2: "La foto se añadió correctamente al reporte",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }
              },
            },
            {
              text: "Tomar foto",
              onPress: async () => {
                const { status } =
                  await ImagePicker.requestCameraPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert(
                    "Permisos requeridos",
                    "Necesitamos acceso a la cámara"
                  );
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  allowsEditing: false,
                  base64: true,
                  quality: 1,
                });

                if (!result.canceled && result.assets) {
                  const newPhoto = {
                    uri: result.assets[0].uri,
                    base64: result.assets[0].base64,
                    name: `photo_${Date.now()}.jpg`,
                    type: result.assets[0].type || "image/jpeg",
                  };

                  setPhotos((prev) => [...prev, newPhoto]);

                  Toast.show({
                    type: "success",
                    text1: "Foto tomada",
                    text2: "La foto se añadió correctamente al reporte",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }
              },
            },
          ],
          { cancelable: true }
        );
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo obtener la imagen",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const validarCamposObligatorios = (dataToSave) => {
    const camposObligatorios = [
      { key: "seguro", label: "Compañía de seguro" },
      { key: "fecha", label: "Fecha de Consulta" },
      { key: "empresa", label: "Nombre empresa" },
      { key: "caso", label: "Número caso" },
      { key: "nombre", label: "Nombre del Paciente" },
      { key: "ci", label: "Cédula de Identidad" },
      { key: "tipoDocumentoPaciente", label: "Tipo documento paciente" },
      { key: "edad", label: "Edad" },
      { key: "sexo", label: "Sexo" },
      { key: "titular", label: "Nombre titular" },
      { key: "telefono", label: "Teléfono" },
      { key: "ciTitular", label: "Cédula titular" },
      { key: "tipoDocumentoTitular", label: "Tipo documento titular" },
      { key: "motivoConsulta", label: "Motivo de Consulta" },
      { key: "enfermedadActual", label: "Enfermedad Actual" },
      { key: "horaInicial", label: "Hora Inicial" },
      { key: "TA1Inicial", label: "TA1 Inicial" },
      { key: "FC1Inicial", label: "FC1 Inicial" },
      { key: "FR1Inicial", label: "FR1 Inicial" },
      { key: "GlasgowInicial", label: "Glasgow Inicial" },
      { key: "SatInicial", label: "Sat 02% Inicial" },
      { key: "General", label: "General" },
      { key: "Cardiopulmonar", label: "Cardiopulmonar" },
      { key: "Abdomen", label: "Abdomen" },
      { key: "Miembros", label: "Miembros superiores" },
      { key: "Neurológicos", label: "Neurológicos" },
      { key: "HoraInicioAT", label: "HoraInicioAT" },
      { key: "HoraFinAT", label: "HoraFinAT" },
    ];

    let camposFaltantes = [];

    camposObligatorios.forEach((campo) => {
      const valor = dataToSave[campo.key];
      if (
        valor === undefined ||
        valor === null ||
        (typeof valor === "string" && valor.trim() === "")
      ) {
        camposFaltantes.push(campo.label);
      }
    });

    // Validación específica para sexo
    if (
      dataToSave.sexo &&
      typeof dataToSave.sexo === "string" &&
      !["M", "F"].includes(dataToSave.sexo.toUpperCase())
    ) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "El campo 'Sexo' solo puede ser 'M' o 'F'.",
        position: "top",
        visibilityTime: 3000,
      });
      return false;
    }

    if (camposFaltantes.length > 0) {
      Toast.show({
        type: "info",
        text1: "Campos obligatorios",
        text2: "Por favor completar:\n" + camposFaltantes.join("\n"),
        position: "top",
        visibilityTime: 4000,
      });
      return false;
    }

    return true;
  };

  const mergePDFs = async (pdfUris, fileName) => {
    try {
      const mergedPdf = await PDFDocument.create();

      for (const uri of pdfUris) {
        const pdfBytes = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          pdfDoc,
          pdfDoc.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const finalPdfBytes = await mergedPdf.saveAsBase64();
      const mergedFilePath = `${FileSystem.documentDirectory}${fileName}.pdf`;

      await FileSystem.writeAsStringAsync(mergedFilePath, finalPdfBytes, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return mergedFilePath;
    } catch (error) {
      return null;
    }
  };

  const validateDateFormat = (text) => {
    const datePattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return datePattern.test(text);
  };

  const handleFechaChange = (text) => {
    const cleanText = text.replace(/[^0-9/]/g, ""); // 🔹 Solo permite números y "/"
    if (cleanText.length > 10) return; // 🔹 Evita que pase los 10 caracteres

    setFecha(cleanText);

    // 🔹 Limpiar timeout anterior antes de iniciar uno nuevo
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 🔹 Esperar 3 segundos antes de validar
    timeoutRef.current = setTimeout(() => {
      if (!validateDateFormat(cleanText)) {
        Toast.show({
          type: "error",
          text1: "Formato incorrecto",
          text2: "La fecha debe ser en formato DD/MM/YYYY.",
          position: "top",
          visibilityTime: 3000,
        });
      }
    }, 3000);
  };

  const pickSignatureImage = async () => {
    try {
      let result;
      if (Platform.OS === "web") {
        // Web: usar input de archivo
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setFirmaRechazo(reader.result); // Base64 para web
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        // App (Expo ImagePicker)
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          alert("Se necesita permiso para acceder a la galería");
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 1,
        });

        if (!result.cancelled) {
          setFirmaRechazo(`data:image/jpeg;base64,${result.base64}`);
        }
      }
    } catch (error) {
      console.error("Error al seleccionar firma:", error);
      alert("Error al seleccionar firma.");
    }
  };

  const calcularTurno = (hora) => {
    try {
      const [horaStr, minutosStr] = hora.split(":");
      let horaNum = parseInt(horaStr);
      const amPm = hora.toLowerCase().includes("pm") ? "pm" : "am";

      if (amPm === "pm" && horaNum !== 12) horaNum += 12;
      if (amPm === "am" && horaNum === 12) horaNum = 0;

      // Turno diurno entre 07:00 y 18:59 (inclusive)
      return horaNum >= 7 && horaNum < 19 ? "Diurno" : "Nocturno";
    } catch (error) {
      console.warn("Error calculando turno:", error);
      return "Desconocido";
    }
  };

  const getMedicalReportHTML = (data) => {
    return useSvastyFormat
      ? generateMedicalReportSvastyHTML(data)
      : generateMedicalReportHTML(data);
  };

  const getRecipeHTML = (data) => {
    return useSvastyFormat
      ? generateRecipeSvastyHTML(data)
      : generateRecipeHTML(data);
  };

  const getInterconsultHTML = (data) => {
    return useSvastyFormat
      ? generateInterconsultSvastyHTML(data)
      : generateInterconsultHTML(data);
  };

  const getParaclinicosHTML = (data) => {
    return useSvastyFormat
      ? generateParaclinicosSvastyHTML(data)
      : generateParaclinicosHTML(data);
  };

  const getRechazoTrasladoHTML = (data) => {
    return useSvastyFormat
      ? generateRechazoTrasladoSvastyHTML(data)
      : generateRechazoTrasladoHTML(data);
  };

  const enviarCasoAppSheet = async () => {
    const emailDoctor = await obtenerEmailDesdeCaso(caso);

    // Mostrar Toast de confirmación primero
    Toast.show({
      type: "customConfirm",
      text1: "Enviar Reporte Médico",
      text2:
        "¿Estás seguro de que deseas enviar este reporte? Verifica que toda la información es correcta.",
      position: "top",
      autoHide: false,
      props: {
        buttons: [
          {
            text: "Cancelar",
            onPress: () => Toast.hide(),
            style: { color: "#666" },
          },
          {
            text: "Enviar",
            onPress: async () => {
              Toast.hide();

              // Mostrar loader mientras se procesa
              Toast.show({
                type: "info",
                text1: "Enviando reporte...",
                position: "top",
                autoHide: false,
              });

              try {
                const turno = calcularTurno(HoraInicioAT);
                const urlCaso =
                  "https://api.appsheet.com/api/v2/apps/a602fb72-2d0e-4f93-a261-4b9a2e6eff47/tables/CasosDoctor/Action";
                const apiKey =
                  "V2-SUzRC-NP6hs-qs5gC-lNuf7-dIV3d-avSpT-dC9b1-gOKSi";

                // ------------------------
                // 1️⃣ Enviar el reporte médico (caso)
                // ------------------------
                const bodyCaso = {
                  Action: "Add",
                  Properties: {
                    Locale: "es-ES",
                    RunAsUserEmail: emailDoctor,
                  },
                  Rows: [
                    {
                      RegistroCasosID: caso,
                      Fecha: fecha,
                      Cliente: seguro,
                      TipoServicio: "AMD",
                      Turno: turno,
                      Estado: estado,
                      Ciudad: ciudad,
                      CedulaTitular: ciTitular,
                      NombreTitular: titular,
                      CedulaPaciente: ci,
                      NombrePaciente: nombre,
                      Observaciones: Observaciones,
                      AdministroTratamiento: TratamientoAdministrado,
                    },
                  ],
                };

                const responseCaso = await fetch(urlCaso, {
                  method: "POST",
                  headers: {
                    ApplicationAccessKey: apiKey,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(bodyCaso),
                });

                const resultCaso = await responseCaso.json();

                if (!responseCaso.ok) {
                  Toast.hide();
                  Toast.show({
                    type: "error",
                    text1: "Error al enviar caso",
                    text2:
                      resultCaso?.message || "No se pudo completar el envío.",
                    position: "top",
                    visibilityTime: 3000,
                  });
                  return;
                }

                // ------------------------
                // 2️⃣ Enviar entrega de medicamentos si existen
                // ------------------------
                // ------------------------
                // 2️⃣ Enviar entrega de medicamentos si existen
                // ------------------------
                if (medicamentosEntregar.length > 0) {
                  const urlMedicamentos =
                    "https://api.appsheet.com/api/v2/apps/a602fb72-2d0e-4f93-a261-4b9a2e6eff47/tables/MedicamentosMovimientos/Action";

                  for (const m of medicamentosEntregar) {
                    const bodyMedicamento = {
                      Action: "Add",
                      Properties: {
                        Locale: "es-ES",
                        RunAsUserEmail: emailDoctor,
                      },
                      Rows: [
                        {
                          UsuarioID: String(CIDoctor),
                          MedicamentoID: m.MedicamentoBarCode,
                          Cantidad: m.cantidad,
                          RegistroCasoID: caso,
                        },
                      ],
                    };

                    const responseMed = await fetch(urlMedicamentos, {
                      method: "POST",
                      headers: {
                        ApplicationAccessKey: apiKey,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(bodyMedicamento),
                    });

                    const resultMed = await responseMed.json();

                    if (!responseMed.ok) {
                      Toast.hide();
                      Toast.show({
                        type: "error",
                        text1: "Error al enviar medicamento",
                        text2:
                          resultMed?.message ||
                          `Fallo con medicamento ${m.MedicamentoBarCode}`,
                        position: "top",
                        visibilityTime: 3000,
                      });
                      return; // cortamos si uno falla
                    }
                  }
                }

                // ------------------------
                // ✅ Todo enviado correctamente
                // ------------------------
                Toast.hide();
                Toast.show({
                  type: "success",
                  text1: "Reporte enviado",
                  text2:
                    "El caso y la entrega de medicamentos se registraron correctamente.",
                  position: "top",
                  visibilityTime: 3000,
                });
              } catch (error) {
                console.error("❌ Error general al enviar:", error);
                Toast.hide(); // Ocultar loader
                Toast.show({
                  type: "error",
                  text1: "Error de conexión",
                  text2: "No se pudo conectar con el servidor.",
                  position: "top",
                  visibilityTime: 3000,
                });
              }
            },
            style: { color: "#2196F3", fontWeight: "bold" },
          },
        ],
      },
    });
  };

  const generatePDF = async () => {
    try {
      const ciudadNombre = await obtenerNombreCiudad(ciudad);
      const dataToSave = {
        seguro,
        fecha,
        poliza,
        empresa,
        caso,
        nombre,
        ci,
        tipoDocumentoPaciente,
        edad,
        sexo,
        titular,
        telefono,
        ciTitular,
        tipoDocumentoTitular,
        hogar,
        direccion,
        edificio,
        piso,
        apto,
        urbanizacion,
        ciudadNombre,
        referencia,
        tabaquicos,
        unidadesDias,
        bebidasAlcoholicas,
        otros,
        alergias,
        medicacionActual,
        intervencionesOx,
        antecedentesMedicos,
        motivoConsulta,
        enfermedadActual,
        horaInicial,
        TA1Inicial,
        FC1Inicial,
        FR1Inicial,
        TemperaturaInicial,
        GlicemiaInicial,
        GlasgowInicial,
        SatInicial,
        horaFinal,
        TA2Final,
        FC2Final,
        FR2Final,
        TemperaturaFinal,
        GlicemiaFinal,
        GlasgowFinal,
        SatFinal,
        General,
        PielMucosas,
        CabezaORL,
        Cardiopulmonar,
        Abdomen,
        Miembros,
        Pulsos,
        Neurológicos,
        Observaciones,
        IDX,
        TratamientoAplicado,
        TratamientoAdministrado,
        TratamientoAmbulatorio,
        EspecificaciónTratamientoAmbulatorio,
        Paraclinicos,
        ExLaboratorio,
        ExRadiologia,
        Referido,
        userName,
        msds,
        especialidad,
        CM,
        proveedor: selectedProviderName,
        CIDoctor,
        tipoDocumento,
        HoraInicioAT,
        HoraFinAT,
        Traslado,
        NombreParamédico,
        MédicoRecibe,
        EstadoClinicoFinal,
        firmaUrl,
        Recipe,
        Indicaciones,
        especialidadMedica,
        nombreRepresentante,
        ciRepresentante,
        firmaRechazo,
        quienLlena,
        recibeConforme,
      };

      // Verificar si hay paraclínicos para incluir
      const hasExLaboratorio = dataToSave.ExLaboratorio !== "";
      const hasExRadiologia = dataToSave.ExRadiologia !== "";
      const tieneExamenes = hasExLaboratorio || hasExRadiologia;

      // Validar que al menos un tipo esté seleccionado
      if (
        !selectedPdfTypes.reporte &&
        !selectedPdfTypes.recipe &&
        !selectedPdfTypes.interconsulta &&
        !selectedPdfTypes.rechazoTraslado
      ) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Selecciona al menos un tipo de documento",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      let photoFiles = [];
      let reportFile = null;
      let recipeFile = null;
      let interconsultFile = null;
      let rechazoTrasladoFile = null;
      let exLaboratorioFile = null;
      let entregaMedicamentosFile = null;
      let jsPDF, html2canvas;
      let pdfUris = [];

      if (Platform.OS === "web") {
        const { default: jsPDF } = await import("jspdf");
        const html2canvas = await import("html2canvas");

        const fileName = `${dataToSave.nombre}_${dataToSave.caso}`
          .replace(/\s+/g, "_")
          .replace(/[^\w\-]/g, "");

        const createPDFPage = async (html, isLandscape = false) => {
          const element = document.createElement("div");
          element.style.width = isLandscape ? "297mm" : "210mm";
          element.style.height = isLandscape ? "210mm" : "297mm";

          // Ajustar el padding según la orientación
          if (isLandscape) {
            // Para documentos horizontales (recipe) usa menos padding o ninguno
            element.style.padding = "0mm"; // o '0' si prefieres
          } else {
            // Para documentos verticales (reporte) mantén el padding original
            element.style.padding = "10mm";
          }

          element.style.boxSizing = "border-box";
          element.style.position = "absolute";
          element.style.left = "-9999px";
          element.style.top = "0";
          element.style.background = "#fff";
          element.innerHTML = html;

          document.body.appendChild(element);

          const canvas = await html2canvas.default(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#FFFFFF",
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            logging: false,
          });

          document.body.removeChild(element);

          return canvas.toDataURL("image/jpeg", 0.92);
        };

        // Crear el PDF principal (siempre portrait por defecto)
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        let isFirstPage = true;

        // Lógica para Reporte Médico
        if (selectedPdfTypes.reporte) {
          const imgData = await createPDFPage(getMedicalReportHTML(dataToSave));

          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
          isFirstPage = false;
        }

        // Lógica para Interconsulta
        if (selectedPdfTypes.interconsulta) {
          const imgData = await createPDFPage(getInterconsultHTML(dataToSave));
          if (!isFirstPage) {
            pdf.addPage([210, 297], "portrait");
          }
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
          isFirstPage = false;
        }

        // Lógica especial para Recipe
        if (selectedPdfTypes.recipe) {
          const imgData = await createPDFPage(getRecipeHTML(dataToSave));

          if (isFirstPage) {
            // Caso especial: Recipe es el primer documento
            pdf.addPage([297, 210], "portrait"); // Agregar página landscape
            pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
            pdf.deletePage(1); // Eliminar la página portrait vacía inicial
          } else {
            // Recipe no es el primer documento
            pdf.addPage([297, 210], "portrait");
            pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
          }

          isFirstPage = false;
        }

        // Lógica para Rechazo Traslado
        if (selectedPdfTypes.rechazoTraslado) {
          const imgData = await createPDFPage(
            getRechazoTrasladoHTML(dataToSave)
          );
          if (!isFirstPage) {
            pdf.addPage([210, 297], "portrait");
          }
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
          isFirstPage = false;
        }

        // Paraclínicos (se añade automáticamente si hay contenido)
        if (tieneExamenes) {
          const imgData = await createPDFPage(
            getParaclinicosHTML(dataToSave),
            true // landscape como el recipe
          );

          if (isFirstPage) {
            pdf.addPage([297, 210], "landscape");
            pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
            pdf.deletePage(1);
          } else {
            pdf.addPage([297, 210], "landscape");
            pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
          }
          isFirstPage = false;
        }

        // Reporte de Medicamentos (se añade automáticamente si hay medicamentos)
        if (medicamentosEntregar.length > 0) {
          const imgData = await createPDFPage(
            generateMedicineReportHTML({
              ...dataToSave,
              medicamentos: medicamentosEntregar, // 🔹 paso la lista
            })
          );

          if (!isFirstPage) {
            pdf.addPage([210, 297], "portrait");
          }
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
          isFirstPage = false;
        }

        // Agregar fotos si existen
        if (photos.length > 0) {
          for (const photo of photos) {
            await addImageToPDF(pdf, photo.uri);
          }
        }

        pdf.save(`${fileName}.pdf`);

        Toast.show({
          type: "success",
          text1: "PDF Generado",
          text2: `Se ha creado el PDF: ${fileName}.pdf`,
          position: "top",
          visibilityTime: 3000,
        });
      } else {
        // 📌 Generar Reporte Médico
        if (selectedPdfTypes.reporte) {
          const htmlReport = getMedicalReportHTML(dataToSave);
          reportFile = await printToFileAsync({
            html: htmlReport,
            base64: false,
            ...(Platform.OS === "ios" ? { width: 600, height: 900 } : {}),
          });
        }

        // 📌 Generar Recipe (en landscape)
        if (selectedPdfTypes.recipe) {
          const htmlRecipe = getRecipeHTML(dataToSave);
          recipeFile = await printToFileAsync({
            html: htmlRecipe,
            base64: false,
            ...(Platform.OS === "ios" ? { width: 600, height: 900 } : {}),
          });
        }

        // 📌 Generar Interconsulta
        if (selectedPdfTypes.interconsulta) {
          const htmlInterconsult = getInterconsultHTML(dataToSave);
          interconsultFile = await printToFileAsync({
            html: htmlInterconsult,
            base64: false,
            ...(Platform.OS === "ios" ? { width: 600, height: 900 } : {}),
          });
        }

        // 📌 Generar Interconsulta
        if (selectedPdfTypes.rechazoTraslado) {
          const htmlRechazoTraslado = getRechazoTrasladoHTML(dataToSave);
          rechazoTrasladoFile = await printToFileAsync({
            html: htmlRechazoTraslado,
            base64: false,
            ...(Platform.OS === "ios" ? { width: 600, height: 900 } : {}),
          });
        }

        // Paraclínicos (se añade automáticamente si hay contenido)
        if (tieneExamenes) {
          const htmlParaclinicos = getParaclinicosHTML(dataToSave);
          exLaboratorioFile = await printToFileAsync({
            html: htmlParaclinicos,
            base64: false,
            ...(Platform.OS === "ios"
              ? { format: "A4", orientation: "landscape" }
              : { width: 842, height: 595 }),
          });
        }

        if (medicamentosEntregar.length > 0) {
          const htmlMedicamentosHTML = generateMedicineReportHTML({
            ...dataToSave,
            medicamentos: medicamentosEntregar, // aquí inyectas la lista
          });
          entregaMedicamentosFile = await printToFileAsync({
            html: htmlMedicamentosHTML,
            base64: false,
            ...(Platform.OS === "ios" ? { width: 600, height: 900 } : {}),
          });
        }
        //viraralrevez

        // 📌 Generar PDF con fotos si aplica
        let photosFile = null;
        if (photos.length > 0) {
          const htmlPhotos = generatePhotosHTML(photos);
          photosFile = await printToFileAsync({
            html: htmlPhotos,
            base64: false,
            ...(Platform.OS === "ios"
              ? { format: "A4", orientation: "portrait" }
              : {}),
          });
        }

        const fileName = `${dataToSave.nombre}_${dataToSave.caso}`
          .replace(/\s+/g, "_")
          .replace(/[^\w\-]/g, "");

        const pdfUris = [];
        if (reportFile?.uri) pdfUris.push(reportFile.uri);
        if (recipeFile?.uri) pdfUris.push(recipeFile.uri);
        if (interconsultFile?.uri) pdfUris.push(interconsultFile.uri);
        if (exLaboratorioFile?.uri) pdfUris.push(exLaboratorioFile.uri);
        if (rechazoTrasladoFile?.uri) pdfUris.push(rechazoTrasladoFile.uri);
        if (entregaMedicamentosFile?.uri)
          pdfUris.push(entregaMedicamentosFile.uri);
        if (photosFile?.uri) pdfUris.push(photosFile.uri);

        if (pdfUris.length > 1) {
          const mergedPdfUri = await mergePDFs(pdfUris, fileName);
          if (mergedPdfUri) {
            setPdfUri(mergedPdfUri);
            Toast.show({
              type: "success",
              text1: "PDF Generado",
              text2: `Se ha creado el PDF: ${fileName}.pdf`,
              position: "top",
              visibilityTime: 3000,
            });
          }
        } else if (pdfUris.length === 1) {
          const newFilePath = `${FileSystem.documentDirectory}${fileName}.pdf`;
          await FileSystem.moveAsync({
            from: pdfUris[0],
            to: newFilePath,
          });
          setPdfUri(newFilePath);
          Toast.show({
            type: "success",
            text1: "PDF Generado",
            text2: `Se ha creado el PDF: ${fileName}.pdf`,
            position: "top",
            visibilityTime: 3000,
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No se pudo generar el PDF.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const sanitizeValue = (value) => {
    return value === "" || value === undefined ? null : value;
  };

  const sanitizeInteger = (value) => {
    return value === "" || value === undefined || value === null
      ? null
      : parseInt(value, 10);
  };

  const sanitizeFloat = (value) => {
    return value === "" || value === undefined || value === null
      ? null
      : parseFloat(value);
  };

  const saveMedicineReport = async () => {
    if (!caso || medicamentosEntregar.length === 0) {
      Toast.show({
        type: "info",
        text1: "Faltan datos",
        text2: "Agrega al menos un medicamento con cantidad",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    // Insertar en Supabase
    const registros = medicamentosEntregar.map((m) => ({
      caso: parseInt(caso, 10),
      nombre: m.nombre,
      MedicamentoBarCode: m.MedicamentoBarCode,
      cantidad: m.cantidad,
    }));

    const { error } = await supa.from("medicineReport").insert(registros);

    if (error) {
      Toast.show({
        type: "error",
        text1: "Error al guardar",
        text2: error.message,
      });
      return;
    }

    // Enviar a la otra app
    const payload = {
      Action: "Add",
      Properties: {
        Locale: "es-ES",
        RunAsUserEmail: email, // <- aquí usas el email del doctor
      },
      Rows: registros.map((r) => ({
        UsuarioID: CIDoctor,
        UsuarioAlmacen: CIDoctor, // <- si aplica, completa este valor
        MedicamentoID: r.MedicamentoBarCode,
        Cantidad: r.cantidad,
        RegistroCasoID: r.caso,
      })),
    };

    try {
      await fetch("URL_DE_TU_OTRA_APP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      Toast.show({
        type: "success",
        text1: "Entrega registrada",
        text2: "Se guardó en la base y se envió a la otra app",
        position: "top",
        visibilityTime: 3000,
      });
      setMedicamentosEntregar([]);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error al enviar",
        text2: e.message,
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const saveMedicalReport = async () => {
    try {
      const ciudadNombre = await obtenerNombreCiudad(ciudad);
      const dataToSaves = {
        seguro,
        fecha,
        poliza,
        empresa,
        caso,
        nombre,
        ci,
        tipoDocumentoPaciente,
        edad,
        sexo,
        titular,
        telefono,
        ciTitular,
        tipoDocumentoTitular,
        hogar,
        direccion,
        edificio,
        piso,
        apto,
        urbanizacion,
        ciudadNombre,
        referencia,
        tabaquicos,
        unidadesDias,
        bebidasAlcoholicas,
        otros,
        alergias,
        medicacionActual,
        intervencionesOx,
        antecedentesMedicos,
        motivoConsulta,
        enfermedadActual,
        horaInicial,
        TA1Inicial,
        FC1Inicial,
        FR1Inicial,
        TemperaturaInicial,
        GlicemiaInicial,
        GlasgowInicial,
        SatInicial,
        horaFinal,
        TA2Final,
        FC2Final,
        FR2Final,
        TemperaturaFinal,
        GlicemiaFinal,
        GlasgowFinal,
        SatFinal,
        General,
        PielMucosas,
        CabezaORL,
        Cardiopulmonar,
        Abdomen,
        Miembros,
        Pulsos,
        Neurológicos,
        Observaciones,
        IDX,
        TratamientoAplicado,
        TratamientoAdministrado,
        TratamientoAmbulatorio,
        EspecificaciónTratamientoAmbulatorio,
        Paraclinicos,
        ExLaboratorio,
        ExRadiologia,
        Referido,
        userName,
        msds,
        especialidad,
        CM,
        proveedor: selectedProviderName,
        CIDoctor,
        tipoDocumento,
        HoraInicioAT,
        HoraFinAT,
        Traslado,
        NombreParamédico,
        MédicoRecibe,
        EstadoClinicoFinal,
        firmaUrl,
        Recipe,
        Indicaciones,
        especialidadMedica,
        nombreRepresentante,
        ciRepresentante,
        firmaRechazo,
        quienLlena,
      };

      // 📌 Validar los campos obligatorios antes de continuar
      if (!validarCamposObligatorios(dataToSaves)) {
        return; // ❌ Detener el proceso si faltan campos
      }

      // 🔹 Buscar si ya existe un reporte con la misma fecha y CI
      let existingReport = null;
      if (reporte?.id) {
        const { data, error } = await supa
          .from("medicalReport")
          .select("*")
          .eq("id", reporte.id)
          .single();

        if (error && error.code !== "PGRST116") {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "No se pudo verificar el reporte.",
            position: "top",
            visibilityTime: 3000,
          });
          return;
        }

        existingReport = data;
      }

      // 🔹 Mapeo de los valores de la APP con la Base de Datos
      const dataToSave = {
        fecha: sanitizeValue(fecha),
        ciPaciente: sanitizeInteger(ci),
        tipoDocumentoPaciente: sanitizeValue(tipoDocumentoPaciente),
        compañiaSeguro: sanitizeValue(seguro),
        nPoliza: sanitizeInteger(poliza),
        empresa: sanitizeValue(empresa),
        nCaso: sanitizeInteger(caso),
        nombrePaciente: sanitizeValue(nombre),
        edad: sanitizeInteger(edad),
        sexo: sanitizeValue(sexo),
        titularPoliza: sanitizeValue(titular),
        telefono: sanitizeValue(telefono),
        ciTitular: sanitizeInteger(ciTitular),
        tipoDocumentoTitular: sanitizeValue(tipoDocumentoTitular),
        direccion: sanitizeValue(hogar),
        avenida: sanitizeValue(direccion),
        edificio: sanitizeValue(edificio),
        piso: sanitizeInteger(piso),
        apt: sanitizeValue(apto),
        urb: sanitizeValue(urbanizacion),
        ciudad: sanitizeValue(ciudad),
        estado: sanitizeValue(estado),
        puntoReferencia: sanitizeValue(referencia),
        tabaquicos: sanitizeValue(tabaquicos),
        unidadesDias: sanitizeValue(unidadesDias),
        bebidasAlcoholicas: sanitizeValue(bebidasAlcoholicas),
        otros: sanitizeValue(otros),
        alergias: sanitizeValue(alergias),
        medicacionActual: sanitizeValue(medicacionActual),
        intervencionesOx: sanitizeValue(intervencionesOx),
        antecedentesMedicos: sanitizeValue(antecedentesMedicos),
        motivoConsulta: sanitizeValue(motivoConsulta),
        enfermedadActual: sanitizeValue(enfermedadActual),
        horaInicial: sanitizeValue(horaInicial),
        ta1: sanitizeValue(TA1Inicial),
        fc1: sanitizeInteger(FC1Inicial),
        fr1: sanitizeInteger(FR1Inicial),
        tempInicial: sanitizeFloat(TemperaturaInicial),
        glicemiaInicial: sanitizeInteger(GlicemiaInicial),
        glasgowInicial: sanitizeInteger(GlasgowInicial),
        satInicial: sanitizeInteger(SatInicial),
        horaFinal: sanitizeValue(horaFinal),
        ta2: sanitizeValue(TA2Final),
        fc2: sanitizeInteger(FC2Final),
        fr2: sanitizeInteger(FR2Final),
        tempFinal: sanitizeFloat(TemperaturaFinal),
        glicemiaFinal: sanitizeInteger(GlicemiaFinal),
        glasgowFinal: sanitizeInteger(GlasgowFinal),
        satFinal: sanitizeInteger(SatFinal),
        general: sanitizeValue(General),
        pielMucosas: sanitizeValue(PielMucosas),
        cabeza: sanitizeValue(CabezaORL),
        cardiopulmonar: sanitizeValue(Cardiopulmonar),
        abdomen: sanitizeValue(Abdomen),
        miembros1: sanitizeValue(Miembros),
        pulsos1: sanitizeValue(Pulsos),
        neurologicos: sanitizeValue(Neurológicos),
        observaciones: sanitizeValue(Observaciones),
        idx: sanitizeValue(IDX),
        tratamientoAplicado: sanitizeValue(TratamientoAplicado),
        tratamientoAdministrado: sanitizeValue(TratamientoAdministrado),
        tratamientoAmbulatorio: sanitizeValue(TratamientoAmbulatorio),
        tratamientoAmbulatorioEspecificacion: sanitizeValue(
          EspecificaciónTratamientoAmbulatorio
        ),
        paraclinico: sanitizeValue(Paraclinicos),
        exLaboratorio: sanitizeValue(ExLaboratorio),
        exRadiologia: sanitizeValue(ExRadiologia),
        referido: sanitizeValue(Referido),

        // 📌 Mantener los datos originales del reporte si existen
        medico: reporte.medico ? reporte.medico : userName,
        CIDoctor: reporte.CIDoctor ? reporte.CIDoctor : CIDoctor,
        tipoDocumento: reporte.tipoDocumento
          ? reporte.tipoDocumento
          : tipoDocumento,
        msds: reporte.msds ? reporte.msds : msds,
        firma: reporte.firma ? reporte.firma : firmaUrl,
        especialidad: reporte.especialidad
          ? reporte.especialidad
          : especialidad,
        CM: reporte.CM ? reporte.CM : CM,
        proveedor: selectedProviderName, // <-- código numérico

        horaInicioAM: sanitizeValue(HoraInicioAT),
        horaFinAM: sanitizeValue(HoraFinAT),
        traslado: sanitizeValue(Traslado),
        nombreParamedico: sanitizeValue(NombreParamédico),
        medicoRecibe: sanitizeValue(MédicoRecibe),
        estadoClinico: sanitizeValue(EstadoClinicoFinal),

        recipe: sanitizeValue(Recipe),
        indicaciones: sanitizeValue(Indicaciones),
        especialidadMedica: sanitizeValue(especialidadMedica),
      };

      if (existingReport || !primeraVezGeneradoPDF) {
        let reportId = existingReport?.id;

        if (!reportId) {
          // Intentar buscar primero por nCaso
          const { data: reportByCaso, error: errorByCaso } = await supa
            .from("medicalReport")
            .select("id")
            .eq("nCaso", caso)
            .maybeSingle(); // no lanza error si no hay resultado

          if (reportByCaso?.id) {
            reportId = reportByCaso.id;
          } else {
            // Si no lo encuentra por nCaso, buscar por ciPaciente y tomar el último creado
            const { data: reportsByCI, error: errorByCI } = await supa
              .from("medicalReport")
              .select("id")
              .eq("ciPaciente", ci)
              .order("id", { ascending: false }) // el último insertado
              .limit(1);

            if (reportsByCI && reportsByCI.length > 0) {
              reportId = reportsByCI[0].id;
            }
          }
        }

        // 🔹 Actualizar
        const { error: updateError } = await supa
          .from("medicalReport")
          .update(dataToSave)
          .eq("id", reportId);

        if (updateError) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "No se pudo actualizar el reporte.",
            position: "top",
            visibilityTime: 3000,
          });
          return;
        }

        Toast.show({
          type: "success",
          text1: "PDF Guardado con éxito",
          position: "top",
          visibilityTime: 3000,
        });
        generatePDF();
      } else {
        // 🔹 Insertar nuevo
        const { error: insertError } = await supa
          .from("medicalReport")
          .insert([dataToSave]);

        if (insertError) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "No se pudo guardar el reporte.",
            position: "top",
            visibilityTime: 3000,
          });
          return;
        }

        setPrimeraVezGeneradoPDF(false); // 🔹 La próxima vez será update

        Toast.show({
          type: "success",
          text1: "PDF Guardado con éxito",
          position: "top",
          visibilityTime: 3000,
        });
        generatePDF();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Ocurrió un problema al guardar el informe.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  // 📌 Función para compartir el PDF generado
  const sharePDF = async () => {
    if (!pdfUri) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No hay un PDF generado.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    await Sharing.shareAsync(pdfUri);
  };

  const [userName, setUserName] = useState("");
  const [CIDoctor, setCIDoctor] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState(null);
  const [firmaUrl, setFirmaUrl] = useState(null);
  const [msds, setMSDS] = useState(null);
  const [especialidad, setEspecialidad] = useState(null);
  const [CM, setCM] = useState(null);
  const [proveedor1, setProveedor1] = useState(null);
  const [proveedor2, setProveedor2] = useState(null);
  const [proveedor3, setProveedor3] = useState(null);
  const [email, setEmail] = useState(null);

  const [estado1, setEstado1] = useState(null);
  const [estado2, setEstado2] = useState(null);
  const [estado3, setEstado3] = useState(null);

  const estadosDelDoctor = [estado1, estado2, estado3].filter(Boolean);
  const tieneVariosEstados = estadosDelDoctor.length > 1;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        if (session) {
          const userData = JSON.parse(session);

          // 📌 Si el reporte ya existe, mantener sus valores originales
          setUserName(reporte?.medico || userData.nombre || "Usuario");
          setCIDoctor(reporte?.cedula || userData.cedula || null);
          setTipoDocumento(
            reporte?.tipoDocumento || userData.tipoDocumento || null
          );
          setFirmaUrl(reporte?.firma || userData["Sello y firma"] || null);
          setMSDS(reporte?.msds || userData["M.S.D.S"] || null);
          setEspecialidad(
            reporte?.especialidad || userData.especialidad || null
          );
          setCM(reporte?.CM || userData.CM || null);
          setProveedor1(reporte?.proveedor1 || userData.proveedor1 || null);
          setProveedor2(reporte?.proveedor2 || userData.proveedor2 || null);
          setProveedor3(reporte?.proveedor3 || userData.proveedor3 || null);
          setEmail(userData.email);
          setEstado1(userData.estado1);
          setEstado2(userData.estado2);
          setEstado3(userData.estado3);
        }
      } catch (error) {}
    };

    fetchUserData();
  }, [reporte]); // Se ejecuta cuando cambia el reporte

  useEffect(() => {
    const estados = [estado1, estado2, estado3].filter(Boolean);

    // ✅ Solo auto-seleccionar si el usuario aún no ha elegido nada
    if (!estado) {
      if (estados.length === 1) {
        setEstado(String(estados[0]));
        setZonaAtencionID(String(estados[0]));
      } else if (reporte?.estado) {
        setEstado(String(reporte.estado));
      }
    }
  }, [estado1, estado2, estado3, reporte]);

  const PdfTypeCheckbox = ({ label, value, isSelected, onToggle }) => {
    return (
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onToggle(!isSelected)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkboxIcon}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const safeSetState = (setter, value) => {
    if (value !== null && value !== undefined) {
      setter(String(value)); // 🔹 Asegura que siempre sea un string y evita "null"
    }
  };

  useEffect(() => {
    if (reporte.nCaso) {
      safeSetState(setSeguro, reporte.compañiaSeguro);
      safeSetState(setFecha, reporte.fecha);
      safeSetState(setPoliza, String(reporte.nPoliza));
      safeSetState(setEmpresa, reporte.empresa);
      safeSetState(setCaso, String(reporte.nCaso));
      safeSetState(setNombre, reporte.nombrePaciente);
      safeSetState(setCi, String(reporte.ciPaciente));
      safeSetState(setTipoDocumentoPaciente(reporte.tipoDocumentoPaciente));
      safeSetState(setEdad, String(reporte.edad));
      safeSetState(setSexo, reporte.sexo);
      safeSetState(setTitular, reporte.titularPoliza);
      safeSetState(setTelefono, reporte.telefono);
      safeSetState(setciTitular, String(reporte.ciTitular));
      safeSetState(setTipoDocumentoTitular(reporte.tipoDocumentoTitular));
      safeSetState(setHogar, reporte.direccion);
      safeSetState(setDireccion, reporte.avenida);
      safeSetState(setEdificio, reporte.edificio);
      safeSetState(setPiso, String(reporte.piso));
      safeSetState(setApto, reporte.apt);
      safeSetState(setUrbanizacion, reporte.urb);
      safeSetState(setCiudad, reporte.ciudad);
      safeSetState(setEstado, reporte.estado);
      safeSetState(setReferencia, reporte.puntoReferencia);
      safeSetState(setTabaquicos, reporte.tabaquicos);
      safeSetState(setUnidadesDias, reporte.unidadesDias);
      safeSetState(setBebidasAlcoholicas, reporte.bebidasAlcoholicas);
      safeSetState(setOtros, reporte.otros);
      safeSetState(setAlergias, reporte.alergias);
      safeSetState(setMedicacionActual, reporte.medicacionActual);
      safeSetState(setIntervencionesOx, reporte.intervencionesOx);
      safeSetState(setAntecedentesMedicos, reporte.antecedentesMedicos);
      safeSetState(setMotivoConsulta, reporte.motivoConsulta);
      safeSetState(setEnfermedadActual, reporte.enfermedadActual);
      safeSetState(setHoraInicial, reporte.horaInicial);
      safeSetState(setTA1Inicial, reporte.ta1);
      safeSetState(setFC1Inicial, reporte.fc1);
      safeSetState(setFR1Inicial, reporte.fr1);
      safeSetState(setTemperaturaInicial, reporte.tempInicial);
      safeSetState(setGlicemiaInicial, reporte.glicemiaInicial);
      safeSetState(setGlasgowInicial, reporte.glasgowInicial);
      safeSetState(setSatInicial, reporte.satInicial);
      safeSetState(setHoraFinal, reporte.horaFinal);
      safeSetState(setTA2Final, reporte.ta2);
      safeSetState(setFC2Final, reporte.fc2);
      safeSetState(setFR2Final, reporte.fr2);
      safeSetState(setTemperaturaFinal, reporte.tempFinal);
      safeSetState(setGlicemiaFinal, reporte.glicemiaFinal);
      safeSetState(setGlasgowFinal, reporte.glasgowFinal);
      safeSetState(setSatFinal, reporte.satFinal);
      safeSetState(setGeneral, reporte.general);
      safeSetState(setPielMucosas, reporte.pielMucosas);
      safeSetState(setCabezaORL, reporte.cabeza);
      safeSetState(setCardiopulmonar, reporte.cardiopulmonar);
      safeSetState(setAbdomen, reporte.abdomen);
      safeSetState(setMiembros, reporte.miembros1);
      safeSetState(setPulsos, reporte.pulsos1);
      safeSetState(setNeurológicos, reporte.neurologicos);
      safeSetState(setObservaciones, reporte.observaciones);
      safeSetState(setIDX, reporte.idx);
      safeSetState(setTratamientoAplicado, reporte.tratamientoAplicado);
      safeSetState(setTratamientoAdministrado, reporte.tratamientoAdministrado);
      safeSetState(setTratamientoAmbulatorio, reporte.tratamientoAmbulatorio);
      safeSetState(
        setEspecificaciónTratamientoAmbulatorio,
        reporte.tratamientoAmbulatorioEspecificacion
      );
      safeSetState(setParaclinicos, reporte.paraclinico);
      safeSetState(setExLaboratorio, reporte.exLaboratorio);
      safeSetState(setExRadiologia, reporte.exRadiologia);
      safeSetState(setReferido, reporte.referido);
      safeSetState(setUserName, reporte.medico);
      safeSetState(setMSDS, reporte.msds);

      safeSetState(setHoraInicioAT, reporte.horaInicioAM);
      safeSetState(setHoraFinAT, reporte.horaFinAM);
      safeSetState(setTraslado, reporte.traslado);
      safeSetState(setSelectedProviderName, reporte.proveedor);

      safeSetState(setNombreParamédico, reporte.nombreParamedico);
      safeSetState(setMédicoRecibe, reporte.medicoRecibe);
      safeSetState(setEstadoClinicoFinal, reporte.estadoClinico);
      safeSetState(setRecipe, reporte.recipe);
      safeSetState(setIndicaciones, reporte.indicaciones);
      safeSetState(setEspecialidad, reporte.especialidad);
      safeSetState(setCM, reporte.CM);
      safeSetState(setCIDoctor, reporte.cedula);
      safeSetState(setEspecialidadMedica, reporte.especialidadMedica);
      safeSetState(setTipoDocumento, reporte.tipoDocumento);
    }
  }, [reporte]);

  const soloNumeros = (texto, setValor) => {
    const numeros = texto.replace(/[^0-9]/g, ""); // 🔹 Elimina cualquier carácter que no sea número
    setValor(numeros);
  };

  const soloNumerosFC = (texto, setValor) => {
    const numeros = texto.replace(/[^0-9]/g, "").slice(0, 3); // 🔹 Elimina cualquier carácter que no sea número
    setValor(numeros);
  };

  const soloNumerosFR = (texto, setValor) => {
    const numeros = texto.replace(/[^0-9]/g, "").slice(0, 2); // 🔹 Elimina cualquier carácter que no sea número
    setValor(numeros);
  };

  const soloNumerosGlicemia = (texto, setValor) => {
    const numeros = texto.replace(/[^0-9]/g, "").slice(0, 4); // 🔹 Elimina cualquier carácter que no sea número
    setValor(numeros);
  };

  const soloNumerosGlasgow = (texto, setValor) => {
    const numeros = texto.replace(/[^0-9]/g, "").slice(0, 2); // 🔹 Elimina cualquier carácter que no sea número
    setValor(numeros);
  };

  const soloNumerosSat = (texto, setValor) => {
    const numeros = texto.replace(/[^0-9]/g, "").slice(0, 3); // 🔹 Elimina cualquier carácter que no sea número
    setValor(numeros);
  };

  const handleTemp = (texto, setValor) => {
    // 1. Elimina todo lo que no sea número, punto o coma
    let numeros = texto.replace(/[^0-9.]/g, "").slice(0, 4);

    // 2. Validación para permitir solo un punto o coma decimal
    const hasDecimal = numeros.match(/[,.]/g);
    if (hasDecimal && hasDecimal.length > 1) {
      // Si hay más de un punto/coma, elimina los adicionales
      const firstDecimalIndex = numeros.search(/[,.]/);
      numeros =
        numeros.substring(0, firstDecimalIndex + 1) +
        numeros.substring(firstDecimalIndex + 1).replace(/[,.]/g, "");
    }

    // 3. Opcional: Reemplazar comas por puntos para consistencia
    // numeros = numeros.replace(",", "."); // Descomenta si quieres forzar punto decimal

    setValor(numeros);
  };

  const handleEdadChange = (text) => {
    // 🔹 Elimina caracteres no numéricos
    const numericValue = text.replace(/[^0-9]/g, "");

    // 🔹 Convierte a número entero
    const parsedAge = numericValue !== "" ? parseInt(numericValue, 10) : "";

    // 🔹 Restringe entre 0 y 120
    if (parsedAge === "" || (parsedAge >= 0 && parsedAge <= 120)) {
      setEdad(numericValue);
    }
  };

  const handleTelefonoChange = (text) => {
    // 🔹 Permitir solo números, "/", y "+"
    const formattedText = text.replace(/[^0-9/+]/g, "");
    setTelefono(formattedText);
  };

  const handleGlasgowChange = (text, setState) => {
    // 🔹 Permitir solo números, "/" y "\"
    const formattedText = text.replace(/[^0-9/\\]/g, "").slice(0, 7);
    setState(formattedText);
  };

  const handleNombreChange = (text, setStatus) => {
    // Expresión regular que permite solo letras (con tildes) y espacios
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;

    if (regex.test(text) || text === "") {
      setStatus(text);
    }
  };

  //Voy a dejar esta funcion aqui en caso de que necesite borrar a fuerza de la base de datos
  const handleDeleteReport = async () => {
    if (!reporte?.id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No hay un reporte seleccionado para eliminar",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    Alert.alert(
      "Eliminar Reporte",
      "¿Estás seguro de que deseas eliminar este reporte médico? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supa
                .from("medicalReport")
                .delete()
                .eq("id", reporte.id);

              if (error) throw error;

              Toast.show({
                type: "success",
                text1: "Éxito",
                text2: "El reporte ha sido eliminado correctamente",
                position: "top",
                visibilityTime: 3000,
              });

              // Navegar de vuelta después de eliminar
              navigation.goBack();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "No se pudo eliminar el reporte: " + error.message,
                position: "top",
                visibilityTime: 3000,
              });
            }
          },
        },
      ]
    );
  };

  const obtenerEmailDesdeCaso = async (numeroCaso) => {
    // 1️⃣ Buscar el caso
    const { data: casoData, error: casoError } = await supa
      .from("medicalReport")
      .select("msds")
      .eq("nCaso", caso)
      .single();

    if (casoError || !casoData?.msds) {
      console.log("No se encontró el caso o no tiene MSDS.");
    }

    // 2️⃣ Buscar usuario por MSDS
    const { data: userData, error: userError } = await supa
      .from("user")
      .select("email")
      .eq('"M.S.D.S"', casoData.msds)
      .single();

    if (userError || !userData?.email) {
      console.log("No se encontró usuario con ese MSDS");
    }

    return userData.email;
  };

  const [providerOptions, setProviderOptions] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviderName, setSelectedProviderName] = useState("");
  const [providerOpen, setProviderOpen] = useState(false);

  useEffect(() => {
    const cargarProveedores = async () => {
      const session = await AsyncStorage.getItem("userSession");
      const user = JSON.parse(session);
      const proveedores = await fetchUserProviders(user);
      setProviderOptions(proveedores);
    };

    cargarProveedores();
  }, []);

  const [expandedDatosGenerales, setExpandedDatosGenerales] = useState(false);
  const [expandedDatosdelPaciente, setExpandedDatosdelPaciente] =
    useState(false);
  const [expandedDireccion, setExpandedDireccion] = useState(false);
  const [expandedHabitosyAntecedentes, setExpandedHabitosyAntecedentes] =
    useState(false);
  const [expandedEvaluacion, setExpandedEvaluacion] = useState(false);
  const [expandedTratamiento, setExpandedTratamiento] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(false);
  const [expandedInterconsulta, setExpandedInterconsulta] = useState(false);

  // estados para el dropdown de aseguradora (mantenerlos en el padre)
  const [aseguradoraOpen, setAseguradoraOpen] = useState(false);
  const [aseguradoraItems, setAseguradoraItems] = useState([]);
  const [aseguradoraLoading, setAseguradoraLoading] = useState(true);
  const aseguradoraFetchedRef = useRef(false); // para hacer fetch solo una vez

  useEffect(() => {
    // evita re-fetch si ya se ejecutó
    if (aseguradoraFetchedRef.current) return;
    aseguradoraFetchedRef.current = true;

    let cancelled = false;
    const fetchInsurances = async () => {
      try {
        const { data, error } = await supa
          .from("insurance")
          .select("nombre")
          .eq("esActivo", true);

        if (cancelled) return;
        if (!error && data) {
          setAseguradoraItems(
            data.map((item) => ({ label: item.nombre, value: item.nombre }))
          );
        } else {
          console.warn("Error cargando aseguradoras:", error);
        }
      } catch (err) {
        console.error("fetchInsurances error:", err);
      } finally {
        if (!cancelled) setAseguradoraLoading(false);
      }
    };

    fetchInsurances();

    return () => {
      cancelled = true;
    };
  }, []); // corre sólo al montar

  // Estados para EstadoDropdown
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [estadoItems, setEstadoItems] = useState([]);
  const [estadoLoading, setEstadoLoading] = useState(true);

  // este valor ya lo tienes (estado y setEstado)
  const estadosDelDoctorr = [estado1, estado2, estado3]
    .filter(Boolean)
    .map((e) => String(e).trim());

  useEffect(() => {
    let cancelled = false;
    const fetchEstados = async () => {
      try {
        const { data, error } = await supa
          .from("estado")
          .select("ZonaNombre, ZonaAtencionID");

        if (error) throw error;

        const estadosFiltrados = data.filter((item) =>
          estadosDelDoctorr.includes(item.ZonaAtencionID)
        );

        const formattedItems = estadosFiltrados.map((item) => ({
          label: item.ZonaNombre,
          value: String(item.ZonaAtencionID),
        }));

        if (!cancelled) {
          setEstadoItems(formattedItems);
          if (formattedItems.length === 1) {
            setEstado(formattedItems[0].value);
            setZonaAtencionID(formattedItems[0].value);
          }
          setEstadoLoading(false);
        }
      } catch (err) {
        console.error("Error al obtener estados:", err.message);
        if (!cancelled) setEstadoLoading(false);
      }
    };
    fetchEstados();
    return () => {
      cancelled = true;
    };
  }, [estado1, estado2, estado3]);

  const [ciudadOpen, setCiudadOpen] = useState(false);
  const [ciudadItems, setCiudadItems] = useState([]);
  const [ciudadLoading, setCiudadLoading] = useState(false);

  useEffect(() => {
    if (!estado) return;
    let cancelled = false;
    const fetchCiudades = async () => {
      setCiudadLoading(true);
      try {
        const { data, error } = await supa
          .from("ciudad")
          .select("CiudadNombre, ZonaCiudadID")
          .eq("DoctorZonaAtencion", estado);

        if (error) throw error;

        const formattedItems = data.map((item) => ({
          label: item.CiudadNombre,
          value: String(item.ZonaCiudadID),
        }));

        if (!cancelled) setCiudadItems(formattedItems);
      } catch (err) {
        console.error("Error al obtener ciudades:", err.message);
      } finally {
        if (!cancelled) setCiudadLoading(false);
      }
    };
    fetchCiudades();
    return () => {
      cancelled = true;
    };
  }, [estado]);

  // Dropdown Tipo Documento Paciente
  const [tipoDocPacienteOpen, setTipoDocPacienteOpen] = useState(false);
  const tipoDocItems = [
    { label: "Venezolano", value: "V" },
    { label: "Extranjero", value: "E" },
    { label: "Pasaporte", value: "P" },
  ];

  // Dropdown Tipo Documento Titular
  const [tipoDocTitularOpen, setTipoDocTitularOpen] = useState(false);

  // Estados para BooleanDropdown (Sí/No)
  const [booleanOpen1, setBooleanOpen1] = useState(false);
  const [booleanOpen2, setBooleanOpen2] = useState(false);
  const [booleanOpen3, setBooleanOpen3] = useState(false);
  const booleanItems = [
    { label: "Sí", value: "Si" },
    { label: "No", value: "No" },
  ];

  // Estados para BooleanDropdownNY (Y/N)
  const [booleanNYOpen, setBooleanNYOpen] = useState(false);
  const booleanNYItems = [
    { label: "Sí", value: "Y" },
    { label: "No", value: "N" },
  ];

  // Estados para ClinicStatusDropdown
  const [clinicStatusOpen, setClinicStatusOpen] = useState(false);
  const clinicStatusItems = [
    { label: "Estable", value: "Estable" },
    { label: "Inestable", value: "Inestable" },
  ];

  // Estados para HogarDropdown
  const [hogarOpen, setHogarOpen] = useState(false);
  const hogarItems = [
    { label: "Hogar", value: "Hogar" },
    { label: "Trabajo", value: "Trabajo" },
    { label: "Otro", value: "Otro" },
  ];

  // Estados para EspecialidadDropdown
  const [especialidadOpen, setEspecialidadOpen] = useState(false);
  const especialidadItems = [
    { label: "Medicina Interna", value: "Medicina Interna" },
    { label: "Pediatria", value: "Pediatria" },
    { label: "Traumatología", value: "Traumatología" },
    { label: "Neurología", value: "Neurología" },
    { label: "Cirugía", value: "Cirugía" },
    { label: "Ortopedia", value: "Ortopedia" },
    { label: "Gastroenterología", value: "Gastroenterología" },
    { label: "Fisioterapia", value: "Fisioterapia" },
    { label: "Oftalmología", value: "Oftalmología" },
    { label: "Otorrinolaringología", value: "Otorrinolaringología" },
    { label: "Dermatología", value: "Dermatología" },
    { label: "Reumatología", value: "Reumatología" },
    { label: "Neumonología", value: "Neumonología" },
    { label: "Urología", value: "Urología" },
    { label: "Nefrología", value: "Nefrología" },
    { label: "Ginecología", value: "Ginecología" },
    { label: "Neurocirugía", value: "Neurocirugía" },
    { label: "Mastología", value: "Mastología" },
    { label: "Alergología", value: "Alergología" },
    { label: "Cardiología", value: "Cardiología" },
    { label: "Psiquiatría", value: "Psiquiatría" },
    { label: "Odontología", value: "Odontología" },
    { label: "Endocrinología", value: "Endocrinología" },
  ];

  return (
    <View style={styles.grande}>
      <NavBar />
      <View style={styles.container}>
        <FlatList
          data={[{ key: "formulario" }]}
          renderItem={() => (
            <>
              <Text style={styles.title}>Generador de Informe Médico</Text>

              {/* Sección: Datos Generales */}
              <List.Accordion
                title="Datos Generales"
                expanded={expandedDatosGenerales}
                onPress={() =>
                  setExpandedDatosGenerales(!expandedDatosGenerales)
                }
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedDatosGenerales ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  <DropDownPicker
                    open={aseguradoraOpen}
                    value={seguro}
                    items={aseguradoraItems}
                    setOpen={setAseguradoraOpen}
                    setValue={setSeguro}
                    setItems={setAseguradoraItems}
                    placeholder="Seleccione una compañía"
                    loading={aseguradoraLoading}
                    activityIndicatorColor="#000"
                    style={{
                      marginBottom: aseguradoraOpen ? 150 : 5,
                      marginTop: 5,
                    }}
                    dropDownDirection="AUTO"
                    listMode="SCROLLVIEW"
                    zIndex={1000}
                  />

                  <TextInput
                    label="Fecha (DD/MM/AAAA)"
                    onChangeText={handleFechaChange}
                    value={fecha}
                    mode="outlined"
                  />
                  <TextInput
                    label="N° de Póliza"
                    value={poliza}
                    onChangeText={(text) => soloNumeros(text, setPoliza)}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <TextInput
                    label="Empresa"
                    value={empresa}
                    onChangeText={setEmpresa}
                    mode="outlined"
                  />
                  <TextInput
                    label="N° de Caso"
                    value={caso}
                    onChangeText={(text) => soloNumeros(text, setCaso)}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                </Card.Content>
              </List.Accordion>

              {/* Sección: Datos del Paciente */}
              <List.Accordion
                title="Datos del Paciente"
                expanded={expandedDatosdelPaciente}
                onPress={() =>
                  setExpandedDatosdelPaciente(!expandedDatosdelPaciente)
                }
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedDatosdelPaciente ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  <TextInput
                    label="Nombre del Paciente"
                    value={nombre}
                    onChangeText={(text) => handleNombreChange(text, setNombre)}
                    mode="outlined"
                  />

                  <Text style={styles.label}>Tipo de Documento</Text>
                  <DropDownPicker
                    open={tipoDocPacienteOpen}
                    value={tipoDocumentoPaciente}
                    items={tipoDocItems}
                    setOpen={setTipoDocPacienteOpen}
                    setValue={setTipoDocumentoPaciente}
                    setItems={() => {}}
                    placeholder="Seleccione tipo de documento"
                    style={{ marginBottom: tipoDocPacienteOpen ? 125 : 5 }}
                    zIndex={1000}
                    zIndexInverse={999}
                  />

                  <TextInput
                    label="C.I."
                    value={ci}
                    onChangeText={(text) => soloNumeros(text, setCi)}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <TextInput
                    label="Edad"
                    value={edad}
                    onChangeText={(text) => handleEdadChange(text)}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <TextInput
                    label="Sexo (M/F)"
                    value={sexo}
                    onChangeText={setSexo}
                    mode="outlined"
                  />
                  <TextInput
                    label="Titular de la Póliza"
                    value={titular}
                    onChangeText={(text) =>
                      handleNombreChange(text, setTitular)
                    }
                    mode="outlined"
                  />
                  <TextInput
                    label="Teléfono"
                    value={telefono}
                    onChangeText={(text) => handleTelefonoChange(text)}
                    mode="outlined"
                  />
                  <Text style={styles.label}>Tipo de Documento</Text>
                  <DropDownPicker
                    open={tipoDocTitularOpen}
                    value={tipoDocumentoTitular}
                    items={tipoDocItems}
                    setOpen={setTipoDocTitularOpen}
                    setValue={setTipoDocumentoTitular}
                    setItems={() => {}}
                    placeholder="Seleccione tipo de documento"
                    style={{ marginBottom: tipoDocTitularOpen ? 125 : 5 }}
                    zIndex={999}
                    zIndexInverse={998}
                  />
                  <TextInput
                    label="C.I. Titular"
                    value={ciTitular}
                    onChangeText={(text) => soloNumeros(text, setciTitular)}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                </Card.Content>
              </List.Accordion>

              {/* Sección: Dirección */}
              <List.Accordion
                title="Dirección"
                expanded={expandedDireccion}
                onPress={() => setExpandedDireccion(!expandedDireccion)}
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedDireccion ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  <DropDownPicker
                    open={hogarOpen}
                    value={hogar}
                    items={hogarItems}
                    setOpen={setHogarOpen}
                    setValue={setHogar}
                    setItems={() => {}}
                    placeholder="Seleccione dirección"
                    style={{ marginBottom: hogarOpen ? 125 : 5 }}
                    zIndex={700}
                    zIndexInverse={699}
                  />
                  <TextInput
                    label="Avenida/Calle"
                    value={direccion}
                    onChangeText={setDireccion}
                    mode="outlined"
                  />
                  <TextInput
                    label="Edificio/Casa/Empresa"
                    value={edificio}
                    onChangeText={setEdificio}
                    mode="outlined"
                  />
                  <TextInput
                    label="Piso"
                    value={piso}
                    onChangeText={(text) => soloNumeros(text, setPiso)}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <TextInput
                    label="Apto"
                    value={apto}
                    onChangeText={setApto}
                    mode="outlined"
                  />
                  <TextInput
                    label="Urbanización"
                    value={urbanizacion}
                    onChangeText={setUrbanizacion}
                    mode="outlined"
                  />
                  <DropDownPicker
                    open={estadoOpen}
                    value={estado}
                    items={estadoItems}
                    setOpen={setEstadoOpen}
                    setValue={(updater) => {
                      // DropDownPicker a veces pasa una función o un valor directo
                      const newVal =
                        typeof updater === "function"
                          ? updater(estado)
                          : updater;
                      const normalized = newVal == null ? null : String(newVal);

                      setEstado(normalized);
                      setZonaAtencionID(normalized);

                      // Al cambiar estado, limpiamos la ciudad (las ciudades pertenecen a un estado)
                      setCiudad(null);
                    }}
                    setItems={setEstadoItems}
                    placeholder="Seleccione un estado"
                    loading={estadoLoading}
                    activityIndicatorColor="#000"
                    style={{ marginBottom: estadoOpen ? 70 : 5, marginTop: 5 }}
                    dropDownDirection="AUTO"
                    listMode="SCROLLVIEW"
                    zIndex={1000}
                  />

                  <DropDownPicker
                    open={ciudadOpen}
                    value={ciudad}
                    items={ciudadItems}
                    setOpen={setCiudadOpen}
                    setValue={setCiudad}
                    setItems={setCiudadItems}
                    placeholder="Seleccione una ciudad"
                    loading={ciudadLoading}
                    activityIndicatorColor="#000"
                    style={{
                      marginBottom: ciudadOpen ? 210 : 5,
                      marginTop: 10,
                    }}
                    dropDownDirection="AUTO"
                    listMode="SCROLLVIEW"
                    zIndex={900}
                  />

                  <TextInput
                    label="Punto de Referencia"
                    value={referencia}
                    onChangeText={setReferencia}
                    mode="outlined"
                  />
                </Card.Content>
              </List.Accordion>

              {/* Sección: Hábitos y Antecedentes Médicos */}
              <List.Accordion
                title="Hábitos y Antecedentes Médicos"
                expanded={expandedHabitosyAntecedentes}
                onPress={() =>
                  setExpandedHabitosyAntecedentes(!expandedHabitosyAntecedentes)
                }
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedHabitosyAntecedentes ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  <TextInput
                    label="Tabáquicos"
                    value={tabaquicos}
                    onChangeText={setTabaquicos}
                    mode="outlined"
                  />
                  <TextInput
                    label="Unidades/Días"
                    value={unidadesDias}
                    onChangeText={setUnidadesDias}
                    mode="outlined"
                  />
                  <TextInput
                    label="Bebidas Alcohólicas"
                    value={bebidasAlcoholicas}
                    onChangeText={setBebidasAlcoholicas}
                    mode="outlined"
                  />
                  <TextInput
                    label="Otros"
                    value={otros}
                    onChangeText={setOtros}
                    mode="outlined"
                  />
                  <TextInput
                    label="Alergias"
                    value={alergias}
                    onChangeText={setAlergias}
                    mode="outlined"
                  />
                  <TextInput
                    label="Medicación Actual"
                    value={medicacionActual}
                    onChangeText={setMedicacionActual}
                    mode="outlined"
                  />
                  <TextInput
                    label="Intervenciones Ox"
                    value={intervencionesOx}
                    onChangeText={setIntervencionesOx}
                    mode="outlined"
                  />
                  <TextInput
                    label="Antecedentes Médicos"
                    value={antecedentesMedicos}
                    onChangeText={setAntecedentesMedicos}
                    mode="outlined"
                  />
                </Card.Content>
              </List.Accordion>

              {/* Sección: Evaluación del Caso */}
              <List.Accordion
                title="Evaluación del Caso"
                expanded={expandedEvaluacion}
                onPress={() => setExpandedEvaluacion(!expandedEvaluacion)}
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedEvaluacion ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  <TextInput
                    label="Motivo Consulta"
                    value={motivoConsulta}
                    onChangeText={setMotivoConsulta}
                    mode="outlined"
                  />
                  <TextInput
                    label="Enfermedad Actual"
                    value={enfermedadActual}
                    onChangeText={setEnfermedadActual}
                    mode="outlined"
                    multiline
                    numberOfLines={5}
                    style={{ height: 120 }}
                  />
                  <TextInput
                    label="Hora Inicial (Formato 24h sin division)"
                    value={horaInicial}
                    onChangeText={(text) =>
                      handleHoraChange(text, setHoraInicial)
                    }
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <TextInput
                    label="TA 1"
                    onChangeText={(text) =>
                      handleGlasgowChange(text, setTA1Inicial)
                    }
                    value={TA1Inicial}
                    mode="outlined"
                  />
                  <TextInput
                    label="FC 1"
                    keyboardType="numeric"
                    onChangeText={(text) => soloNumerosFC(text, setFC1Inicial)}
                    value={FC1Inicial}
                    mode="outlined"
                  />
                  <TextInput
                    label="FR 1"
                    keyboardType="numeric"
                    onChangeText={(text) => soloNumerosFR(text, setFR1Inicial)}
                    value={FR1Inicial}
                    mode="outlined"
                  />
                  <TextInput
                    label="Temperatura Inicial"
                    onChangeText={(text) =>
                      handleTemp(text, setTemperaturaInicial)
                    }
                    value={TemperaturaInicial}
                    mode="outlined"
                  />
                  <TextInput
                    label="Glicemia Inicial"
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      soloNumerosGlicemia(text, setGlicemiaInicial)
                    }
                    value={GlicemiaInicial}
                    mode="outlined"
                  />
                  <TextInput
                    label="Glasgow Inicial"
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      soloNumerosGlasgow(text, setGlasgowInicial)
                    }
                    value={GlasgowInicial}
                    mode="outlined"
                  />
                  <TextInput
                    label="Sat 02% Inicial"
                    keyboardType="numeric"
                    onChangeText={(text) => soloNumerosSat(text, setSatInicial)}
                    value={SatInicial}
                    mode="outlined"
                  />
                  <TextInput
                    label="Hora Final (Formato 24h sin division)"
                    value={horaFinal}
                    onChangeText={(text) =>
                      handleHoraChange(text, setHoraFinal)
                    }
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <TextInput
                    label="TA 2"
                    onChangeText={(text) =>
                      handleGlasgowChange(text, setTA2Final)
                    }
                    value={TA2Final}
                    mode="outlined"
                  />
                  <TextInput
                    label="FC 2"
                    keyboardType="numeric"
                    onChangeText={(text) => soloNumerosFC(text, setFC2Final)}
                    value={FC2Final}
                    mode="outlined"
                  />
                  <TextInput
                    label="FR 2"
                    keyboardType="numeric"
                    onChangeText={(text) => soloNumerosFR(text, setFR2Final)}
                    value={FR2Final}
                    mode="outlined"
                  />
                  <TextInput
                    label="Temperatura Final"
                    onChangeText={(text) =>
                      handleTemp(text, setTemperaturaFinal)
                    }
                    value={TemperaturaFinal}
                    mode="outlined"
                  />
                  <TextInput
                    label="Glicemia Final"
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      soloNumerosGlicemia(text, setGlicemiaFinal)
                    }
                    value={GlicemiaFinal}
                    mode="outlined"
                  />
                  <TextInput
                    label="Glasgow Final"
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      soloNumerosGlasgow(text, setGlasgowFinal)
                    }
                    value={GlasgowFinal}
                    mode="outlined"
                  />
                  <TextInput
                    label="Sat 02% Final"
                    keyboardType="numeric"
                    onChangeText={(text) => soloNumerosSat(text, setSatFinal)}
                    value={SatFinal}
                    mode="outlined"
                  />
                  <TextInput
                    label="General"
                    onChangeText={setGeneral}
                    value={General}
                    mode="outlined"
                  />
                  <TextInput
                    label="Piel / Mucosas"
                    onChangeText={setPielMucosas}
                    value={PielMucosas}
                    mode="outlined"
                  />
                  <TextInput
                    label="Cabeza / ORL"
                    onChangeText={setCabezaORL}
                    value={CabezaORL}
                    mode="outlined"
                  />
                  <TextInput
                    label="Cardiopulmonar"
                    onChangeText={setCardiopulmonar}
                    value={Cardiopulmonar}
                    mode="outlined"
                  />
                  <TextInput
                    label="Abdomen"
                    onChangeText={setAbdomen}
                    value={Abdomen}
                    mode="outlined"
                  />
                  <TextInput
                    label="Miembros Superiores"
                    onChangeText={setMiembros}
                    value={Miembros}
                    mode="outlined"
                  />

                  <TextInput
                    label="Pulsos"
                    onChangeText={setPulsos}
                    value={Pulsos}
                    mode="outlined"
                  />
                  <TextInput
                    label="Neurológicos (ROT)"
                    onChangeText={setNeurológicos}
                    value={Neurológicos}
                    mode="outlined"
                  />
                  <TextInput
                    label="Observaciones / Otros"
                    onChangeText={setObservaciones}
                    value={Observaciones}
                    mode="outlined"
                    multiline
                    numberOfLines={7}
                    style={{ height: 150 }}
                  />
                  <TextInput
                    label="IDX"
                    onChangeText={setIDX}
                    value={IDX}
                    mode="outlined"
                  />
                </Card.Content>
              </List.Accordion>

              {/* Sección: Tratamiento */}
              <List.Accordion
                title="Tratamiento"
                expanded={expandedTratamiento}
                onPress={() => setExpandedTratamiento(!expandedTratamiento)}
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedTratamiento ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  <TextInput
                    label="Hora inicio atención médica"
                    value={HoraInicioAT}
                    onChangeText={(text) =>
                      handleHoraChange(text, setHoraInicioAT)
                    }
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <DropDownPicker
                    open={booleanNYOpen}
                    value={TratamientoAdministrado}
                    items={booleanNYItems}
                    setOpen={setBooleanNYOpen}
                    setValue={setTratamientoAdministrado}
                    setItems={() => {}}
                    placeholder="Administro Tratamiento"
                    style={{
                      marginBottom: booleanNYOpen ? 75 : 5,
                      marginTop: 10,
                    }}
                    zIndex={900}
                    zIndexInverse={899}
                  />
                  <TextInput
                    label="Tratamiento Aplicado"
                    value={TratamientoAplicado}
                    onChangeText={setTratamientoAplicado}
                    mode="outlined"
                  />
                  <DropDownPicker
                    open={booleanOpen1}
                    value={TratamientoAmbulatorio}
                    items={booleanItems}
                    setOpen={setBooleanOpen1}
                    setValue={setTratamientoAmbulatorio}
                    setItems={() => {}}
                    placeholder="Tratamiento Ambulatorio"
                    style={{
                      marginBottom: booleanOpen1 ? 75 : 5,
                      marginTop: 10,
                    }}
                    zIndex={900}
                    zIndexInverse={899}
                  />
                  <TextInput
                    label="Especificación tratamiento ambulatorio"
                    value={EspecificaciónTratamientoAmbulatorio}
                    onChangeText={setEspecificaciónTratamientoAmbulatorio}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={{ height: 72 }}
                  />
                  <TextInput
                    label="Paraclínicos"
                    value={Paraclinicos}
                    onChangeText={setParaclinicos}
                    mode="outlined"
                  />
                  <TextInput
                    label="Ex. Laboratorio"
                    value={ExLaboratorio}
                    onChangeText={setExLaboratorio}
                    mode="outlined"
                  />
                  <TextInput
                    label="Ex. Radiológico"
                    value={ExRadiologia}
                    onChangeText={setExRadiologia}
                    mode="outlined"
                  />
                  <TextInput
                    label="Referido"
                    value={Referido}
                    onChangeText={setReferido}
                    mode="outlined"
                  />

                  <TextInput
                    label="Hora fin atención médica"
                    value={HoraFinAT}
                    onChangeText={(text) =>
                      handleHoraChange(text, setHoraFinAT)
                    }
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <DropDownPicker
                    open={booleanOpen2}
                    value={Traslado}
                    items={booleanItems}
                    setOpen={setBooleanOpen2}
                    setValue={setTraslado}
                    setItems={() => {}}
                    placeholder="Translado"
                    style={{
                      marginBottom: booleanOpen2 ? 75 : 5,
                      marginTop: 10,
                    }}
                    zIndex={900}
                    zIndexInverse={899}
                  />
                  {providerOptions.length > 1 && (
                    <DropDownPicker
                      open={providerOpen}
                      value={selectedProvider}
                      items={providerOptions}
                      setOpen={setProviderOpen}
                      setValue={(callback) => {
                        setSelectedProvider((prev) => {
                          const value = callback(prev);

                          const selected = providerOptions.find(
                            (p) => p.value === value
                          );

                          setSelectedProviderName(selected?.label);

                          return value;
                        });
                      }}
                      setItems={setProviderOptions}
                      placeholder="Seleccione un proveedor"
                      style={{ marginBottom: providerOpen ? 150 : 20 }}
                      zIndex={1000}
                    />
                  )}

                  <TextInput
                    label="Nombre del Paramédico"
                    value={NombreParamédico}
                    onChangeText={(text) =>
                      handleNombreChange(text, setNombreParamédico)
                    }
                    mode="outlined"
                  />
                  <TextInput
                    label="Médico que recibe"
                    value={MédicoRecibe}
                    onChangeText={(text) =>
                      handleNombreChange(text, setMédicoRecibe)
                    }
                    mode="outlined"
                  />
                  <DropDownPicker
                    open={clinicStatusOpen}
                    value={EstadoClinicoFinal}
                    items={clinicStatusItems}
                    setOpen={setClinicStatusOpen}
                    setValue={setEstadoClinicoFinal}
                    setItems={() => {}}
                    placeholder="Estado Clínico Final"
                    style={{
                      marginBottom: clinicStatusOpen ? 75 : 5,
                      marginTop: 10,
                    }}
                    zIndex={900}
                    zIndexInverse={899}
                  />
                </Card.Content>
              </List.Accordion>

              {/* Sección: Tratamiento */}
              <List.Accordion
                title="Recipe"
                expanded={expandedRecipe}
                onPress={() => setExpandedRecipe(!expandedRecipe)}
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedRecipe ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  <TextInput
                    label="Recipe"
                    value={Recipe}
                    onChangeText={setRecipe}
                    mode="outlined"
                    multiline
                    numberOfLines={5}
                    style={{ height: 120 }}
                  />
                  <TextInput
                    label="Indicaciones"
                    value={Indicaciones}
                    onChangeText={setIndicaciones}
                    mode="outlined"
                    multiline
                    numberOfLines={5}
                    style={{ height: 120 }}
                  />
                </Card.Content>
              </List.Accordion>

              <List.Accordion
                title="Interconsulta"
                expanded={expandedInterconsulta}
                onPress={() => setExpandedInterconsulta(!expandedInterconsulta)}
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedInterconsulta ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  <DropDownPicker
                    open={especialidadOpen}
                    value={especialidadMedica}
                    items={especialidadItems}
                    setOpen={setEspecialidadOpen}
                    setValue={setEspecialidadMedica}
                    setItems={() => {}}
                    placeholder="Seleccione especialidad"
                    style={{ marginBottom: especialidadOpen ? 200 : 5 }}
                    zIndex={800}
                    zIndexInverse={799}
                    dropDownDirection="AUTO"
                    listMode="SCROLLVIEW"
                  />
                </Card.Content>
              </List.Accordion>

              <List.Accordion
                title="Rechazo de Traslado"
                expanded={expandedRechazo}
                onPress={() => setExpandedRechazo(!expandedRechazo)}
                right={() => (
                  <Text style={{ fontSize: 20, marginRight: 16 }}>
                    {expandedRechazo ? "▼" : "▲"}
                  </Text>
                )}
              >
                <Card.Content>
                  {/* Selector: ¿Quién llena el formulario? */}
                  <Text style={styles.label}>¿Quién llena el formulario?</Text>
                  <DropDownPicker
                    open={quienLlenaOpen}
                    value={quienLlena}
                    items={[
                      { label: "Paciente", value: "paciente" },
                      {
                        label: "Familiar/Representante",
                        value: "representante",
                      },
                    ]}
                    setOpen={setQuienLlenaOpen}
                    setValue={setQuienLlena}
                    placeholder="Seleccione"
                    style={{ marginBottom: quienLlenaOpen ? 115 : 5 }}
                  />

                  {/* Si es representante, pedir nombre y C.I */}
                  {quienLlena === "representante" && (
                    <>
                      <TextInput
                        label="Nombre del Familiar/Representante"
                        value={nombreRepresentante}
                        onChangeText={setNombreRepresentante}
                        mode="outlined"
                      />
                      <TextInput
                        label="C.I. del Familiar/Representante"
                        value={ciRepresentante}
                        onChangeText={setCiRepresentante}
                        keyboardType="numeric"
                        mode="outlined"
                      />
                    </>
                  )}

                  {Platform.OS === "web" ? (
                    <TouchableOpacity
                      onPress={pickSignatureImage}
                      style={styles.button}
                    >
                      <Text style={styles.buttonText}>
                        {firmaRechazo
                          ? "Modificar Firma"
                          : "Agregar Firma (como imagen)"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ height: 340 }}>
                      <SignaturePadWeb
                        onConfirm={(base64) => {
                          setFirmaRechazo(base64);
                        }}
                      />
                    </View>
                  )}

                  {firmaRechazo && (
                    <Image
                      source={{ uri: firmaRechazo }}
                      style={{
                        width: 200,
                        height: 100,
                        marginTop: 10,
                        marginBottom: 10,
                        alignSelf: "center",
                      }}
                      resizeMode="contain"
                    />
                  )}
                </Card.Content>
              </List.Accordion>

              <Card.Content>
                <View style={styles.checkboxGroup}>
                  <PdfTypeCheckbox
                    label="Reporte Médico"
                    value="reporte"
                    isSelected={selectedPdfTypes.reporte}
                    onToggle={(selected) =>
                      setSelectedPdfTypes({
                        ...selectedPdfTypes,
                        reporte: selected,
                      })
                    }
                  />
                  <PdfTypeCheckbox
                    label="Recipe"
                    value="recipe"
                    isSelected={selectedPdfTypes.recipe}
                    onToggle={(selected) =>
                      setSelectedPdfTypes({
                        ...selectedPdfTypes,
                        recipe: selected,
                      })
                    }
                  />
                  <PdfTypeCheckbox
                    label="Interconsulta"
                    value="interconsulta"
                    isSelected={selectedPdfTypes.interconsulta}
                    onToggle={(selected) =>
                      setSelectedPdfTypes({
                        ...selectedPdfTypes,
                        interconsulta: selected,
                      })
                    }
                  />
                  <PdfTypeCheckbox
                    label="Rechazo Traslado"
                    value="rechazoTraslado"
                    isSelected={selectedPdfTypes.rechazoTraslado}
                    onToggle={(selected) =>
                      setSelectedPdfTypes({
                        ...selectedPdfTypes,
                        rechazoTraslado: selected,
                      })
                    }
                  />
                </View>
              </Card.Content>

              {pdfUri && (
                <TouchableOpacity style={styles.button} onPress={sharePDF}>
                  <Text style={styles.buttonText}>Compartir PDF</Text>
                </TouchableOpacity>
              )}

              {/* Botones */}
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  await saveMedicalReport(); // Guardar en Supabase antes de generar el PDF
                  // Luego generar el PDF
                }}
              >
                <Text style={styles.buttonText}>Generar PDF</Text>
              </TouchableOpacity>

              {/* 
              <TouchableOpacity
  style={styles.button}
  onPress={handleDeleteReport} // Solo la referencia a la función
>
  <Text style={styles.buttonText}>Eliminar reporte</Text>
</TouchableOpacity>
*/}

              <TouchableOpacity
                onPress={pickImage}
                style={styles.buttonOrange} // Usa el nuevo estilo
              >
                <Text style={styles.buttonText}>Agregar Foto</Text>
              </TouchableOpacity>
            </>
          )}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </View>
  );
};

export default PDFGenerator;

const styles = StyleSheet.create({
  inputContainer: {
    width: "90%",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#004b9a",
    marginBottom: 5,
    paddingTop: 10,
  },
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  grande: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#45c0e8",
  },
  input: { marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#004b9a",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonOrange: {
    backgroundColor: "#FF7F00", // Naranja
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  buttonText: { color: "white", fontWeight: "bold" },
  checkbox: { flexDirection: "row", alignItems: "center", marginRight: 10 },
  checkboxText: { marginRight: 5 },
  checkboxGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
    justifyContent: "space-between",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    width: "48%", // Para dos columnas
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#004b9a",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: "#004b9a",
  },
  checkboxIcon: {
    color: "white",
    fontSize: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#333",
  },
});
