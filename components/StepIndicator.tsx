import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const animatedValues = useRef(steps.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animatedValues.map((val, index) =>
      Animated.timing(val, {
        toValue: index <= currentStep ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      })
    );
    Animated.stagger(80, animations).start();
  }, [currentStep]);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const bgColor = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: ['#ccc', '#0033A0'],
        });

        return (
          <View key={index} style={styles.stepRow}>
            <View style={styles.circleWrapper}>
              <Animated.View
                style={[
                  styles.circle,
                  { backgroundColor: bgColor },
                  isCurrent && styles.circleCurrent,
                ]}
              >
                <Text style={[styles.circleText, (isCompleted || isCurrent) && styles.circleTextActive]}>
                  {isCompleted ? '✓' : index + 1}
                </Text>
              </Animated.View>
              {index < steps.length - 1 && (
                <Animated.View
                  style={[
                    styles.line,
                    {
                      backgroundColor: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#ccc', '#0033A0'],
                      }),
                    },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.label, isCurrent && styles.labelActive]} numberOfLines={1}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  stepRow: {
    flex: 1,
    alignItems: 'center',
  },
  circleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCurrent: {
    borderWidth: 2,
    borderColor: '#0033A0',
  },
  circleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  circleTextActive: {
    color: '#fff',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#ccc',
    marginLeft: 4,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  labelActive: {
    color: '#0033A0',
    fontWeight: '600',
  },
});
