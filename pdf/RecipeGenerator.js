import { Platform } from "react-native";

const generateRecipeHTML = (dataToSave) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Estilos generales */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            margin: 10mm 15mm;
            font-size: 14px;
            line-height: 1.4;
            color: #000;
            height: 100vh;
        }
        
        /* Contenedor principal */
        .recipe-container {
            width: 100%;
            max-width: 180mm;
            margin: 0 auto;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        /* Cabecera con logo y texto */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
            flex-shrink: 0;
        }
        
        .header-left {
            
        }
        
        .header-right {
           
            text-align: right;
        }
        
        .header-title {
            font-size: 22px;
            font-weight: bold;
            color: #005A9B;
            margin-bottom: 3px;
            font-style: italic;
        }
        
        .header-subtitle {
            font-size: 22px;
            color: #005A9B;
            font-style: italic;
        }
        
        .bold-text {
            font-weight: bold;
            color: #005A9B;
        }
        
        .logoImagen {
            width: 300px;
            height: 80px;
        }
        
        /* Formulario de datos del paciente con bordes azules */
        .patient-form-container {
            border: 1px solid #005A9B;
            border-radius: 15px;
            margin-bottom: 20px;
            overflow: hidden;
            flex-shrink: 0;
        }
        
        .form-row {
            display: flex;
            flex-wrap: wrap;
            border-bottom: 1px solid #005A9B;
        }
        
        .form-row:last-child {
            border-bottom: none;
        }
        
        .form-cell {
            padding: 6px 8px;
            border-right: 1px solid #005A9B;
            box-sizing: border-box;
        }
        
        .form-cell:last-child {
            border-right: none;
        }
        
        .cell-100 {
            width: 100%;
            font-size: 11px;
        }
        
        .cell-60 {
            width: 60%;
            font-size: 11px;
        }
        
        .cell-40 {
            width: 40%;
            font-size: 11px;
        }
        
        .form-label {
            color: #005A9B;
            font-size: 14px;
            margin-right: 5px;
        }
        
        /* Contenedor de contenido principal */
        .content-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0; /* Importante para el scroll interno */
        }
        
        /* Secciones de contenido con altura flexible */
        .section {
            display: flex;
            flex-direction: column;
            margin-bottom: 20px;
            flex: 1;
            min-height: 150px; /* Altura mínima para cada sección */
        }
        
        .section-title {

            font-size: 14px;
            margin-bottom: 8px;
            color: #005A9B;
            flex-shrink: 0;
        }
        
        .section-content {
            white-space: pre-line;
            line-height: 1.6;
            padding: 10px;
            border-radius: 8px;
            flex: 1;
            overflow-y: auto;
            min-height: 120px;
            background-color: #fafafa;  
        }
        
        /* Contenedor para ambas secciones con espacio flexible */
        .sections-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        /* Línea divisoria con guiones */
        .divider {
            text-align: center;
            margin: 10px 0;
            color: #666;
            letter-spacing: 2px;
            flex-shrink: 0;
        }
        
        .divider-line {
            display: inline-block;
            border: none;
            width: 100%;
            text-align: center;
            color: #999;
            font-size: 16px;
        }
        
        /* Pie de página */
        .footer {
            margin-top: 20px;
            flex-shrink: 0;
        }
        
        .doctor-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin: 20px 90px;
        }
        
        .doctor-details {
            flex: 1;
        }
        
        .doctor-name {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 5px;
        }
        
        .consultation-date {
            font-size: 12px;
            color: #555;
        }
        
        .signature-container {
            text-align: right;
            flex-shrink: 0;
        }
        
        .firma-img {
            width: 150px;
            height: 90px;
            margin-bottom: 5px;
        }
        
        .signature-label {
            font-size: 11px;
            color: #555;
            font-style: italic;
        }
        
        /* Información de contacto */
        .contact-info {
            text-align: center;
            font-size: 15px;
            line-height: 1.6;
            color: #005A9B;
            padding-top: 15px;
            margin-top: 15px;
            border-top: 1px solid #ddd;
        }
        
        .bold-link {
            font-weight: bold;
            color: #005A9B;
            text-decoration: none;
            font-size: 15px;
        }
        
        .address-line {
            display: block;
            margin-top: 3px;
            font-size: 15px;
            color: #005A9B;
        }
        
        
    </style>
</head>
<body>
    <div class="recipe-container">
        <!-- Cabecera con logo -->
        <div class="header">
            <div class="header-left">
                <img src="https://wqyaqcnntzovnpxdqwtc.supabase.co/storage/v1/object/public/Signs//LogoRIF.png" 
                     class="logoImagen" 
                     alt="Logo" />
            </div>
            <div class="header-right">
                <div class="header-title">transformando</div>
                <div class="header-subtitle">tu <span class="bold-text">experiencia</span> en salud</div>
            </div>
        </div>
        
        <!-- Formulario con datos del paciente -->
        <div class="patient-form-container">
            <div class="form-row">
                <div class="form-cell cell-100">
                    <span class="form-label">Paciente:</span> ${dataToSave.nombre}
                </div>
            </div>
            <div class="form-row">
                <div class="form-cell cell-60">
                    <span class="form-label">C.I:</span> ${dataToSave.tipoDocumentoPaciente}-${dataToSave.ci}
                </div>
                <div class="form-cell cell-40">
                    <span class="form-label">Edad:</span> ${dataToSave.edad}
                </div>
            </div>
        </div>
        
        <!-- Contenedor de contenido principal -->
        <div class="content-wrapper">
            <!-- Sección Recipe -->
            <div class="section">
                <div class="section-title">Récipe</div>
                <div class="section-content">${dataToSave.Recipe}</div>
            </div>
            
            <!-- Línea divisoria con guiones -->
            <div class="divider">
                <div class="divider-line">-----------------------------------------------------------------------------------------</div>
            </div>
            
            <!-- Sección Indicaciones -->
            <div class="section">
                <div class="section-title">Indicaciones</div>
                <div class="section-content">${dataToSave.Indicaciones}</div>
            </div>
        </div>
        
        <!-- Pie de página -->
        <div class="footer">
            <div class="doctor-info">
                <div class="doctor-details">
                    <div class="doctor-name">Médico: ${dataToSave.userName}</div>
                    <div class="consultation-date">Fecha de consulta: ${dataToSave.fecha}</div>
                </div>
                
                <div class="signature-container">
                    <img src="${dataToSave.firmaUrl}" 
                         class="firma-img" 
                         alt="Firma del médico" />
                    <div class="signature-label">Firma y sello</div>
                </div>
            </div>
            
            <!-- Información de contacto -->
            <div class="contact-info">
                <div>
                    Visite <span class="bold-link">www.gruponueveonce.com</span> 
                    o contáctenos al <span class="bold-link">0800-GNO-24-00 | 24-01</span>
                </div>
                <div class="address-line">
                    Calle Herrera Toro, Las Mercedes, Caracas, 1080, Miranda
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
};

export default generateRecipeHTML;