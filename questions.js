/* AS 10 PERGUNTAS DO QUIZ.
   A ideia: o gosto da pessoa no dia a dia (bebida, comida, lugares, vida social) revela o estilo de perfume dela.
   Cada opção pode somar pontos em:
     acc        → acordes do Fragrantica (nomes da lista ACC em app.js; negativo afasta o acorde)
     style      → eixo de estilo: positivo = CHAMATIVO (doce, marcante, de balada, "cafajeste"/"menina")
                                  negativo = REFINADO (sutil, marcante sem enjoar, o perfume que fica na memória)
     gender     → "masculino" | "feminino" | "unissex" (só na pergunta 1)
     occ        → ocasiões: academia, trabalho, social, encontro
     season     → inverno, primavera, verao, outono
     time       → dia, noite
     intensity  → 1 (íntima) a 4 (enorme)   — a média vira a projeção preferida
     longevity  → 1 (curta) a 4 (muito longa)
   type: "perfume" → a pessoa busca um perfume que já gosta; ele vale "weight" (0,4 = 40%) do perfil.
   multi: true permite marcar mais de uma opção (até "max"). */
window.QUESTIONS = [
  { id: "genero", title: "Que tipo de perfume você procura?", options: [
    { label: "Masculino", gender: "masculino" },
    { label: "Feminino", gender: "feminino" },
    { label: "Tanto faz", sub: "gosto de unissex também", gender: "unissex" }
  ]},
  { id: "bebida", title: "Qual é o seu tipo de bebida preferida?", options: [
    { label: "Café", acc: { "Âmbar": 1, "Especiado quente": 1, "Amadeirado": 1 }, style: -1, longevity: 3 },
    { label: "Suco", acc: { "Frutado": 2, "Cítrico": 2, "Fresco": 1 }, season: { verao: 1 }, time: { dia: 1 } },
    { label: "Refrigerante", acc: { "Doce": 2, "Frutado": 1 }, style: 1 },
    { label: "Bebida alcoólica", sub: "na próxima pergunta você conta qual" },
    { label: "Outros", sub: "chá, água, achocolatado…", acc: { "Verde": 1, "Aromático": 1, "Almiscarado": 1 }, style: -1 }
  ]},
  { id: "alcool", title: "E quando bebe álcool, o que você pede?", options: [
    { label: "Vinho", acc: { "Amadeirado": 2, "Frutado": 1, "Especiado quente": 1, "Couro": 1 }, style: -3, occ: { encontro: 2 }, time: { noite: 1 }, longevity: 4, season: { outono: 1, inverno: 1 } },
    { label: "Cerveja ou chope", acc: { "Fresco": 1, "Aromático": 2, "Cítrico": 1, "Verde": 1 }, occ: { social: 2 } },
    { label: "Caipirinha ou drinks", acc: { "Cítrico": 2, "Frutado": 1, "Verde": 1, "Doce": 1 }, style: 1, occ: { social: 2 }, season: { verao: 2 } },
    { label: "Copão: whisky ou gin com energético", acc: { "Doce": 3, "Frutado": 2, "Âmbar": 1, "Especiado quente": 1 }, style: 4, occ: { encontro: 2 }, time: { noite: 3 }, intensity: 4 },
    { label: "Whisky puro ou destilados", acc: { "Amadeirado": 2, "Defumado": 2, "Couro": 1, "Âmbar": 1 }, style: -2, time: { noite: 1 }, intensity: 3 },
    { label: "Não bebo álcool" }
  ]},
  { id: "paladar", title: "No geral, você prefere sabores…", options: [
    { label: "Muito doces", sub: "brigadeiro, doce de leite, leite condensado", acc: { "Doce": 4, "Baunilha": 3, "Chocolate": 1, "Frutado": 1 }, style: 2 },
    { label: "Mais doces", acc: { "Doce": 2, "Baunilha": 1, "Frutado": 1 }, style: 1 },
    { label: "Mais amargos", acc: { "Doce": -1, "Amadeirado": 2, "Terroso": 1, "Verde": 1 }, style: -1 },
    { label: "Muito amargos", sub: "chocolate 70%, café puro, cerveja IPA", acc: { "Doce": -3, "Baunilha": -2, "Amadeirado": 2, "Couro": 1, "Defumado": 2, "Terroso": 1 }, style: -2 }
  ]},
  { id: "restaurante", title: "Que tipo de restaurante você mais curte?", options: [
    { label: "Despojado", sub: "hambúrguer, pizza, lanchonete", acc: { "Doce": 1, "Especiado fresco": 1, "Frutado": 1 }, style: 1, occ: { social: 2 } },
    { label: "Barzinho", sub: "petisco, música, mesa na calçada", acc: { "Especiado fresco": 1, "Aromático": 1, "Âmbar": 1 }, style: 1, occ: { social: 1, encontro: 1 }, time: { noite: 1 } },
    { label: "Refinado", sub: "ambiente elegante, carta de vinhos", acc: { "Íris": 2, "Atalcado": 1, "Amadeirado": 2, "Almiscarado": 1 }, style: -3, occ: { encontro: 2, trabalho: 1 }, intensity: 2, longevity: 4 },
    { label: "Comida caseira", sub: "almoço de família, self-service", acc: { "Almiscarado": 1, "Fresco": 1, "Aromático": 1 }, occ: { trabalho: 1 }, intensity: 2 }
  ]},
  { id: "lugar", title: "Onde você mais gosta de estar?", sub: "Pode marcar até 2.", multi: true, max: 2, options: [
    { label: "Praia", acc: { "Aquático": 3, "Marinho": 2, "Cítrico": 2, "Salgado": 1 }, style: -1, season: { verao: 3 }, occ: { social: 1 }, time: { dia: 2 } },
    { label: "Sítio ou campo", acc: { "Verde": 3, "Terroso": 2, "Musgoso": 1, "Amadeirado": 2, "Herbal": 1 }, style: -1, occ: { social: 1 }, time: { dia: 2 } },
    { label: "Cidade", sub: "shopping, rolê, movimento", acc: { "Especiado fresco": 2, "Aromático": 2, "Âmbar": 1, "Lavanda": 1 }, occ: { trabalho: 2 } },
    { label: "Em casa", sub: "sofá, série, sossego", acc: { "Almiscarado": 3, "Baunilha": 1, "Atalcado": 2 }, style: -1, intensity: 1, season: { inverno: 1 } }
  ]},
  { id: "noite", title: "E quando o assunto é sair à noite?", options: [
    { label: "Balada", sub: "pista, música alta", acc: { "Doce": 2, "Âmbar": 2, "Frutado": 1, "Especiado quente": 1 }, style: 3, occ: { encontro: 3 }, time: { noite: 3 }, intensity: 4 },
    { label: "Festa", sub: "aniversário, casamento, churrasco", acc: { "Especiado fresco": 2, "Amadeirado": 1, "Aromático": 1 }, style: 1, occ: { social: 3 }, time: { noite: 2, dia: 1 }, intensity: 3 },
    { label: "Barzinho ou jantar", acc: { "Âmbar": 1, "Amadeirado": 2, "Especiado quente": 1 }, style: -1, occ: { encontro: 2, social: 1 }, time: { noite: 2 }, intensity: 2 },
    { label: "Prefiro não sair à noite", acc: { "Fresco": 1, "Almiscarado": 1 }, style: -1, occ: { trabalho: 1 }, time: { dia: 3 }, intensity: 2 }
  ]},
  { id: "estado_civil", title: "Qual é o seu estado civil?", options: [
    { label: "Solteiro(a)", style: 1, occ: { social: 1, encontro: 2 }, time: { noite: 1 } },
    { label: "Estou conhecendo alguém", style: 1, occ: { encontro: 3 }, time: { noite: 1 }, intensity: 3 },
    { label: "Casado(a) ou namorando", style: -1, occ: { encontro: 2, trabalho: 1 }, acc: { "Amadeirado": 1 } },
    { label: "Divorciado(a) ou viúvo(a)", style: -1, occ: { encontro: 2, social: 1 }, acc: { "Amadeirado": 1, "Âmbar": 1 }, longevity: 3 }
  ]},
  { id: "sair_junto", title: "Com que frequência você sai com quem está com você (ou com quem quer conquistar)?", sub: "Se não tiver ninguém agora, marque “Não se aplica”.", options: [
    { label: "Toda semana", occ: { encontro: 3 }, time: { noite: 2 } },
    { label: "Algumas vezes por mês", occ: { encontro: 2 }, time: { noite: 1 } },
    { label: "Raramente", occ: { encontro: 1 } },
    { label: "Não se aplica" }
  ]},
  { id: "favorito", type: "perfume", weight: 0.4, title: "Tem algum perfume que você já gosta?", sub: "Busque pelo nome. Ele vai valer 40% do seu perfil olfativo." }
];
