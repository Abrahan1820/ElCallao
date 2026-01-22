import { Platform } from "react-native";

const generateMedicalReportHTML = (dataToSave) => {
  // Función para calcular el número de líneas
  const calcularLineas = (texto, minLineas, caracteresDesperdiciados) => {
    const caracteresPorLinea = 153; // Número de caracteres por línea (ajusta este valor según tu diseño)
    const longitudTexto = texto.length;
    // Calcula el límite de caracteres para las líneas mínimas
    const limiteCaracteres = (minLineas - 1) * caracteresPorLinea;
    // Verifica si estamos en la última línea
    const esUltimaLinea =
      longitudTexto + caracteresDesperdiciados > limiteCaracteres;
    if (longitudTexto + caracteresDesperdiciados <= caracteresPorLinea) {
      return {
        lineas: minLineas, // Mínimo de líneas
        esUltimaLinea: false,
      };
    }

    // Calcula el número de líneas necesarias
    const lineasNecesarias = Math.ceil(
      (longitudTexto + caracteresDesperdiciados) / caracteresPorLinea
    );

    return {
      lineas: Math.max(lineasNecesarias, minLineas),
      esUltimaLinea: esUltimaLinea,
    };
  };

  const esAndroid = Platform.OS === "android";
    const esWeb = Platform.OS === "web"; // 👈 detecta versión web

  // Detectar iPhone solo en web
  let esIphoneWeb = false;
  if (esWeb && typeof navigator !== "undefined") {
    esIphoneWeb = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  const ta1 = dataToSave.TA1Inicial ? `${dataToSave.TA1Inicial} mmHg` : "";
  const fc1 = dataToSave.FC1Inicial ? `${dataToSave.FC1Inicial} lpm` : "";
  const fr1 = dataToSave.FR1Inicial ? `${dataToSave.FR1Inicial} rpm` : "";
  const temperatura1 = dataToSave.TemperaturaInicial
    ? `${dataToSave.TemperaturaInicial}°C`
    : "";
  const glicemia1 = dataToSave.GlicemiaInicial
    ? `${dataToSave.GlicemiaInicial} mg/dL`
    : "";
  const sat1 = dataToSave.SatInicial ? `${dataToSave.SatInicial}%` : "";
  const ta2 = dataToSave.TA2Final ? `${dataToSave.TA2Final} mmHg` : "";
  const fc2 = dataToSave.FC2Final ? `${dataToSave.FC2Final} lpm` : "";
  const fr2 = dataToSave.FR2Final ? `${dataToSave.FR2Final} rpm` : "";
  const temperatura2 = dataToSave.TemperaturaFinal
    ? `${dataToSave.TemperaturaFinal}°C`
    : "";
  const glicemia2 = dataToSave.GlicemiaFinal
    ? `${dataToSave.GlicemiaFinal} mg/dL`
    : "";
  const sat2 = dataToSave.SatFinal ? `${dataToSave.SatFinal}%` : "";

  return `
        <html>
                <head>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                        }
                        
                        .header { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center;  
                            margin-bottom: 5px;
                            margin-top: ${
              esIphoneWeb ? "-30px" : "5px"
            };
                        }
                        .logo { width: 300px; height: 80px; }
                        .title { font-size: 30px; text-align: right; color: #fe6b00; }
                        .titleBold { font-size: 30px; font-weight: bold; text-align: right; color: #fe6b00; }
                        .form-container { 
                            border: 1px solid #45c0e8; /* Borde naranja */
                            border-radius: 20px; /* Bordes redondeados */
                            margin-bottom: 10px; /* Espacio entre secciones */
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
                            border-bottom: 1px solid #45c0e8; /* Línea separadora entre filas */
                        }
                        .row:last-child {
                            border-bottom: none; /* Eliminar línea de la última fila */
                        }
                        .cell {
                            
                            padding: 2px 0;
                            border-right: 1px solid #45c0e8; /* Línea separadora entre celdas */
                            box-sizing: border-box; /* Incluir el borde en el ancho */
                            padding-left: 5px;
                        }
                        .cell:last-child {
                            border-right: none; /* Eliminar línea de la última celda */
                        }
                        .label {
                            color: #005A9B;  /* Color negro */
                        }
                        .cell-60 { width: 60%; font-size: 10px}
                        .cell-40 { width: 40%; font-size: 10px}
                        .cell-45 { width: 45%; font-size: 10px}
                        .cell-20 { width: 20%; font-size: 10px}
                        .cell-9 { width: 9%; font-size: 10px}
                        .cell-10 { width: 10%; font-size: 10px}
                        .cell-11 { width: 11%; font-size: 10px}
                        .cell-12 { width: 12%; font-size: 10px}
                        .cell-13 { width: 13%; font-size: 10px}
                        .cell-14 { width: 13%; font-size: 9px}
                        .cell-55 { width: 55%; font-size: 10px}
                        .cell-15 { width: 15%; font-size: 10px}
                        .cell-25 { width: 25%; font-size: 10px}
                        .cell-30 { width: 30%; font-size: 10px}
                        .cell-50 { width: 50%; font-size: 10px}
                        .cell-70 { width: 70%; font-size: 10px}
                        .cell-75 { width: 75%; font-size: 10px}
                        .cell-80 { width: 80%; font-size: 10px}
                        .cell-90 { width: 90%; font-size: 10px}
                        .cell-100 { width: 100%; font-size: 10px}
                        .littleTitle {
                            font-size: 13px;
                            color: #fe6b00;
                            font-weight: bold;  
                        }
                        .leftPadding {left-Padding: 7px;}

                        .underline-lines {
                            display: block;
                            width: 100%;
                            line-height: 1.5em;
                            
                            background-size: 100% 1.5em; /* Tamaño del fondo acorde a la línea */
                            background-repeat: repeat-y; /* Repite la línea en cada línea de texto */ 
                            
                            
                        }
                        .ultima-linea { margin-bottom: -0.5em; }

                        .underlineConsult { min-height: calc(1.5em * ${
                          calcularLineas(dataToSave.motivoConsulta, 2, 20)
                            .lineas
                        });}
                        .underlineActualDisease { min-height: calc(1.5em * ${
                          calcularLineas(dataToSave.enfermedadActual, 7, 19)
                            .lineas
                        });}
                        .underlineCardiopulmonary { min-height: calc(1.5em * ${
                          calcularLineas(dataToSave.Cardiopulmonar, 2, 16)
                            .lineas
                        });}
                        .underlineAbs { min-height: calc(1.5em * ${
                          calcularLineas(dataToSave.Abdomen, 2, 9).lineas
                        });}
                        .underlineObservations { min-height: calc(1.5em * ${
                          calcularLineas(dataToSave.Observaciones, 3, 23).lineas
                        });}
                        .underlineIDX { min-height: calc(1.5em * ${
                          calcularLineas(dataToSave.IDX, 2, 5).lineas
                        });}
                        .underlineTreatmentApplied { min-height: calc(1.5em * ${
                          calcularLineas(dataToSave.TratamientoAplicado, 3, 92)
                            .lineas
                        });}
                        .underlineAmbulatoryTreatment { min-height: calc(1.5em * ${
                          calcularLineas(
                            dataToSave.EspecificaciónTratamientoAmbulatorio,
                            3,
                            41
                          ).lineas
                        });}
                        .underlineMedicalHistory { min-height: calc(1.5em * ${
                          calcularLineas(dataToSave.antecedentesMedicos, 2, 22)
                            .lineas
                        });}

                        .izquierdaImg {width: 80%}
                        .derechaImg {width: 20%}
                        .displayFlex {display: flex}
                        .uppercase {
                        text-transform: uppercase;
                        .grande {
                            flex: 1;
                            width: 100%;
                            height: 100%;
                            }
                    }

                    </style>
                </head>
                <body>
                <div class="grande">
                    <div class="header">
                        <img src="https://wqyaqcnntzovnpxdqwtc.supabase.co/storage/v1/object/public/Signs//LogoRIF.png" class="logo" />
                        <div class="${esAndroid ? "android-margin" : ""}">
                            <div class="title">INFORME DE </div>
                            <div class="titleBold">ATENCIÓN MÉDICA</div>
                        </div>
                    </div>
    
                    <!-- Primera sección -->
                    <div class="form-container ${
                      esAndroid ? "android-margin" : ""
                    }">
                        <!-- Línea 1 -->
                        <div class="row">
                            <div class="cell cell-60"><span class="label">Compañía de Seguro:</span> ${
                              dataToSave.seguro
                            }</div>
                            <div class="cell cell-20"><span class="label">Fecha:</span> ${
                              dataToSave.fecha
                            }</div>
                            <div class="cell cell-20"><span class="label">N° de Póliza:</span> ${
                              dataToSave.poliza
                            }</div>
                        </div>
                        <!-- Línea 2 -->
                        <div class="row">
                            <div class="cell cell-80"><span class="label">Empresa:</span> ${
                              dataToSave.empresa
                            }</div>
                            <div class="cell cell-20"><span class="label">N° de Caso:</span> ${
                              dataToSave.caso
                            }</div>
                        </div>
                        <!-- Línea 3 -->
                        <div class="row">
                            <div class="cell cell-60"><span class="label">Nombres y Apellidos:</span> ${
                              dataToSave.nombre
                            }</div>
                            <div class="cell cell-20"><span class="label">C.I:</span> ${
                              dataToSave.tipoDocumentoPaciente
                            }-${dataToSave.ci}</div>
                            <div class="cell cell-10"><span class="label">Edad:</span> ${
                              dataToSave.edad
                            }</div>
                            <div class="cell cell-10"><span class="label">Sexo:</span> <span class="uppercase">${
                              dataToSave.sexo
                            }</span></div>
                        </div>
                        <!-- Línea 4 -->
                        <div class="row">
                            <div class="cell cell-55"><span class="label">Titular de la Póliza:</span> ${
                              dataToSave.titular
                            }</div>
                            <div class="cell cell-25"><span class="label">Teléfono:</span> ${
                              dataToSave.telefono
                            }</div>
                            <div class="cell cell-20"><span class="label">C.I:</span> ${
                              dataToSave.tipoDocumentoTitular
                            }-${dataToSave.ciTitular}</div>
                        </div>
                        <!-- Línea 5 -->
                        <div class="row">
                            <div class="cell cell-25"><span class="label">Ubicación:</span> ${
                              dataToSave.hogar
                            }</div>
                            <div class="cell cell-75"><span class="label">Avenida/Calle:</span> ${
                              dataToSave.direccion
                            }</div>
                        </div>
                        <!-- Línea 6 -->
                        <div class="row">
                            <div class="cell cell-60"><span class="label">Edificio/Casa/Empresa:</span> ${
                              dataToSave.edificio
                            }</div>
                            <div class="cell cell-10"><span class="label">Piso:</span> ${
                              dataToSave.piso || ""
                            }</div>
                            <div class="cell cell-10"><span class="label">Apto:</span> ${
                              dataToSave.apto
                            }</div>
                            <div class="cell cell-20"><span class="label">Urbanización:</span> ${
                              dataToSave.urbanizacion
                            }</div>
                        </div>
                        <!-- Línea 7 -->
                        <div class="row">
                            <div class="cell cell-30"><span class="label">Ciudad:</span> ${
                              dataToSave.ciudadNombre
                            }</div>
                            <div class="cell cell-70"><span class="label">Punto de Referencia:</span> ${
                              dataToSave.referencia
                            }</div>
                        </div>
                    </div>

                    <!-- Segunda sección: Hábitos y Antecedentes Médicos -->
                    <div class="form-container ${
                      esAndroid ? "android-margin" : ""
                    }"> 
                        <!-- Línea 1 -->
                        <div class="row">
                            <div class="cell cell-55"><span class="littleTitle">HÁBITOS Y ANTECEDENTES MÉDICOS:</span><span class="label">Tabáquicos:</span> ${
                              dataToSave.tabaquicos
                            }</div>
                            <div class="cell cell-15"><span class="label">Unidades/Días:</span> ${
                              dataToSave.unidadesDias
                            }</div>
                            <div class="cell cell-30"><span class="label">Bebidas Alcohólicas:</span> ${
                              dataToSave.bebidasAlcoholicas
                            }</div>
                        </div>
                        <!-- Línea 2 -->
                        <div class="row">
                            <div class="cell cell-50"><span class="label">Otros:</span> ${
                              dataToSave.otros
                            }</div>
                            <div class="cell cell-50"><span class="label">Alergias:</span> ${
                              dataToSave.alergias
                            }</div>
                        </div>
                        <!-- Línea 3 -->
                        <div class="row">
                            <div class="cell cell-50"><span class="label">Medicación Actual:</span> ${
                              dataToSave.medicacionActual
                            }</div>
                            <div class="cell cell-50"><span class="label">Intervenciones Ox:</span> ${
                              dataToSave.intervencionesOx
                            }</div>
                        </div>
                    </div>

                    <!-- Tercera sección: Antecedentes Médicos -->
                    <div class="form-container ${
                      esAndroid ? "android-margin" : ""
                    }"> 
                        <div class="row">
                            <div class="cell cell-100 underline-lines underlineMedicalHistory ${
                              calcularLineas(
                                dataToSave.antecedentesMedicos,
                                2,
                                22
                              ).esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="littleTitle">ANTECEDENTES MÉDICOS:</span> <span>${
                                  dataToSave.antecedentesMedicos
                                }</span>
                            </div>
                        </div>
                    </div>

                    <span class="littleTitle leftPadding ${
                      esAndroid ? "android-margin" : ""
                    }">EVALUACIÓN DE CASO</span>
                    <!-- Cuarta sección: Antecedentes Médicos -->
                    <div class="form-container ${
                      esAndroid ? "android-margin" : ""
                    }"> 
                         <div class="row">
                            <div class="cell cell-100 underline-lines underlineConsult ${
                              calcularLineas(dataToSave.motivoConsulta, 2, 20)
                                .esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="label">Motivo Consulta:</span> <span>${
                                  dataToSave.motivoConsulta
                                }</span>
                            </div>
                        </div>
                    
                        <div class="row">
                            <div class="cell cell-100 underline-lines underlineActualDisease ${
                              calcularLineas(dataToSave.enfermedadActual, 7, 19)
                                .esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="label">Enfermedad Actual:</span> <span>${
                                  dataToSave.enfermedadActual
                                }</span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-11"><span class="label">Exámen inicial:</span></div>
                            <div class="cell cell-11"><span class="label">Hora:</span> ${
                              dataToSave.horaInicial
                            }</div>
                            <div class="cell cell-14"><span class="label">TA 1:</span> ${ta1}</div>
                            <div class="cell cell-10"><span class="label">FC 1:</span> ${fc1}</div>
                            <div class="cell cell-10"><span class="label">FR 1:</span> ${fr1}</div>
                            <div class="cell cell-10"><span class="label">Temp:</span> ${temperatura1}</div>
                            <div class="cell cell-14"><span class="label">Glicemia:</span> ${glicemia1}</div>
                            <div class="cell cell-10"><span class="label">Glasgow:</span> ${
                              dataToSave.GlasgowInicial
                            }</div>
                            <div class="cell cell-10"><span class="label">Sat 02%</span> ${sat1}</div>  
                        </div>
                        <div class="row">
                            <div class="cell cell-11"><span class="label">Exámen final:</span></div>
                            <div class="cell cell-11"><span class="label">Hora:</span> ${
                              dataToSave.horaFinal
                            }</div>
                            <div class="cell cell-14"><span class="label">TA 2:</span> ${ta2}</div>
                            <div class="cell cell-10"><span class="label">FC 2:</span> ${fc2}</div>
                            <div class="cell cell-10"><span class="label">FR 2:</span> ${fr2}</div>
                            <div class="cell cell-10"><span class="label">Temp:</span> ${temperatura2}</div>
                            <div class="cell cell-14"><span class="label">Glicemia:</span> ${glicemia2}</div>
                            <div class="cell cell-10"><span class="label">Glasgow:</span> ${
                              dataToSave.GlasgowFinal
                            }</div>
                            <div class="cell cell-10"><span class="label">Sat 02%</span> ${sat2}</div>  
                        </div>
                        <div class="row">
                            <div class="cell cell-100"><span class="label">General:</span> ${
                              dataToSave.General
                            }</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100"><span class="label">Piel / Mucosas:</span> ${
                              dataToSave.PielMucosas
                            }</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100"><span class="label">Cabeza / ORL:</span> ${
                              dataToSave.CabezaORL
                            }</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100 underline-lines underlineCardiopulmonary ${
                              calcularLineas(dataToSave.Cardiopulmonar, 2, 16)
                                .esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="label">Cardiopulmonar:</span> <span>${
                                  dataToSave.Cardiopulmonar
                                }</span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100 underline-lines underlineAbs ${
                              calcularLineas(dataToSave.Abdomen, 2, 9)
                                .esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="label">Abdomen:</span> <span>${
                                  dataToSave.Abdomen
                                }</span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-10"><span class="label">Miembros:</span></div>
                            <div class="cell cell-90">${
                              dataToSave.Miembros
                            }</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-10"><span class="label">Pulsos:</span></div>
                            <div class="cell cell-90">${dataToSave.Pulsos}</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100"><span class="label">Neurológicos (ROT):</span> ${
                              dataToSave.Neurológicos
                            }</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100 underline-lines underlineObservations ${
                              calcularLineas(dataToSave.Observaciones, 3, 23)
                                .esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="label">Observaciones / Otros:</span> <span>${
                                  dataToSave.Observaciones
                                }</span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100 underline-lines underlineIDX ${
                              calcularLineas(dataToSave.IDX, 2, 5).esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="label">IDX:</span> <span>${
                                  dataToSave.IDX
                                }</span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100 underline-lines underlineTreatmentApplied ${
                              calcularLineas(
                                dataToSave.TratamientoAplicado,
                                3,
                                92
                              ).esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="label">Tratamiento aplicado (Parenteral, Enteral, SL, Tópico, Nebulación, Sutura, Sondaje, Otros):</span> <span>${
                                  dataToSave.TratamientoAplicado
                                }</span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100 underline-lines underlineAmbulatoryTreatment ${
                              calcularLineas(
                                dataToSave.EspecificaciónTratamientoAmbulatorio,
                                3,
                                41
                              ).esUltimaLinea
                                ? "ultima-linea"
                                : ""
                            }">
                                <span class="label">Tratamiento Ambulatorio:</span> <span>${
                                  dataToSave.TratamientoAmbulatorio
                                }</span>
                                <span class="label">Especificar:</span> <span>${
                                  dataToSave.EspecificaciónTratamientoAmbulatorio
                                }</span>
                            </div>
                        </div>



                        <div class="displayFlex ${
                      esAndroid ? "android-margin" : ""
                    }">
                        <div class="izquierdaImg">
                            <div class="row">
                            <div class="cell cell-100"><span class="label">Paraclínicos:</span> ${
                              dataToSave.Paraclinicos
                            }</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100"><span class="label">Ex. de Laboratorio:</span> ${
                              dataToSave.ExLaboratorio
                            }</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100"><span class="label">Ex. de Radiológia:</span> ${
                              dataToSave.ExRadiologia
                            }</div>
                        </div>
                        <div class="row">
                            <div class="cell cell-100"><span class="label">Referido:</span> ${
                              dataToSave.Referido
                            }</div>
                        </div>
                        </div>
                        <div class="derechaImg" >
                            <img src="${
                              dataToSave.firmaUrl
                            }" style="width:150px; height:70px;" />
                        </div>
                    </div>





                        
                    </div>
                    <div class="form-container ${
                      esAndroid ? "android-margin" : ""
                    }">
                        
                            <div class="row">
                                <div class="cell cell-60"><span class="label">Nombre Médico de Consulta:</span> ${
                                  dataToSave.userName
                                }</div>
                                <div class="cell cell-40"><span class="label">N M.S.D.S.:</span> ${
                                  dataToSave.msds
                                } </div>
                            </div>
                            <div class="row">
                                <div class="cell cell-50"><span class="label">Hora inicio atención médica:</span> ${
                                  dataToSave.HoraInicioAT
                                }</div>
                                <div class="cell cell-50"><span class="label">Hora fin atención médica:</span> ${
                                  dataToSave.HoraFinAT
                                } </div>
                            </div>
                            <div class="row"> 
                                <div class="cell cell-50"><span class="label">Traslado:</span> ${
                                  dataToSave.Traslado
                                }</div>
                                <div class="cell cell-50"><span class="label">Proveedor:</span> ${
                                  dataToSave.proveedor
                                } </div>
                            </div>
                            <div class="row">
                                <div class="cell cell-100"><span class="label">Nombre del Paramédico:</span> ${
                                  dataToSave.NombreParamédico
                                }</div>                            
                            </div> 
                            <div class="row">
                                <div class="cell cell-50"><span class="label">Médico que recibe:</span> ${
                                  dataToSave.MédicoRecibe
                                }</div> 
                                <div class="cell cell-50"><span class="label">Estado Clínico Final:</span> ${
                                  dataToSave.EstadoClinicoFinal
                                }</div>                           
                            </div> 
                        
                    </div>
                    </div>
                    
                    


                </body>
                </html>
    `;
};

export default generateMedicalReportHTML;