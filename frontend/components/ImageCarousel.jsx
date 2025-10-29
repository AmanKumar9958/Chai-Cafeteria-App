import React, { useEffect, useRef, useState, memo } from 'react';
import { View, ScrollView, Dimensions, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const ImageCarouselBase = ({
  images = [], // [{ imageURL }]
  width, // required: pixel width of each slide
  height = 176, // ~h-44 default
  interval = 3000,
  autoPlay = true,
  onPressSlide, // optional: (index, image) => void
}) => {
  const sliderRef = useRef(null);
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      if (!pausedRef.current && images.length > 0) {
        setIndex((prev) => (prev + 1) % images.length);
      }
    }, interval);
    return () => clearInterval(id);
  }, [autoPlay, images.length, interval]);

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ x: index * width, animated: true });
    }
  }, [index, width]);

  if (!width) {
    // fallback to full device width if not provided
    width = Dimensions.get('window').width - 48;
  }

  return (
    <View style={{ height }} className="mb-8">
      <ScrollView
        ref={sliderRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x || 0;
          const idx = Math.round(x / width);
          setIndex(idx % (images.length || 1));
        }}
        onTouchStart={() => { pausedRef.current = true; }}
        onTouchEnd={() => { pausedRef.current = false; }}
      >
        {images.map((img, i) => (
          <Pressable
            key={i}
            style={{ width }}
            className="rounded-2xl overflow-hidden mx-1"
            onPress={() => onPressSlide && onPressSlide(i, img)}
            android_ripple={{ color: '#00000018' }}
          >
            <ExpoImage
              source={{ uri: img.imageURL }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          </Pressable>
        ))}
      </ScrollView>
      <View className="flex-row justify-center items-center pt-3">
        {images.map((_, i) => (
          <View
            key={i}
            className={`rounded-full mx-1 ${i === index ? 'w-3 h-3 bg-chai-primary' : 'w-2 h-2 bg-gray-300'}`}
          />
        ))}
      </View>
    </View>
  );
};

ImageCarouselBase.displayName = 'ImageCarouselBase';

export const ImageCarousel = memo(ImageCarouselBase);
ImageCarousel.displayName = 'ImageCarousel';

export default ImageCarousel;
