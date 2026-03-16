import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DENOMINATIONS = [
  { label: '500k', value: 500000 },
  { label: '200k', value: 200000 },
  { label: '100k', value: 100000 },
  { label: '50k', value: 50000 },
  { label: '20k', value: 20000 },
  { label: '10k', value: 10000 },
  { label: '5k', value: 5000 },
  { label: '2k', value: 2000 },
  { label: '1k', value: 1000 },
];

interface KeypadProps {
  amount: number;
  onAddAmount: (amount: number) => void;
  onClear: () => void;
}

const Keypad: React.FC<KeypadProps> = ({ amount, onAddAmount, onClear }) => {
  const [counts, setCounts] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (amount === 0) {
      setCounts({});
    }
  }, [amount]);

  const handlePress = (value: number) => {
    setCounts(prev => ({
      ...prev,
      [value]: (prev[value] || 0) + 1
    }));
    onAddAmount(value);
  };

  const handleClear = () => {
    setCounts({});
    onClear();
  };

  return (
    <View style={styles.container}>
      {DENOMINATIONS.map((deno) => {
        const count = counts[deno.value] || 0;
        const isActive = count > 0;
        
        return (
          <TouchableOpacity
            key={deno.value}
            style={[styles.button, isActive && styles.buttonActive]}
            onPress={() => handlePress(deno.value)}
          >
            <Text style={[styles.buttonText, isActive && styles.buttonTextActive]}>{deno.label}</Text>
            {isActive && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
        <Text style={[styles.buttonText, styles.clearText]}>Hủy</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 16,
  },
  button: {
    backgroundColor: '#f1f5f9',
    width: '31%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  buttonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    borderWidth: 1,
  },
  buttonTextActive: {
    color: '#ffffff',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#fee2e2',
    width: '100%',
  },
  clearText: {
    color: '#ef4444',
  },
});

export default Keypad;
