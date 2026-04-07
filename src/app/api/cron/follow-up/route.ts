import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { openai, OPENAI_MODEL_FLAGSHIP } from "@/lib/ai/openai-client";
import { sendWhatsAppMessage } from "@/lib/whatsapp/evolution";
import { sendEmail } from "@/lib/emails/resend";
import { assertCronAuthorized } from "@/lib/cron/verify-cron-request";

export async function GET(req: Request) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const supabase = await createClient();

  // 1. Find active campaigns with follow-up enabled
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, business:businesses(*)')
    .eq('status', 'active');
    
  if (!campaigns) return NextResponse.json({ ok: true, processed: 0 });

  let totalProcessed = 0;

  for (const campaign of campaigns) {
    const config = campaign.config || { followup_enabled: false };
    if (!config.followup_enabled) continue;

    const daysBetween = config.days_between || 2;
    const maxFollowups = config.max_followups || 3;

    // 2. Find contacted leads for this campaign that haven't been touched in X days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBetween);

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'contacted')
      .lt('updated_at', cutoffDate.toISOString());

    if (!leads) continue;

    for (const lead of leads) {
      const metadata = lead.metadata || {};
      const followupsSent = metadata.followups_sent || 0;

      if (followupsSent >= maxFollowups) continue;

      // 3. Generate Follow-up Message
      const systemPrompt = `
        Você é um assistente de vendas persistente, mas extremamente educado.
        Seu objetivo é fazer um follow-up com o lead: ${lead.name}.
        Eles já foram contatados uma vez por ${campaign.channel}, mas não responderam.
        
        CONTEXTO DO NEGÓCIO:
        ${campaign.business.name} - ${campaign.business.segment}
        
        INSTRUÇÕES:
        - Seja breve (máximo 30 palavras).
        - No WhatsApp, use um tom amigável. No Email, seja profissional.
        - Tente entender se eles tiveram tempo de ver a mensagem anterior.
        - Proponha um próximo passo simples (ex: uma call de 5 min).
      `;

      try {
        const aiResponse = await openai.chat.completions.create({
          model: OPENAI_MODEL_FLAGSHIP,
          max_tokens: 300,
          temperature: 0.65,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Gere um follow-up curto e gentil." },
          ],
        });

        const followMessage = aiResponse.choices[0]?.message?.content?.trim() || "";
        const integrations = campaign.business.metadata?.integrations || {};

        // 4. Send via Channel
        if (campaign.channel === 'whatsapp' && integrations.evolution) {
          await sendWhatsAppMessage(
            integrations.evolution.url,
            integrations.evolution.key,
            integrations.evolution.instance,
            lead.phone,
            followMessage
          );
        } else if (campaign.channel === 'email' && integrations.resend?.key) {
          await sendEmail(
            integrations.resend.key,
            lead.email || lead.website, // Simplified logic for to address
            `Ainda sobre a ${campaign.business.name}`,
            `<p>${followMessage}</p>`
          );
        }

        // 5. Update Lead
        const updatedMetadata = {
          ...metadata,
          followups_sent: followupsSent + 1,
          last_followup_at: new Date().toISOString()
        };

        await supabase
          .from('leads')
          .update({ 
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        totalProcessed++;
      } catch (err) {
        console.error(`Error processing follow-up for lead ${lead.id}:`, err);
      }
    }
  }

  return NextResponse.json({ ok: true, processed: totalProcessed });
}
