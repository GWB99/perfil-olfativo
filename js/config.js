/* Configuração do site.
   Deixe SUPABASE_URL vazio para rodar em MODO DEMO (tudo fica salvo só no navegador — bom para testar).
   Para usar de verdade: crie o projeto no supabase.com e cole aqui a "Project URL" e a "anon public key"
   (Project Settings → API). A anon key é pública por natureza; a segurança fica nas regras do schema.sql. */
window.APP_CONFIG = {
  SITE_NAME: "Perfil Olfativo",
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  /* Pagamento: "simulado" (pedido fica aguardando e o admin marca como pago)
     ou "mercadopago" (precisa publicar as funções em supabase/functions). */
  CHECKOUT_MODE: "simulado",

  /* Só usado no MODO DEMO (no Supabase isso fica na tabela app_settings) */
  DEMO: {
    ADMIN_EMAILS: ["guibruno99@gmail.com"],
    PRIVATE_BETA: true,
    INVITE_CODE: "PERFIL-TESTE",
    FREE_SHIPPING_OVER: 299,
    SHIPPING_FEE: 19.9
  },

  DEFAULT_CITY: { name: "São Paulo, SP", lat: -23.55, lon: -46.63 }
};
