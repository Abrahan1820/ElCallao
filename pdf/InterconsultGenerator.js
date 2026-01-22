import { Platform } from "react-native";

const generateInterconsultHTML = (dataToSave) => {
  const widthValue = Platform.OS === "ios" ? "width: 90%;" : "width: 92%;";
  const esAndroid = Platform.OS === "android";

  const formatSexo = (sexo) => {
    if (!sexo) return "No especificado";
    const normalizedSexo = sexo.trim().toUpperCase();
    return normalizedSexo === "M"
      ? "Masculino"
      : normalizedSexo === "F"
      ? "Femenino"
      : "No válido";
  };

  const sexoFormateado = formatSexo(dataToSave.sexo);

  return `
    <html>
        <head>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0;
                    padding: 0;
                }
                
                .interconsult-container {
                    display: flex;
                    ${widthValue}
                    height: 270mm !important;
                    margin: 15px auto;
                    flex-direction: column;
                }
                
                .header-container {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 10px;
                }
                
                .logo-title-container {
                    display: flex;
                    flex-direction: column;
                    ${esAndroid ? "margin-left: 20px; margin-right: 20px;" : ""}
                }
                
                .logo { 
                    width: 300px; 
                    height: 80px;
                    align-self: flex-start; /* Logo a la izquierda */
                }
                
                .document-title {
                    text-align: center;
                    width: 100%;
                    margin-top: 10px;
                    margin-bottom: 15px;
                }
                
                .document-title span {
                    font-size: 30px;
                    color: #fe6b00;
                }
                
                .document-title .bold {
                    font-weight: bold;
                }
                
                .form-container { 
                    border: 1px solid #45c0e8;
                    border-radius: 20px;
                    margin-bottom: 15px;
                    overflow: hidden; 
                }
                
                .android-margin {
                    margin-left: 20px;
                    margin-right: 20px;
                }
                
                .row {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    border-bottom: 1px solid #45c0e8;
                }
                
                .row:last-child {
                    border-bottom: none;
                }
                
                .cell {
                    padding: 5px 0;
                    border-right: 1px solid #45c0e8;
                    box-sizing: border-box;
                    padding-left: 5px;
                }
                
                .cell:last-child {
                    border-right: none;
                }
                
                .label {
                    color: #000000;
                }
                
                .cell-70 { width: 70%; font-size: 10px }
                .cell-30 { width: 30%; font-size: 10px }
                .cell-13 { width: 13%; font-size: 10px }
                .cell-17 { width: 17%; font-size: 10px }
                
                .content-section {
                    margin-bottom: 20px;
                    font-size: 12px;
                    line-height: 1.5;
                    min-height: 120mm;
                    ${esAndroid ? "margin-left: 20px; margin-right: 20px;" : ""}
                }
                
                .signature-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-top: 30px;
                }
                
                .signature-img {
                    width: 150px; 
                    height: 90px;
                    margin: 10px 0;
                }
                
                .contact-info {
                    text-align: center;
                    font-size: 11px;
                    margin-top: 20px;
                    line-height: 1.4;
                }
                
                .bold-link {
                    font-weight: bold;
                }
                
                .address-line {
                    display: block;
                    margin-top: 5px;
                }
            </style>
        </head>
        <body>
            <div class="interconsult-container">
                <!-- Encabezado con logo y título -->
                <div class="header-container">
                    <div class="logo-title-container">
                        <img src="https://wqyaqcnntzovnpxdqwtc.supabase.co/storage/v1/object/public/Signs//LogoRIF.png" class="logo" />
                        <div class="document-title">
                            <span>INFORME DE </span><span class="bold">ATENCIÓN MÉDICA</span>
                        </div>
                    </div>
                </div>
                
                <!-- Sección de datos del paciente -->
                <div class="form-container ${esAndroid ? "android-margin" : ""}">
                    <div class="row">
                        <div class="cell cell-70"><span class="label">Empresa:</span> ${dataToSave.empresa || ''}</div>
                        <div class="cell cell-30"><span class="label">Fecha:</span> ${dataToSave.fecha}</div>
                    </div>
                    <div class="row">
                        <div class="cell cell-70"><span class="label">Nombres y Apellidos:</span> ${dataToSave.nombre}</div>
                        <div class="cell cell-13"><span class="label">Edad:</span> ${dataToSave.edad}</div>
                        <div class="cell cell-17"><span class="label">Sexo:</span> ${sexoFormateado}</div>
                    </div>
                    <div class="row">
                        <div class="cell cell-70"></div>
                        <div class="cell cell-30"><span class="label">C.I:</span> ${dataToSave.tipoDocumentoPaciente}-${dataToSave.ci}</div>
                    </div>
                </div>
                
                <!-- Contenido de la interconsulta -->
                <div class="content-section">
                    <div><span class="label">Especialidad médica:</span> ${dataToSave.especialidadMedica}</div>
                    <div style="margin-top: 15px;">${dataToSave.enfermedadActual}</div>
                    <div style="margin-top: 20px;">Se agradece su evaluación y conducta.</div>
                </div>
                
                <!-- Sección de firma -->
                <div class="signature-section ${esAndroid ? "android-margin" : ""}">
                    <span>Atentamente</span>
                    <img src="${dataToSave.firmaUrl}" class="signature-img" />
                    <span>${dataToSave.userName}</span>
                    <span>${dataToSave.especialidad}</span>
                    <span>C.I: ${dataToSave.tipoDocumento}-${dataToSave.CIDoctor} / MPSS: ${dataToSave.msds} / CM: ${dataToSave.CM}</span>
                </div>
                
                <!-- Información de contacto -->
                <div class="contact-info ${esAndroid ? "android-margin" : ""}">
                    <span>Visita <span class="bold-link">www.gruponueveonce.com</span> o contactanos al <span class="bold-link">0800-GNO-24-00 | 24-01</span></span>
                    <span class="address-line">Calle Herrera Toro, Las Mercedes, Caracas, 1080, Miranda</span>
                </div>
            </div>
        </body>
    </html>
    `;
};

export default generateInterconsultHTML;