import axios from 'axios';

export async function sendWhatsAppMessage(
  baseUrl: string,
  apiKey: string,
  instance: string,
  number: string,
  text: string
) {
  try {
    // Clean number (remove non-digits, ensure it starts with country code if needed)
    const cleanNumber = number.replace(/\D/g, '');
    
    // Evolution API v2 Format
    const url = `${baseUrl}/message/sendText/${instance}`;
    
    const response = await axios.post(
      url,
      {
        number: cleanNumber,
        text: text,
        linkPreview: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Evolution API Error:', error.response?.data || error.message);
    throw new Error('Erro ao enviar mensagem via WhatsApp');
  }
}
