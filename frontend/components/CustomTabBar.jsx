import React from 'react';
import { View, Pressable, Dimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        height: 64 + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: '#fff',
        position: 'absolute',
        left: '2.5%',
        right: '2.5%',
        bottom: 8 + insets.bottom,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconName =
          label === 'Home'
            ? isFocused
              ? 'home-variant'
              : 'home-variant-outline'
            : label === 'Menu'
            ? isFocused
              ? 'silverware-fork-knife'
              : 'silverware'
            : label === 'Orders'
            ? 'shopping-outline'
            : label === 'Profile'
            ? isFocused
              ? 'account-circle'
              : 'account-circle-outline'
            : 'help-circle';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={26}
              color={isFocused ? '#E8751A' : '#757575'}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
