import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface CurrencyInputProps {
  value: number | null;
  moneda: 'CLP' | 'UF';
  onChangeValue: (value: number | null) => void;
  onChangeMoneda: (moneda: 'CLP' | 'UF') => void;
  label?: string;
  placeholder?: string;
}

function formatCLP(num: number): string {
  return num.toLocaleString('es-CL');
}

function formatUF(num: number): string {
  return num.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function CurrencyInput({
  value,
  moneda,
  onChangeValue,
  onChangeMoneda,
  label,
  placeholder,
}: CurrencyInputProps) {
  const [displayText, setDisplayText] = useState(
    value !== null ? (moneda === 'CLP' ? formatCLP(value) : formatUF(value)) : ''
  );

  const handleChangeText = (text: string) => {
    // Strip formatting
    const raw = text.replace(/[^\d,]/g, '').replace(',', '.');
    if (raw === '' || raw === '.') {
      setDisplayText(text);
      onChangeValue(null);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) return;

    if (moneda === 'CLP') {
      setDisplayText(formatCLP(Math.round(num)));
      onChangeValue(Math.round(num));
    } else {
      // Allow partial decimal input
      if (text.endsWith(',') || text.endsWith('.')) {
        setDisplayText(text);
      } else {
        const ufStr = num.toFixed(2).replace('.', ',');
        setDisplayText(ufStr);
        onChangeValue(num);
      }
    }
  };

  const switchMoneda = (m: 'CLP' | 'UF') => {
    onChangeMoneda(m);
    setDisplayText(value !== null ? (m === 'CLP' ? formatCLP(Math.round(value)) : formatUF(value)) : '');
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, moneda === 'CLP' && styles.toggleBtnActive]}
            onPress={() => switchMoneda('CLP')}
          >
            <Text style={[styles.toggleText, moneda === 'CLP' && styles.toggleTextActive]}>CLP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, moneda === 'UF' && styles.toggleBtnActive]}
            onPress={() => switchMoneda('UF')}
          >
            <Text style={[styles.toggleText, moneda === 'UF' && styles.toggleTextActive]}>UF</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrapper}>
          <Text style={styles.prefix}>{moneda === 'CLP' ? '$' : 'UF'}</Text>
          <TextInput
            style={styles.input}
            value={displayText}
            onChangeText={handleChangeText}
            keyboardType="decimal-pad"
            placeholder={placeholder ?? (moneda === 'CLP' ? '1.250.000' : '3.500')}
            placeholderTextColor="#bbb"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0033A0',
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  toggleBtnActive: {
    backgroundColor: '#0033A0',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0033A0',
  },
  toggleTextActive: {
    color: '#fff',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  prefix: {
    fontSize: 16,
    color: '#666',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 10,
  },
});
