import React from "react";
import { WebView } from "react-native-webview";
import { signatureHtml } from "../assets/SignatureHTML";

const SignatureCaptureWebView = ({ onConfirm }) => {
  const handleMessage = (event) => {
    const base64Signature = event.nativeEvent.data;
    onConfirm(base64Signature);
  };

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: signatureHtml }}
      onMessage={handleMessage}
      javaScriptEnabled
      style={{ flex: 1 }}
    />
  );
};

export default SignatureCaptureWebView;
