/* AS 10 PERGUNTAS DO QUIZ.
   Cada opção pode somar pontos em:
     acc        → acordes do Fragrantica (nomes da lista ACC em app.js; negativo afasta o acorde)
     occ        → ocasiões: academia, trabalho, social, encontro
     season     → inverno, primavera, verao, outono
     time       → dia, noite
     intensity  → 1 (íntima) a 4 (enorme)   — a média vira a projeção preferida
     longevity  → 1 (curta) a 4 (muito longa)
   type: "perfume" → a pessoa busca um perfume que já gosta na base de referência.
                     Ele vale "weight" (0,4 = 40%) do perfil olfativo.
   multi: true permite marcar mais de uma opção (até "max"). */
window.QUESTIONS = [
  { id: "cafe_acucar", title: "Como você toma o seu café?", options: [
    { label: "Com açúcar", sub: "ou adoçante, bem docinho", acc: { "Doce": 3, "Baunilha": 2, "Âmbar": 1 } },
    { label: "Pouco açúcar", sub: "só para quebrar o amargo", acc: { "Doce": 1, "Âmbar": 1, "Especiado quente": 1 } },
    { label: "Sem açúcar", sub: "puro", acc: { "Doce": -2, "Amadeirado": 2, "Defumado": 1, "Especiado quente": 1 } },
    { label: "Não tomo café", acc: {} }
  ]},
  { id: "cafe_forca", title: "E a força do café?", options: [
    { label: "Forte", sub: "expresso, curto, encorpado", acc: { "Defumado": 1, "Especiado quente": 2, "Couro": 1, "Âmbar": 1 }, intensity: 4, longevity: 4 },
    { label: "Médio", sub: "coado do dia a dia", acc: { "Amadeirado": 1, "Âmbar": 1 }, intensity: 3, longevity: 3 },
    { label: "Fraco ou com bastante leite", sub: "pingado, latte, cappuccino", acc: { "Almiscarado": 2, "Baunilha": 1, "Atalcado": 1 }, intensity: 2, longevity: 2 },
    { label: "Não tomo café", acc: {} }
  ]},
  { id: "bebida", title: "Fora o café, o que você mais gosta de tomar?", options: [
    { label: "Achocolatado", sub: "Nescau, Toddy, chocolate quente", acc: { "Chocolate": 3, "Doce": 2, "Baunilha": 2 }, season: { inverno: 2 } },
    { label: "Chá", sub: "verde, mate, erva-doce", acc: { "Verde": 3, "Aromático": 2, "Herbal": 2 } },
    { label: "Suco ou refrigerante gelado", acc: { "Frutado": 2, "Cítrico": 3, "Fresco": 1 }, season: { verao: 2 } },
    { label: "Prefiro café mesmo", acc: { "Âmbar": 1, "Especiado quente": 1 } }
  ]},
  { id: "paladar", title: "No geral, você prefere sabores…", options: [
    { label: "Muito doces", sub: "brigadeiro, doce de leite, leite condensado", acc: { "Doce": 4, "Baunilha": 3, "Chocolate": 1, "Frutado": 1 } },
    { label: "Mais doces", acc: { "Doce": 2, "Baunilha": 1, "Frutado": 1 } },
    { label: "Mais amargos", acc: { "Doce": -1, "Amadeirado": 2, "Terroso": 1, "Verde": 1 } },
    { label: "Muito amargos", sub: "chocolate 70%, café puro, cerveja IPA", acc: { "Doce": -3, "Baunilha": -2, "Amadeirado": 2, "Couro": 1, "Defumado": 2, "Terroso": 1 } }
  ]},
  { id: "lugar", title: "Onde você mais gosta de estar?", sub: "Pode marcar até 2.", multi: true, max: 2, options: [
    { label: "Praia", acc: { "Aquático": 3, "Marinho": 2, "Cítrico": 2, "Salgado": 1 }, season: { verao: 3 }, occ: { social: 1 }, time: { dia: 2 } },
    { label: "Sítio ou campo", acc: { "Verde": 3, "Terroso": 2, "Musgoso": 1, "Amadeirado": 2, "Herbal": 1 }, occ: { social: 1 }, time: { dia: 2 } },
    { label: "Cidade", sub: "restaurante, shopping, rolê", acc: { "Especiado fresco": 2, "Aromático": 2, "Âmbar": 1, "Lavanda": 1 }, occ: { trabalho: 2 } },
    { label: "Em casa", sub: "sofá, série, sossego", acc: { "Almiscarado": 3, "Baunilha": 1, "Atalcado": 2, "Floral": 1 }, intensity: 1, season: { inverno: 1 } }
  ]},
  { id: "noite", title: "E quando o assunto é sair à noite?", options: [
    { label: "Balada", sub: "pista, música alta", acc: { "Doce": 2, "Âmbar": 2, "Frutado": 1, "Especiado quente": 1 }, occ: { encontro: 3 }, time: { noite: 3 }, intensity: 4 },
    { label: "Festa", sub: "aniversário, casamento, churrasco", acc: { "Especiado fresco": 2, "Amadeirado": 1, "Aromático": 1 }, occ: { social: 3 }, time: { noite: 2, dia: 1 }, intensity: 3 },
    { label: "Barzinho ou jantar", acc: { "Âmbar": 1, "Amadeirado": 2, "Especiado quente": 1 }, occ: { encontro: 2, social: 1 }, time: { noite: 2 }, intensity: 2 },
    { label: "Prefiro não sair à noite", acc: { "Fresco": 1, "Almiscarado": 1 }, occ: { trabalho: 1 }, time: { dia: 3 }, intensity: 2 }
  ]},
  { id: "parceiro", title: "Você tem um parceiro ou parceira?", options: [
    { label: "Sim", occ: { encontro: 2 }, time: { noite: 1 } },
    { label: "Não", occ: { social: 1 } },
    { label: "Estou conhecendo alguém", occ: { encontro: 3 }, time: { noite: 1 }, intensity: 3 },
    { label: "Prefiro não dizer" }
  ]},
  { id: "estado_civil", title: "Qual é o seu estado civil?", options: [
    { label: "Solteiro(a)", occ: { social: 1, encontro: 1 } },
    { label: "Namorando", occ: { encontro: 2 } },
    { label: "Casado(a) ou morando junto", occ: { encontro: 1, trabalho: 1 }, acc: { "Amadeirado": 1 } },
    { label: "Prefiro não dizer" }
  ]},
  { id: "sair_junto", title: "Com que frequência você sai com essa pessoa?", sub: "Se não tiver alguém, marque “Não se aplica”.", options: [
    { label: "Toda semana", occ: { encontro: 3 }, time: { noite: 2 } },
    { label: "Algumas vezes por mês", occ: { encontro: 2 }, time: { noite: 1 } },
    { label: "Raramente", occ: { encontro: 1 } },
    { label: "Não se aplica" }
  ]},
  { id: "favorito", type: "perfume", weight: 0.4, title: "Tem algum perfume que você já gosta?", sub: "Busque pelo nome. Ele vai valer 40% do seu perfil olfativo." }
];
