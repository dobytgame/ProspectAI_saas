# Guia de Configuração: Google Maps API (ProspectAI)

Para que o mapa e a busca de leads funcionem corretamente, você precisa gerar uma chave de API no Google Cloud Console e configurar as permissões necessárias.

## Passo 1: Criar um Projeto no Google Cloud
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No topo da página, clique no seletor de projetos e selecione **"Novo Projeto"**.
3. Dê um nome ao projeto (ex: `ProspectAI`) e clique em **Criar**.

## Passo 2: Ativar as APIs Necessárias
Você precisa ativar duas APIs específicas para este projeto:
1. No menu lateral, vá em **APIs e Serviços > Biblioteca**.
2. Pesquise por **"Maps JavaScript API"** e clique em **Ativar**.
3. Pesquise por **"Places API"** (ou "Places API (New)") e clique em **Ativar**.
4. Pesquise por **"Geocoding API"** e clique em **Ativar** (necessário para converter nomes de cidades em coordenadas).

## Passo 3: Criar a Chave de API
1. No menu lateral, vá em **APIs e Serviços > Credenciais**.
2. Clique em **+ Criar Credenciais** no topo e selecione **Chave de API**.
3. Uma janela aparecerá com sua nova chave. **Copie esta chave.**

## Passo 4: Configurar o arquivo .env.local
Abra o arquivo `.env.local` na raiz do seu projeto e adicione a chave que você copiou:

```env
# Chave para o Backend (Busca de lugares)
GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI

# Chave para o Frontend (Renderização do Mapa)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI
```

> [!IMPORTANT]
> A chave `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ficará visível no navegador. Em produção, é altamente recomendável clicar em **"Restringir Chave"** no Google Cloud Console e limitar o uso apenas ao seu domínio (ex: `prospectai.com.br`) e às APIs mencionadas acima.

## Passo 5: Ativar Faturamento (Billing)
O Google Maps exige uma conta de faturamento ativa, mesmo que você use a cota gratuita mensal ($200 USD gratuitos por mês). 
1. No menu lateral, vá em **Faturamento** e certifique-se de que há uma conta vinculada ao projeto.
