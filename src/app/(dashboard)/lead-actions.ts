'use server'

import { createClient } from "@/utils/supabase/server";
import { searchPlaces, getGeocode, getPlaceDetails } from "@/lib/maps/places";
import { scoreLead } from "@/lib/ai/claude";
import { revalidatePath } from "next/cache";
import { PlanType, PLAN_LIMITS } from "@/utils/plan-limits";

export async function searchLeadsAction(query: string, region: string, campaignId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, icp, plan, leads_used_this_month, agents(config)")
    .eq("user_id", user.id)
    .single();

  if (!business) throw new Error("Perfil de negócio não encontrado");

  // 1. Check Limits First
  const plan = (business.plan || 'free') as PlanType;
  const currentLeadsCount = business.leads_used_this_month || 0;
  const limit = PLAN_LIMITS[plan].leadsPerMonth;

  if (currentLeadsCount >= limit) {
    return { error: `VOCE_ATINGIU_O_LIMITE_DE_LEADS_DO_SEU_PLANO` };
  }

  // 2. Create a Prospecting Job
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

  // 3. Geocode Region
  const geo = await getGeocode(region);
  if (!geo) throw new Error("Não foi possível localizar a região informada.");

  // 4. Search Places - Max 3 pages (60 leads) for paid plans, 1 page (20) for free
  const maxPages = plan === 'free' ? 1 : 3;
  const places = await searchPlaces(query, `${geo.lat},${geo.lng}`, 5000, maxPages);
  
  if (currentLeadsCount + places.length > limit) {
    const remaining = limit - currentLeadsCount;
    if (remaining <= 0) {
      return { error: `VOCE_ATINGIU_O_LIMITE_DE_LEADS_DO_SEU_PLANO` };
    }
    // Truncate results to fit limit
    places.splice(remaining);
  }

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

  if (leadsError) return { error: leadsError.message };

  // 6. Increment Lead Counter in Business
  await supabase.rpc('increment_business_leads', { 
    p_business_id: business.id, 
    p_count: leadsToInsert.length 
  });

  // 6. Score all leads with AI — using ID for safe updates
  if (!leadsError && insertedLeads) {
    for (let i = 0; i < insertedLeads.length; i++) {
      const lead = leadsToInsert[i];
      const insertedLead = insertedLeads[i];
      const agentConfig = business.agents?.[0]?.config || business.icp;
      const analysis = await scoreLead(lead, agentConfig);
      
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

  return { success: true };
}
