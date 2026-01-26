import { useState } from "react";
import { SupaClient } from "../Supabase/supabase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "../NavBar/Components/NavBar";

// 🔧 Convierte DD/MM/AAAA → Date
const parseDDMMYYYY = (str) => {
  if (!str) return null;
  const [day, month, year] = str.split("/");
  return new Date(year, month - 1, day);
};

export default function AdminManagment() {
  const supa = SupaClient();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);

  // 🔍 BUSCAR REPORTES
  const buscarReportes = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecciona un rango de fechas");
      return;
    }

    setLoading(true);
    setError(null);

    const from = new Date(startDate);
    const to = new Date(endDate);
    to.setHours(23, 59, 59, 999);

    const { data, error } = await supa
      .from("medicalReport")
      .select(`
        nCaso,
        fecha,
        proveedor,
        ciTitular,
        titularPoliza,
        ciPaciente,
        nombrePaciente,
        ciudad:ciudad (
          CiudadNombre,
          CiudadCosto,
          ClasificacionDistancia
        ),
        estado:estado (
          ZonaNombre
        )
      `)
      .eq("enviado", false);

    if (error) {
      console.error(error);
      setError("Error cargando reportes");
      toast.error("Error cargando reportes");
    } else {
      const filtrados = (data || []).filter((r) => {
        const f = parseDDMMYYYY(r.fecha);
        return f && f >= from && f <= to;
      });

      setReports(filtrados);
      toast.success(`Reportes encontrados: ${filtrados.length}`);
    }

    setLoading(false);
  };

  // 📊 GENERAR EXCEL
  const generarExcel = () => {
    if (reports.length === 0) {
      toast.error("No hay reportes para exportar");
      return;
    }

    const excelData = reports.map((r) => ({
      Fecha: r.fecha,
      Cliente: r.proveedor,
      Monto: r.ciudad?.CiudadCosto ?? 0,
      "Tipo Servicio": "AMD",
      Turno: "Diurno",
      Clasificación: r.ciudad?.ClasificacionDistancia ?? "",
      Estado: r.estado?.ZonaNombre ?? "",
      Ciudad: r.ciudad?.CiudadNombre ?? "",
      "N° Caso": r.nCaso,
      "Cédula Titular": r.ciTitular,
      "Nombre Titular": r.titularPoliza,
      "Cédula Paciente": r.ciPaciente,
      "Nombre Paciente": r.nombrePaciente,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `reportes_admin_${startDate}_${endDate}.xlsx`);
    toast.success("Excel generado correctamente");
  };

  return (
    <div style={styles.page}>
      <ToastContainer position="top-right" />
      <NavBar />
      <div style={styles.contenedor}>
      <h2 style={styles.title}>Gestión Administrativa</h2>

      {/* FILTROS */}
      <div style={styles.card}>
        <div style={styles.field}>
          <label>Desde</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div style={styles.field}>
          <label>Hasta</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <button style={styles.primaryBtn} onClick={buscarReportes} disabled={loading}>
          Buscar
        </button>

        <button
          style={styles.successBtn}
          onClick={generarExcel}
          disabled={loading || reports.length === 0}
        >
          Exportar Excel
        </button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* TABLA */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {[
                "Fecha",
                "Cliente",
                "Monto",
                "Ciudad",
                "Estado",
                "Caso",
                "Cédula Titular",
                "Nombre Titular",
                "Cédula Paciente",
                "Nombre Paciente",
              ].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && !loading && (
              <tr>
                <td colSpan="10" style={styles.empty}>No hay reportes</td>
              </tr>
            )}

            {reports.map((r, i) => (
              <tr key={i}>
                <td style={styles.td}>{r.fecha}</td>
                <td style={styles.td}>{r.proveedor}</td>
                <td style={styles.td}>{r.ciudad?.CiudadCosto}</td>
                <td style={styles.td}>{r.ciudad?.CiudadNombre}</td>
                <td style={styles.td}>{r.estado?.ZonaNombre}</td>
                <td style={styles.td}>{r.nCaso}</td>
                <td style={styles.td}>{r.ciTitular}</td>
                <td style={styles.td}>{r.titularPoliza}</td>
                <td style={styles.td}>{r.ciPaciente}</td>
                <td style={styles.td}>{r.nombrePaciente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

/* 🎨 ESTILOS */
const styles = {
  page: {
  
  background: "#f7f9fc",
  minHeight: "100vh",
  width: "100%",
},
contenedor: {
  margin: 20,
},

  title: {
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  primaryBtn: {
    padding: "8px 18px",
    background: "#45c0e8",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  successBtn: {
    padding: "8px 18px",
    background: "#2ecc71",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  th: {
    background: "#45c0e8",
    color: "#fff",
    padding: 12,
    textAlign: "left",
    fontSize: 14,
  },
  td: {
    padding: 10,
    borderBottom: "1px solid #eee",
    fontSize: 13,
  },
  empty: {
    textAlign: "center",
    padding: 20,
    color: "#888",
  },
};
