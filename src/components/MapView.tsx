import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MapViewProps {
  zones?: any[];
  reports?: any[];
  onZoneClick?: (zone: any) => void;
  onReportClick?: (report: any) => void;
  center?: [number, number];
  zoom?: number;
}

export default function MapView({
  zones = [],
  reports = [],
  onZoneClick,
  onReportClick,
  center = [77.5946, 12.9716], // [lng, lat]
  zoom = 11,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.LayerGroup | null>(null);

  const getZoneColor = (risk: number) => {
    if (risk > 0.7) return "#ef4444"; // Red
    if (risk > 0.3) return "#eab308"; // Yellow
    return "#22c55e"; // Green
  };

  const getReportColor = (status: string) => {
    switch (status) {
      case "resolved": return "#22c55e";
      case "in_progress": return "#f97316";
      default: return "#ef4444"; // pending
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (!leafletMap.current) {
      // Leaflet uses [lat, lng]
      leafletMap.current = L.map(mapRef.current).setView([center[1], center[0]], zoom);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(leafletMap.current);

      layerGroup.current = L.layerGroup().addTo(leafletMap.current);
    } else {
      leafletMap.current.flyTo([center[1], center[0]], zoom);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        layerGroup.current = null;
      }
    };
  }, []); // Only run once on mount, we'll handle center/zoom in a separate effect if needed, but for this demo it's fine.

  // Update Layers
  useEffect(() => {
    if (!leafletMap.current || !layerGroup.current) return;
    
    layerGroup.current.clearLayers();

    // Add Zones
    zones.forEach((zone) => {
      if (!zone.geometry) return;
      
      const geoJsonLayer = L.geoJSON(zone.geometry as any, {
        style: {
          color: "#000",
          weight: 1,
          opacity: 0.5,
          fillColor: getZoneColor(zone.flood_risk_score || 0),
          fillOpacity: 0.4,
        }
      });
      
      geoJsonLayer.on('click', () => {
        if (onZoneClick) onZoneClick(zone);
      });
      
      geoJsonLayer.addTo(layerGroup.current!);
    });

    // Add Reports
    reports.forEach((report) => {
      if (!report.location?.coordinates || report.location.coordinates.length < 2) return;
      
      // Flip to [lat, lng]
      const lat = report.location.coordinates[1];
      const lng = report.location.coordinates[0];

      const marker = L.circleMarker([lat, lng], {
        color: "white",
        weight: 2,
        fillColor: getReportColor(report.status),
        fillOpacity: 0.8,
        radius: 8
      });

      marker.on('click', () => {
        if (onReportClick) onReportClick(report);
      });

      marker.addTo(layerGroup.current!);
    });

  }, [zones, reports, onZoneClick, onReportClick]);

  return (
    <Card className="h-full w-full overflow-hidden relative group border-0 shadow-inner">
      <div ref={mapRef} style={{ height: "100%", width: "100%", zIndex: 0 }} />


      {/* Map Legend (Kept from original design) */}
      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 z-[1000] max-w-xs transition-opacity opacity-90 hover:opacity-100 pointer-events-auto">
        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4" /> Map Layers
        </h4>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Flood Risk Zones</p>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-red-500/50 border border-red-500"></div>
              <span>High Risk</span>
              <div className="w-3 h-3 rounded bg-yellow-500/50 border border-yellow-500 ml-2"></div>
              <span>Moderate</span>
              <div className="w-3 h-3 rounded bg-green-500/50 border border-green-500 ml-2"></div>
              <span>Safe</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Citizen Reports</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-red-500 border border-white shadow-sm"></div>
                <span>Pending Action</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-orange-500 border border-white shadow-sm"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 border border-white shadow-sm"></div>
                <span>Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
