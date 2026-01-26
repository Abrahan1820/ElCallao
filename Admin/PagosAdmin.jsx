import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { SupaClient } from "../Supabase/supabase";
import { useNavigation } from "@react-navigation/native";
import NavBar from "../NavBar/Components/NavBar";

export default function PagosAdmin() {
  const supa = SupaClient();
  const navigation = useNavigation();

  const [resumen, setResumen] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarPagos();
  }, []);

  const cargarPagos = async () => {
    setLoading(true);

    const { data, error } = await supa
      .from("medicalReport")
      .select(`
        medico,
        ciudad:ciudad (
          pago
        )
      `)
      .eq("pagado", false);

    if (error) {
      console.error("Error cargando pagos:", error);
      setLoading(false);
      return;
    }

    const map = {};
    let totalGeneral = 0;

    data.forEach((r) => {
      const doctor = r.medico;
      const monto = r.ciudad?.pago ?? 0;

      totalGeneral += monto;

      if (!map[doctor]) {
        map[doctor] = {
          id: doctor,
          nombre: doctor,
          total: 0,
          cantidad: 0,
        };
      }

      map[doctor].total += monto;
      map[doctor].cantidad += 1;
    });

    setResumen(Object.values(map));
    setTotal(totalGeneral);
    setLoading(false);
  };

  const irADetalle = (doctorId) => {
    
      navigation.navigate("PagosDoctor", { doctorId });
    
  };

  return (
    <ScrollView style={styles.page}>
        <NavBar/>
      <Text style={styles.title}>Pagos Pendientes</Text>

      {/* TOTAL GENERAL */}
      <View style={styles.totalCard}>
        <View>
          <Text style={styles.totalLabel}>Total adeudado</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        </View>
        <Text style={styles.icon}>💰</Text>
      </View>

      {loading && <Text style={styles.loading}>Cargando...</Text>}

      {/* LISTADO DE DOCTORES */}
      <View style={styles.grid}>
        {resumen.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => irADetalle(d.id)}
          >
            <Text style={styles.cardTitle}>👨‍⚕️ {d.nombre}</Text>
            <Text style={styles.amount}>${d.total.toFixed(2)}</Text>
            <Text style={styles.subtext}>
              {d.cantidad} reportes pendientes
            </Text>
          </TouchableOpacity>
        ))}

        {resumen.length === 0 && !loading && (
          <Text style={styles.empty}>No hay pagos pendientes</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
    color: "#0f172a",
  },

  totalCard: {
    backgroundColor: "#45c0e8",
    padding: 20,
    borderRadius: 18,
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    ...Platform.select({
      web: {
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
      },
      default: {
        elevation: 6,
      },
    }),
  },

  totalLabel: {
    fontSize: 14,
    color: "#e0f2fe",
  },

  totalAmount: {
    fontSize: 30,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 4,
  },

  icon: {
    fontSize: 40,
  },

  loading: {
    textAlign: "center",
    marginBottom: 20,
    color: "#475569",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    width: Platform.OS === "web" ? "calc(33.333% - 12px)" : "100%",

    ...Platform.select({
      web: {
        boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
      },
      default: {
        elevation: 4,
      },
    }),
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#020617",
  },

  amount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },

  subtext: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
  },

  empty: {
    textAlign: "center",
    width: "100%",
    color: "#64748b",
    marginTop: 40,
  },
});
