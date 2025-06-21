import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

interface Props {
  items: string[];
}

const FeatureList: React.FC<Props> = ({ items }) => (
  <View style={styles.container}>
    {items.map((item, idx) => (
      <View key={idx} style={styles.row}>
        <Ionicons name="checkmark-circle" size={22} color={COLORS.systemGreen} style={styles.icon} />
        <Text style={styles.text}>{item}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: COLORS.text.primary,
    fontSize: 15,
    flex: 1,
  },
});

export default FeatureList; 