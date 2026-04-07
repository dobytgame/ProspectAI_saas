import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const TOKEN_DELAY_MS = 3000;
const AXIOS_TIMEOUT_MS = 15000;
const MAX_INVALID_REQUEST_RETRIES = 3;
const MAX_CONSECUTIVE_HARD_ERRORS = 3;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PlacesTextSearchPayload {
  results: unknown[];
  next_page_token?: string;
  status: string;
  error_message?: string;
}

export type MappedPlace = {
  name: string;
  address: string;
  place_id: string;
  rating?: number;
  user_ratings_total?: number;
  lat: number;
  lng: number;
  types?: string[];
  business_status?: string;
};

function mapPlace(place: any): MappedPlace {
  return {
    name: place.name,
    address: place.formatted_address,
    place_id: place.place_id,
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    types: place.types,
    business_status: place.business_status,
  };
}

/**
 * Uma requisição Text Search (primeira ou pagetoken).
 */
async function fetchSinglePlacesPage(
  url: string,
  isTokenContinuation: boolean
): Promise<{
  results: unknown[];
  nextPageToken: string | null;
  ok: boolean;
}> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY não configurada.");
  }

  let invalidRetries = 0;
  let consecutiveHardErrors = 0;

  for (;;) {
    let data: PlacesTextSearchPayload;
    try {
      const res = await axios.get<PlacesTextSearchPayload>(url, {
        timeout: AXIOS_TIMEOUT_MS,
      });
      data = res.data;
    } catch (err) {
      consecutiveHardErrors++;
      console.error("Places: request error", err);
      if (consecutiveHardErrors >= MAX_CONSECUTIVE_HARD_ERRORS) {
        throw new Error("Falha ao buscar lugares no Google Maps.");
      }
      await delay(TOKEN_DELAY_MS);
      continue;
    }

    const { results, next_page_token, status, error_message } = data;

    if (status === "OK" || status === "ZERO_RESULTS") {
      return {
        results,
        nextPageToken: next_page_token || null,
        ok: true,
      };
    }

    if (status === "INVALID_REQUEST" && isTokenContinuation) {
      invalidRetries++;
      if (invalidRetries > MAX_INVALID_REQUEST_RETRIES) {
        console.warn(
          "[Places] INVALID_REQUEST após retries (paginação).",
          error_message
        );
        return { results: [], nextPageToken: null, ok: false };
      }
      await delay(TOKEN_DELAY_MS);
      continue;
    }

    console.error("[Places] status inesperado:", status, error_message || "");
    return { results: [], nextPageToken: null, ok: false };
  }
}

export type SearchPlacesResult = {
  places: MappedPlace[];
  /** Token para a próxima página (se o Google enviar e você ainda puder buscar). */
  nextPageToken: string | null;
  pagesFetched: number;
};

/**
 * Text Search com até N páginas (≈20 resultados por página).
 */
export async function searchPlaces(
  query: string,
  location: string,
  radius: number = 5000,
  maxPages: number = 3
): Promise<SearchPlacesResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY não configurada.");
  }

  const allResults: unknown[] = [];
  let nextToken: string | null = null;
  let pagesFetched = 0;

  try {
    do {
      const currentUrl: string = nextToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${encodeURIComponent(nextToken)}&key=${GOOGLE_MAPS_API_KEY}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&language=pt-BR&key=${GOOGLE_MAPS_API_KEY}`;

      const page = await fetchSinglePlacesPage(currentUrl, !!nextToken);
      if (!page.ok && pagesFetched === 0) {
        throw new Error("Falha ao buscar lugares no Google Maps.");
      }
      if (!page.ok) {
        nextToken = null;
        break;
      }

      allResults.push(...page.results);
      nextToken = page.nextPageToken;
      pagesFetched++;
      console.info(
        `[Places] page ${pagesFetched}/${maxPages} results+${page.results.length}`
      );

      if (nextToken && pagesFetched < maxPages) {
        await delay(TOKEN_DELAY_MS);
      }
    } while (nextToken && pagesFetched < maxPages);

    const places = allResults.map((p: any) => mapPlace(p));

    return {
      places,
      nextPageToken: nextToken,
      pagesFetched,
    };
  } catch (error) {
    console.error("Error searching Google Places:", error);
    throw new Error("Falha ao buscar lugares no Google Maps.");
  }
}

/**
 * Próxima página usando somente o token (aguarde ~3s após a página anterior).
 */
export async function searchPlacesNextPage(
  nextPageToken: string
): Promise<{ places: MappedPlace[]; nextPageToken: string | null }> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY não configurada.");
  }

  await delay(TOKEN_DELAY_MS);

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${encodeURIComponent(nextPageToken)}&key=${GOOGLE_MAPS_API_KEY}`;

  const page = await fetchSinglePlacesPage(url, true);
  const places = page.results.map((p: any) => mapPlace(p));

  return {
    places,
    nextPageToken: page.ok ? page.nextPageToken : null,
  };
}

export async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,opening_hours&language=pt-BR&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await axios.get(url, { timeout: AXIOS_TIMEOUT_MS });
    return response.data.result;
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

export async function getGeocode(address: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=pt-BR&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await axios.get(url, { timeout: AXIOS_TIMEOUT_MS });
    const result = response.data.results[0];
    if (!result) return null;

    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}
