import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface InteractivePinMapProps {
  coordinates: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
}

export const InteractivePinMap: React.FC<InteractivePinMapProps> = ({
  coordinates,
  onChange,
  className = 'h-72 w-full',
  zoom = 15,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Default to Monas / Central Jakarta if null
  const defaultLat = coordinates?.lat ?? -6.2297;
  const defaultLng = coordinates?.lng ?? 106.8073;

  useEffect(() => {
    let isMounted = true;

    // Dynamically load Leaflet on client
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Prevent re-initialization if map already exists
      if (mapInstanceRef.current) {
        return;
      }

      // Create Custom SVG Pin Icon
      const customPinIcon = L.divIcon({
        className: 'omoo-map-pin-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: grab;">
            <div style="position: absolute; width: 14px; height: 14px; background: rgba(16, 185, 129, 0.35); border-radius: 50%; transform: scale(2.2); animation: pulse 2s infinite;"></div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#059669" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3" fill="#ffffff" stroke="none"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 34],
      });

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Add OpenStreetMap Free Open Source Tiles (No API key, 100% Free)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Create draggable Marker
      const marker = L.marker([defaultLat, defaultLng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      // Handle Map Click: Move Marker & Emit Change
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      // Handle Marker Drag End: Emit Change
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange(pos.lat, pos.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate map size after short delay to ensure full container rendering
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update map center and marker when coordinates change externally
  useEffect(() => {
    if (!coordinates || !mapInstanceRef.current || !markerRef.current) return;

    const currentPos = markerRef.current.getLatLng();
    // Only update if difference is meaningful
    if (
      Math.abs(currentPos.lat - coordinates.lat) > 0.00001 ||
      Math.abs(currentPos.lng - coordinates.lng) > 0.00001
    ) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      mapInstanceRef.current.panTo([coordinates.lat, coordinates.lng], {
        animate: true,
        duration: 0.6,
      });
    }
  }, [coordinates?.lat, coordinates?.lng]);

  return (
    <div className="relative w-full border border-line rounded-xs overflow-hidden bg-surface/30">
      <div ref={mapContainerRef} className={className} />
      <div className="absolute bottom-2 left-2 z-[400] bg-surface/95 backdrop-blur-sm text-[0.65rem] text-ink font-medium px-2.5 py-1 rounded border border-line shadow-md pointer-events-none">
        Klik atau geser pin hijau untuk menentukan titik antar kurir
      </div>
    </div>
  );
};
