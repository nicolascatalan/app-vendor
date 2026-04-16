import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  icon?: string;
}

export default function Stepper({ value, min, max, onChange, label, icon }: StepperProps) {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const decrement = () => {
    if (value <= min) { bounce(); return; }
    onChange(value - 1);
  };

  const increment = () => {
    if (value >= max) { bounce(); return; }
    onChange(value + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={decrement}
          style={[styles.button, value <= min && styles.buttonDisabled]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.buttonText, value <= min && styles.buttonTextDisabled]}>−</Text>
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <Text style={styles.value}>{value}</Text>
        </Animated.View>
        <TouchableOpacity
          onPress={increment}
          style={[styles.button, value >= max && styles.buttonDisabled]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.buttonText, value >= max && styles.buttonTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0033A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 26,
  },
  buttonTextDisabled: {
    color: '#aaa',
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
});
