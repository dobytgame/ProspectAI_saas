import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function searchPlaces(query: string, location: string, radius: number = 5000) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY não configurada.");
  }

  // Note: Using the Text Search (New) or standard Text Search
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await axios.get(url);
    const results = response.data.results;

    return results.map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      place_id: place.place_id,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      types: place.types,
      business_status: place.business_status,
    }));
  } catch (error) {
    console.error("Error searching Google Places:", error);
    throw new Error("Falha ao buscar lugares no Google Maps.");
  }
}

export async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,opening_hours&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    return response.data.result;
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

export async function getGeocode(address: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    const result = response.data.results[0];
    if (!result) return null;
    
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}
