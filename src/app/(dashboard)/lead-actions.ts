'use server'

import { createClient } from "@/utils/supabase/server";
import {
  searchPlaces,
  searchPlacesNextPage,
  getGeocode,
  getPlaceDetails,
  type MappedPlace,
} from "@/lib/maps/places";
import { scoreLead } from "@/lib/ai/claude";
import { revalidatePath } from "next/cache";
import { PlanType, PLAN_LIMITS } from "@/utils/plan-limits";

export type CampaignDiscoveryState = {
  query: string;
  region: string;
  next_page_token: string | null;
  pages_fetched: number;
  max_pages: number;
};

async function existingPlaceIdsForCampaign(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaignId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("leads")
    .select("metadata")
    .eq("campaign_id", campaignId);
  const ids = new Set<string>();
  for (const row of data || []) {
    const pid = row.metadata?.place_id as string | undefined;
    if (pid) ids.add(pid);
  }
  return ids;
}

function filterNewPlaces(places: MappedPlace[], existing: Set<string>): MappedPlace[] {
  return places.filter((p) => p.place_id && !existing.has(p.place_id));
}

export async function searchLeadsAction(
  query: string,
  region: string,
  campaignId?: string,
  options?: { loadMore?: boolean; maxPagesInThisSearch?: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  let business: any = null;

  if (campaignId) {
    const { data: campaign, error: campaignErr } = await supabase
      .from("campaigns")
      .select("business_id, discovery_state")
      .eq("id", campaignId)
      .single();

    if (campaignErr) {
      console.error("searchLeadsAction: campaign lookup", campaignErr);
      return { error: "Não foi possível carregar a campanha." };
    }

    if (campaign?.business_id) {
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .select("id, icp, plan, leads_used_this_month, agents(config)")
        .eq("id", campaign.business_id)
        .single();
      if (bizErr) {
        console.error("searchLeadsAction: business by campaign", bizErr);
        return { error: "Não foi possível carregar o perfil do negócio. Tente novamente." };
      }
      business = biz;
    }
  }

  if (!business) {
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, icp, plan, leads_used_this_month, agents(config)")
      .eq("user_id", user.id)
      .single();
    if (bizErr) {
      console.error("searchLeadsAction: business by user", bizErr);
      return { error: "Não foi possível carregar o perfil do negócio. Tente novamente." };
    }
    business = biz;
  }

  if (!business) {
    return {
      error: "Perfil de negócio não encontrado. Complete o onboarding primeiro.",
    };
  }

  const plan = (business.plan || "free") as PlanType;
  const currentLeadsCount = business.leads_used_this_month || 0;
  const limit = PLAN_LIMITS[plan].leadsPerMonth;
  const planMaxPages = PLAN_LIMITS[plan].maxPagesPerSearch;

  if (currentLeadsCount >= limit) {
    return { error: `VOCE_ATINGIU_O_LIMITE_DE_LEADS_DO_SEU_PLANO` };
  }

  const loadMore = Boolean(options?.loadMore && campaignId);

  let places: MappedPlace[] = [];
  let pagesFetchedTotal = 0;
  let nextPageToken: string | null = null;
  let segmentQuery = query.trim();
  let regionUsed = region.trim();
  let geo: { lat: number; lng: number } | null = null;

  if (loadMore) {
    const { data: camp } = await supabase
      .from("campaigns")
      .select("discovery_state")
      .eq("id", campaignId!)
      .single();

    const state = camp?.discovery_state as CampaignDiscoveryState | null;
    if (!state?.next_page_token) {
      return {
        error:
          "Não há mais páginas disponíveis para esta busca. Tente uma nova pesquisa ou aguarde alguns minutos (token do Google expira).",
      };
    }
    if (state.pages_fetched >= state.max_pages) {
      return {
        error: `Seu plano permite até ${state.max_pages} página(s) (~${state.max_pages * 20} resultados) por sequência de busca.`,
      };
    }

    segmentQuery = state.query;
    regionUsed = state.region;

    const next = await searchPlacesNextPage(state.next_page_token);
    places = next.places;
    nextPageToken = next.nextPageToken;
    pagesFetchedTotal = state.pages_fetched + 1;

    if (pagesFetchedTotal >= state.max_pages) {
      nextPageToken = null;
    }
  } else {
    if (!segmentQuery || !regionUsed) {
      return { error: "Informe o segmento e a região." };
    }

    geo = await getGeocode(regionUsed);
    if (!geo) throw new Error("Não foi possível localizar a região informada.");

    const requested = Math.max(
      1,
      Math.min(
        options?.maxPagesInThisSearch ?? planMaxPages,
        planMaxPages
      )
    );

    const searchResult = await searchPlaces(
      segmentQuery,
      `${geo.lat},${geo.lng}`,
      5000,
      requested
    );

    places = searchResult.places;
    pagesFetchedTotal = searchResult.pagesFetched;
    nextPageToken = searchResult.nextPageToken;

    if (pagesFetchedTotal >= planMaxPages) {
      nextPageToken = null;
    }
  }

  const placesBeforeDedupe = places.length;

  if (campaignId) {
    const existing = await existingPlaceIdsForCampaign(supabase, campaignId);
    places = filterNewPlaces(places, existing);
  }

  if (currentLeadsCount + places.length > limit) {
    const remaining = limit - currentLeadsCount;
    if (remaining <= 0) {
      return { error: `VOCE_ATINGIU_O_LIMITE_DE_LEADS_DO_SEU_PLANO` };
    }
    places.splice(remaining);
  }

  if (places.length === 0) {
    if (loadMore && campaignId) {
      await supabase
        .from("campaigns")
        .update({
          discovery_state: {
            query: segmentQuery,
            region: regionUsed,
            next_page_token: nextPageToken,
            pages_fetched: pagesFetchedTotal,
            max_pages: planMaxPages,
          } as CampaignDiscoveryState,
        })
        .eq("id", campaignId);

      revalidatePath(`/campanhas/${campaignId}`);
      return {
        success: true,
        inserted: 0,
        message:
          "Nenhum lead novo nesta página (todos já estão na campanha ou não há resultados).",
      };
    }
    if (campaignId && placesBeforeDedupe > 0) {
      await supabase
        .from("campaigns")
        .update({
          discovery_state: {
            query: segmentQuery,
            region: regionUsed,
            next_page_token: nextPageToken,
            pages_fetched: pagesFetchedTotal,
            max_pages: planMaxPages,
          } as CampaignDiscoveryState,
        })
        .eq("id", campaignId);

      revalidatePath(`/campanhas/${campaignId}`);
      return {
        success: true,
        inserted: 0,
        message:
          "Os resultados do Maps já estavam todos nesta campanha. Use “Buscar mais” se aparecer, ou mude o termo/região.",
      };
    }
    return {
      error:
        "Nenhum estabelecimento encontrado. Ajuste o termo de busca ou a região.",
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("prospecting_jobs")
    .insert({
      business_id: business.id,
      region: regionUsed,
      filters: { query: segmentQuery, load_more: loadMore },
      status: "prospecting",
    })
    .select()
    .single();

  if (jobError) throw jobError;

  const enrichedPlaces = await Promise.all(
    places.map(async (place: MappedPlace, index: number) => {
      await new Promise((resolve) => setTimeout(resolve, index * 100));
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

  const leadsToInsert = enrichedPlaces.map((place: MappedPlace & { phone?: string | null; website?: string | null }) => ({
    job_id: job.id,
    business_id: business.id,
    name: place.name,
    address: place.address,
    phone: place.phone,
    website: place.website,
    lat: place.lat,
    lng: place.lng,
    segment: segmentQuery,
    status: "new",
    campaign_id: campaignId || null,
    metadata: {
      place_id: place.place_id,
      rating: place.rating,
      types: place.types,
      search_query: segmentQuery,
      search_region: regionUsed,
    },
  }));

  const { data: insertedLeads, error: leadsError } = await supabase
    .from("leads")
    .insert(leadsToInsert)
    .select("id");

  if (leadsError) return { error: leadsError.message };

  await supabase.rpc("increment_business_leads", {
    p_business_id: business.id,
    p_count: leadsToInsert.length,
  });

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
          metadata: { ...lead.metadata, reasoning: analysis.reasoning },
        })
        .eq("id", insertedLead.id);
    }
  }

  await supabase
    .from("prospecting_jobs")
    .update({ status: "completed" })
    .eq("id", job.id);

  if (campaignId) {
    const discoveryUpdate: CampaignDiscoveryState = {
      query: segmentQuery,
      region: regionUsed,
      next_page_token: nextPageToken,
      pages_fetched: pagesFetchedTotal,
      max_pages: planMaxPages,
    };
    await supabase
      .from("campaigns")
      .update({ discovery_state: discoveryUpdate })
      .eq("id", campaignId);
  }

  if (campaignId) {
    revalidatePath(`/campanhas/${campaignId}`);
  } else {
    revalidatePath("/dashboard");
  }

  return { success: true, inserted: leadsToInsert.length };
}
