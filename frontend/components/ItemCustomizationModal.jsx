import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

const { height } = Dimensions.get('window');
const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://192.168.1.1:5000/api';

export default function ItemCustomizationModal({ visible, item, onClose, onAddToCart }) {
  const [selectedPortion, setSelectedPortion] = useState(null);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      // Reset selection when opening
      setSelectedPortion(null);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleAddToCart = () => {
    if (item?.portions && item.portions.length > 0) {
      if (selectedPortion) {
        onAddToCart({ ...item, price: selectedPortion.price, portion: selectedPortion.name });
        handleClose();
      }
    } else {
      onAddToCart(item);
      handleClose();
    }
  };

  const normalizeImageUrl = (u) => {
    try {
      if (!u || typeof u !== 'string') return null;
      let url = u.trim();
      if (url.startsWith('//')) url = `https:${url}`;
      if (url.startsWith('http://')) url = url.replace('http://', 'https://');
      if (!/^https?:\/\//i.test(url)) {
        const base = API_URL.replace(/\/api$/, '');
        if (url.startsWith('/')) return `${base}${url}`;
        return `${base}/${url}`;
      }
      return url;
    } catch { return null; }
  };

  if (!visible && !item) return null;

  const imageUrl = normalizeImageUrl(item?.image);
  const hasPortions = item?.portions && item.portions.length > 0;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
        
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* Image */}
            <View className="w-full h-48 bg-gray-100 rounded-t-3xl overflow-hidden relative">
                {imageUrl ? (
                    <ExpoImage 
                        source={{ uri: imageUrl }} 
                        style={{ width: '100%', height: '100%' }} 
                        contentFit="cover" 
                    />
                ) : (
                    <View className="w-full h-full items-center justify-center bg-gray-200">
                        <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                    </View>
                )}
                <TouchableOpacity 
                    onPress={handleClose} 
                    className="absolute top-4 right-4 bg-black/30 p-2 rounded-full backdrop-blur-sm"
                >
                    <Feather name="x" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="p-5">
                <View className="mb-4">
                    <Text className="text-2xl font-bold text-gray-800 mb-1">{item?.name}</Text>
                    <Text className="text-gray-500 text-sm">{item?.description || 'Delicious food item'}</Text>
                </View>

                {hasPortions ? (
                    <View className="mb-4">
                        <Text className="text-base font-bold text-gray-800 mb-3">
                          {item.variantType === 'pieces' ? 'Select Quantity' : 'Select Portion'}
                        </Text>
                        {item.portions.map((portion, index) => (
                        <TouchableOpacity 
                            key={index} 
                            className={`flex-row justify-between items-center p-4 mb-3 rounded-xl border ${selectedPortion?.name === portion.name ? 'border-chai-primary bg-orange-50' : 'border-gray-200 bg-white'}`}
                            onPress={() => setSelectedPortion(portion)}
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center">
                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${selectedPortion?.name === portion.name ? 'border-chai-primary' : 'border-gray-300'}`}>
                                    {selectedPortion?.name === portion.name && (
                                        <View className="w-2.5 h-2.5 rounded-full bg-chai-primary" />
                                    )}
                                </View>
                                <Text className={`text-base ${selectedPortion?.name === portion.name ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{portion.name}</Text>
                            </View>
                            <Text className="text-base font-semibold text-gray-800">₹{portion.price}</Text>
                        </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View className="flex-row justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                        <Text className="text-base font-semibold text-gray-800">Price</Text>
                        <Text className="text-xl font-bold text-chai-primary">₹{item?.price}</Text>
                    </View>
                )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-4 border-t border-gray-100 bg-white pb-8">
            <TouchableOpacity 
                className={`w-full py-4 rounded-full items-center shadow-sm ${(!hasPortions || selectedPortion) ? 'bg-chai-primary' : 'bg-gray-300'}`}
                disabled={hasPortions && !selectedPortion}
                onPress={handleAddToCart}
                activeOpacity={0.9}
            >
                <Text className="text-white font-bold text-lg">
                    {(!hasPortions || selectedPortion) 
                        ? `Add to Cart • ₹${hasPortions ? selectedPortion.price : item?.price}` 
                        : (item.variantType === 'pieces' ? 'Select a quantity' : 'Select a portion')}
                </Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
