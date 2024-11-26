import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  NativeModules,
  Platform,
  Linking,
} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const {BluetoothModule} = NativeModules;

const App = () => {
  const [isBluetoothEnabled, setBluetoothEnabled] = useState(false);

  const checkPermissions = async () => {
    if (Platform.OS === 'ios') {
      const result = await check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
      if (result !== RESULTS.GRANTED) {
        await request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
      }
    }
  };

  const checkBluetoothStatus = () => {
    if (Platform.OS === 'android') {
      const status = BluetoothModule.isBluetoothEnabled();
      setBluetoothEnabled(status);
    } else {
      Alert.alert(
        'Info',
        'iOS does not allow programmatically toggling Bluetooth. Manage Bluetooth in Settings.',
      );
    }
  };

  const toggleBluetooth = () => {
    if (Platform.OS === 'android') {
      if (isBluetoothEnabled) {
        BluetoothModule.disableBluetooth();
        Alert.alert('Bluetooth Disabled');
      } else {
        BluetoothModule.enableBluetooth();
        Alert.alert('Bluetooth Enabled');
      }
      setBluetoothEnabled(!isBluetoothEnabled);
    } else {
      Alert.alert(
        'iOS Restriction',
        'iOS does not allow toggling Bluetooth programmatically. Redirecting to settings...',
        [
          {text: 'Open Settings', onPress: () => Linking.openSettings()},
          {text: 'Cancel', style: 'cancel'},
        ],
      );
    }
  };

  useEffect(() => {
    checkPermissions();
    checkBluetoothStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Bluetooth Controller</Text>
      <View style={styles.toggleContainer}>
        <Text>
          {isBluetoothEnabled ? 'Bluetooth is ON' : 'Bluetooth is OFF'}
        </Text>
        <Switch value={isBluetoothEnabled} onValueChange={toggleBluetooth} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    padding: 10,
  },
});

export default App;
