import { Platform } from "react-native";

const generateMedicineReportHTML = (dataToSave) => {
  const esAndroid = Platform.OS === "android";

  // Normalizamos valores que puedan venir como undefined
  const safe = (val) => (val && val !== "undefined" ? val : "");

  // Garantizar que haya siempre 9 filas (rellenar con vacías)
  const meds = [...(dataToSave.medicamentos || [])];
  while (meds.length < 9) {
    meds.push({ cantidad: "", nombre: "" });
  }
  const nombrePaciente = dataToSave.nombre || "";
  const nombreRepresentante = dataToSave.nombreRepresentante || "";
  const quien = dataToSave.quienLlena;

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          @page {
    margin: 20px;
  }
  body { 
    font-family: Arial, sans-serif; 
   
  }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
            margin-top: 5px;
          }
          .logo { width: 200px; height: auto; }
          .titleRight { font-size: 18px; text-align: right; color: #fe6b00; }
          .mainTitle { 
            font-size: 22px; 
            text-align: center; 
            margin: 10px 0; 
            color: #fe6b00;
          }
          .mainTitle span.bold { font-weight: bold; }

          .form-container {
            border: 1px solid #45c0e8;
            border-radius: 10px;
            margin-bottom: 10px;
            overflow: hidden;
          }
          .row {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            border-bottom: 1px solid #45c0e8;
            min-height: 22px; /* altura uniforme */
            align-items: stretch; /* <-- líneas completas */
          }
          .row:last-child { border-bottom: none; }
          .cell {
            padding: 4px 0;
            border-right: 1px solid #45c0e8;
            box-sizing: border-box;
            padding-left: 2px; /* menos sangría */
            font-size: 11px;
            display: flex;
            align-items: center;
          }
          .cell:last-child { border-right: none; }
          .cell-15 { width: 15%; }
          .cell-25 { width: 25%; }
          .cell-30 { width: 30%; }
          .cell-50 { width: 50%; }
          .cell-70 { width: 70%; }
          .cell-75 { width: 75%; }
          .cell-100 { width: 100%; }
          .littleTitle {
            font-size: 12px;
            font-weight: bold;
            color: #000;
          }
          .firma-box {
            height: 80px;
            border: 1px solid #45c0e8;
            margin-top: 5px;
          }
          .firma-space {
            height: 150px; /* espacio firma recibe */
            margin: 5px 0;
          }
          .observaciones-box {
            height: 120px; /* espacio fijo ~7 líneas */
            padding: 5px;
            font-size: 11px;
          }
          .centerText { 
            text-align: center; 
            font-size: 12px; 
            margin-top: 10px;
            margin-bottom: 5px;
          }
          .firma-section {
            display: flex;
            justify-content: space-between;
            gap: 20px; /* separación entre columnas */
          }
          .firma-col {
            flex: 1;
          }
          /* Estilos Recibe conforme */
          .recibe-conforme {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .recibe-row {
            display: flex;
            justify-content: space-between;
           
            align-items: center;
            height: 25px;
          }
          .recibe-cell {
            width: 50%;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
          }
          .checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid #000;
  margin: auto;
}
.checkbox.checked {
  background-color: #000;
}
            .signature-img {
          width: 40mm;
          height: 25mm;
          margin: 10px auto 0;
          display: block;
        }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <img src="https://wqyaqcnntzovnpxdqwtc.supabase.co/storage/v1/object/public/Signs//LogoRIF.png" class="logo" />
          <div class="titleRight">Transformando<br/>tu experiencia en salud</div>
        </div>

        <!-- Título -->
        <div class="mainTitle">KIT DE <span class="bold">MEDICAMENTOS</span></div>

        <!-- Datos principales -->
        <div class="form-container ${esAndroid ? "android-margin" : ""}">
          <div class="row">
            <div class="cell cell-70"><span class="littleTitle">Nombre del paciente:</span> ${safe(dataToSave.nombre)}</div>
            <div class="cell cell-30"><span class="littleTitle">Fecha:</span> ${safe(dataToSave.fecha)}</div>
          </div>
          <div class="row">
            <div class="cell cell-70"><span class="littleTitle">Tipo de servicio:</span> Atención médica domiciliaria</div>
            <div class="cell cell-30"><span class="littleTitle">Clave:</span> ${safe(dataToSave.caso)}</div>
          </div>
          <div class="row">
            <div class="cell cell-70"><span class="littleTitle">Aseguradora:</span> ${safe(dataToSave.seguro)}</div>
            <div class="cell cell-30"><span class="littleTitle">CI:</span> ${safe(dataToSave.ci)}</div>
          </div>
        </div>

        <!-- Medicamentos -->
        <div class="form-container ${esAndroid ? "android-margin" : ""}">
          <div class="row">
            <div class="cell cell-15"><span class="littleTitle">Cantidad</span></div>
            <div class="cell cell-75"><span class="littleTitle">Medicamento entregado</span></div>
          </div>
          ${meds
            .map(
              (m) => `
            <div class="row">
              <div class="cell cell-15">${safe(m.cantidad)}</div>
              <div class="cell cell-75">${safe(m.nombre)}</div>
            </div>`
            )
            .join("")}
        </div>

        <!-- Firmas -->
        <div class="form-container ${esAndroid ? "android-margin" : ""}">
          <div class="firma-section">
            <div class="firma-col">
              <span class="littleTitle">Sello y firma del médico</span>
              <div class="firma-box">
                ${dataToSave.firmaUrl ? `<img src="${dataToSave.firmaUrl}" style="width:150px; height:90px;" />` : ""}
              </div>
            </div>
<div class="firma-col">
  <span class="littleTitle">Recibe conforme:</span>
  <div class="recibe-conforme">
    <div class="recibe-row">
      <div class="recibe-cell">SI</div>
      <div class="recibe-cell">NO</div>
    </div>
    <div class="recibe-row">
  <div class="recibe-cell">
    <div class="checkbox ${dataToSave.recibeConforme === "Si" ? "checked" : ""}"></div>
  </div>
  <div class="recibe-cell">
    <div class="checkbox ${dataToSave.recibeConforme === "No" ? "checked" : ""}"></div>
  </div>
</div>

  </div>
</div>

          </div>
        </div>

        <!-- Personal -->
        <div class="form-container ${esAndroid ? "android-margin" : ""}">
          <div class="row"><div class="cell cell-100"><span class="littleTitle">Paramédico: </span> ${safe(dataToSave.NombreParamédico)}</div></div>
          <div class="row"><div class="cell cell-100"><span class="littleTitle">Médico: </span> ${safe(dataToSave.MédicoRecibe)}</div></div>
          <div class="row"><div class="cell cell-100"><span class="littleTitle">Recibido por: </span> ${quien === "paciente" ? nombrePaciente : nombreRepresentante}</div></div>
        </div>

        <div class="centerText">Firma de quien recibe</div>
        <div class="firma-space">${dataToSave.firmaRechazo ? `<img src="${dataToSave.firmaRechazo}" class="signature-img" />` : ""}</div>

        <!-- Observaciones -->
        <div class="form-container ${esAndroid ? "android-margin" : ""}">
          <span class="littleTitle">Observaciones:</span>
          <div class="observaciones-box">${safe(dataToSave.Observaciones)}</div>
        </div>
      </body>
    </html>
  `;
};

export default generateMedicineReportHTML;
