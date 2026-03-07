import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const API_KEY = Deno.env.get('MEUDANFE_API_KEY')!;
const BASE_URL = 'https://api.meudanfe.com.br/v2/fd';

async function addNFe(chave: string): Promise<{ httpStatus: number }> {
  const res = await fetch(`${BASE_URL}/add/${chave}`, {
    method: 'PUT',
    headers: { 
      'Api-Key': API_KEY,
      'Accept': 'application/json',
    },
  });
  const body = await res.text();
  console.log(`[addNFe] HTTP ${res.status}:`, body.slice(0, 200));
  if (!res.ok) throw new Error(`Erro ao registrar NF-e: ${res.status} - ${body}`);
  return { httpStatus: res.status };
}

async function getNFeXml(chave: string): Promise<{ status: string; xml?: string; httpStatus: number }> {
  const res = await fetch(`${BASE_URL}/get/xml/${chave}`, {
    method: 'GET',
    headers: { 'Api-Key': API_KEY, 'Accept': 'application/json' },
  });
  const body = await res.text();
  console.log(`[getNFeXml] HTTP ${res.status}:`, body.slice(0, 300));

  // HTTP 200 = sucesso, XML está no campo "data"
  if (res.status === 200) {
    try {
      const json = JSON.parse(body);
      const xml = json.data ?? json.xml ?? null;
      if (xml) return { status: 'OK', xml, httpStatus: 200 };
    } catch (_) {}
  }

  // HTTP 404 = não encontrado na base
  if (res.status === 404) return { status: 'NOT_FOUND', httpStatus: 404 };

  // HTTP 202 = aguardando processamento
  if (res.status === 202) return { status: 'WAITING', httpStatus: 202 };

  // Tenta extrair status do corpo se houver
  try {
    const json = JSON.parse(body);
    return { status: json.status ?? 'PROCESSING', httpStatus: res.status };
  } catch (_) {
    return { status: 'ERROR', httpStatus: res.status };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chave, action } = await req.json();

    if (!chave || chave.length !== 44) {
      return new Response(
        JSON.stringify({ error: 'Chave de acesso inválida. Deve ter 44 dígitos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: "add" = registrar NF-e, "get" = buscar XML, "fetch" = add + aguardar + get
    if (action === 'add') {
      const result = await addNFe(chave);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get') {
      const result = await getNFeXml(chave);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // action === 'fetch': tenta baixar primeiro, só registra se NOT_FOUND
    let xml: string | undefined;
    let lastStatus = 'NOT_FOUND';

    // 1) Tenta buscar XML direto
    const firstTry = await getNFeXml(chave);
    lastStatus = firstTry.status;

    if (firstTry.status === 'OK' && firstTry.xml) {
      // Já disponível — retorna imediatamente (grátis)
      xml = firstTry.xml;
    } else if (firstTry.status === 'NOT_FOUND') {
      // Não está na base → registra e aguarda
      await addNFe(chave);
    }
    // Se WAITING ou SEARCHING → já registrado, só precisa aguardar

    // 2) Polling (se ainda não temos o XML)
    if (!xml) {
      for (let i = 0; i < 8; i++) {
        await sleep(3000);
        const result = await getNFeXml(chave);
        lastStatus = result.status;

        if (result.status === 'OK' && result.xml) {
          xml = result.xml;
          break;
        }
        if (result.status === 'ERROR') break;
        // NOT_FOUND, WAITING, SEARCHING → continua polling
      }
    }

    if (xml) {
      return new Response(JSON.stringify({ status: 'OK', xml, httpStatus: 200 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ status: lastStatus, xml: null, httpStatus: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
