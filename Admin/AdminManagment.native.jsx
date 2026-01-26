import { View, Text } from "react-native";
import NavBar from "../NavBar/Components/NavBar";

export default function AdminManagment() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <NavBar />
      <Text>Esta vista solo está disponible en la versión web</Text>
    </View>
  );
}
