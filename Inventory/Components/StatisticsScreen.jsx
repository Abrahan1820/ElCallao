import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Card } from "react-native-paper";
import { SupaClient } from "../../Supabase/supabase";
import NavBar from "../../NavBar/Components/NavBar";

// --------------------------------------------------
// 🔧 Helpers de fecha
// --------------------------------------------------
const parseFecha = (fechaStr) => {
  if (!fechaStr) return null;
  const [dia, mes, año] = fechaStr.split("/");
  return new Date(año, mes - 1, dia);
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const getDateRange = (filter) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (filter) {
    case "hoy":
      return { inicio: todayStart, fin: todayEnd };

    case "ayer": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { inicio: startOfDay(d), fin: endOfDay(d) };
    }

    case "semana": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { inicio: startOfDay(d), fin: todayEnd };
    }

    case "mes": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return { inicio: startOfDay(d), fin: todayEnd };
    }

    case "90dias": {
      const d = new Date(now);
      d.setDate(d.getDate() - 89);
      return { inicio: startOfDay(d), fin: todayEnd };
    }

    default:
      return { inicio: null, fin: null };
  }
};

// --------------------------------------------------
// 📊 Pantalla principal
// --------------------------------------------------
const StatisticsScreen = () => {
  const supa = SupaClient();

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);

  const [estadoMap, setEstadoMap] = useState({});
  const [doctorMap, setDoctorMap] = useState({});
  const [filter, setFilter] = useState("hoy");

  const [statsEstados, setStatsEstados] = useState({});
  const [statsDoctores, setStatsDoctores] = useState({});
  const [statsDias, setStatsDias] = useState({});
  const [statsProveedores, setStatsProveedores] = useState({});

  // --------------------------------------------------
  // 📍 Cargar estados
  // --------------------------------------------------
  const loadEstados = async () => {
    const { data, error } = await supa
      .from("estado")
      .select("ZonaAtencionID, ZonaNombre");

    if (error) {
      console.error("❌ Error cargando estados:", error);
      return;
    }

    const map = {};
    data.forEach((e) => {
      map[e.ZonaAtencionID] = e.ZonaNombre;
    });

    setEstadoMap(map);
  };

  // --------------------------------------------------
  // 👨‍⚕️ Cargar doctores
  // --------------------------------------------------
  const loadDoctores = async () => {
    const { data, error } = await supa
      .from("user")
      .select("cedula, nombre");

    if (error) {
      console.error("❌ Error cargando doctores:", error);
      return;
    }

    const map = {};
    data.forEach((u) => {
      map[u.cedula] = u.nombre;
    });

    setDoctorMap(map);
  };

  // --------------------------------------------------
  // 📥 Cargar reportes
  // --------------------------------------------------
  const fetchReports = async () => {
    const { data, error } = await supa
      .from("medicalReport")
      .select(`
        id,
        estado,
        medico,
        CIDoctor,
        fecha,
        proveedor
      `)
      .order("id", { ascending: false })
      .range(0, 999);

    if (error) {
      console.error("❌ Error cargando reportes:", error);
      return;
    }

    setReports(data || []);
  };

  // --------------------------------------------------
  // 🔄 Cargar todo al iniciar
  // --------------------------------------------------
  useEffect(() => {
    loadEstados();
    loadDoctores();
    fetchReports();
  }, []);

  // --------------------------------------------------
  // 🔍 Reaplicar filtro
  // --------------------------------------------------
  useEffect(() => {
    if (reports.length > 0) applyFilter();
  }, [filter, reports]);

  const applyFilter = () => {
    const { inicio, fin } = getDateRange(filter);

    const filtrados = reports.filter((r) => {
      if (!r.fecha) return false;
      const f = parseFecha(r.fecha);
      if (!f) return false;
      if (!inicio) return true;
      return f >= inicio && f <= fin;
    });

    setFilteredReports(filtrados);
    procesarEstadisticas(filtrados);
  };

  // --------------------------------------------------
  // 📊 Procesar estadísticas
  // --------------------------------------------------
  const procesarEstadisticas = (data) => {
    const estados = {};
    const doctores = {};
    const dias = {};
    const proveedores = {};

    data.forEach((r) => {
      // ---------- ESTADOS ----------
      let estadoRaw = r.estado;

      const idEncontrado = Object.keys(estadoMap).find(
        (key) =>
          estadoMap[key]?.toLowerCase() === estadoRaw?.toLowerCase()
      );

      let estadoNombre =
        estadoMap[estadoRaw] ||
        estadoMap[idEncontrado] ||
        estadoRaw ||
        "Estado desconocido";

      estados[estadoNombre] = (estados[estadoNombre] || 0) + 1;

      // ---------- DOCTORES ----------
      let doctorNombre = r.medico || doctorMap[r.CIDoctor] || "Desconocido";
      doctores[doctorNombre] = (doctores[doctorNombre] || 0) + 1;

      // ---------- DIAS ----------
      if (r.fecha) {
        dias[r.fecha] = (dias[r.fecha] || 0) + 1;
      }

      // ---------- PROVEEDOR ----------
      if (r.proveedor) {
        proveedores[r.proveedor] = (proveedores[r.proveedor] || 0) + 1;
      }
    });

    const orderedDias = Object.keys(dias)
      .sort((a, b) => parseFecha(b) - parseFecha(a))
      .reduce((obj, key) => {
        obj[key] = dias[key];
        return obj;
      }, {});

    setStatsEstados(estados);
    setStatsDoctores(doctores);
    setStatsDias(orderedDias);
    setStatsProveedores(proveedores);
  };

  // --------------------------------------------------
  // 🔘 Botón filtro
  // --------------------------------------------------
  const FiltroBoton = ({ label, value }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
    >
      <Text
        style={[
          styles.filterText,
          filter === value && { color: "white", fontWeight: "bold" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // --------------------------------------------------
  // 🖼️ Render
  // --------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <NavBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Total de casos: {filteredReports.length}
        </Text>

        <View style={styles.filterRow}>
          <FiltroBoton label="Hoy" value="hoy" />
          <FiltroBoton label="Ayer" value="ayer" />
          <FiltroBoton label="Semana" value="semana" />
          <FiltroBoton label="Mes" value="mes" />
          <FiltroBoton label="90 días" value="90dias" />
        </View>

        {/* Casos por Estado */}
        <Card style={styles.card}>
          <Card.Title title="Casos por Estado" />
          <Card.Content>
            {Object.entries(statsEstados).map(([estado, total]) => (
              <Text key={estado} style={styles.item}>
                {estado}: {total}
              </Text>
            ))}
          </Card.Content>
        </Card>

        {/* Casos por Doctor */}
        <Card style={styles.card}>
          <Card.Title title="Casos por Doctor" />
          <Card.Content>
            {Object.entries(statsDoctores).map(([doc, total]) => (
              <Text key={doc} style={styles.item}>
                {doc}: {total}
              </Text>
            ))}
          </Card.Content>
        </Card>

        {/* Casos por Proveedor */}
        <Card style={styles.card}>
          <Card.Title title="Casos por Proveedor" />
          <Card.Content>
            {Object.entries(statsProveedores).length === 0 ? (
              <Text style={styles.item}>No hay datos</Text>
            ) : (
              Object.entries(statsProveedores).map(([prov, total]) => (
                <Text key={prov} style={styles.item}>
                  {prov}: {total}
                </Text>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Casos por Día */}
        <Card style={styles.card}>
          <Card.Title title="Casos por Día" />
          <Card.Content>
            {Object.entries(statsDias).map(([fecha, total]) => (
              <Text key={fecha} style={styles.item}>
                {fecha}: {total}
              </Text>
            ))}
          </Card.Content>
        </Card>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --------------------------------------------------
// 🎨 Estilos
// --------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  card: {
    marginBottom: 15,
    borderRadius: 14,
    elevation: 2,
  },
  item: {
    fontSize: 16,
    marginVertical: 3,
    color: "#444",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: "#4A90E2",
  },
  filterText: {
    color: "#555",
    fontWeight: "600",
  },
  bottomSpace: {
    height: 20,
  },
});

export default StatisticsScreen;
