import React from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function CartScreen() {
  const { items, updateQty, removeItem, clear } = useCart();

  // Guard items in case the context is not yet initialized
  const itemsList = items || [];
  const total = itemsList.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0);

  const renderItem = ({ item }) => (
    <View className="bg-white rounded-lg p-4 mb-4 flex-row items-center justify-between">
      <View style={{ flex: 1 }}>
        <Text className="font-bold">{item.name}</Text>
        <Text className="text-sm text-gray-500">₹{item.price}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => {
            const current = item.qty || 0;
            if (current <= 1) {
              Alert.alert('Remove item', `Remove ${item.name} from cart?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    removeItem(item._id);
                    Toast.show({ type: 'success', text1: 'Removed from cart' });
                  }
                }
              ]);
              return;
            }
            updateQty(item._id, Math.max(0, current - 1));
          }}
          className="p-2 mr-2 bg-gray-200 rounded"
        >
          <Feather name="minus" size={18} color="#111" />
        </Pressable>

        <Text className="mx-2 font-bold">{item.qty || 0}</Text>

        <Pressable onPress={() => { updateQty(item._id, (item.qty || 0) + 1); Toast.show({ type: 'success', text1: 'Updated quantity' }); }} className="p-2 ml-2 bg-[#C7A27C] rounded">
          <Ionicons name="add" size={18} color="#fff" />
        </Pressable>

        <Pressable onPress={() => {
          Alert.alert('Remove item', `Remove ${item.name} from cart?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => { removeItem(item._id); Toast.show({ type: 'success', text1: 'Removed from cart' }); } }
          ]);
        }} className="ml-3 p-2">
          <Feather name="x" size={18} color="#e11d48" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-black" numberOfLines={1} ellipsizeMode="tail">My Cart</Text>
        <Pressable onPress={() => router.back()} className="p-2">
          <Text className="text-gray-500">Close</Text>
        </Pressable>
      </View>

      {itemsList.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Your cart is empty</Text>
        </View>
      ) : (
        <>
          <FlatList data={itemsList} renderItem={renderItem} keyExtractor={i => i._id} />

          <View className="mt-auto">
            <View className="flex-row justify-between items-center p-4">
              <Text className="font-bold">Total</Text>
              <Text className="font-bold">₹{Number(total).toFixed(2)}</Text>
            </View>

            <View className="p-4">
              <Pressable onPress={() => router.push('/checkout')} className="bg-[#C7A27C] p-4 rounded items-center">
                <Text className="text-white font-bold">Checkout</Text>
              </Pressable>

              <Pressable onPress={() => {
                Alert.alert('Clear cart', 'Are you sure you want to clear the cart?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => { clear(); Toast.show({ type: 'success', text1: 'Cart cleared' }); } }
                ]);
              }} className="mt-3 items-center">
                <Text className="text-red-500">Clear cart</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
