'use server'

import { createClient } from "@/utils/supabase/server";
import { searchPlaces, getGeocode, getPlaceDetails } from "@/lib/maps/places";
import { scoreLead } from "@/lib/ai/claude";
import { revalidatePath } from "next/cache";

export async function searchLeadsAction(query: string, region: string, campaignId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, icp")
    .eq("user_id", user.id)
    .single();

  if (!business) throw new Error("Perfil de negócio não encontrado");

  // 1. Create a Prospecting Job
  const { data: job, error: jobError } = await supabase
    .from("prospecting_jobs")
    .insert({
      business_id: business.id,
      region,
      filters: { query },
      status: 'prospecting'
    })
    .select()
    .single();

  if (jobError) throw jobError;

  // 2. Geocode Region
  const geo = await getGeocode(region);
  if (!geo) throw new Error("Não foi possível localizar a região informada.");

  // 3. Search Places
  const places = await searchPlaces(query, `${geo.lat},${geo.lng}`);

  // 4. Enrich with Place Details (phone, website) — all leads with rate limiting
  const enrichedPlaces = await Promise.all(
    places.map(async (place: any, index: number) => {
      // Delay progressivo para respeitar rate limits da Places API
      await new Promise(resolve => setTimeout(resolve, index * 100));
      try {
        const details = await getPlaceDetails(place.place_id);
        return {
          ...place,
          phone: details?.formatted_phone_number || null,
          website: details?.website || null,
        };
      } catch {
        return { ...place, phone: null, website: null };
      }
    })
  );

  // 5. Save Leads with contact data
  const leadsToInsert = enrichedPlaces.map((place: any) => ({
    job_id: job.id,
    business_id: business.id,
    name: place.name,
    address: place.address,
    phone: place.phone,
    website: place.website,
    lat: place.lat,
    lng: place.lng,
    segment: query,
    status: 'new',
    campaign_id: campaignId || null,
    metadata: {
      place_id: place.place_id,
      rating: place.rating,
      types: place.types,
      search_query: query,
      search_region: region,
    }
  }));

  const { data: insertedLeads, error: leadsError } = await supabase
    .from("leads")
    .insert(leadsToInsert)
    .select("id");

  // 6. Score all leads with AI — using ID for safe updates
  if (!leadsError && insertedLeads) {
    for (let i = 0; i < insertedLeads.length; i++) {
      const lead = leadsToInsert[i];
      const insertedLead = insertedLeads[i];
      const analysis = await scoreLead(lead, business.icp);
      
      await supabase
        .from("leads")
        .update({ 
          score: analysis.score,
          metadata: { ...lead.metadata, reasoning: analysis.reasoning }
        })
        .eq("id", insertedLead.id);
    }
  }

  // 7. Update Job status
  await supabase.from("prospecting_jobs").update({ status: 'completed' }).eq("id", job.id);

  if (campaignId) {
    revalidatePath(`/campanhas/${campaignId}`);
  } else {
    revalidatePath("/dashboard");
  }
}
