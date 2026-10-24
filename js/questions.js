/* AS 10 PERGUNTAS DO QUIZ — versão PROVISÓRIA para teste. Troque pelas perguntas definitivas.
   Cada opção pode somar pontos em:
     acc        → acordes do Fragrantica (use os nomes da lista ACC em app.js; valores negativos afastam o acorde)
     occ        → ocasiões: academia, trabalho, social, encontro
     season     → inverno, primavera, verao, outono
     time       → dia, noite
     intensity  → 1 (íntima) a 4 (enorme)  — a média das respostas vira a projeção preferida
     longevity  → 1 (curta) a 4 (muito longa)
   multi: true permite marcar mais de uma opção (até "max"). */
window.QUESTIONS = [
  { id: "uso", title: "Onde você mais vai usar perfume?", sub: "Pode marcar até 2.", multi: true, max: 2, options: [
    { label: "Trabalho", sub: "escritório, reuniões", occ: { trabalho: 3 }, acc: { "Amadeirado": 1, "Aromático": 1 } },
    { label: "Academia e esporte", sub: "lugar fechado, suor", occ: { academia: 3 }, acc: { "Cítrico": 1, "Fresco": 1 } },
    { label: "Churrasco e passeio", sub: "ao ar livre, casual", occ: { social: 3 }, acc: { "Especiado fresco": 1 } },
    { label: "Encontros e noite", sub: "jantar, festa", occ: { encontro: 3 }, time: { noite: 2 }, acc: { "Âmbar": 1, "Doce": 1 } }
  ]},
  { id: "manha", title: "Qual destes cheiros te dá vontade de sair de casa de manhã?", options: [
    { label: "Limão e laranja espremidos", acc: { "Cítrico": 3, "Fresco": 1 } },
    { label: "Café passado na hora", acc: { "Doce": 2, "Âmbar": 1, "Especiado quente": 1 } },
    { label: "Chá verde e hortelã", acc: { "Verde": 2, "Aromático": 2, "Herbal": 1 } },
    { label: "Roupa limpa saindo da máquina", acc: { "Almiscarado": 2, "Atalcado": 1, "Fresco": 1 } }
  ]},
  { id: "lugar", title: "Escolha um lugar para passar o dia.", options: [
    { label: "Praia", acc: { "Aquático": 3, "Marinho": 2, "Salgado": 1 }, season: { verao: 2 } },
    { label: "Floresta depois da chuva", acc: { "Amadeirado": 3, "Musgoso": 1, "Terroso": 1, "Verde": 1 } },
    { label: "Jardim florido", acc: { "Floral": 3, "Floral branco": 1, "Rosa": 1 }, season: { primavera: 2 } },
    { label: "Mercado de especiarias", acc: { "Especiado quente": 3, "Canela": 1, "Oud": 1 }, season: { inverno: 1, outono: 1 } }
  ]},
  { id: "doce", title: "Como você se sente com perfume doce?", options: [
    { label: "Não suporto", acc: { "Doce": -3, "Baunilha": -3, "Chocolate": -2 } },
    { label: "Só um toque", acc: { "Doce": 1 } },
    { label: "Gosto bastante", acc: { "Doce": 3, "Baunilha": 2 } },
    { label: "Quanto mais doce, melhor", acc: { "Doce": 4, "Baunilha": 3, "Chocolate": 1, "Frutado": 1 } }
  ]},
  { id: "clima", title: "Em que época do ano você mais quer estar cheiroso?", options: [
    { label: "Calor do verão", season: { verao: 3, primavera: 1 }, acc: { "Cítrico": 1, "Aquático": 1 } },
    { label: "Dias amenos de primavera", season: { primavera: 3 }, acc: { "Aromático": 1, "Floral": 1 } },
    { label: "Friozinho de outono", season: { outono: 3 }, acc: { "Amadeirado": 1, "Especiado quente": 1 } },
    { label: "Inverno", season: { inverno: 3 }, acc: { "Âmbar": 1, "Baunilha": 1, "Couro": 1 } }
  ]},
  { id: "intensidade", title: "Quanto as pessoas devem sentir o seu perfume?", options: [
    { label: "Só quem chega bem perto", intensity: 1 },
    { label: "Quem está do meu lado", intensity: 2 },
    { label: "Quem está na mesma sala", intensity: 3 },
    { label: "Quero deixar rastro", intensity: 4 }
  ]},
  { id: "fixacao", title: "Quanto tempo ele precisa durar na pele?", options: [
    { label: "Umas 2 horas já está bom", longevity: 1 },
    { label: "Uma manhã ou uma tarde", longevity: 2 },
    { label: "O dia todo de trabalho", longevity: 3 },
    { label: "Do café da manhã até a noite", longevity: 4 }
  ]},
  { id: "horario", title: "Você usa perfume mais de dia ou de noite?", options: [
    { label: "Quase sempre de dia", time: { dia: 3 } },
    { label: "Mais de dia", time: { dia: 2, noite: 1 } },
    { label: "Mais de noite", time: { noite: 2, dia: 1 } },
    { label: "Quase sempre de noite", time: { noite: 3 }, acc: { "Âmbar": 1 } }
  ]},
  { id: "estilo", title: "Qual destes combina mais com o seu estilo?", options: [
    { label: "Esportivo", acc: { "Fresco": 2, "Cítrico": 1, "Aromático": 1 }, occ: { academia: 1 } },
    { label: "Social e clássico", acc: { "Amadeirado": 2, "Aromático": 1, "Lavanda": 1 }, occ: { trabalho: 1 } },
    { label: "Casual e moderno", acc: { "Especiado fresco": 2, "Frutado": 1, "Âmbar": 1 }, occ: { social: 1 } },
    { label: "Marcante e noturno", acc: { "Couro": 1, "Âmbar": 2, "Oud": 1, "Especiado quente": 1 }, occ: { encontro: 1 }, intensity: 4 }
  ]},
  { id: "bebida", title: "Para fechar: qual bebida você escolheria?", options: [
    { label: "Caipirinha de limão", acc: { "Cítrico": 2, "Verde": 1 } },
    { label: "Taça de vinho tinto", acc: { "Frutado": 2, "Amadeirado": 1, "Especiado quente": 1 } },
    { label: "Whisky ou bourbon", acc: { "Amadeirado": 2, "Defumado": 1, "Balsâmico": 1, "Couro": 1 } },
    { label: "Água de coco gelada", acc: { "Tropical": 1, "Aquático": 2, "Fresco": 1 } }
  ]}
];
