import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const TasaBCVScreen = () => {
  const navigation = useNavigation();
  const supa = SupaClient();

  const [tasa, setTasa] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState(null);

  // Cargar tasa actual
  const loadTasa = async () => {
    try {
      const { data, error } = await supa
        .from("tasaBCV")
        .select("precioVESUSD")
        .eq("id", 1)
        .single();

      if (error) throw error;
      
      if (data) {
        setTasa(data.precioVESUSD?.toString() || "");
      }
    } catch (error) {
      console.error("Error cargando tasa:", error);
      Alert.alert("Error", "No se pudo cargar la tasa actual");
    } finally {
      setLoading(false);
    }
  };

  // Verificar usuario
  const checkUser = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (!session) {
        navigation.navigate("Log_in");
        return;
      }
      const user = JSON.parse(session);
      setUserData(user);
    } catch (error) {
      console.error("Error verificando usuario:", error);
    }
  };

  useEffect(() => {
    checkUser();
    loadTasa();
  }, []);

  // Actualizar tasa
  const updateTasa = async () => {
    if (!tasa || parseFloat(tasa) <= 0) {
      Alert.alert("Error", "Ingresa una tasa válida mayor a 0");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supa
        .from("tasaBCV")
        .update({ "precioVESUSD": parseFloat(tasa) })
        .eq("id", 1);

      if (error) throw error;

      Alert.alert(
        "Éxito",
        "Tasa actualizada correctamente",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error actualizando tasa:", error);
      Alert.alert("Error", "No se pudo actualizar la tasa");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
        <NavBar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#45c0e8" />
          <Text style={styles.loadingText}>Cargando tasa...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#45c0e8"} />
      <NavBar />

      <View style={styles.container}>
        <LinearGradient
          colors={["#45c0e8", "#3aa5c9"]}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tasa BCV</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="swap-horizontal" size={50} color="#45c0e8" />
          </View>

          <Text style={styles.label}>Tasa de Cambio (USD → VES)</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>$ 1 =</Text>
            <TextInput
              style={styles.input}
              value={tasa}
              onChangeText={setTasa}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.currencySymbol}>Bs.</Text>
          </View>

          <Text style={styles.hint}>
            Esta tasa se usará para calcular los pagos en bolívares
          </Text>

          <TouchableOpacity
            style={[styles.updateButton, updating && styles.updateButtonDisabled]}
            onPress={updateTasa}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color="white" />
                <Text style={styles.updateButtonText}>Actualizar Tasa</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color="#45c0e8" />
            <Text style={styles.infoText}>
              La tasa se actualiza diariamente según el BCV
            </Text>
          </View>
        </View>
      </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginHorizontal: 8,
  },
  input: {
    width: 120,
    height: 50,
    borderWidth: 2,
    borderColor: '#45c0e8',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
  },
  hint: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  updateButton: {
    backgroundColor: '#45c0e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  updateButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#45c0e8',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#45c0e8',
  },
});

export default TasaBCVScreen;