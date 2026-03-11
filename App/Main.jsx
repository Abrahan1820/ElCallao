import React from "react";
import { View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import InitialPageView from "../Inventory/Components/InicialPageView";
import MainPage from "../Inventory/Components/MainPage";
import { DatabaseContextProvider } from "../Context/DatabaseContext";
import { UserContextProvider } from "../Context/UserContext";
import Log_in from "../SessionInit/Components/Log_in";
import Sign_up from "../SessionInit/Components/Sing_Up";
import PDFGenerator from "../pdf/PDFGenerator";
import PDFModify from "../pdf/Pdfmodify";
import AdminPanel from "../Admin/AdminPanel";
import AdminUsers from "../Admin/AdminUsers";
import AdminPasswordChange from "../Admin/AdminPasswordChange";
import AdminCategory from "../Admin/AdminCategory";
import AdminProviders from "../Admin/AdminProvider";
import StatisticsScreen from "../Inventory/Components/StatisticsScreen";
import AdminManagment from "../Admin/AdminManagment";
import PagosAdmin from "../Admin/PagosAdmin";
import PagosDoctor from "../Admin/PagosDoctor";
import InventoryScreen from "../Inventory/Components/InventoryScreen";
import ProductDetailScreen from "../Inventory/Components/ProductDetailScreen";
import BillingScreen from "../Inventory/Components/BillingScreen";
import ProductSelectionModal from "../Inventory/Components/ProductSelectionModal";
import MovementsScreen from "../Inventory/Components/MovementsScreen";
import PurchaseScreen from "../Inventory/Components/PurchaseScreen";
import TasaBCVScreen from "../Inventory/Components/TasaBCVScreen";
import CreateProduct from "../Inventory/Components/CreateProduct";
import AdjustStock from "../Inventory/Components/AdjustStock";
import AdvanceCashModal from "../Inventory/Components/AdvanceCashModal";
import RechargeModal from "../Inventory/Components/RechargeModal";




const Stack = createNativeStackNavigator();

const toastConfig = {
  customConfirm: ({ text1, text2, props }) => (
    <View style={styles.confirmToast}>
      <Text style={styles.toastTitle}>{text1}</Text>
      <Text style={styles.toastMessage}>{text2}</Text>
      <View style={styles.buttonsContainer}>
        {props.buttons.map((button, index) => (
          <TouchableOpacity
            key={index}
            onPress={button.onPress}
            style={styles.toastButton}
          >
            <Text style={[styles.buttonText, button.style]}>{button.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={[styles.baseToast, styles.infoBorder]}>
      <Text style={styles.toastTitle}>{text1}</Text>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  ),
  success: ({ text1, text2 }) => (
    <View style={[styles.baseToast, styles.successBorder]}>
      <Text style={styles.toastTitle}>{text1}</Text>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={[styles.baseToast, styles.errorBorder]}>
      <Text style={styles.toastTitle}>{text1}</Text>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  )
};


const styles = StyleSheet.create({
    contenedorPrincipal: {
        flex: 1
    },
    baseToast: {
      width: '90%',
      backgroundColor: '#f9f9f9',
      padding: 15,
      borderRadius: 10,
      borderLeftWidth: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      marginBottom: 10,
    },
    
    infoBorder: {
      borderLeftColor: '#3498db', // azul
    },
    
    successBorder: {
      borderLeftColor: '#4CAF50', // verde
    },
    
    errorBorder: {
      borderLeftColor: '#f44336', // rojo
    },    
    confirmToast: {
      width: '90%',
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 10,
      borderLeftColor: '#3498db',
      borderLeftWidth: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    toastTitle: {
      fontWeight: 'bold',
      fontSize: 16,
      color: '#333',
      marginBottom: 5
    },
    toastMessage: {
      fontSize: 14,
      color: '#666'
    },    
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end'
    },
    toastButton: {
      marginLeft: 15,
      paddingVertical: 5,
      paddingHorizontal: 10
    },
    buttonText: {
      fontSize: 14
    },
    infoToast: {
      backgroundColor: '#3498db',
      padding: 10,
      borderRadius: 5
    },
    successToast: {
      backgroundColor: '#4CAF50',
      padding: 10,
      borderRadius: 5
    },
    errorToast: {
      backgroundColor: '#f44336',
      padding: 10,
      borderRadius: 5
    },
    infoText: {
      color: 'white'
    },
    successTitle: {
      color: 'white',
      fontWeight: 'bold'
    },
    successMessage: {
      color: 'white'
    },
    errorTitle: {
      color: 'white',
      fontWeight: 'bold'
    },
    errorMessage: {
      color: 'white'
    }
  })


const Main = () => {
    return (
      <View style={styles.contenedorPrincipal}>
      <DatabaseContextProvider>
      <UserContextProvider>
      <Stack.Navigator>
      <Stack.Screen name="PaginaInicial" component={InitialPageView} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="Log_in" component={Log_in} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="Sign_up" component={Sign_up} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="PaginaPrincipal" component={MainPage} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="PDFGenerator" component={PDFGenerator} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="PDFModify" component={PDFModify} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="AdminPanel" component={AdminPanel} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="AdminUsers" component={AdminUsers} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="AdminPasswordChange" component={AdminPasswordChange} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="AdminCategory" component={AdminCategory} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="AdminProvider" component={AdminProviders} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="StatisticsScreen" component={StatisticsScreen} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="AdminManagment" component={AdminManagment} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="PagosAdmin" component={PagosAdmin} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="PagosDoctor" component={PagosDoctor} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="Billing" component={BillingScreen} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="ProductSelectionModal" component={ProductSelectionModal} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="Movements" component={MovementsScreen} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="Purchase" component={PurchaseScreen} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="TasaBCV" component={TasaBCVScreen} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="CreateProduct" component={CreateProduct} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="AdjustStock" component={AdjustStock} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="AdvanceCashModal" component={AdvanceCashModal} options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="RechargeModal" component={RechargeModal} options={{ headerShown: false }}></Stack.Screen>
      
      </Stack.Navigator>
      <Toast config={toastConfig} />
      </UserContextProvider>
      </DatabaseContextProvider>
      </View>
    );
  };
  
  export default Main;