import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
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
    onHover?: (id: string | null) => void;
}

const ComparablesMap: React.FC<ComparablesMapProps> = ({ subjectProperty, comparables, onHover }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<{
        id: string;
        position: { lat: number; lng: number };
        title: string;
        details: string;
    } | null>(null);
    const [internalSubjectCoords, setInternalSubjectCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Effect to handle subject property coordinates (use provided or geocode)
    React.useEffect(() => {
        if (subjectProperty.coordinates) {
            setInternalSubjectCoords({
                lat: subjectProperty.coordinates.lat,
                lng: subjectProperty.coordinates.lon
            });
        } else if (isLoaded && subjectProperty.address) {
            // Fallback: Geocode the address
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: subjectProperty.address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    console.log('Geocoded subject property:', location.toJSON());
                    setInternalSubjectCoords({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                } else {
                    console.error('Geocode failed for subject property:', status);
                }
            });
        }
    }, [subjectProperty, isLoaded]);

    const onLoad = useCallback((map: google.maps.Map) => {
        const bounds = new window.google.maps.LatLngBounds();

        // Add subject property to bounds
        if (internalSubjectCoords) {
            bounds.extend(internalSubjectCoords);
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
        if (internalSubjectCoords || comparables.length > 0) {
            map.fitBounds(bounds);
        }

        setMap(map);
    }, [internalSubjectCoords, comparables]);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    if (!isLoaded) {
        return <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>;
    }

    return (
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 relative">
            {!internalSubjectCoords && (
                <div className="absolute top-2 left-2 z-10 bg-white px-3 py-1 rounded-md shadow-md text-xs font-medium text-gray-600 flex items-center">
                    <div className="animate-spin h-3 w-3 border-2 border-brand-blue border-t-transparent rounded-full mr-2"></div>
                    Locating Subject Property...
                </div>
            )}
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
                {/* Subject Property - Red Marker (Default) */}
                {internalSubjectCoords && (
                    <Marker
                        position={internalSubjectCoords}
                        onClick={() => setSelectedMarker({
                            id: 'subject',
                            position: internalSubjectCoords,
                            title: 'Subject Property',
                            details: subjectProperty.address
                        })}
                        zIndex={1000} // Ensure it's on top
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
                            onClick={() => setSelectedMarker({
                                id: comp.id,
                                position: {
                                    lat: comp.latitude!,
                                    lng: comp.longitude!
                                },
                                title: comp.address,
                                details: `Price: $${comp.salePrice.toLocaleString()} | ${comp.bedrooms}bd/${comp.bathrooms}ba | ${comp.sqft} sqft`
                            })}
                            onMouseOver={() => onHover && onHover(comp.id)}
                            onMouseOut={() => onHover && onHover(null)}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                            }}
                        />
                    )
                ))}

                {/* Info Window */}
                {selectedMarker && (
                    <InfoWindow
                        position={selectedMarker.position}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="p-2 max-w-xs">
                            <h3 className="font-bold text-gray-900 mb-1">{selectedMarker.title}</h3>
                            <p className="text-sm text-gray-600">{selectedMarker.details}</p>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
};

export default React.memo(ComparablesMap);
