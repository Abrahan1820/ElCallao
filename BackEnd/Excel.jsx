import ExcelJS from "exceljs";

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Reportes Pendientes");

sheet.columns = [
  { header: "Fecha", key: "fecha", width: 15 },
  { header: "Caso", key: "caso", width: 15 },
  { header: "Paciente", key: "paciente", width: 30 },
  { header: "Médico", key: "medico", width: 30 },
  { header: "MSDS", key: "msds", width: 15 },
  { header: "Empresa", key: "empresa", width: 25 },
];

reportes.forEach(r => sheet.addRow(r));

const buffer = await workbook.xlsx.writeBuffer();

return new Response(buffer, {
  headers: {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": "attachment; filename=reportes_pendientes.xlsx",
  },
});
