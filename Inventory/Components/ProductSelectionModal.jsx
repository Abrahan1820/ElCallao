import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ProductSelectionModal = ({
  visible,
  onClose,
  products,
  categoriasMap,
  searchText,
  onSearch,
  onSelectProduct,
}) => {
  
  const getStockStatus = (stock, min) => {
    if (stock === 0) return { color: '#e74c3c', text: 'Agotado' };
    if (stock <= min) return { color: '#f39c12', text: 'Bajo' };
    return { color: '#27ae60', text: 'Disponible' };
  };

  const renderProduct = ({ item }) => {
    const status = getStockStatus(item.stockActual, item.stockMinimo);
    
    return (
      <TouchableOpacity
  style={styles.productItem}
  onPress={() => onSelectProduct(item)}
>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.nombre}</Text>
          <Text style={styles.productCategory}>
            {categoriasMap[item.categoriaID] || "Sin categoría"}
          </Text>
        </View>
        
        <View style={styles.productDetails}>
          <View style={[styles.stockBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.stockText, { color: status.color }]}>
              {item.stockActual} {status.text}
            </Text>
          </View>
          <Text style={styles.productPrice}>${item.precioVentaUSD}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Producto</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar producto..."
              placeholderTextColor="#94a3b8"
              value={searchText}
              onChangeText={onSearch}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => onSearch("")}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de productos */}
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProduct}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="package-variant-closed" size={50} color="#cbd5e1" />
                <Text style={styles.emptyText}>No hay productos disponibles</Text>
              </View>
            }
            contentContainerStyle={styles.productList}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 8,
  },
  productList: {
    paddingBottom: 30,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  productDisabled: {
    opacity: 0.5,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#64748b',
  },
  productDetails: {
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
});

export default ProductSelectionModal;