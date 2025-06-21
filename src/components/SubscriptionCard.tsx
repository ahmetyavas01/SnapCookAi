import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import FeatureList from './FeatureList';
import { COLORS } from '../utils/colors';

interface Props {
  title: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  buttonLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const SubscriptionCard: React.FC<Props> = ({
  title,
  price,
  features,
  highlighted = false,
  buttonLabel,
  onPress,
  style,
}) => {
  const cardStyles = [styles.card, highlighted && styles.highlightedCard, style];

  return (
    <View style={cardStyles}>
      <Text style={[styles.title, highlighted && styles.highlightedTitle]}>{title}</Text>
      <Text style={[styles.price, highlighted && styles.highlightedPrice]}>{price}</Text>
      <FeatureList items={features} />

      {buttonLabel && (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.9}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: COLORS.systemBlue,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  highlightedTitle: {
    color: COLORS.systemBlue,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  highlightedPrice: {
    color: COLORS.systemBlue,
  },
  button: {
    backgroundColor: COLORS.systemBlue,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SubscriptionCard; 