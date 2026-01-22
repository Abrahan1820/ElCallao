import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SupaClient } from "../Supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavBar from "../NavBar/Components/NavBar";
import Toast from "react-native-toast-message";

const PDFModify = () => {
  const supa = SupaClient();
  const navigation = useNavigation();
  const [nCaso, setNCaso] = useState("");
  const [reportes, setReportes] = useState([]);
  const [msds, setMSDS] = useState(null);


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

        // Verificar si es administrador
        if (!user.esAdministrador) {
          navigation.navigate("PaginaPrincipal");
          return;
        }

        // Opcional: Verificar en la base de datos el estado actual
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
        if (!data?.esAdministrador) {
          Toast.show({
                            type: "error",
                            text1: "No Administrador",
                            text2: "Acceso no autorizado.",
                            position: "top",
                            visibilityTime: 3000,
                          });
          navigation.navigate("PaginaPrincipal");
        }
      } catch (error) {
        console.error("Error verificando acceso:", error);
        navigation.navigate("PaginaPrincipal");
      }
    };

    verificarAcceso();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        if (session) {
          const userData = JSON.parse(session);
          setMSDS(userData["M.S.D.S"] || null);
        }
      } catch (error) {}
    };

    fetchUserData();
  }, []);

  const fetchReports = async () => {
    if (!msds) {
      return;
    }

    try {
      let query = supa.from("medicalReport").select("*");

      if (nCaso.trim() !== "") {
        const nCasoParsed = parseInt(nCaso, 10);
        if (!isNaN(nCasoParsed)) {
          query = query.eq("nCaso", nCasoParsed);
        } else {
          Toast.show({
                        type: "error",
                        text1: "Error",
                        text2: "El número de caso debe ser un número válido.",
                        position: "top",
                        visibilityTime: 3000,
                      });
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudo obtener los reportes.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      setReportes(data || []);
    } catch (error) {}
  };

  const handleSelectReport = (reporte) => {
    navigation.navigate("PDFGenerator", { reporte });
  };

  return (
    <View style={styles.grande}>
      <NavBar />
      <View style={styles.container}>
        <Text style={styles.title}>Buscar Reporte Médico</Text>

        <TextInput
          style={styles.input}
          placeholder="Ingrese el N° de Caso"
          keyboardType="numeric"
          onChangeText={setNCaso}
          value={nCaso}
        />

        <TouchableOpacity style={styles.button} onPress={fetchReports}>
          <Text style={styles.buttonText}>Buscar</Text>
        </TouchableOpacity>

        <FlatList
          data={reportes}
          keyExtractor={(item) => item.nCaso.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelectReport(item)}
            >
              <Text style={styles.itemText}>Caso #{item.nCaso}</Text>
              <Text style={styles.itemSubtext}>{item.fecha}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

export default PDFModify;

const styles = StyleSheet.create({
  grande: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#45c0e8",
  },
  input: {
    borderWidth: 1,
    borderColor: "#004b9a",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#fe6b00",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  itemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  itemSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});
