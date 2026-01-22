// signatureHtml.js
export const signatureHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Firma Digital</title>
    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.6/dist/signature_pad.umd.min.js"></script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
        font-family: sans-serif;
      }

      #container {
        display: flex;
        flex-direction: column;
        height: 1000px;
        padding: 10px;
        box-sizing: border-box;
      }

      canvas {
        border: 1px solid #000;
        flex: 1;
        width: 100%;
        touch-action: none;
      }

      .controls {
        margin-top: 10px;
        display: flex;
        justify-content: space-around;
      }

      button {
        padding: 10px 20px;
        font-size: 30px;
        cursor: pointer;
        width: 300px;
      }
    </style>
  </head>
  <body>
    <div id="container">
      <canvas id="signature"></canvas>
      <div class="controls">
        <button id="clearBtn">Limpiar</button>
        <button id="saveBtn">Guardar</button>
      </div>
    </div>

    <script>
      let signaturePad;

      function resizeCanvas() {
        const canvas = document.getElementById("signature");
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);

        if (signaturePad) {
          const data = signaturePad.toData();
          signaturePad.clear();
          signaturePad.fromData(data);
        }
      }

      window.addEventListener("load", () => {
        const canvas = document.getElementById("signature");
        signaturePad = new SignaturePad(canvas, {
          minWidth: 2,
          maxWidth: 4,
        });

        resizeCanvas();

        document.getElementById("clearBtn").addEventListener("click", () => {
          signaturePad.clear();
        });

        document.getElementById("saveBtn").addEventListener("click", () => {
          if (!signaturePad.isEmpty()) {
            const dataURL = signaturePad.toDataURL("image/png");
            // Enviar al WebView
            window.ReactNativeWebView?.postMessage(dataURL); // React Native
            window.parent?.postMessage(dataURL, "*"); // Web
          } else {
            alert("No hay firma para guardar.");
          }
        });
      });

      window.addEventListener("resize", resizeCanvas);

      // Prevenir scroll mientras se firma en móvil
      document.getElementById("signature").addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
      document.getElementById("signature").addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    </script>
  </body>
</html>
`;
