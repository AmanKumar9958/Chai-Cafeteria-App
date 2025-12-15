import React, { createContext, useContext } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

const TabBarContext = createContext({
  tabBarTranslateY: { value: 0 },
  showTabBar: () => {},
  hideTabBar: () => {},
});

export const useTabBar = () => useContext(TabBarContext);

export const useTabBarScroll = () => {
  const { showTabBar, hideTabBar } = useTabBar();
  const lastContentOffset = React.useRef(0);

  const onScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    // Hide when scrolling down (and past a threshold to avoid jitter at top)
    if (currentOffset > lastContentOffset.current && currentOffset > 20) {
      hideTabBar();
    } 
    // Show when scrolling up
    else if (currentOffset < lastContentOffset.current) {
      showTabBar();
    }
    lastContentOffset.current = currentOffset;
  };

  return onScroll;
};

export const TabBarProvider = ({ children }) => {
  const tabBarTranslateY = useSharedValue(0);

  const showTabBar = () => {
    'worklet';
    tabBarTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
  };

  const hideTabBar = () => {
    'worklet';
    // Assuming tab bar height + bottom margin is around 100-120
    tabBarTranslateY.value = withTiming(150, { duration: 300, easing: Easing.out(Easing.cubic) });
  };

  return (
    <TabBarContext.Provider value={{ tabBarTranslateY, showTabBar, hideTabBar }}>
      {children}
    </TabBarContext.Provider>
  );
};
