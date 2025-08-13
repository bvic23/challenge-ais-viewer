import { Image, StyleSheet, View } from "react-native";
import Mapbox from '@rnmapbox/maps';
import { useRef } from "react";

const vesselImage = require('./assets/vessel.png');

export type Vessel = {
    mmsi: number;
    lat: number;
    lon: number;
    bearing: number;
    position_accuracy: boolean;
}

const getStyleForVessel = (vessel: Vessel) => ({
    width: 32,
    height: 32,
    opacity: vessel.position_accuracy ? 1 : 0.5,
    transform: [{ rotate: `${vessel.bearing}deg` }],
});

const styles = StyleSheet.create({
    box: {
        backgroundColor: 'transparent',
        // mapbox only rotates the image, if parent view has *any* transform
        transform: [{ scale: 1 }], 
    },
});


export const Marker = ({ vessel }: { vessel: Vessel }) => {
    const ref = useRef<Mapbox.PointAnnotation | null>(null);
    return (
        <Mapbox.PointAnnotation
            id={vessel.mmsi.toString()}
            coordinate={[vessel.lon, vessel.lat]}
            ref={ref}
        >
            <View style={styles.box}>
                <Image source={vesselImage}
                    resizeMode='contain'
                    style={getStyleForVessel(vessel)}
                    // refresh the annotation when the image is loaded, otherwise image is not visible
                    onLoad={() => ref.current?.refresh()}
                    fadeDuration={0} />
            </View>
        </Mapbox.PointAnnotation>
    );
};
