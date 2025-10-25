import React, { forwardRef, memo } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

const SearchBarBase = ({ value, onChange, onSubmit, onClear, placeholder = 'Search for chai, snacks...' }, ref) => {
  return (
    <View className="flex-row items-center bg-white rounded-xl p-4 mb-6 shadow-sm border border-chai-divider">
      <Feather name="search" size={20} color="#9CA3AF" />
      <TextInput
        ref={ref}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        blurOnSubmit={false}
        className="flex-1 text-base text-chai-text-primary ml-3"
        placeholderTextColor="#9CA3AF"
      />
      {!!value && value.length > 0 && (
        <Pressable onPress={onClear} className="pl-2">
          <Feather name="x-circle" size={20} color="#9CA3AF" />
        </Pressable>
      )}
    </View>
  );
};

SearchBarBase.displayName = 'SearchBarBase';

export const SearchBar = memo(forwardRef(SearchBarBase));
SearchBar.displayName = 'SearchBar';

export default SearchBar;
