import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ onGetStarted }) => {
    const scale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0,
        }).start();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF5722" />

            {/* Top Orange Section with Curve */}
            <View style={styles.topContainer}>
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../assets/images/food-delivery.webp')}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Bottom White Section */}
            <View style={styles.bottomContainer}>
                {/* Main Title with Nested Text for Colors */}
                <View style={styles.textWrapper}>
                    <Text style={styles.title}>
                        <Text style={styles.orangeText}>Fastest</Text> <Text style={styles.blackText}>Online</Text>{'\n'}
                        <Text style={styles.blackText}>Food</Text> <Text style={styles.orangeText}>Delivery</Text>{'\n'}
                        <Text style={styles.blackText}>Service</Text>
                    </Text>

                    <Text style={styles.subtitle}>
                        We are most fastest and favourite food delivery service in Ranchi, Jharkhand. Search for your favourite food.
                    </Text>
                </View>

                {/* Button with pressable effect */}
                <Animated.View style={{ width: '100%', transform: [{ scale }] }}>
                    <Pressable
                        style={styles.button}
                        onPress={onGetStarted}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
};

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topContainer: {
        height: height * 0.50, // Takes up 50% of screen
        backgroundColor: '#E8751A', // The Deep Orange Color
        borderBottomLeftRadius: 60, // Creates the curve
        borderBottomRightRadius: 60, // Creates the curve
        overflow: 'hidden', // Ensures content respects the rounded corners
        justifyContent: 'flex-end',
        alignItems: 'center',
        // paddingBottom: ,
    },
    imageContainer: {
        width: width,
        height: '85%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    image: {
        width: width * 1.2, // Slightly larger than screen width for better fit
        height: '100%',
    },
    bottomContainer: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 30,
        paddingBottom: 40,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textWrapper: {
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '800', // Extra Bold
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 15,
    },
    blackText: {
        color: '#1a1a1a',
    },
    orangeText: {
        color: '#E8751A',
    },
    subtitle: {
        fontSize: 17,
        color: '#7a7a7a',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    button: {
        backgroundColor: '#E8751A',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 2, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 19,
        fontWeight: 'bold',
    },
});

export default LandingScreen;