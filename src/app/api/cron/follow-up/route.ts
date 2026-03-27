import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { getSystemPrompt } from "@/lib/ai/prompts";
import Anthropic from "@anthropic-ai/sdk";
import { sendWhatsAppMessage } from "@/lib/whatsapp/evolution";
import { sendEmail } from "@/lib/emails/resend";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function GET(req: Request) {
  // Simple "Auth" check for Cron (should use a secret in prod)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
        const aiResponse = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: "user", content: "Gere um follow-up curto e gentil." }],
        });

        const followMessage = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';
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
