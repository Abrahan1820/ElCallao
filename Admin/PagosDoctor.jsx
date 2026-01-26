import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SupaClient } from "../Supabase/supabase";
import { useRoute } from "@react-navigation/native";

export default function PagosDoctor({ user }) {
  const supa = SupaClient();
  const route = useRoute();

  // 👉 Si viene por Admin usamos el param
  const doctorId = route?.params?.doctorId || user?.nombre;

  const [reportes, setReportes] = useState([]);
  const [total, setTotal] = useState(0);
  const [cantidad, setCantidad] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDetalle();
  }, []);

  const cargarDetalle = async () => {
    setLoading(true);

    const { data, error } = await supa
      .from("medicalReport")
      .select(`
        fecha,
        nCaso,
        medico,
        ciudad:ciudad (
          CiudadNombre,
          pago
        )
      `)
      .eq("pagado", false)
      .eq("medico", doctorId)
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error cargando detalle:", error);
      setLoading(false);
      return;
    }

    let suma = 0;
    data.forEach(r => {
      suma += r.ciudad?.pago ?? 0;
    });

    setReportes(data);
    setTotal(suma);
    setCantidad(data.length);
    setLoading(false);
  };

  const promedio = cantidad > 0 ? total / cantidad : 0;

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.title}>Detalle de Pagos</Text>
      <Text style={styles.subtitle}>👨‍⚕️ {doctorId}</Text>

      {/* MÉTRICAS */}
      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total generado</Text>
          <Text style={styles.metricValue}>${total.toFixed(2)}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Reportes</Text>
          <Text style={styles.metricValue}>{cantidad}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Promedio</Text>
          <Text style={styles.metricValue}>${promedio.toFixed(2)}</Text>
        </View>
      </View>

      {loading && <Text style={styles.loading}>Cargando...</Text>}

      {/* LISTADO */}
      <View style={styles.list}>
        {reportes.map((r, i) => (
          <View key={i} style={styles.row}>
            <View>
              <Text style={styles.case}>Caso #{r.nCaso}</Text>
              <Text style={styles.date}>{r.fecha}</Text>
              <Text style={styles.city}>
                📍 {r.ciudad?.CiudadNombre}
              </Text>
            </View>

            <Text style={styles.amount}>
              ${r.ciudad?.pago ?? 0}
            </Text>
          </View>
        ))}

        {reportes.length === 0 && !loading && (
          <Text style={styles.empty}>
            No hay pagos pendientes
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f7fb",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 20,
  },

  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },

  metricCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    width: Platform.OS === "web" ? "calc(33.333% - 12px)" : "100%",

    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
      default: {
        elevation: 4,
      },
    }),
  },

  metricLabel: {
    fontSize: 13,
    color: "#64748b",
  },

  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
    color: "#0f172a",
  },

  loading: {
    textAlign: "center",
    marginVertical: 20,
    color: "#475569",
  },

  list: {
    gap: 12,
  },

  row: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      },
      default: {
        elevation: 2,
      },
    }),
  },

  case: {
    fontWeight: "700",
    fontSize: 15,
  },

  date: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  city: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
  },

  amount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#64748b",
  },
});
