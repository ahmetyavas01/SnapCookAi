import React, { createContext, useContext, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';

interface LoadingContextType {
  show: (message?: string) => void;
  hide: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  show: () => {},
  hide: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string>('');

  const show = (msg: string = 'Loading...') => {
    setMessage(msg);
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
    setMessage('');
  };

  return (
    <LoadingContext.Provider value={{ show, hide }}>
      {children}
      {visible && (
        <View style={styles.container}>
          <View style={styles.content}>
            <LottieView
              source={require('../../assets/cooking.json')}
              autoPlay
              loop
              style={styles.animation}
            />
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
      )}
    </LoadingContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  animation: {
    width: 150,
    height: 150,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
}); 