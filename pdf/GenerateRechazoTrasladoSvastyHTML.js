import { Platform } from "react-native";

const generateRechazoTrasladoHTML = (dataToSave) => {
  const widthValue = Platform.OS === "ios" ? "width: 90%;" : "width: 92%;";

  const nombrePaciente = dataToSave.nombre || "";
  const ciPaciente = `${dataToSave.tipoDocumentoPaciente}-${dataToSave.ci}`;
  const nombreRepresentante = dataToSave.nombreRepresentante || "";
  const ciRepresentante = dataToSave.ciRepresentante || "";
  const quien = dataToSave.quienLlena;

  return `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          ${widthValue}
          margin: 20px auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          width: 200px;
          height: auto;
        }
        .fecha-ovalo {
          border: 1px solid #000000;
          border-radius: 10px;
          padding: 5px 15px;
          font-weight: bold;
          display: inline-block;
        }
        .titulo {
          text-align: center;
          font-size: 24px;
          margin: 20px 0;
        }
        .titulo span {
          color: #000000;
          font-weight: bold;
        }
        .formulario {
          border: 1px solid #000000;
          border-radius: 15px;
          padding: 10px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .check-row {
          display: flex;
          gap: 20px;
          margin-top: 15px;
        }
        .parrafos {
          margin-top: 20px;
          font-size: 13px;
          line-height: 1.6;
        }
        .firmas {
          margin-top: 40px;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          text-align: center;
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
      <div class="container">
        <div class="header">
          <img src="https://wqyaqcnntzovnpxdqwtc.supabase.co/storage/v1/object/public/Signs/AdaptativeIcon%20(2).png" class="logo" />
          <div class="fecha-ovalo">Fecha: ${dataToSave.fecha}</div>
        </div>

        <div class="titulo">
          <span>Consentimiento</span> de rechazo de traslado
        </div>

        <div class="formulario">
          <div class="row">
            <div style="width: 65%">
              <strong>Nombres y Apellidos:</strong> ${quien === "paciente" ? nombrePaciente : "______________"}
            </div>
            <div style="width: 30%">
              <strong>C.I:</strong> ${quien === "paciente" ? ciPaciente : "__________"}
            </div>
          </div>
          <div class="row">
            <div style="width: 100%">
              <strong>Nombre y C.I del familiar/representante:</strong> ${quien === "representante" ? `${nombreRepresentante} - ${ciRepresentante}` : "______________"}
            </div>
          </div>
        </div>

        <div class="check-row">
          <label><input type="checkbox" ${quien === "representante" ? "checked" : ""}/> Familiar/representante</label>
          <label><input type="checkbox" ${quien === "paciente" ? "checked" : ""}/> Paciente</label>
        </div>

        <div class="parrafos">
          <p>1. Yo <strong>${quien === "paciente" ? nombrePaciente : "______________"}</strong>, titular de la C.I. <strong>${quien === "paciente" ? ciPaciente : "__________"}</strong>, declaro que tras haber sido informado por el Dr./Dra <strong>${quien === "paciente" ? dataToSave.userName : "______________"}</strong> sobre la necesidad de tratarme y/o trasladarme de emergencia a un centro de asistencia por padecer el siguiente diagnóstico: <strong>${quien === "paciente" ? dataToSave.IDX : "______________"}</strong>.</p>

          <p>2. Yo <strong>${quien === "representante" ? nombreRepresentante : "______________"}</strong>, titular de la C.I. <strong>${quien === "representante" ? ciRepresentante : "__________"}</strong>, representante/familiar del paciente <strong>${quien === "representante" ? nombrePaciente : "______________"}</strong>, titular de la C.I. <strong>${quien === "representante" ? ciPaciente : "______________"}</strong>, declaro que tras haber sido informado por el Dr./Dra. <strong>${quien === "representante" ? dataToSave.userName : "______________"}</strong> sobre la necesidad de tratar al paciente y/o trasladarlo de emergencia a un centro de asistencia por padecer el siguiente diagnóstico: <strong>${quien === "representante" ? dataToSave.IDX : "______________"}</strong>.</p>

          <p>3. El Dr. / Dra. antes mencionado, me ha explicado la naturaleza y propósito del traslado, los riesgos y consecuencias de no aceptarlo. No obstante lo antedicho, me niego a consentir la realización del tratamiento y/o traslado.</p>

          <p>4. Se me ha dado la oportunidad de realizar preguntas con respecto a las posibles consecuencias de la no realización del tratamiento / traslado y todas ellas han sido contestadas completa y satisfactoriamente.</p>

          <p>5. Comprendo perfectamente todo lo mencionado en los puntos anteriores y dejo constancia que asumo a mi exclusivo cargo todas las consecuencias que mi negativa genere sobre mi estado de salud, deslindando de toda responsabilidad a los médicos que hasta el momento me han atendido.</p>
        </div>

        <div class="firmas">
          <div>
            ${dataToSave.firmaRechazo ? `<img src="${dataToSave.firmaRechazo}" class="signature-img" />` : ""}
            <br/>
            Firma del ${quien === "representante" ? "representante" : "paciente"}
          </div>

          <div>
            <br/>
            ${quien === "representante" ? ciRepresentante : ciPaciente}<br/>
            Cédula de Identidad<br/>
            (${quien === "representante" ? "familiar/representante" : "paciente"})
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
};

export default generateRechazoTrasladoHTML;
