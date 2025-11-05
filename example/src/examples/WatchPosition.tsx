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
import { StyleSheet, Text, View, Alert, Button } from 'react-native';
import Geolocation, { type GeolocationResponse } from '@react-native-community/geolocation';
import {
  WatchOptionsForm,
  buildCurrentPositionOptions,
  buildWatchOptions,
  initialWatchOptionValues,
  type WatchOptionFormValues,
} from '../components/WatchOptionsForm';

export default function WatchPositionExample() {
  const [formValues, setFormValues] =
    useState<WatchOptionFormValues>(initialWatchOptionValues);
  const [currentPosition, setCurrentPosition] =
    useState<GeolocationResponse | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);

  const watchPosition = () => {
    try {
      const currentOptions = buildCurrentPositionOptions(formValues);
      console.log('watchPosition.getCurrentPositionOptions', currentOptions);
      Geolocation.getCurrentPosition(
        (nextPosition) => {
          setCurrentPosition(nextPosition);
          setLastUpdate(Date.now());
        },
        (error) => Alert.alert('GetCurrentPosition Error', JSON.stringify(error)),
        currentOptions
      );

      const watchOptions = buildWatchOptions(formValues);
      console.log('watchPosition.startOptions', watchOptions);
      const watchID = Geolocation.watchPosition(
        (nextPosition) => {
          console.log('watchPosition', JSON.stringify(nextPosition));
          setCurrentPosition(nextPosition);
          setLastUpdate(Date.now());
        },
        (error) => Alert.alert('WatchPosition Error', JSON.stringify(error)),
        watchOptions
      );
      setSubscriptionId(watchID);
    } catch (error) {
      Alert.alert('WatchPosition Error', JSON.stringify(error));
    }
  };

  const clearWatch = () => {
    subscriptionId !== null && Geolocation.clearWatch(subscriptionId);
    setSubscriptionId(null);
    setCurrentPosition(null);
    setLastUpdate(null);
  };

  useEffect(() => {
    return () => {
      clearWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View>
      <WatchOptionsForm
        values={formValues}
        onChange={(field, value) =>
          setFormValues((prev) => ({ ...prev, [field]: value }))
        }
      />
      <Text>
        <Text style={styles.title}>Last position: </Text>
        {currentPosition ? JSON.stringify(currentPosition) : 'unknown'}
      </Text>
      {lastUpdate !== null && (
        <Text style={styles.caption}>
          Last update: {new Date(lastUpdate).toLocaleTimeString()}
        </Text>
      )}
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
  caption: {
    marginBottom: 12,
    color: '#555',
  },
});
