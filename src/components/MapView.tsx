import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons if needed, though we use CircleMarker mainly.
// But standard Markers might be used if desired.
// For this implementation we stick to geometric shapes for consistency with the design.

interface MapViewProps {
  zones?: any[];
  reports?: any[];
  onZoneClick?: (zone: any) => void;
  onReportClick?: (report: any) => void;
  center?: [number, number];
  zoom?: number;
}

// Helper to update map view when props change
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    // Leaflet uses [lat, lng], mapbox often [lng, lat].
    // Our props are passed as [lng, lat] usually in this app (Bangalore 77.59 which is lng).
    // So we flip them for Leaflet: [center[1], center[0]]
    map.flyTo([center[1], center[0]], zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  zones = [],
  reports = [],
  onZoneClick,
  onReportClick,
  center = [77.5946, 12.9716], // [lng, lat]
  zoom = 11,
}: MapViewProps) {

  // Leaflet expects [lat, lng]
  const leafletCenter: [number, number] = [center[1], center[0]];

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

  return (
    <Card className="h-full w-full overflow-hidden relative group border-0 shadow-inner">
      <MapContainer
        center={leafletCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Zones Layer */}
        {zones.map((zone) => (
          <GeoJSON
            key={zone.id}
            data={zone.geometry}
            style={() => ({
              color: "#000",
              weight: 1,
              opacity: 0.5,
              fillColor: getZoneColor(zone.flood_risk_score || 0),
              fillOpacity: 0.4,
            })}
            eventHandlers={{
              click: () => onZoneClick && onZoneClick(zone)
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm">{zone.name}</h3>
                <div className="text-xs mt-1">
                  <span>Flood Risk: </span>
                  <span className={`font-bold ${(zone.flood_risk_score || 0) > 0.7 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.round((zone.flood_risk_score || 0) * 100)}%
                  </span>
                </div>
              </div>
            </Popup>
          </GeoJSON>
        ))}

        {/* Reports Layer */}
        {reports.map((report) => {
          // Ensure coordinates exist and are valid [lng, lat]
          if (!report.location?.coordinates || report.location.coordinates.length < 2) return null;
          // Flip to [lat, lng]
          const position: [number, number] = [report.location.coordinates[1], report.location.coordinates[0]];

          return (
            <CircleMarker
              key={report.id}
              center={position}
              pathOptions={{
                color: "white",
                weight: 2,
                fillColor: getReportColor(report.status),
                fillOpacity: 0.8
              }}
              radius={8}
              eventHandlers={{
                click: () => onReportClick && onReportClick(report)
              }}
            >
              <Popup>
                <div className="p-2 max-w-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${report.status === 'resolved' ? 'bg-green-500' :
                        report.status === 'in_progress' ? 'bg-orange-500' : 'bg-red-500'
                      }`}>
                      {report.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{report.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{report.description}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      </MapContainer>

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
