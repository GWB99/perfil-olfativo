# Perfil Olfativo

Site estático (GitHub Pages) onde o usuário se cadastra, responde 10 perguntas, recebe o perfil olfativo e recomendações de perfume para cada dia (ocasião + previsão do tempo), e compra pelo carrinho.

## Arquivos
| Arquivo | O que é |
|---|---|
| `index.html`, `css/style.css` | Páginas e visual (mesmo design do dash "Perfumes do Dia") |
| `js/config.js` | **Configuração**: Supabase, modo de pagamento, convite do modo demo |
| `js/questions.js` | **As 10 perguntas do quiz** (a 10ª é o perfume favorito, que vale 40% do perfil) |
| `js/reference.js` | Base de referência (29 perfumes, sem preço): quiz, armário e de onde o Admin coloca à venda |
| `js/backend.js` | Dados: Supabase ou modo demo (navegador) |
| `js/app.js` | Quiz → perfil, recomendações, loja, carrinho, admin |
| `supabase/schema.sql` | Tabelas, segurança (RLS), convite, pedidos |
| `supabase/functions/` | Mercado Pago (opcional, para cobrar de verdade) |

## Modo demo (já funciona)
Com `SUPABASE_URL` vazio, tudo fica salvo no navegador. Cadastre-se com **guibruno99@gmail.com** para ter acesso de admin. Outras pessoas precisam do código de convite `PERFIL-TESTE`.

## Ligar o Supabase (usuários reais)
1. Crie um projeto em supabase.com.
2. SQL Editor → rode `supabase/schema.sql`. A loja começa vazia.
3. Authentication → URL Configuration → *Site URL* = endereço do GitHub Pages.
   (Para testar mais rápido: Authentication → Providers → Email → desligue *Confirm email*.)
4. Project Settings → API → copie *Project URL* e *anon public key* para `js/config.js`.
5. Cadastre-se no site com guibruno99@gmail.com → vira admin automaticamente.

## Dropshipping
Admin → Produtos e fornecedores → "Colocar à venda": preço de venda, link e custo no fornecedor (o cliente nunca vê o fornecedor). Cada pedido mostra o link para comprar no fornecedor, o endereço de entrega, o custo e a margem. Status: aguardando pagamento → pago → em separação (comprado no fornecedor) → enviado (com rastreio) → entregue.

## Teste fechado
Aba Admin → Configurações: liga/desliga o convite, troca o código, ajusta o frete.

## Pagamento
`CHECKOUT_MODE: "simulado"` → o pedido fica "aguardando pagamento" e o admin marca como pago.
Mercado Pago: `supabase secrets set MP_ACCESS_TOKEN=TEST-...`, `supabase functions deploy mp-checkout`, `supabase functions deploy mp-webhook --no-verify-jwt` e mude para `"mercadopago"`.
