import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Property, AttomComparable } from '../types';

const containerStyle = {
    width: '100%',
    height: '400px'
};

const defaultCenter = {
    lat: 39.8283,
    lng: -98.5795
};

interface ComparablesMapProps {
    subjectProperty: Property;
    comparables: AttomComparable[];
}

const ComparablesMap: React.FC<ComparablesMapProps> = ({ subjectProperty, comparables }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        const bounds = new window.google.maps.LatLngBounds();

        // Add subject property to bounds
        if (subjectProperty.coordinates) {
            bounds.extend({
                lat: subjectProperty.coordinates.lat,
                lng: subjectProperty.coordinates.lon
            });
        }

        // Add comparables to bounds
        comparables.forEach(comp => {
            if (comp.latitude && comp.longitude) {
                bounds.extend({
                    lat: comp.latitude,
                    lng: comp.longitude
                });
            }
        });

        // Only fit bounds if we have points
        if (subjectProperty.coordinates || comparables.length > 0) {
            map.fitBounds(bounds);
        }

        setMap(map);
    }, [subjectProperty, comparables]);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    if (!isLoaded) {
        return <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>;
    }

    return (
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                }}
            >
                {/* Subject Property - Red Marker */}
                {subjectProperty.coordinates && (
                    <Marker
                        position={{
                            lat: subjectProperty.coordinates.lat,
                            lng: subjectProperty.coordinates.lon
                        }}
                        title="Subject Property"
                        icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                        }}
                    />
                )}

                {/* Comparables - Yellow Markers */}
                {comparables.map(comp => (
                    (comp.latitude && comp.longitude) && (
                        <Marker
                            key={comp.id}
                            position={{
                                lat: comp.latitude,
                                lng: comp.longitude
                            }}
                            title={`${comp.address} - $${comp.salePrice.toLocaleString()}`}
                            icon={{
                                url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                            }}
                        />
                    )
                ))}
            </GoogleMap>
        </div>
    );
};

export default React.memo(ComparablesMap);
