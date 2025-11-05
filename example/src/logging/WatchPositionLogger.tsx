/**
 * Copyright (c) React Native Community
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Geolocation, {
  type GeolocationResponse,
} from '@react-native-community/geolocation';
import RNFS from 'react-native-fs';

import {
  WatchOptionsForm,
  buildCurrentPositionOptions,
  buildWatchOptions,
  initialWatchOptionValues,
  type WatchOptionFormValues,
} from '../components/WatchOptionsForm';

const CSV_HEADER =
  'timestamp,latitude,longitude,altitude,accuracy,altitudeAccuracy,heading,speed,mocked';

const getTargetDirectory = () => {
  if (Platform.OS === 'android') {
    return RNFS.ExternalDirectoryPath;
  }

  return RNFS.DocumentDirectoryPath;
};

const ensureDirectoryExists = async (path: string) => {
  const exists = await RNFS.exists(path);
  if (!exists) {
    await RNFS.mkdir(path);
  }
};

const formatFilenameTimestamp = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

const buildCsvRow = (position: GeolocationResponse) => {
  const { coords, timestamp } = position;
  const maybeMocked = (position as Record<string, unknown>).mocked;

  const values = [
    timestamp,
    coords.latitude,
    coords.longitude,
    coords.altitude ?? '',
    coords.accuracy,
    coords.altitudeAccuracy ?? '',
    coords.heading ?? '',
    coords.speed ?? '',
    typeof maybeMocked === 'boolean' ? maybeMocked : '',
  ];

  return values
    .map((value) =>
      value === null || value === undefined
        ? ''
        : typeof value === 'number'
        ? value.toString()
        : `${value}`
    )
    .join(',');
};

const LoggingStatus = ({
  filePath,
  isLogging,
  entries,
  lastUpdate,
  error,
}: {
  filePath: string | null;
  isLogging: boolean;
  entries: number;
  lastUpdate: number | null;
  error: string | null;
}) => {
  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusLabel}>
        Status: {isLogging ? 'Logging' : 'Idle'}
      </Text>
      <Text style={styles.statusLabel}>Entries written: {entries}</Text>
      {filePath !== null && (
        <Text style={styles.statusPath}>File: {filePath}</Text>
      )}
      {lastUpdate !== null && (
        <Text style={styles.statusLabel}>
          Last update: {new Date(lastUpdate).toLocaleTimeString()}
        </Text>
      )}
      {error !== null && <Text style={styles.statusError}>Error: {error}</Text>}
    </View>
  );
};

export default function WatchPositionLogger() {
  const [formValues, setFormValues] =
    useState<WatchOptionFormValues>(initialWatchOptionValues);
  const [currentPosition, setCurrentPosition] =
    useState<GeolocationResponse | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [entries, setEntries] = useState(0);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const filePathRef = useRef<string | null>(null);

  const appendPosition = useCallback((position: GeolocationResponse) => {
    const targetPath = filePathRef.current;
    if (!targetPath) {
      return;
    }

    const row = buildCsvRow(position);
    RNFS.appendFile(targetPath, `${row}\n`, 'utf8')
      .then(() => {
        setEntries((count) => count + 1);
      })
      .catch((appendError) => {
        const message =
          appendError instanceof Error
            ? appendError.message
            : String(appendError);
        setError(message);
        console.warn('Failed to append position', message);
      });
  }, []);

  const stopLogging = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLogging(false);
  }, []);

  const startLogging = useCallback(async () => {
    if (isLogging) {
      return;
    }

    try {
      setError(null);
      setEntries(0);
      setLastUpdate(null);

      const directory = getTargetDirectory();
      await ensureDirectoryExists(directory);

      const startTime = new Date();
      const filename = `watch-log-${formatFilenameTimestamp(startTime)}.csv`;
      const targetPath = `${directory}/${filename}`;

      await RNFS.writeFile(targetPath, `${CSV_HEADER}\n`, 'utf8');
      filePathRef.current = targetPath;
      setFilePath(targetPath);

      const currentOptions = buildCurrentPositionOptions(formValues);
      console.log(
        'logging.watchPosition.getCurrentPositionOptions',
        currentOptions
      );
      Geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition(position);
          setLastUpdate(Date.now());
          appendPosition(position);
        },
        (positionError) => {
          const message = JSON.stringify(positionError);
          setError(message);
          Alert.alert('GetCurrentPosition Error', message);
        },
        currentOptions
      );

      const watchOptions = buildWatchOptions(formValues);
      console.log('logging.watchPosition.startOptions', watchOptions);
      const watchId = Geolocation.watchPosition(
        (position) => {
          console.log('logging.watchPosition', JSON.stringify(position));
          setCurrentPosition(position);
          setLastUpdate(Date.now());
          appendPosition(position);
        },
        (watchError) => {
          const message = JSON.stringify(watchError);
          setError(message);
          Alert.alert('WatchPosition Error', message);
        },
        watchOptions
      );
      watchIdRef.current = watchId;
      setIsLogging(true);
    } catch (startError) {
      const message =
        startError instanceof Error ? startError.message : String(startError);
      setError(message);
      Alert.alert('Logging Error', message);
      stopLogging();
    }
  }, [appendPosition, formValues, isLogging, stopLogging]);

  useEffect(() => {
    return () => {
      stopLogging();
    };
  }, [stopLogging]);

  return (
    <View>
      <WatchOptionsForm
        values={formValues}
        onChange={(field, value) =>
          setFormValues((prev) => ({ ...prev, [field]: value }))
        }
      />
      <LoggingStatus
        filePath={filePath}
        isLogging={isLogging}
        entries={entries}
        lastUpdate={lastUpdate}
        error={error}
      />
      <Text>
        <Text style={styles.title}>Last position: </Text>
        {currentPosition ? JSON.stringify(currentPosition) : 'unknown'}
      </Text>
      {isLogging ? (
        <Button title="Stop logging" onPress={stopLogging} />
      ) : (
        <Button title="Start logging" onPress={startLogging} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '500',
    marginBottom: 12,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusLabel: {
    marginBottom: 4,
  },
  statusPath: {
    marginBottom: 4,
    color: '#555',
  },
  statusError: {
    marginBottom: 4,
    color: '#b00020',
  },
});

