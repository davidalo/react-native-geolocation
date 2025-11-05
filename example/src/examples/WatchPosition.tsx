/**
 * Copyright (c) React Native Community
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Button,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import Geolocation, {
  type GeolocationOptions,
} from '@react-native-community/geolocation';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_DISTANCE_FILTER_M = 100;

export default function WatchPositionExample() {
  const [enableHighAccuracy, setEnableHighAccuracy] = useState(false);
  const [timeout, setTimeoutValue] = useState('');
  const [maximumAge, setMaximumAge] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('');
  const [useSignificantChanges, setUseSignificantChanges] = useState(false);
  const [interval, setIntervalValue] = useState('');
  const [fastestInterval, setFastestInterval] = useState('');

  const parseNumber = (value: string) => {
    if (value.trim().length === 0) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const buildWatchOptions = (): GeolocationOptions => {
    const options: GeolocationOptions = {};

    if (enableHighAccuracy) {
      options.enableHighAccuracy = true;
    }

    const timeoutValue = parseNumber(timeout);
    if (timeoutValue !== undefined) {
      options.timeout = timeoutValue;
    }

    const maximumAgeValue = parseNumber(maximumAge);
    if (maximumAgeValue !== undefined) {
      options.maximumAge = maximumAgeValue;
    }

    const distanceFilterValue = parseNumber(distanceFilter);
    if (distanceFilterValue !== undefined) {
      options.distanceFilter = distanceFilterValue;
    }

    if (Platform.OS === 'ios') {
      options.useSignificantChanges = useSignificantChanges;
    }

    if (Platform.OS === 'android') {
      const intervalValue = parseNumber(interval);
      if (intervalValue !== undefined) {
        options.interval = intervalValue;
      }

      const fastestIntervalValue = parseNumber(fastestInterval);
      if (fastestIntervalValue !== undefined) {
        options.fastestInterval = fastestIntervalValue;
      }
    }

    return options;
  };

  const buildCurrentPositionOptions = (): GeolocationOptions => {
    const options: GeolocationOptions = {};

    if (enableHighAccuracy) {
      options.enableHighAccuracy = true;
    }

    const timeoutValue = parseNumber(timeout);
    if (timeoutValue !== undefined) {
      options.timeout = timeoutValue;
    }

    const maximumAgeValue = parseNumber(maximumAge);
    if (maximumAgeValue !== undefined) {
      options.maximumAge = maximumAgeValue;
    }

    return options;
  };

  const watchPosition = () => {
    try {
      const currentOptions = buildCurrentPositionOptions();
      console.log('watchPosition.getCurrentPositionOptions', currentOptions);
      Geolocation.getCurrentPosition(
        (position) => {
          setPosition(JSON.stringify(position));
        },
        (error) => Alert.alert('GetCurrentPosition Error', JSON.stringify(error)),
        currentOptions
      );

      const watchOptions = buildWatchOptions();
      console.log('watchPosition.startOptions', watchOptions);
      const watchID = Geolocation.watchPosition(
        (position) => {
          console.log('watchPosition', JSON.stringify(position));
          setPosition(JSON.stringify(position));
        },
        (error) => Alert.alert('WatchPosition Error', JSON.stringify(error)),
        buildWatchOptions()
      );
      setSubscriptionId(watchID);
    } catch (error) {
      Alert.alert('WatchPosition Error', JSON.stringify(error));
    }
  };

  const clearWatch = () => {
    subscriptionId !== null && Geolocation.clearWatch(subscriptionId);
    setSubscriptionId(null);
    setPosition(null);
  };

  const [position, setPosition] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  useEffect(() => {
    return () => {
      clearWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>High accuracy (off)</Text>
        <Switch
          value={enableHighAccuracy}
          onValueChange={setEnableHighAccuracy}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Timeout (ms · {DEFAULT_TIMEOUT_MS})</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={timeout}
          onChangeText={setTimeoutValue}
          placeholder={`${DEFAULT_TIMEOUT_MS}`}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Maximum age (ms · Infinity)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={maximumAge}
          onChangeText={setMaximumAge}
          placeholder="Infinity"
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>
          Distance filter (m · {DEFAULT_DISTANCE_FILTER_M})
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={distanceFilter}
          onChangeText={setDistanceFilter}
          placeholder={`${DEFAULT_DISTANCE_FILTER_M}`}
        />
      </View>
      {Platform.OS === 'ios' && (
        <View style={styles.row}>
          <Text style={styles.label}>Use significant changes (false)</Text>
          <Switch
            value={useSignificantChanges}
            onValueChange={setUseSignificantChanges}
          />
        </View>
      )}
      {Platform.OS === 'android' && (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Interval (ms · system)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={interval}
              onChangeText={setIntervalValue}
              placeholder="System"
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fastest interval (ms · system)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={fastestInterval}
              onChangeText={setFastestInterval}
              placeholder="System"
            />
          </View>
        </>
      )}
      <Text>
        <Text style={styles.title}>Last position: </Text>
        {position || 'unknown'}
      </Text>
      {subscriptionId !== null ? (
        <Button title="Clear Watch" onPress={clearWatch} />
      ) : (
        <Button title="Watch Position" onPress={watchPosition} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '500',
  },
  row: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 100,
    textAlign: 'right',
  },
});
