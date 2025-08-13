import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Platform } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Marker, Vessel } from './Marker';

const baseUrl = Platform.OS === 'android' ? 'http://192.168.50.232:3000' : 'http://localhost:3000';
const zoomLevelThreshold = 12;
const initialZoomLevel = 12.1;
const pollInterval = 9000;
// Den Oever
const startLocation = [5.040745540764078, 52.93773254377389];

Mapbox.setAccessToken("<PUBLIC_MAPBOX_TOKEN>");

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
  map: {
    flex: 1
  },
  info: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 8,
    margin: 8,
  }
});

const App = () => {
  const mapRef = useRef<Mapbox.MapView | null>(null);
  const timerRef = useRef<number | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [zoom, setZoom] = useState(0);
  const [isServerDown, setIsServerDown] = useState(false);

  const renderVessels = useCallback(async () => {
    if (!mapRef.current) {
      return;
    }
    const visibleBounds = await mapRef.current.getVisibleBounds();
    const min_lon = visibleBounds[0][0].toString();
    const min_lat = visibleBounds[0][1].toString();
    const max_lon = visibleBounds[1][0].toString();
    const max_lat = visibleBounds[1][1].toString();

    const queryParams = new URLSearchParams({
      min_lon,
      min_lat,
      max_lon,
      max_lat
    });

    try {
      const url = `${baseUrl}/vessels?${queryParams.toString()}`;
      const response = await fetch(url);
      const vesselsData = await response.json();

      setVessels(vesselsData);
      setIsServerDown(false);
    } catch (error) {
      setIsServerDown(true);
      setVessels([]);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (timerRef.current) {
      return;
    }
    timerRef.current = setInterval(() => {
      renderVessels();
    }, pollInterval);

    // poll once immediately
    renderVessels();
  }, [renderVessels]);

  const stopPolling = useCallback(() => {
    if (!timerRef.current) {
      return;
    }
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const handleMapIdle = useCallback(async () => {
    if (!mapRef.current) {
      return;
    }

    const currentZoom = await mapRef.current.getZoom();
    setZoom(currentZoom);

    if (currentZoom < zoomLevelThreshold) {
      setVessels([]);
      stopPolling();
      return;
    }

    startPolling();
  }, [startPolling, stopPolling]);

  const setRef = useCallback((ref: Mapbox.MapView | null) => {
    mapRef.current = ref;
  }, []); 

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        onMapIdle={handleMapIdle}
        onDidFinishLoadingMap={handleMapIdle}
        onTouchStart={stopPolling}
        ref={setRef}
      >
        <Mapbox.Camera
          zoomLevel={initialZoomLevel}
          centerCoordinate={startLocation}
          animationDuration={0}
        />
        {vessels.map((vessel) => (
          <Marker key={vessel.mmsi.toString()} vessel={vessel} />
        ))}
      </Mapbox.MapView>
      <SafeAreaView style={styles.info}>  
        <Text>Zoom: {zoom.toFixed(1)}, Polling: {timerRef.current ? 'ON' : 'OFF'}, Server: {isServerDown ? 'DOWN' : 'UP'}, #Vessels: {vessels.length}</Text>
      </SafeAreaView>
    </View>
  );
}

export default App;