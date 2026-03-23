'use client'

import React, { useState, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%'
}

const defaultCenter = {
  lat: -23.5505,
  lng: -46.6333
}

interface Lead {
  id: string;
  name: string;
  lat: number;
  lng: number;
  score?: number;
  address?: string;
  phone?: string;
  website?: string;
  status?: string;
  rating?: number | null;
  reasoning?: string;
}

interface LeadMapProps {
  leads: Lead[];
}

function getScoreColor(score: number) {
  if (score >= 70) return '#22c55e'; // green
  if (score >= 40) return '#eab308'; // yellow
  return '#ef4444'; // red
}

function getScoreLabel(score: number) {
  if (score >= 70) return 'Qualificado';
  if (score >= 40) return 'Potencial';
  return 'Baixo';
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    new: 'Novo',
    contacted: 'Contatado',
    interested: 'Interessado',
    closed: 'Fechado',
    rejected: 'Rejeitado',
  };
  return map[status] || status;
}

export default function LeadMap({ leads }: LeadMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    if (leads.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      leads.forEach(lead => {
        if (lead.lat && lead.lng) {
          bounds.extend({ lat: lead.lat, lng: lead.lng });
        }
      });
      map.fitBounds(bounds);
      
      // Don't zoom in too far on a single result
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 16) map.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    }
    setMap(map)
  }, [leads])

  const onUnmount = useCallback(function callback() {
    setMap(null)
  }, [])

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground italic">
        Carregando Mapa...
      </div>
    )
  }

  const mapCenter = leads.length > 0 && leads[0].lat && leads[0].lng
    ? { lat: leads[0].lat, lng: leads[0].lng }
    : defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8892b0' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d4a' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8892b0' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
          // Hide all POIs (shopping, restaurants, etc.)
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          // Hide transit (metro, bus stations, etc.)
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          // Keep administrative labels (neighborhoods, cities)
          { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#6c7aa0' }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      }}
    >
      {leads.map(lead => {
        if (!lead.lat || !lead.lng) return null;
        const score = lead.score || 0;
        const color = getScoreColor(score);

        return (
          <Marker
            key={lead.id}
            position={{ lat: lead.lat, lng: lead.lng }}
            onClick={() => setSelectedLead(lead)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 0.9,
              strokeWeight: 2.5,
              strokeColor: '#ffffff',
              scale: 10,
            }}
            animation={google.maps.Animation.DROP}
          />
        )
      })}

      {selectedLead && selectedLead.lat && selectedLead.lng && (
        <InfoWindow
          position={{ lat: selectedLead.lat, lng: selectedLead.lng }}
          onCloseClick={() => setSelectedLead(null)}
          options={{
            pixelOffset: new google.maps.Size(0, -12),
            maxWidth: 340,
          }}
        >
          <div style={{
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: '#1a1a2e',
            padding: '4px',
            minWidth: '280px'
          }}>
            {/* Header with score */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f0f23', lineHeight: 1.3 }}>
                  {selectedLead.name}
                </h3>
                <span style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.8px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: getScoreColor(selectedLead.score || 0) + '18',
                  color: getScoreColor(selectedLead.score || 0),
                }}>
                  {getStatusLabel(selectedLead.status || 'new')}
                </span>
              </div>
              <div style={{
                minWidth: '52px',
                height: '52px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${getScoreColor(selectedLead.score || 0)}22, ${getScoreColor(selectedLead.score || 0)}44)`,
                border: `2px solid ${getScoreColor(selectedLead.score || 0)}`,
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '12px',
              }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: getScoreColor(selectedLead.score || 0), lineHeight: 1 }}>
                  {selectedLead.score || 0}
                </span>
                <span style={{ fontSize: '8px', fontWeight: 600, color: getScoreColor(selectedLead.score || 0), textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                  {getScoreLabel(selectedLead.score || 0)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '10px' }}>
              {selectedLead.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>📍</span>
                  <span style={{ lineHeight: 1.4 }}>{selectedLead.address}</span>
                </div>
              )}
              {selectedLead.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                  <span style={{ fontSize: '14px' }}>📞</span>
                  <a href={`tel:${selectedLead.phone}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
                    {selectedLead.phone}
                  </a>
                </div>
              )}
              {selectedLead.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                  <span style={{ fontSize: '14px' }}>🌐</span>
                  <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: '200px', display: 'inline-block' }}>
                    {selectedLead.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
              {selectedLead.rating !== undefined && selectedLead.rating !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                  <span style={{ fontSize: '14px' }}>⭐</span>
                  <span style={{ fontWeight: 600 }}>{selectedLead.rating}</span>
                  <span>no Google Maps</span>
                </div>
              )}
            </div>

            {/* AI Reasoning */}
            {selectedLead.reasoning && (
              <div style={{
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                padding: '10px 12px',
                borderLeft: `3px solid ${getScoreColor(selectedLead.score || 0)}`,
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: '#94a3b8', marginBottom: '4px' }}>
                  🤖 Análise da IA
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{selectedLead.reasoning}"
                </p>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
