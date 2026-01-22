import { Platform } from "react-native";

const generateRecipeHTML = (dataToSave) => {
  const marginLeftValue = Platform.OS === "ios" ? "0px" : "25px";
  const heightWEB = Platform.OS === "web" ? "210mm;" : "189mm;";
  const heightWEB2 = Platform.OS === "web" ? "130mm;" : "117mm;";

  return `
            <head>
                <style>
                    /* Salto de página */
                    .page-break {
                        page-break-before: always;
                    }

                    /* Contenedor principal */
                    .recipe-container {
                        display: flex;
                        width: 100%;
                        height: ${heightWEB}
                        magin: 40px;
                        magin-left: 0px;
                    }

                    .subContenedor {
                        width: 50%; 
                        box-sizing: border-box;
                        display: flex;
                        margin: 10px;
                        flex-direction: column;
                        position: relative; /* Añadido para posicionamiento relativo */
                    }
                    
                    .subContenedor:first-child {border-right: 2px solid black;margin-left: ${marginLeftValue};; padding-right: 30px;}
                    .subContenedor:last-child {margin-left: 25px; margin-right:20px;}

                    /* Estilo para la firma */
                    .firma {
                        text-align: center;
                        margin-top: 50px;
                    }

                    .cabeza {
                        display: flex;
                        width: 100%;
                        height:32mm;
                        border-bottom: 2px solid black;    
                        align-items: center;
                    }

                    .cuerpo {
                        display: flex;
                        width: 100%;
                        height: ${heightWEB2};
                        padding-top: 20px;
                        flex-direction: column;
                    }

                    .pie {
                        display: flex;
                        justify-content: flex-end;
                        width: 100%;
                        height:25mm;
                        border-bottom: 2px solid black;
                        position: relative; /* Añadido para posicionamiento */
                    }

                    .pie-text {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                    }

                    .contact-info {
    font-size: 11px;
    margin-top: 10px;
    line-height: 1.4;
}

.contact-info .address-line {
    display: block; /* Solo esto será un bloque (línea nueva) */
}

.bold-link {
    font-weight: bold;
    display: inline; /* Asegura que no haya saltos */
}
                    .adentroDeCabeza {
                        display: flex;
                        flex-direction: column;
                    }

                    .textoCabeza {font-size: 10px;}
                    .bold {font-weight: bold}
                    .margin20bottom {margin-bottom: 20px;}
                    .derechaImg {width: 20%; padding-right: 50px; margin-bottom: 10px;}
                    .whiteSpace { white-space: pre-line;}

                    .logoImagen {  
                         width: 200px; height: 60px;
                    }
                </style>
            </head>
            <body>
                
                <div class="recipe-container">
                    <div class="subContenedor">
                        <div class="cabeza">
                            <img src="https://wqyaqcnntzovnpxdqwtc.supabase.co/storage/v1/object/public/Signs/AdaptativeIcon%20(2).png" class="logoImagen" />
                            <div class="adentroDeCabeza">
                                
                            </div>
                        </div>

                        <div class="cuerpo">
                            <div class="adentroDeCabeza margin20bottom">
                                
                                <span class="textoCabeza bold">Paciente: ${dataToSave.nombre}</span>
                                <span class="textoCabeza bold">C.I: ${dataToSave.tipoDocumentoPaciente}-${dataToSave.ci}</span>
                                <span class="textoCabeza bold">Edad: ${dataToSave.edad}</span>
                            </div>
                            <div class="adentroDeCabeza margin20bottom">
                                <span class="textoCabeza">Recipe:</span>
                            </div>
                            <div class="adentroDeCabeza margin20bottom">
                                <span class="textoCabeza whiteSpace">${dataToSave.Recipe}</span>
                            </div>
                        </div>

                        <div class="pie">
                            <span class="pie-text textoCabeza bold">Medico: ${dataToSave.userName} - Fecha consulta: ${dataToSave.fecha} </span>
                            <div class="derechaImg">
                                <img src="${dataToSave.firmaUrl}" style="width:150px; height:90px;" />
                            </div>
                        </div>
                        
                    </div>

                    <div class="subContenedor">
                        <div class="cabeza">
                            <img src="https://wqyaqcnntzovnpxdqwtc.supabase.co/storage/v1/object/public/Signs/AdaptativeIcon%20(2).png" class="logoImagen" />
                            <div class="adentroDeCabeza">
                                
                            </div>
                        </div>
                        <div class="cuerpo">
                            <div class="adentroDeCabeza margin20bottom">
                                
                                <span class="textoCabeza bold">Paciente: ${dataToSave.nombre}</span>
                                <span class="textoCabeza bold">C.I: ${dataToSave.tipoDocumentoPaciente}-${dataToSave.ci}</span>
                                <span class="textoCabeza bold">Edad: ${dataToSave.edad}</span>
                            </div>
                            <div class="adentroDeCabeza margin20bottom">
                                <span class="textoCabeza">Indicaciones:</span>
                            </div>
                            <div class="adentroDeCabeza margin20bottom">
                                <span class="textoCabeza whiteSpace">${dataToSave.Indicaciones}</span>
                            </div>
                            <div class="adentroDeCabeza margin20bottom">
                                
                            </div>
                        </div>
                        <div class="pie">
                            <span class="pie-text textoCabeza bold">Medico: ${dataToSave.userName} - Fecha consulta: ${dataToSave.fecha} </span>
                            <div class="derechaImg">
                                <img src="${dataToSave.firmaUrl}" style="width:150px; height:90px;" />
                            </div>
                        </div>
                       
                    </div>
                </div>
            </body>
        `;
};
export default generateRecipeHTML;