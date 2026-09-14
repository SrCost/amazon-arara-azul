-- 07-dados-tabela-por-tabela.sql
-- Conteudo atual do banco, na ordem correta das dependencias.
-- IMPORTANTE: rode este arquivo ANTES de 05-gatilhos.sql,
-- para que os gatilhos de auditoria nao criem registros falsos.
-- A tabela fnrh_credentials nao e exportada (contem senha de integracao).
-- A tabela rate_limits nao e exportada (cache temporario).
-- ATENCAO: execute o arquivo 08-usuarios-de-acesso.sql ANTES deste.

-- ============================================================
-- Verificacao previa: os 4 usuarios administrativos precisam existir
-- ============================================================
DO $verifica$
DECLARE
  total int;
BEGIN
  SELECT count(*) INTO total FROM auth.users WHERE id IN (
    '631d2468-c2a6-4eff-926c-d3fda28048b4',
    '7e1632aa-b7a2-4cfc-9089-64b51abf468d',
    '7d78ab2c-9f8b-47d5-b5d1-3d6b4987c29f',
    'f2250b21-3e82-416a-864a-ef814197567a'
  );
  IF total < 4 THEN
    RAISE EXCEPTION
      'Faltam usuarios de login (% de 4 encontrados). Execute o arquivo 08-usuarios-de-acesso.sql primeiro e depois rode este arquivo novamente.',
      total;
  END IF;
END
$verifica$;

-- ============================================================
-- rooms  (9 registros)
-- ============================================================
INSERT INTO public.rooms
SELECT * FROM jsonb_populate_recordset(null::public.rooms, $dados$
[
    {
        "id": "44444444-4444-4444-4444-444444444444",
        "beds": [
        ],
        "slug": null,
        "name_de": "Palm Room",
        "name_en": "Palm Room",
        "name_es": "Habitación Palmera",
        "name_fr": "Chambre Palmier",
        "name_pt": "Quarto Palmeira",
        "amenities": [
        ],
        "image_url": null,
        "is_active": false,
        "created_at": "2025-11-01T15:15:37.575228+00:00",
        "max_guests": 2,
        "updated_at": "2026-05-06T20:07:26.573264+00:00",
        "description_de": "Comfortable room with balcony",
        "description_en": "Comfortable room with balcony",
        "description_es": "Habitación cómoda con balcón",
        "description_fr": "Chambre confortable avec balcon",
        "description_pt": "Quarto confortável com varanda",
        "price_per_night": 450.00
    },
    {
        "id": "55555555-5555-5555-5555-555555555555",
        "beds": [
        ],
        "slug": "suite-test",
        "name_de": "Water Lily Cabin",
        "name_en": "Water Lily Cabin",
        "name_es": "Cabaña Victoria Regia",
        "name_fr": "Chalet Nénuphar",
        "name_pt": "Chalé Test",
        "amenities": [
        ],
        "image_url": null,
        "is_active": false,
        "created_at": "2025-11-01T15:15:37.575228+00:00",
        "max_guests": 4,
        "updated_at": "2026-05-06T20:07:26.573264+00:00",
        "description_de": "Special cabin near the lake",
        "description_en": "Special cabin near the lake",
        "description_es": "Cabaña especial cerca del lago",
        "description_fr": "Chalet spécial près du lac",
        "description_pt": "Chalé especial próximo ao lago",
        "price_per_night": 0.01
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "beds": [
            {
                "type": "Casal",
                "quantity": 1
            },
            {
                "type": "Solteiro",
                "quantity": 1
            }
        ],
        "slug": "bangalo-paneiro",
        "name_de": "Paneiro Bungalow",
        "name_en": "Paneiro Bungalow",
        "name_es": "Bangaló Paneiro",
        "name_fr": "Bungalow Paneiro",
        "name_pt": "Bangalô Paneiro",
        "amenities": [
            "wifi",
            "ar condicionado",
            "varanda privativa",
            "trilhas guiadas",
            "passeios de canoa",
            "observação de aves",
            "visita a comunidades"
        ],
        "image_url": null,
        "is_active": true,
        "created_at": "2025-11-01T15:15:37.575228+00:00",
        "max_guests": 3,
        "updated_at": "2026-06-15T14:04:46.754989+00:00",
        "description_de": "The paneiro, a traditional basket used to store and transport forest fruits, inspires this suite that represents welcome and sharing. Located near the internal garden, the Paneiro Suite is a shelter of serenity: soft natural light, private veranda, and hammock invite a peaceful pause. Inside, the rustic wood decoration and woven elements celebrate local knowledge. The artisanal bathroom features details in woven straw and natural clay, referring to the traditions of the riverside community. An ideal choice for those seeking balance between culture, nature, and comfort.",
        "description_en": "The paneiro, a traditional basket used to store and transport forest fruits, inspires this suite that represents welcome and sharing. Located near the internal garden, the Paneiro Suite is a shelter of serenity: soft natural light, private veranda, and hammock invite a peaceful pause. Inside, the rustic wood decoration and woven elements celebrate local knowledge. The artisanal bathroom features details in woven straw and natural clay, referring to the traditions of the riverside community. An ideal choice for those seeking balance between culture, nature, and comfort.",
        "description_es": "El paneiro, cesta tradicional utilizada para almacenar y transportar los frutos del bosque, inspira esta suite que representa acogida y compartir. Ubicada cerca del jardín interno, la Suite Paneiro es un refugio de serenidad: luz natural suave, terraza privada y hamaca invitan a una pausa tranquila. En el interior, la decoración de madera rústica y elementos trenzados celebran el conocimiento local. El baño artesanal presenta detalles en paja trenzada y arcilla natural, refiriéndose a las tradiciones de la comunidad ribereña. Una elección ideal para quienes buscan equilibrio entre cultura, naturaleza y comodidad.",
        "description_fr": "Le paneiro, panier traditionnel utilisé pour stocker et transporter les fruits de la forêt, inspire cette suite qui représente l'accueil et le partage. Située près du jardin intérieur, la Suite Paneiro est un abri de sérénité : lumière naturelle douce, véranda privée et hamac invitent à une pause paisible. À l'intérieur, la décoration en bois rustique et les éléments tressés célèbrent le savoir local. La salle de bain artisanale présente des détails en paille tressée et argile naturelle, faisant référence aux traditions de la communauté riveraine. Un choix idéal pour ceux qui recherchent l'équilibre entre culture, nature et confort.",
        "description_pt": "O paneiro, cesto tradicional usado para armazenar e transportar os frutos da floresta, inspira esta suíte que representa acolhimento e partilha. Situada próxima ao jardim interno, a Suíte Paneiro é um abrigo de serenidade: luz natural suave, varanda privativa e rede convidam a uma pausa tranquila. No interior, a decoração em madeira rústica e elementos trançados celebram o saber local. O banheiro artesanal possui detalhes em palha trançada e argila natural, remetendo às tradições da comunidade ribeirinha. Uma escolha ideal para quem busca equilíbrio entre cultura, natureza e conforto.",
        "price_per_night": 1499.99
    },
    {
        "id": "7b6060b0-9352-471a-a185-5d2d8c4a140e",
        "beds": [
        ],
        "slug": "bangalo-teste",
        "name_de": "Bangalô teste",
        "name_en": "Bangalô teste",
        "name_es": "Bangalô teste",
        "name_fr": "Bangalô teste",
        "name_pt": "Bangalô teste",
        "amenities": [
        ],
        "image_url": null,
        "is_active": false,
        "created_at": "2025-12-14T16:40:11.435035+00:00",
        "max_guests": 3,
        "updated_at": "2026-05-06T20:07:26.573264+00:00",
        "description_de": "",
        "description_en": "",
        "description_es": "",
        "description_fr": "",
        "description_pt": "",
        "price_per_night": 0.01
    },
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "beds": [
            {
                "type": "Casal",
                "quantity": 1
            },
            {
                "type": "Solteiro",
                "quantity": 1
            },
            {
                "type": "Beliche",
                "quantity": 1
            }
        ],
        "slug": "bangalo-peneira",
        "name_de": "Peneira Bungalow",
        "name_en": "Peneira Bungalow",
        "name_es": "Bangaló Peneira",
        "name_fr": "Bungalow Peneira",
        "name_pt": "Bangalô Peneira",
        "amenities": [
            "wifi",
            "ar condicionado",
            "varanda privativa",
            "trilhas guiadas",
            "passeios de canoa",
            "observação de aves",
            "visita a comunidades"
        ],
        "image_url": null,
        "is_active": true,
        "created_at": "2025-11-01T15:15:37.575228+00:00",
        "max_guests": 5,
        "updated_at": "2026-06-15T14:03:37.886439+00:00",
        "description_de": "Inspired by the traditional sieve used in flour production, this suite symbolizes the act of separating the essential — an invitation to genuine rest. Built with wood and natural straw, the Peneira Suite offers a veranda open to the forest, where the sound of birds accompanies the swinging of the hammock. Inside, the cozy environment combines a double bed, a single bed, and handcrafted details that translate the simplicity of Amazonian life. The themed bathroom features the charm of a bamboo shower, providing a bathing sensation in the middle of the forest. A perfect refuge for those seeking comfort with an Amazonian soul.",
        "description_en": "Inspired by the traditional sieve used in flour production, this suite symbolizes the act of separating the essential — an invitation to genuine rest. Built with wood and natural straw, the Peneira Suite offers a veranda open to the forest, where the sound of birds accompanies the swinging of the hammock. Inside, the cozy environment combines a double bed, a single bed, and handcrafted details that translate the simplicity of Amazonian life. The themed bathroom features the charm of a bamboo shower, providing a bathing sensation in the middle of the forest. A perfect refuge for those seeking comfort with an Amazonian soul.",
        "description_es": "Inspirada en el tamiz tradicional utilizado en la producción de harina, esta suite simboliza el acto de separar lo esencial, una invitación al descanso genuino. Construida con madera y paja natural, la Suite Peneira ofrece una terraza abierta al bosque, donde el sonido de las aves acompaña el balanceo de la hamaca. En el interior, el ambiente acogedor combina una cama doble, una cama individual y detalles artesanales que traducen la simplicidad de la vida amazónica. El baño temático presenta el encanto de una ducha de bambú, brindando una sensación de baño en medio del bosque. Un refugio perfecto para quienes buscan comodidad con alma amazónica.",
        "description_fr": "Inspirée du tamis traditionnel utilisé dans la production de farine, cette suite symbolise l'acte de séparer l'essentiel — une invitation au repos authentique. Construite en bois et paille naturelle, la Suite Peneira offre une véranda ouverte sur la forêt, où le son des oiseaux accompagne le balancement du hamac. À l'intérieur, l'ambiance chaleureuse combine un lit double, un lit simple et des détails artisanaux qui traduisent la simplicité de la vie amazonienne. La salle de bain thématique présente le charme d'une douche en bambou, procurant une sensation de bain au milieu de la forêt. Un refuge parfait pour ceux qui recherchent le confort avec une âme amazonienne.",
        "description_pt": "Inspirada na peneira tradicional usada na produção da farinha, esta suíte simboliza o ato de separar o essencial — um convite ao descanso genuíno. Construída com madeira e palha natural, a Suíte Peneira oferece uma varanda aberta à floresta, onde o som das aves acompanha o balanço da rede. No interior, o ambiente acolhedor combina cama de casal, cama de solteiro e detalhes artesanais que traduzem a simplicidade da vida amazônica. O banheiro temático traz o charme do chuveiro de bambu, proporcionando uma sensação de banho em meio à mata. Um refúgio perfeito para quem busca conforto com alma amazônica.",
        "price_per_night": 1499.99
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "beds": [
            {
                "type": "Casal",
                "quantity": 1
            },
            {
                "type": "Solteiro",
                "quantity": 1
            },
            {
                "type": "Beliche",
                "quantity": 1
            }
        ],
        "slug": "bangalo-tipiti",
        "name_de": "Tipiti Bungalow",
        "name_en": "Tipiti Bungalow",
        "name_es": "Bangaló Tipiti",
        "name_fr": "Bungalow Tipiti",
        "name_pt": "Bangalô Tipiti",
        "amenities": [
            "wifi",
            "ar condicionado",
            "varanda privativa",
            "trilhas guiadas",
            "passeios de canoa",
            "observação de aves",
            "visita a comunidades"
        ],
        "image_url": null,
        "is_active": true,
        "created_at": "2025-11-01T15:15:37.575228+00:00",
        "max_guests": 5,
        "updated_at": "2026-06-15T14:05:27.182466+00:00",
        "description_de": "Named in honor of the tipiti — an instrument used to extract the essence of cassava — this suite represents the purity and strength of the forest. Located in the west wing, the Tipiti Suite opens to lush greenery with an inviting veranda and a perfect hammock to contemplate the surroundings. Its interior combines polished wood and handcrafted pieces that refer to the region's stories. In the bathroom, the highlight is the artistic design inspired by jungle animals, handmade by local artisans. It's the right choice for those who want to live an authentic, light experience deeply connected to the Amazon.",
        "description_en": "Named in honor of the tipiti — an instrument used to extract the essence of cassava — this suite represents the purity and strength of the forest. Located in the west wing, the Tipiti Suite opens to lush greenery with an inviting veranda and a perfect hammock to contemplate the surroundings. Its interior combines polished wood and handcrafted pieces that refer to the region's stories. In the bathroom, the highlight is the artistic design inspired by jungle animals, handmade by local artisans. It's the right choice for those who want to live an authentic, light experience deeply connected to the Amazon.",
        "description_es": "Bautizada en honor al tipiti, instrumento utilizado para extraer la esencia de la yuca, esta suite representa la pureza y la fuerza del bosque. Ubicada en el ala oeste, la Suite Tipiti se abre al verde exuberante con una terraza acogedora y una hamaca perfecta para contemplar el entorno. Su interior combina madera pulida y piezas artesanales que remiten a las historias de la región. En el baño, el destaque es el diseño artístico inspirado en animales de la selva, hecho a mano por artesanos locales. Es la elección correcta para quienes desean vivir una experiencia auténtica, ligera y profundamente conectada con la Amazonía.",
        "description_fr": "Baptisée en l'honneur du tipiti — instrument utilisé pour extraire l'essence du manioc — cette suite représente la pureté et la force de la forêt. Située dans l'aile ouest, la Suite Tipiti s'ouvre sur une verdure luxuriante avec une véranda accueillante et un hamac parfait pour contempler les environs. Son intérieur combine bois poli et pièces artisanales qui font référence aux histoires de la région. Dans la salle de bain, le point culminant est le design artistique inspiré des animaux de la jungle, fait à la main par des artisans locaux. C'est le bon choix pour ceux qui veulent vivre une expérience authentique, légère et profondément connectée à l'Amazonie.",
        "description_pt": "Batizada em homenagem ao tipiti — instrumento usado para extrair a essência da mandioca — esta suíte representa a pureza e a força da floresta. Localizada na ala oeste, a Suíte Tipiti se abre ao verde exuberante com uma varanda convidativa e uma rede perfeita para contemplar o entorno. Seu interior combina madeira polida e peças artesanais que remetem às histórias da região. No banheiro, o destaque é o design artístico inspirado em animais da selva, feito à mão por artesãos locais. É a escolha certa para quem deseja viver uma experiência autêntica, leve e profundamente conectada à Amazônia.",
        "price_per_night": 1499.99
    },
    {
        "id": "ee4b4b6f-7bf0-46e7-98f9-cc8cd716363a",
        "beds": [
        ],
        "slug": "bangalo-testee",
        "name_de": "bangalo flavio teste",
        "name_en": "bangalo flavio teste",
        "name_es": "bangalo flavio teste",
        "name_fr": "bangalo flavio teste",
        "name_pt": "bangalo flavio teste",
        "amenities": [
        ],
        "image_url": null,
        "is_active": false,
        "created_at": "2026-01-05T19:45:06.206981+00:00",
        "max_guests": 3,
        "updated_at": "2026-08-13T15:16:26.285057+00:00",
        "description_de": "",
        "description_en": "",
        "description_es": "",
        "description_fr": "",
        "description_pt": "",
        "price_per_night": 0.01
    },
    {
        "id": "f003cc14-eb49-464f-a2e2-14c970ae2dad",
        "beds": [
            {
                "type": "Casal",
                "quantity": 1
            },
            {
                "type": "Beliche",
                "quantity": 1
            }
        ],
        "slug": "bangalo-tupe",
        "name_de": "Bangalô Abano",
        "name_en": "Bangalô Abano",
        "name_es": "Bangalô Abano",
        "name_fr": "Bangalô Abano",
        "name_pt": "Bangalô Tupé",
        "amenities": [
            "wifi",
            "Varanda privativa",
            "Passeios de canoa",
            "Visita à comunidades",
            "Ar condicionado",
            "Trilhas guiadas",
            "Observação de aves"
        ],
        "image_url": null,
        "is_active": true,
        "created_at": "2026-06-15T15:24:00.73496+00:00",
        "max_guests": 4,
        "updated_at": "2026-06-15T19:50:22.356916+00:00",
        "description_de": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia.\nSua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "description_en": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia.\nSua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "description_es": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia.\nSua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "description_fr": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia.\nSua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "description_pt": "Inspirado no Tupé, tradicional tapete indígena confeccionado com fibras naturais, este bangalô simboliza acolhimento, conforto e a riqueza dos saberes ancestrais da Amazônia. Cercado pela exuberância da floresta, oferece uma experiência autêntica em perfeita harmonia com a natureza.\nSua varanda convida à contemplação e ao descanso, enquanto o interior combina madeira, elementos rústicos e detalhes artesanais que refletem a cultura amazônica. Ideal para quem busca tranquilidade, privacidade e uma conexão genuína com a essência da floresta.",
        "price_per_night": 1499.00
    },
    {
        "id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "beds": [
            {
                "type": "Casal",
                "quantity": 1
            },
            {
                "type": "Solteiro",
                "quantity": 1
            }
        ],
        "slug": "bangalo-abano",
        "name_de": "Bnagalô Abano",
        "name_en": "Bnagalô Abano",
        "name_es": "Bnagalô Abano",
        "name_fr": "Bnagalô Abano",
        "name_pt": "Bangalô Abano",
        "amenities": [
            "wifi",
            "Varanda privativa",
            "Passeios de canoa",
            "Visita à comunidades",
            "Ar condicionado",
            "Trilhas guiadas",
            "Observação de aves"
        ],
        "image_url": null,
        "is_active": true,
        "created_at": "2026-06-18T14:53:13.398151+00:00",
        "max_guests": 3,
        "updated_at": "2026-06-18T19:09:22.535048+00:00",
        "description_de": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia. Sua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "description_en": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia. Sua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "description_es": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia. Sua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "description_fr": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia. Sua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "description_pt": "Inspirado no tradicional abano, objeto utilizado pelas famílias amazônicas para refrescar os ambientes e alimentar o fogo que aquece os encontros e as histórias, o Bangalô Abano simboliza acolhimento, simplicidade e conexão com as raízes da floresta. Cercado pela natureza exuberante, oferece uma experiência de conforto e tranquilidade em perfeita harmonia com a Amazônia. Sua varanda é um convite para contemplar a paisagem e desacelerar ao ritmo da floresta. No interior, madeira, elementos rústicos e detalhes artesanais criam um ambiente acolhedor e autêntico. Ideal para quem busca descanso, privacidade e uma conexão genuína com a natureza amazônica.",
        "price_per_night": 1499.00
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- packages  (4 registros)
-- ============================================================
INSERT INTO public.packages
SELECT * FROM jsonb_populate_recordset(null::public.packages, $dados$
[
    {
        "id": "3dcb216e-957f-4b88-80ca-ea37483dbd0b",
        "name": "Pacote Gavião Panema",
        "slug": "gaviao-panema",
        "price": 0.00,
        "people": 2,
        "duration": "Personalizado",
        "is_active": true,
        "created_at": "2025-12-09T12:39:04.651533+00:00",
        "inclusions": [
            "Consultoria personalizada",
            "Itinerário sob medida",
            "Suporte dedicado",
            "Experiências exclusivas"
        ],
        "updated_at": "2025-12-09T12:39:04.651533+00:00",
        "description": "Pacote exclusivo e personalizável criado junto a um consultor especializado. Ideal para quem deseja uma experiência sob medida na Amazônia.",
        "experiences": [
            "Roteiro personalizado",
            "Atividades à sua escolha",
            "Experiências únicas"
        ]
    },
    {
        "id": "73f0f79c-669f-4dfa-9af5-9eccff3d1953",
        "name": "Pacote Araraúna",
        "slug": "ararauna",
        "price": 25335.00,
        "people": 2,
        "duration": "7 dias e 6 noites",
        "is_active": true,
        "created_at": "2025-11-13T00:16:30.169001+00:00",
        "inclusions": [
            "Alimentação: pensão completa",
            "Transporte terrestre e fluvial (ida e volta)",
            "Recepção amazônica de boas-vindas",
            "Welcome drink cortesia no Sunset Jungle Bar"
        ],
        "updated_at": "2025-12-11T17:15:44.366201+00:00",
        "description": "O pacote mais completo e imersivo. Ideal para quem deseja mergulhar profundamente na natureza e cultura amazônica com conforto e exclusividade.",
        "experiences": [
            "Interação com botos",
            "Visita à aldeia local",
            "Caminhada na selva",
            "Focagem noturna de jacarés",
            "Pescaria de piranhas",
            "Nascer do sol",
            "Pôr do sol no Jungle Bar",
            "Macacos do Ariaú",
            "Doce amazônico artesanal",
            "Casa de farinha tradicional",
            "Passeio na cachoeira (em época de seca)",
            "Passeio na praia de água doce",
            "Samaúma gigante"
        ]
    },
    {
        "id": "65b18385-6138-4371-9a2c-901af2f6e3a0",
        "name": "Pacote Uirapuru",
        "slug": "uirapuru",
        "price": 16410.00,
        "people": 2,
        "duration": "5 dias e 4 noites",
        "is_active": true,
        "created_at": "2025-11-13T00:16:30.169001+00:00",
        "inclusions": [
            "Alimentação: pensão completa",
            "Transporte terrestre e fluvial (ida e volta)",
            "Recepção amazônica de boas-vindas",
            "Welcome drink cortesia no Sunset Jungle Bar",
            "Jantar amazônico sob o Chapéu de Sol"
        ],
        "updated_at": "2025-12-11T17:15:44.366201+00:00",
        "description": "(Exclusivo para casal)\nUm convite à serenidade e à cultura amazônica, com experiências únicas e gastronomia local inesquecível.",
        "experiences": [
            "Interação com botos",
            "Visita à aldeia local",
            "Caminhada na selva",
            "Focagem noturna de jacarés",
            "Pescaria de piranhas",
            "Pôr do sol no Jungle Bar",
            "Nascer do sol",
            "Doce amazônico artesanal",
            "Casa de farinha tradicional"
        ]
    },
    {
        "id": "307d9d78-df51-4a3c-b837-1ae5774a6287",
        "name": "Pacote Japiim",
        "slug": "japiim",
        "price": 17465.00,
        "people": 2,
        "duration": "5 dias e 4 noites",
        "is_active": true,
        "created_at": "2025-11-13T00:16:30.169001+00:00",
        "inclusions": [
            "Alimentação: pensão completa",
            "Transporte terrestre e fluvial (ida e volta)",
            "Recepção amazônica de boas-vindas",
            "Welcome drink cortesia no Sunset Jungle Bar"
        ],
        "updated_at": "2025-12-11T17:15:44.366201+00:00",
        "description": "Conforto, autenticidade e sabor regional. Viva a essência da floresta com acolhimento e comida caseira amazônica.",
        "experiences": [
            "Interação com botos",
            "Visita à aldeia local",
            "Caminhada na selva",
            "Focagem noturna de jacarés",
            "Nascer do sol",
            "Pôr do sol",
            "Macacos do Ariaú",
            "Passeio na praia de água doce",
            "Samaúma gigante"
        ]
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- experiences  (15 registros)
-- ============================================================
INSERT INTO public.experiences
SELECT * FROM jsonb_populate_recordset(null::public.experiences, $dados$
[
    {
        "id": "31d3312e-a234-4d4c-8f58-7446cf0ac5bb",
        "slug": "casa-de-farinha",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787341019765_casa-de-farinha-cheiro-da-floresta-02.png"
        ],
        "name_de": "Maniokmehl-Haus",
        "name_en": "Cassava Flour House",
        "name_es": "Casa de Harina",
        "name_fr": "Maison de la Farine",
        "name_pt": "Casa de Farinha",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-21T19:42:51.879138+00:00",
        "category_de": "Kultur & Flussgemeinden",
        "category_en": "Culture & Riverside Communities",
        "category_es": "Cultura y Comunidades Ribereñas",
        "category_fr": "Culture & Communautés Riveraines",
        "category_pt": "Cultura & Comunidades Ribeirinhas",
        "display_order": 2,
        "what_to_wear_de": "Leichte Kleidung und geschlossene Schuhe oder feste Sandalen",
        "what_to_wear_en": "Light clothing and closed shoes or sturdy sandals",
        "what_to_wear_es": "Ropa ligera y calzado cerrado o sandalia firme",
        "what_to_wear_fr": "Vêtements légers et chaussures fermées ou sandales solides",
        "what_to_wear_pt": "Roupas leves e calçado fechado ou sandália firme",
        "what_to_bring_de": "Insektenschutzmittel, Sonnenschutz, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, sunscreen, water and camera",
        "what_to_bring_es": "Repelente, protector solar, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, crème solaire, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, protetor solar, água e câmera",
        "duration_label_de": "Etwa 1,5 Stunden",
        "duration_label_en": "Approximately 1 hour 30 minutes",
        "duration_label_es": "Aproximadamente 1 hora y 30 minutos",
        "duration_label_fr": "Environ 1 heure 30",
        "duration_label_pt": "Aproximadamente 1 hora e 30 minutos",
        "full_description_de": "Besuch eines handwerklichen Mehlhauses und des traditionellen Herstellungsprozesses aus Maniok. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 1,5 Stunden.",
        "full_description_en": "A visit to an artisanal flour house and the traditional process of making cassava flour. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 1 hour 30 minutes.",
        "full_description_es": "Visita a la casa de harina artesanal y al proceso tradicional de producción a partir de la yuca. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 1 hora y 30 minutos.",
        "full_description_fr": "Visite d'une maison de farine artisanale et du processus traditionnel de production à partir du manioc. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 1 heure 30.",
        "full_description_pt": "Visita à casa de farinha artesanal e ao processo tradicional de produção a partir da mandioca. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 1 hora e 30 minutos.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Besuch eines handwerklichen Mehlhauses und des traditionellen Herstellungsprozesses aus Maniok.",
        "short_description_en": "A visit to an artisanal flour house and the traditional process of making cassava flour.",
        "short_description_es": "Visita a la casa de harina artesanal y al proceso tradicional de producción a partir de la yuca.",
        "short_description_fr": "Visite d'une maison de farine artisanale et du processus traditionnel de production à partir du manioc.",
        "short_description_pt": "Visita à casa de farinha artesanal e ao processo tradicional de produção a partir da mandioca.",
        "base_price_per_person": 255
    },
    {
        "id": "04b6505e-11df-4b6e-9c9b-5b0d6a2e1587",
        "slug": "cheiro-da-floresta",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787836229162_Captura_de_tela_2026-08-27_101016.png"
        ],
        "name_de": "Duft des Waldes",
        "name_en": "Scent of the Forest",
        "name_es": "Aroma de la Selva",
        "name_fr": "Parfum de la Forêt",
        "name_pt": "Cheiro da Floresta",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T13:10:38.360792+00:00",
        "category_de": "Kultur & Flussgemeinden",
        "category_en": "Culture & Riverside Communities",
        "category_es": "Cultura y Comunidades Ribereñas",
        "category_fr": "Culture & Communautés Riveraines",
        "category_pt": "Cultura & Comunidades Ribeirinhas",
        "display_order": 3,
        "what_to_wear_de": "Leichte Kleidung und geschlossene Schuhe oder feste Sandalen",
        "what_to_wear_en": "Light clothing and closed shoes or sturdy sandals",
        "what_to_wear_es": "Ropa ligera y calzado cerrado o sandalia firme",
        "what_to_wear_fr": "Vêtements légers et chaussures fermées ou sandales solides",
        "what_to_wear_pt": "Roupas leves e calçado fechado ou sandália firme",
        "what_to_bring_de": "Insektenschutzmittel, Sonnenschutz, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, sunscreen, water and camera",
        "what_to_bring_es": "Repelente, protector solar, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, crème solaire, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, protetor solar, água e câmera",
        "duration_label_de": "Etwa 1,5 Stunden",
        "duration_label_en": "Approximately 1 hour 30 minutes",
        "duration_label_es": "Aproximadamente 1 hora y 30 minutos",
        "duration_label_fr": "Environ 1 heure 30",
        "duration_label_pt": "Aproximadamente 1 hora e 30 minutos",
        "full_description_de": "Sinnes-Workshop mit Naturkosmetik und Parfums aus Pflanzen und Essenzen des Waldes. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 1,5 Stunden.",
        "full_description_en": "A sensory workshop of natural cosmetics and perfumes made from forest plants and essences. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 1 hour 30 minutes.",
        "full_description_es": "Taller sensorial de cosméticos y perfumes naturales hechos con plantas y esencias de la selva. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 1 hora y 30 minutos.",
        "full_description_fr": "Atelier sensoriel de cosmétiques et parfums naturels à base de plantes et d'essences de la forêt. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 1 heure 30.",
        "full_description_pt": "Oficina sensorial de cosméticos e perfumes naturais feitos com plantas e essências da floresta. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 1 hora e 30 minutos.",
        "operational_notes_de": "Erlebnis zusammen mit dem Maniokmehl-Haus in derselben Gemeinde.",
        "operational_notes_en": "Experience offered together with the Cassava Flour House, in the same community.",
        "operational_notes_es": "Vivencia realizada junto a la Casa de Harina, en la misma comunidad.",
        "operational_notes_fr": "Expérience proposée avec la Maison de la Farine, dans la même communauté.",
        "operational_notes_pt": "Vivência realizada junto à Casa de Farinha, na mesma comunidade.",
        "short_description_de": "Sinnes-Workshop mit Naturkosmetik und Parfums aus Pflanzen und Essenzen des Waldes.",
        "short_description_en": "A sensory workshop of natural cosmetics and perfumes made from forest plants and essences.",
        "short_description_es": "Taller sensorial de cosméticos y perfumes naturales hechos con plantas y esencias de la selva.",
        "short_description_fr": "Atelier sensoriel de cosmétiques et parfums naturels à base de plantes et d'essences de la forêt.",
        "short_description_pt": "Oficina sensorial de cosméticos e perfumes naturais feitos com plantas e essências da floresta.",
        "base_price_per_person": 250
    },
    {
        "id": "e846cc69-35bb-4a69-8d57-7ac321e52d36",
        "slug": "aldeia-indigena-kubewa",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787836414617_Captura_de_tela_2026-08-27_101320.png"
        ],
        "name_de": "Besuch des indigenen Dorfes Kubewa",
        "name_en": "Visit to the Kubewa Indigenous Village",
        "name_es": "Visita a la Aldea Indígena Kubewa",
        "name_fr": "Visite du Village Indigène Kubewa",
        "name_pt": "Visita à Aldeia Indígena Kubewa",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T13:13:43.99783+00:00",
        "category_de": "Kultur & Flussgemeinden",
        "category_en": "Culture & Riverside Communities",
        "category_es": "Cultura y Comunidades Ribereñas",
        "category_fr": "Culture & Communautés Riveraines",
        "category_pt": "Cultura & Comunidades Ribeirinhas",
        "display_order": 4,
        "what_to_wear_de": "Badekleidung",
        "what_to_wear_en": "Swimwear",
        "what_to_wear_es": "Traje de baño",
        "what_to_wear_fr": "Maillot de bain",
        "what_to_wear_pt": "Roupas de banho",
        "what_to_bring_de": "Handtuch, biologisch abbaubarer Sonnenschutz, trockene Wechselkleidung, Wasser, wasserfeste Kamera und Bargeld für Handwerkskunst",
        "what_to_bring_en": "Towel, biodegradable sunscreen, a change of dry clothes, water, waterproof camera and cash for handicrafts",
        "what_to_bring_es": "Toalla, protector solar biodegradable, cambio de ropa seca, agua, cámara resistente al agua y dinero para artesanía",
        "what_to_bring_fr": "Serviette, crème solaire biodégradable, des vêtements de rechange secs, de l'eau, appareil photo étanche et de l'argent pour l'artisanat",
        "what_to_bring_pt": "Toalha, protetor solar biodegradável, troca de roupa seca, água, câmera à prova d'água e dinheiro para artesanato",
        "duration_label_de": "Etwa 2 Stunden",
        "duration_label_en": "Approximately 2 hours",
        "duration_label_es": "Aproximadamente 2 horas",
        "duration_label_fr": "Environ 2 heures",
        "duration_label_pt": "Aproximadamente 2 horas",
        "full_description_de": "Handwerk, Tänze und traditionelle Gesänge des Kubewa-Volkes. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 2 Stunden.",
        "full_description_en": "Handicrafts, dances and traditional songs of the Kubewa people. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 2 hours.",
        "full_description_es": "Artesanía, danzas y cantos tradicionales del pueblo Kubewa. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 2 horas.",
        "full_description_fr": "Artisanat, danses et chants traditionnels du peuple Kubewa. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 2 heures.",
        "full_description_pt": "Artesanato, danças e cantos tradicionais do povo Kubewa. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 2 horas.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Handwerk, Tänze und traditionelle Gesänge des Kubewa-Volkes.",
        "short_description_en": "Handicrafts, dances and traditional songs of the Kubewa people.",
        "short_description_es": "Artesanía, danzas y cantos tradicionales del pueblo Kubewa.",
        "short_description_fr": "Artisanat, danses et chants traditionnels du peuple Kubewa.",
        "short_description_pt": "Artesanato, danças e cantos tradicionais do povo Kubewa.",
        "base_price_per_person": 270
    },
    {
        "id": "2cb98cd2-1281-4dfe-ad0d-8dc082603dca",
        "slug": "praia-de-agua-doce",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787836531498_Captura_de_tela_2026-08-27_101516.png"
        ],
        "name_de": "Süßwasserstrand am Rio Negro",
        "name_en": "Freshwater Beach on the Rio Negro",
        "name_es": "Playa de Agua Dulce del Río Negro",
        "name_fr": "Plage d'Eau Douce du Rio Negro",
        "name_pt": "Praia de Água Doce do Rio Negro",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T13:15:38.138392+00:00",
        "category_de": "Fluss & Tierwelt",
        "category_en": "River & Wildlife",
        "category_es": "Río y Vida Salvaje",
        "category_fr": "Fleuve & Faune",
        "category_pt": "Rio & Vida Selvagem",
        "display_order": 5,
        "what_to_wear_de": "Leichte, helle Kleidung und bequeme Turnschuhe oder Sandalen",
        "what_to_wear_en": "Light, light-colored clothing and comfortable sneakers or sandals",
        "what_to_wear_es": "Ropa ligera y clara y tenis o sandalias cómodas",
        "what_to_wear_fr": "Vêtements légers et clairs et baskets ou sandales confortables",
        "what_to_wear_pt": "Roupas leves e claras e tênis ou sandália confortável",
        "what_to_bring_de": "Handtuch, biologisch abbaubarer Sonnenschutz, Insektenschutzmittel, Wasser, einen kleinen Snack und wasserfeste Kamera",
        "what_to_bring_en": "Towel, biodegradable sunscreen, insect repellent, water, a light snack and waterproof camera",
        "what_to_bring_es": "Toalla, protector solar biodegradable, repelente, agua, merienda ligera y cámara resistente al agua",
        "what_to_bring_fr": "Serviette, crème solaire biodégradable, anti-moustiques, de l'eau, un en-cas léger et appareil photo étanche",
        "what_to_bring_pt": "Toalha, protetor solar biodegradável, repelente, água, lanche leve e câmera à prova d'água",
        "duration_label_de": "Etwa 4 Stunden",
        "duration_label_en": "Approximately 4 hours",
        "duration_label_es": "Aproximadamente 4 horas",
        "duration_label_fr": "Environ 4 heures",
        "duration_label_pt": "Aproximadamente 4 horas",
        "full_description_de": "Helle Sandstrände und das ruhige dunkle Wasser des Rio Negro, ideal zum Entspannen und Schwimmen. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 4 Stunden.",
        "full_description_en": "Light-sand beaches and the calm dark waters of the Rio Negro, perfect to relax and swim. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 4 hours.",
        "full_description_es": "Playas de arena clara y aguas oscuras y tranquilas del Río Negro, ideales para relajarse y nadar. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 4 horas.",
        "full_description_fr": "Plages de sable clair et eaux sombres et calmes du Rio Negro, idéales pour se détendre et nager. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 4 heures.",
        "full_description_pt": "Praias de areia clara e águas escuras e tranquilas do Rio Negro, ideais para relaxar e nadar. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 4 horas.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Helle Sandstrände und das ruhige dunkle Wasser des Rio Negro, ideal zum Entspannen und Schwimmen.",
        "short_description_en": "Light-sand beaches and the calm dark waters of the Rio Negro, perfect to relax and swim.",
        "short_description_es": "Playas de arena clara y aguas oscuras y tranquilas del Río Negro, ideales para relajarse y nadar.",
        "short_description_fr": "Plages de sable clair et eaux sombres et calmes du Rio Negro, idéales pour se détendre et nager.",
        "short_description_pt": "Praias de areia clara e águas escuras e tranquilas do Rio Negro, ideais para relaxar e nadar.",
        "base_price_per_person": 300
    },
    {
        "id": "c0ad7a5e-7588-4106-805c-460138b6e3b0",
        "slug": "focagem-noturna-jacares",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787837866629_Captura_de_tela_2026-08-27_103731.png"
        ],
        "name_de": "Nächtliche Kaiman-Beobachtung",
        "name_en": "Night Caiman Spotting",
        "name_es": "Avistamiento Nocturno de Caimanes",
        "name_fr": "Observation Nocturne des Caïmans",
        "name_pt": "Focagem Noturna de Jacarés",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T13:37:53.230367+00:00",
        "category_de": "Fluss & Tierwelt",
        "category_en": "River & Wildlife",
        "category_es": "Río y Vida Salvaje",
        "category_fr": "Fleuve & Faune",
        "category_pt": "Rio & Vida Selvagem",
        "display_order": 7,
        "what_to_wear_de": "Leichte Kleidung",
        "what_to_wear_en": "Light clothing",
        "what_to_wear_es": "Ropa ligera",
        "what_to_wear_fr": "Vêtements légers",
        "what_to_wear_pt": "Roupas leves",
        "what_to_bring_de": "Insektenschutzmittel, Regenponcho, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, rain poncho, water and camera",
        "what_to_bring_es": "Repelente, capa de lluvia, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, poncho de pluie, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, capa de chuva, água e câmera",
        "duration_label_de": "Etwa 2 Stunden",
        "duration_label_en": "Approximately 2 hours",
        "duration_label_es": "Aproximadamente 2 horas",
        "duration_label_fr": "Environ 2 heures",
        "duration_label_pt": "Aproximadamente 2 horas",
        "full_description_de": "Nächtliche Beobachtung von Mohrenkaimanen am Ufer des Rio Negro, mit Lampen und erfahrenen Guides. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 2 Stunden.",
        "full_description_en": "Night observation of black caimans along the banks of the Rio Negro, with lanterns and expert guides. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 2 hours.",
        "full_description_es": "Observación nocturna de caimanes negros en las orillas del Río Negro, con linternas y guías expertos. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 2 horas.",
        "full_description_fr": "Observation nocturne des caïmans noirs sur les rives du Rio Negro, avec lampes et guides expérimentés. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 2 heures.",
        "full_description_pt": "Observação noturna de jacarés-açu nas margens do Rio Negro, com lanternas e guias experientes. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 2 horas.",
        "operational_notes_de": "Nachttour, Abfahrt nach dem Abendessen.",
        "operational_notes_en": "Night tour, departing after dinner.",
        "operational_notes_es": "Paseo nocturno, con salida después de la cena.",
        "operational_notes_fr": "Sortie nocturne, après le dîner.",
        "operational_notes_pt": "Passeio noturno, com saída após o jantar.",
        "short_description_de": "Nächtliche Beobachtung von Mohrenkaimanen am Ufer des Rio Negro, mit Lampen und erfahrenen Guides.",
        "short_description_en": "Night observation of black caimans along the banks of the Rio Negro, with lanterns and expert guides.",
        "short_description_es": "Observación nocturna de caimanes negros en las orillas del Río Negro, con linternas y guías expertos.",
        "short_description_fr": "Observation nocturne des caïmans noirs sur les rives du Rio Negro, avec lampes et guides expérimentés.",
        "short_description_pt": "Observação noturna de jacarés-açu nas margens do Rio Negro, com lanternas e guias experientes.",
        "base_price_per_person": 400
    },
    {
        "id": "f5cb3acf-e14c-4fe6-936a-2f508d2e693e",
        "slug": "encontro-das-aguas",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787840595479_Captura_de_tela_2026-08-27_112254.png"
        ],
        "name_de": "Zusammenfluss — Rio Negro und Solimões",
        "name_en": "Meeting of Waters — Negro and Solimões Rivers",
        "name_es": "Encuentro de las Aguas — Ríos Negro y Solimões",
        "name_fr": "Rencontre des Eaux — Rio Negro et Solimões",
        "name_pt": "Encontro das Águas - Rios Negro e Solimões",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T14:23:19.55155+00:00",
        "category_de": "Fluss & Tierwelt",
        "category_en": "River & Wildlife",
        "category_es": "Río y Vida Salvaje",
        "category_fr": "Fleuve & Faune",
        "category_pt": "Rio & Vida Selvagem",
        "display_order": 8,
        "what_to_wear_de": "Leichte Kleidung, Kappe, bequeme Turnschuhe oder Sandalen und langarm mit UV-Schutz",
        "what_to_wear_en": "Light clothing, cap, comfortable sneakers or sandals and long sleeves with UV protection",
        "what_to_wear_es": "Ropa ligera, gorra, tenis o sandalias cómodas y manga larga con protección UV",
        "what_to_wear_fr": "Vêtements légers, casquette, baskets ou sandales confortables et manches longues avec protection UV",
        "what_to_wear_pt": "Roupas leves, boné, tênis ou sandália confortável e manga longa com proteção UV",
        "what_to_bring_de": "Insektenschutzmittel, Sonnenschutz, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, sunscreen, water and camera",
        "what_to_bring_es": "Repelente, protector solar, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, crème solaire, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, protetor solar, água e câmera",
        "duration_label_de": "Etwa 6,5 Stunden",
        "duration_label_en": "Approximately 6 hours 30 minutes",
        "duration_label_es": "Aproximadamente 6 horas y 30 minutos",
        "duration_label_fr": "Environ 6 heures 30",
        "duration_label_pt": "Aproximadamente 6 horas e 30 minutos",
        "full_description_de": "Das Naturphänomen, bei dem Rio Negro und Solimões nebeneinander fließen, ohne sich zu vermischen. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 6,5 Stunden.",
        "full_description_en": "The natural phenomenon where the Negro and Solimões rivers run side by side without mixing. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 6 hours 30 minutes.",
        "full_description_es": "Fenómeno natural donde los ríos Negro y Solimões corren lado a lado sin mezclarse. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 6 horas y 30 minutos.",
        "full_description_fr": "Le phénomène naturel où le Rio Negro et le Solimões coulent côte à côte sans se mélanger. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 6 heures 30.",
        "full_description_pt": "Fenômeno natural onde os rios Negro e Solimões correm lado a lado sem se misturar. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 6 horas e 30 minutos.",
        "operational_notes_de": "Exklusive Tour, nach Verfügbarkeit. Eine Mindestgruppe von 12 Personen wird empfohlen.",
        "operational_notes_en": "Exclusive tour, subject to availability. A minimum group of 12 people is recommended.",
        "operational_notes_es": "Paseo exclusivo, sujeto a disponibilidad. Se recomienda un grupo mínimo de 12 personas.",
        "operational_notes_fr": "Excursion exclusive, sous réserve de disponibilité. Groupe minimum de 12 personnes recommandé.",
        "operational_notes_pt": "Passeio exclusivo, sujeito à disponibilidade. Recomendado grupo mínimo de 12 pessoas.",
        "short_description_de": "Das Naturphänomen, bei dem Rio Negro und Solimões nebeneinander fließen, ohne sich zu vermischen.",
        "short_description_en": "The natural phenomenon where the Negro and Solimões rivers run side by side without mixing.",
        "short_description_es": "Fenómeno natural donde los ríos Negro y Solimões corren lado a lado sin mezclarse.",
        "short_description_fr": "Le phénomène naturel où le Rio Negro et le Solimões coulent côte à côte sans se mélanger.",
        "short_description_pt": "Fenômeno natural onde os rios Negro e Solimões correm lado a lado sem se misturar.",
        "base_price_per_person": 1800
    },
    {
        "id": "369fdf65-54d1-41f5-9907-e9824044fa54",
        "slug": "samauma-gigante",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787841032771_Captura_de_tela_2026-08-27_112938.png"
        ],
        "name_de": "Riesige Samaúma — Mutter des Waldes",
        "name_en": "Giant Samaúma — Mother of the Forest",
        "name_es": "Samaúma Gigante — La Madre de la Selva",
        "name_fr": "Samaúma Géant — La Mère de la Forêt",
        "name_pt": "Samaúma Gigante — A Mãe da Floresta",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T14:30:40.347924+00:00",
        "category_de": "Abenteuer & Natur",
        "category_en": "Adventure & Nature",
        "category_es": "Aventura y Naturaleza",
        "category_fr": "Aventure & Nature",
        "category_pt": "Aventura & Natureza",
        "display_order": 10,
        "what_to_wear_de": "Leichte Kleidung, Kappe und Turnschuhe oder Wanderstiefel",
        "what_to_wear_en": "Light clothing, cap and sneakers or hiking boots",
        "what_to_wear_es": "Ropa ligera, gorra y tenis o botas de senderismo",
        "what_to_wear_fr": "Vêtements légers, casquette et baskets ou chaussures de randonnée",
        "what_to_wear_pt": "Roupas leves, boné e tênis ou bota de caminhada",
        "what_to_bring_de": "Insektenschutzmittel, Sonnenschutz, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, sunscreen, water and camera",
        "what_to_bring_es": "Repelente, protector solar, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, crème solaire, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, protetor solar, água e câmera",
        "duration_label_de": "Etwa 3 Stunden",
        "duration_label_en": "Approximately 3 hours",
        "duration_label_es": "Aproximadamente 3 horas",
        "duration_label_fr": "Environ 3 heures",
        "duration_label_pt": "Aproximadamente 3 horas",
        "full_description_de": "Besuch eines der größten Bäume Amazoniens und seiner ökologischen und symbolischen Bedeutung für die Menschen der Region. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 3 Stunden.",
        "full_description_en": "A visit to one of the largest trees in the Amazon and its ecological and symbolic meaning for local peoples. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 3 hours.",
        "full_description_es": "Visita a uno de los árboles más grandes de la Amazonía y su significado ecológico y simbólico para los pueblos locales. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 3 horas.",
        "full_description_fr": "Visite de l'un des plus grands arbres d'Amazonie et de sa signification écologique et symbolique pour les peuples locaux. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 3 heures.",
        "full_description_pt": "Visita a uma das maiores árvores da Amazônia e ao seu significado ecológico e simbólico para os povos da região. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 3 horas.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Besuch eines der größten Bäume Amazoniens und seiner ökologischen und symbolischen Bedeutung für die Menschen der Region.",
        "short_description_en": "A visit to one of the largest trees in the Amazon and its ecological and symbolic meaning for local peoples.",
        "short_description_es": "Visita a uno de los árboles más grandes de la Amazonía y su significado ecológico y simbólico para los pueblos locales.",
        "short_description_fr": "Visite de l'un des plus grands arbres d'Amazonie et de sa signification écologique et symbolique pour les peuples locaux.",
        "short_description_pt": "Visita a uma das maiores árvores da Amazônia e ao seu significado ecológico e simbólico para os povos da região.",
        "base_price_per_person": 320
    },
    {
        "id": "3f0b7566-d873-40fe-9a66-6175cdd7cdf4",
        "slug": "caminhada-na-selva",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787842392912_Captura_de_tela_2026-08-27_115257.png"
        ],
        "name_de": "Dschungelwanderung",
        "name_en": "Jungle Walk",
        "name_es": "Caminata en la Selva",
        "name_fr": "Randonnée en Forêt",
        "name_pt": "Caminhada na Selva",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T14:53:24.043377+00:00",
        "category_de": "Abenteuer & Natur",
        "category_en": "Adventure & Nature",
        "category_es": "Aventura y Naturaleza",
        "category_fr": "Aventure & Nature",
        "category_pt": "Aventura & Natureza",
        "display_order": 11,
        "what_to_wear_de": "Leichte langärmelige Kleidung, geschlossene Schuhe, lange Hose und Kappe",
        "what_to_wear_en": "Light long-sleeved clothing, closed shoes, long trousers and cap",
        "what_to_wear_es": "Ropa ligera de manga larga, calzado cerrado, pantalón largo y gorra",
        "what_to_wear_fr": "Vêtements légers à manches longues, chaussures fermées, pantalon long et casquette",
        "what_to_wear_pt": "Roupas leves de manga longa, calçado fechado, calça comprida e boné",
        "what_to_bring_de": "Insektenschutzmittel, Sonnenschutz, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, sunscreen, water and camera",
        "what_to_bring_es": "Repelente, protector solar, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, crème solaire, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, protetor solar, água e câmera",
        "duration_label_de": "Etwa 2,5 Stunden",
        "duration_label_en": "Approximately 2 hours 30 minutes",
        "duration_label_es": "Aproximadamente 2 horas y 30 minutos",
        "duration_label_fr": "Environ 2 heures 30",
        "duration_label_pt": "Aproximadamente 2 horas e 30 minutos",
        "full_description_de": "Geführte Wanderung durch den Amazonas-Regenwald mit Tier- und Pflanzenbeobachtung. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 2,5 Stunden.",
        "full_description_en": "A guided trail through the Amazon rainforest, observing fauna, flora and learning about native plants. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 2 hours 30 minutes.",
        "full_description_es": "Sendero guiado por la selva amazónica, observando fauna, flora y aprendiendo sobre plantas nativas. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 2 horas y 30 minutos.",
        "full_description_fr": "Sentier guidé dans la forêt amazonienne, observation de la faune, de la flore et découverte des plantes locales. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 2 heures 30.",
        "full_description_pt": "Trilha guiada pela floresta amazônica, observando fauna, flora e aprendendo sobre plantas nativas. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 2 horas e 30 minutos.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Geführte Wanderung durch den Amazonas-Regenwald mit Tier- und Pflanzenbeobachtung.",
        "short_description_en": "A guided trail through the Amazon rainforest, observing fauna, flora and learning about native plants.",
        "short_description_es": "Sendero guiado por la selva amazónica, observando fauna, flora y aprendiendo sobre plantas nativas.",
        "short_description_fr": "Sentier guidé dans la forêt amazonienne, observation de la faune, de la flore et découverte des plantes locales.",
        "short_description_pt": "Trilha guiada pela floresta amazônica, observando fauna, flora e aprendendo sobre plantas nativas.",
        "base_price_per_person": 230
    },
    {
        "id": "87e176b2-256a-4240-9698-b59dc91dca32",
        "slug": "horta-vovo-vania",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787843137325_Captura_de_tela_2026-08-27_120348.png"
        ],
        "name_de": "Heilpflanzengarten von Oma Vânia",
        "name_en": "Grandma Vânia's Medicinal Garden",
        "name_es": "Huerta Medicinal de la Abuela Vânia",
        "name_fr": "Jardin Médicinal de Grand-mère Vânia",
        "name_pt": "Horta Medicinal da Vovó Vânia",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T15:05:42.339218+00:00",
        "category_de": "Kultur & Flussgemeinden",
        "category_en": "Culture & Riverside Communities",
        "category_es": "Cultura y Comunidades Ribereñas",
        "category_fr": "Culture & Communautés Riveraines",
        "category_pt": "Cultura & Comunidades Ribeirinhas",
        "display_order": 12,
        "what_to_wear_de": "Leichte Kleidung, langarm mit UV-Schutz, Turnschuhe oder Sandalen, die nass werden dürfen und Kappe",
        "what_to_wear_en": "Light clothing, long sleeves with UV protection, sneakers or sandals that can get wet and cap",
        "what_to_wear_es": "Ropa ligera, manga larga con protección UV, tenis o sandalias que puedan mojarse y gorra",
        "what_to_wear_fr": "Vêtements légers, manches longues avec protection UV, baskets ou sandales pouvant être mouillées et casquette",
        "what_to_wear_pt": "Roupas leves, manga longa com proteção UV, tênis ou sandália que possa molhar e boné",
        "what_to_bring_de": "Insektenschutzmittel, Sonnenschutz, Wasser, einen kleinen Snack, Kamera und Regenponcho",
        "what_to_bring_en": "Insect repellent, sunscreen, water, a light snack, camera and rain poncho",
        "what_to_bring_es": "Repelente, protector solar, agua, merienda ligera, cámara y capa de lluvia",
        "what_to_bring_fr": "Anti-moustiques, crème solaire, de l'eau, un en-cas léger, appareil photo et poncho de pluie",
        "what_to_bring_pt": "Repelente, protetor solar, água, lanche leve, câmera e capa de chuva",
        "duration_label_de": "Etwa 3 Stunden",
        "duration_label_en": "Approximately 3 hours",
        "duration_label_es": "Aproximadamente 3 horas",
        "duration_label_fr": "Environ 3 heures",
        "duration_label_pt": "Aproximadamente 3 horas",
        "full_description_de": "In der Gemeinde São Thomé: traditionelles Wissen über Heilpflanzen Amazoniens. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 3 Stunden.",
        "full_description_en": "In the São Thomé community, traditional knowledge about Amazonian medicinal plants. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 3 hours.",
        "full_description_es": "En la comunidad de São Thomé, el conocimiento tradicional sobre las plantas medicinales amazónicas. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 3 horas.",
        "full_description_fr": "Dans la communauté de São Thomé, les savoirs traditionnels sur les plantes médicinales amazoniennes. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 3 heures.",
        "full_description_pt": "Na comunidade de São Thomé, o conhecimento tradicional sobre as plantas medicinais amazônicas. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 3 horas.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "In der Gemeinde São Thomé: traditionelles Wissen über Heilpflanzen Amazoniens.",
        "short_description_en": "In the São Thomé community, traditional knowledge about Amazonian medicinal plants.",
        "short_description_es": "En la comunidad de São Thomé, el conocimiento tradicional sobre las plantas medicinales amazónicas.",
        "short_description_fr": "Dans la communauté de São Thomé, les savoirs traditionnels sur les plantes médicinales amazoniennes.",
        "short_description_pt": "Na comunidade de São Thomé, o conhecimento tradicional sobre as plantas medicinais amazônicas.",
        "base_price_per_person": 200
    },
    {
        "id": "e3d690cc-d7fb-4508-8481-4b9134889c2e",
        "slug": "boto-cor-de-rosa",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787230792787_boto-cor-de-rosa-01.png"
        ],
        "name_de": "Begegnung mit dem Rosa Flussdelfin",
        "name_en": "Encounter with Pink River Dolphins",
        "name_es": "Interacción con el Delfín Rosado",
        "name_fr": "Rencontre avec le Dauphin Rose",
        "name_pt": "Interação com Boto Cor-de-Rosa",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-20T12:59:59.659861+00:00",
        "category_de": "Fluss & Tierwelt",
        "category_en": "River & Wildlife",
        "category_es": "Río y Vida Salvaje",
        "category_fr": "Fleuve & Faune",
        "category_pt": "Rio & Vida Selvagem",
        "display_order": 1,
        "what_to_wear_de": "Badekleidung",
        "what_to_wear_en": "Swimwear",
        "what_to_wear_es": "Traje de baño",
        "what_to_wear_fr": "Maillot de bain",
        "what_to_wear_pt": "Roupas de banho",
        "what_to_bring_de": "Handtuch, biologisch abbaubarer Sonnenschutz, trockene Wechselkleidung, Wasser und wasserfeste Kamera",
        "what_to_bring_en": "Towel, biodegradable sunscreen, a change of dry clothes, water and waterproof camera",
        "what_to_bring_es": "Toalla, protector solar biodegradable, cambio de ropa seca, agua y cámara resistente al agua",
        "what_to_bring_fr": "Serviette, crème solaire biodégradable, des vêtements de rechange secs, de l'eau et appareil photo étanche",
        "what_to_bring_pt": "Toalha, protetor solar biodegradável, troca de roupa seca, água e câmera à prova d'água",
        "duration_label_de": "Etwa 2 Stunden",
        "duration_label_en": "Approximately 2 hours",
        "duration_label_es": "Aproximadamente 2 horas",
        "duration_label_fr": "Environ 2 heures",
        "duration_label_pt": "Aproximadamente 2 horas",
        "full_description_de": "Eine Begegnung mit den rosa Delfinen des Rio Negro, mit Respekt für Lebensraum und Tiere. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 2 Stunden.",
        "full_description_en": "A close encounter with the pink dolphins of the Rio Negro, respecting their habitat and wellbeing. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 2 hours.",
        "full_description_es": "Encuentro cercano con los delfines rosados del Río Negro, con respeto por su hábitat y los animales. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 2 horas.",
        "full_description_fr": "Une rencontre rapprochée avec les dauphins roses du Rio Negro, dans le respect de leur habitat. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 2 heures.",
        "full_description_pt": "Encontro de perto com os botos do Rio Negro, com respeito ao habitat e aos animais. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 2 horas.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Eine Begegnung mit den rosa Delfinen des Rio Negro, mit Respekt für Lebensraum und Tiere.",
        "short_description_en": "A close encounter with the pink dolphins of the Rio Negro, respecting their habitat and wellbeing.",
        "short_description_es": "Encuentro cercano con los delfines rosados del Río Negro, con respeto por su hábitat y los animales.",
        "short_description_fr": "Une rencontre rapprochée avec les dauphins roses du Rio Negro, dans le respect de leur habitat.",
        "short_description_pt": "Encontro de perto com os botos do Rio Negro, com respeito ao habitat e aos animais.",
        "base_price_per_person": 430
    },
    {
        "id": "17e5d790-928c-4000-87bc-d11131cf815c",
        "slug": "anavilhanas",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787843566622_Captura_de_tela_2026-08-27_121225.png"
        ],
        "name_de": "Anavilhanas-Archipel",
        "name_en": "Anavilhanas Archipelago",
        "name_es": "Archipiélago de Anavilhanas",
        "name_fr": "Archipel d'Anavilhanas",
        "name_pt": "Arquipélago de Anavilhanas",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T15:12:56.699163+00:00",
        "category_de": "Abenteuer & Natur",
        "category_en": "Adventure & Nature",
        "category_es": "Aventura y Naturaleza",
        "category_fr": "Aventure & Nature",
        "category_pt": "Aventura & Natureza",
        "display_order": 13,
        "what_to_wear_de": "Leichte Kleidung, Kappe, bequeme Turnschuhe oder Sandalen und langarm mit UV-Schutz",
        "what_to_wear_en": "Light clothing, cap, comfortable sneakers or sandals and long sleeves with UV protection",
        "what_to_wear_es": "Ropa ligera, gorra, tenis o sandalias cómodas y manga larga con protección UV",
        "what_to_wear_fr": "Vêtements légers, casquette, baskets ou sandales confortables et manches longues avec protection UV",
        "what_to_wear_pt": "Roupas leves, boné, tênis ou sandália confortável e manga longa com proteção UV",
        "what_to_bring_de": "Insektenschutzmittel, Sonnenschutz, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, sunscreen, water and camera",
        "what_to_bring_es": "Repelente, protector solar, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, crème solaire, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, protetor solar, água e câmera",
        "duration_label_de": "Etwa 3 Stunden",
        "duration_label_en": "Approximately 3 hours",
        "duration_label_es": "Aproximadamente 3 horas",
        "duration_label_fr": "Environ 3 heures",
        "duration_label_pt": "Aproximadamente 3 horas",
        "full_description_de": "Eines der größten Flussarchipele der Welt mit Kanälen, Inseln und Süßwasserstränden. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 3 Stunden.",
        "full_description_en": "One of the largest river archipelagos in the world, with channels, islands and freshwater beaches. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 3 hours.",
        "full_description_es": "Uno de los mayores archipiélagos fluviales del mundo, con canales, islas y playas de agua dulce. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 3 horas.",
        "full_description_fr": "L'un des plus grands archipels fluviaux du monde, avec canaux, îles et plages d'eau douce. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 3 heures.",
        "full_description_pt": "Um dos maiores arquipélagos fluviais do mundo, com canais, ilhas e praias de água doce. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 3 horas.",
        "operational_notes_de": "Tour ab mindestens 4 Personen.",
        "operational_notes_en": "Tour operated with a minimum of 4 people.",
        "operational_notes_es": "Paseo realizado con un mínimo de 4 personas.",
        "operational_notes_fr": "Excursion réalisée avec un minimum de 4 personnes.",
        "operational_notes_pt": "Passeio realizado com mínimo de 4 pessoas.",
        "short_description_de": "Eines der größten Flussarchipele der Welt mit Kanälen, Inseln und Süßwasserstränden.",
        "short_description_en": "One of the largest river archipelagos in the world, with channels, islands and freshwater beaches.",
        "short_description_es": "Uno de los mayores archipiélagos fluviales del mundo, con canales, islas y playas de agua dulce.",
        "short_description_fr": "L'un des plus grands archipels fluviaux du monde, avec canaux, îles et plages d'eau douce.",
        "short_description_pt": "Um dos maiores arquipélagos fluviais do mundo, com canais, ilhas e praias de água doce.",
        "base_price_per_person": 600
    },
    {
        "id": "6ba24f36-b54e-4804-8166-fc771dc27be1",
        "slug": "cachoeira-do-arara",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787843942667_Captura_de_tela_2026-08-27_121839.png"
        ],
        "name_de": "Arara-Wasserfall + Flussmittagessen",
        "name_en": "Arara Waterfall + Riverside Lunch",
        "name_es": "Cascada del Arara + Almuerzo Ribereño",
        "name_fr": "Cascade d'Arara + Déjeuner Riverain",
        "name_pt": "Cachoeira do Arara + Almoço Ribeirinho",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T15:19:12.667926+00:00",
        "category_de": "Abenteuer & Natur",
        "category_en": "Adventure & Nature",
        "category_es": "Aventura y Naturaleza",
        "category_fr": "Aventure & Nature",
        "category_pt": "Aventura & Natureza",
        "display_order": 14,
        "what_to_wear_de": "Leichte Kleidung, Badekleidung, Kappe, Turnschuhe oder Sandalen, die nass werden dürfen und langarm mit UV-Schutz",
        "what_to_wear_en": "Light clothing, swimwear, cap, sneakers or sandals that can get wet and long sleeves with UV protection",
        "what_to_wear_es": "Ropa ligera, traje de baño, gorra, tenis o sandalias que puedan mojarse y manga larga con protección UV",
        "what_to_wear_fr": "Vêtements légers, maillot de bain, casquette, baskets ou sandales pouvant être mouillées et manches longues avec protection UV",
        "what_to_wear_pt": "Roupas leves, roupas de banho, boné, tênis ou sandália que possa molhar e manga longa com proteção UV",
        "what_to_bring_de": "Insektenschutzmittel, Sonnenschutz, Handtuch, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, sunscreen, towel, water and camera",
        "what_to_bring_es": "Repelente, protector solar, toalla, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, crème solaire, serviette, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, protetor solar, toalha, água e câmera",
        "duration_label_de": "Etwa 7 Stunden",
        "duration_label_en": "Approximately 7 hours",
        "duration_label_es": "Aproximadamente 7 horas",
        "duration_label_fr": "Environ 7 heures",
        "duration_label_pt": "Aproximadamente 7 horas",
        "full_description_de": "Ein nur in der Trockenzeit erreichbarer Wasserfall, mit typischem Mittagessen am Fluss (gegrillter Fisch). Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 7 Stunden.",
        "full_description_en": "A waterfall reachable only in the dry season, with a typical riverside lunch (grilled fish). The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 7 hours.",
        "full_description_es": "Cascada accesible solo en la temporada seca, con almuerzo típico a la orilla del río (pescado asado). La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 7 horas.",
        "full_description_fr": "Cascade accessible seulement en saison sèche, avec un déjeuner typique au bord du fleuve (poisson grillé). L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 7 heures.",
        "full_description_pt": "Cachoeira acessível apenas no período da seca, com almoço típico à beira do rio (peixe assado). A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 7 horas.",
        "operational_notes_de": "Tour nur in der Trockenzeit möglich.",
        "operational_notes_en": "Tour available only during the dry season.",
        "operational_notes_es": "Paseo realizado solo en la temporada seca.",
        "operational_notes_fr": "Excursion réalisée uniquement en saison sèche.",
        "operational_notes_pt": "Passeio realizado somente no período da seca.",
        "short_description_de": "Ein nur in der Trockenzeit erreichbarer Wasserfall, mit typischem Mittagessen am Fluss (gegrillter Fisch).",
        "short_description_en": "A waterfall reachable only in the dry season, with a typical riverside lunch (grilled fish).",
        "short_description_es": "Cascada accesible solo en la temporada seca, con almuerzo típico a la orilla del río (pescado asado).",
        "short_description_fr": "Cascade accessible seulement en saison sèche, avec un déjeuner typique au bord du fleuve (poisson grillé).",
        "short_description_pt": "Cachoeira acessível apenas no período da seca, com almoço típico à beira do rio (peixe assado).",
        "base_price_per_person": 350
    },
    {
        "id": "6f7542e3-a7db-4465-bc22-d738d4d9bb60",
        "slug": "pescaria-de-piranha",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787837251446_Captura_de_tela_2026-08-27_102715.png"
        ],
        "name_de": "Piranha-Angeln — Acajatuba-Seen",
        "name_en": "Piranha Fishing — Acajatuba Lakes",
        "name_es": "Pesca de Pirañas — Lagos de Acajatuba",
        "name_fr": "Pêche au Piranha — Lacs d'Acajatuba",
        "name_pt": "Pescaria de Piranha - Lagos de Acajatuba",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T13:30:36.013175+00:00",
        "category_de": "Fluss & Tierwelt",
        "category_en": "River & Wildlife",
        "category_es": "Río y Vida Salvaje",
        "category_fr": "Fleuve & Faune",
        "category_pt": "Rio & Vida Selvagem",
        "display_order": 6,
        "what_to_wear_de": "Leichte Kleidung, langarm mit UV-Schutz, Turnschuhe oder Sandalen, die nass werden dürfen und Kappe",
        "what_to_wear_en": "Light clothing, long sleeves with UV protection, sneakers or sandals that can get wet and cap",
        "what_to_wear_es": "Ropa ligera, manga larga con protección UV, tenis o sandalias que puedan mojarse y gorra",
        "what_to_wear_fr": "Vêtements légers, manches longues avec protection UV, baskets ou sandales pouvant être mouillées et casquette",
        "what_to_wear_pt": "Roupas leves, manga longa com proteção UV, tênis ou sandália que possa molhar e boné",
        "what_to_bring_de": "Handtuch, Sonnenschutz, Insektenschutzmittel, Wasser, einen kleinen Snack, Kamera und Regenponcho",
        "what_to_bring_en": "Towel, sunscreen, insect repellent, water, a light snack, camera and rain poncho",
        "what_to_bring_es": "Toalla, protector solar, repelente, agua, merienda ligera, cámara y capa de lluvia",
        "what_to_bring_fr": "Serviette, crème solaire, anti-moustiques, de l'eau, un en-cas léger, appareil photo et poncho de pluie",
        "what_to_bring_pt": "Toalha, protetor solar, repelente, água, lanche leve, câmera e capa de chuva",
        "duration_label_de": "Etwa 3 Stunden",
        "duration_label_en": "Approximately 3 hours",
        "duration_label_es": "Aproximadamente 3 horas",
        "duration_label_fr": "Environ 3 heures",
        "duration_label_pt": "Aproximadamente 3 horas",
        "full_description_de": "Traditionelles Angeln der Flussbewohner in ruhigen Seebereichen mit erfahrenem Guide. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 3 Stunden.",
        "full_description_en": "Traditional riverside fishing in the calm areas of the lakes, with an experienced guide. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 3 hours.",
        "full_description_es": "Pesca tradicional ribereña en zonas tranquilas de los lagos, con guía experimentado. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 3 horas.",
        "full_description_fr": "Pêche traditionnelle riveraine dans les zones calmes des lacs, avec un guide expérimenté. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 3 heures.",
        "full_description_pt": "Pesca tradicional ribeirinha em áreas calmas dos lagos, com guia experiente. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 3 horas.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Traditionelles Angeln der Flussbewohner in ruhigen Seebereichen mit erfahrenem Guide.",
        "short_description_en": "Traditional riverside fishing in the calm areas of the lakes, with an experienced guide.",
        "short_description_es": "Pesca tradicional ribereña en zonas tranquilas de los lagos, con guía experimentado.",
        "short_description_fr": "Pêche traditionnelle riveraine dans les zones calmes des lacs, avec un guide expérimenté.",
        "short_description_pt": "Pesca tradicional ribeirinha em áreas calmas dos lagos, com guia experiente.",
        "base_price_per_person": 300
    },
    {
        "id": "788dd064-fad3-4cf7-b7df-d8b668216abb",
        "slug": "nascer-do-sol",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787840784494_Captura_de_tela_2026-08-27_112609.png"
        ],
        "name_de": "Sonnenaufgang am Rio Negro",
        "name_en": "Sunrise on the Rio Negro",
        "name_es": "Amanecer en el Río Negro",
        "name_fr": "Lever de Soleil sur le Rio Negro",
        "name_pt": "Nascer do Sol no Rio Negro",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T14:26:33.967266+00:00",
        "category_de": "Fluss & Tierwelt",
        "category_en": "River & Wildlife",
        "category_es": "Río y Vida Salvaje",
        "category_fr": "Fleuve & Faune",
        "category_pt": "Rio & Vida Selvagem",
        "display_order": 9,
        "what_to_wear_de": "Leichte Kleidung und leichte Jacke",
        "what_to_wear_en": "Light clothing and light jacket",
        "what_to_wear_es": "Ropa ligera y chaqueta ligera",
        "what_to_wear_fr": "Vêtements légers et veste légère",
        "what_to_wear_pt": "Roupas leves e casaco leve",
        "what_to_bring_de": "Insektenschutzmittel, Wasser und Kamera",
        "what_to_bring_en": "Insect repellent, water and camera",
        "what_to_bring_es": "Repelente, agua y cámara",
        "what_to_bring_fr": "Anti-moustiques, de l'eau et appareil photo",
        "what_to_bring_pt": "Repelente, água e câmera",
        "duration_label_de": "Etwa 1 Stunde",
        "duration_label_en": "Approximately 1 hour",
        "duration_label_es": "Aproximadamente 1 hora",
        "duration_label_fr": "Environ 1 heure",
        "duration_label_pt": "Aproximadamente 1 hora",
        "full_description_de": "Abfahrt gegen 5:30 Uhr, um den Sonnenaufgang über Wald und Fluss zu erleben, zurück zum Frühstück. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 1 Stunde.",
        "full_description_en": "Departure around 5:30 am to watch the sunrise over the forest and the river, back in time for breakfast. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 1 hour.",
        "full_description_es": "Salida cerca de las 5:30 para ver el amanecer sobre la selva y el río, regresando a tiempo para el desayuno. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 1 hora.",
        "full_description_fr": "Départ vers 5h30 pour voir le lever du soleil sur la forêt et le fleuve, retour à temps pour le petit-déjeuner. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 1 heure.",
        "full_description_pt": "Saída por volta das 5h30 para ver o nascer do sol sobre a floresta e o rio, com retorno a tempo do café da manhã. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 1 hora.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Abfahrt gegen 5:30 Uhr, um den Sonnenaufgang über Wald und Fluss zu erleben, zurück zum Frühstück.",
        "short_description_en": "Departure around 5:30 am to watch the sunrise over the forest and the river, back in time for breakfast.",
        "short_description_es": "Salida cerca de las 5:30 para ver el amanecer sobre la selva y el río, regresando a tiempo para el desayuno.",
        "short_description_fr": "Départ vers 5h30 pour voir le lever du soleil sur la forêt et le fleuve, retour à temps pour le petit-déjeuner.",
        "short_description_pt": "Saída por volta das 5h30 para ver o nascer do sol sobre a floresta e o rio, com retorno a tempo do café da manhã.",
        "base_price_per_person": 310
    },
    {
        "id": "87c4ac96-0789-4124-94fb-8cdd9c3af0be",
        "slug": "doce-amazonico",
        "photos": [
            "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/experiences-module/1787844003653_Captura_de_tela_2026-08-27_121940.png"
        ],
        "name_de": "Amazonische Süße — Workshop der Waldaromen",
        "name_en": "Amazonian Sweets — Flavors of the Forest Workshop",
        "name_es": "Dulce Amazónico — Taller de Sabores de la Selva",
        "name_fr": "Douceur Amazonienne — Atelier des Saveurs de la Forêt",
        "name_pt": "Doce Amazônico - Oficina de Sabores da Floresta",
        "is_active": true,
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "updated_at": "2026-08-27T15:53:14.530271+00:00",
        "category_de": "Gastronomie",
        "category_en": "Gastronomy",
        "category_es": "Gastronomía",
        "category_fr": "Gastronomie",
        "category_pt": "Gastronomia",
        "display_order": 15,
        "what_to_wear_de": "Leichte Kleidung und bequeme Turnschuhe oder Sandalen",
        "what_to_wear_en": "Light clothing and comfortable sneakers or sandals",
        "what_to_wear_es": "Ropa ligera y tenis o sandalias cómodas",
        "what_to_wear_fr": "Vêtements légers et baskets ou sandales confortables",
        "what_to_wear_pt": "Roupas leves e tênis ou sandália confortável",
        "what_to_bring_de": "Wasser und Kamera",
        "what_to_bring_en": "Water and camera",
        "what_to_bring_es": "Agua y cámara",
        "what_to_bring_fr": "De l'eau et appareil photo",
        "what_to_bring_pt": "Água e câmera",
        "duration_label_de": "Etwa 2 Stunden",
        "duration_label_en": "Approximately 2 hours",
        "duration_label_es": "Aproximadamente 2 horas",
        "duration_label_fr": "Environ 2 heures",
        "duration_label_pt": "Aproximadamente 2 horas",
        "full_description_de": "Verkostung und Workshop mit handgemachten Süßigkeiten aus regionalen Früchten. Die Aktivität wird von einheimischen Guides geleitet, die die Region genau kennen, mit Respekt für die Natur und die Gemeinden am Rio Negro. Ungefähre Dauer: 2 Stunden.",
        "full_description_en": "Tasting and workshop of artisanal sweets made with regional fruits. The activity is led by local guides with deep knowledge of the region, always respecting the nature and the communities of the Rio Negro. Approximate duration: 2 hours.",
        "full_description_es": "Degustación y taller de dulces artesanales hechos con frutas regionales. La actividad es guiada por guías locales que conocen profundamente la región, con respeto por la naturaleza y las comunidades del Río Negro. Duración aproximada: 2 horas.",
        "full_description_fr": "Dégustation et atelier de douceurs artisanales à base de fruits régionaux. L'activité est encadrée par des guides locaux qui connaissent parfaitement la région, dans le respect de la nature et des communautés du Rio Negro. Durée approximative : 2 heures.",
        "full_description_pt": "Degustação e oficina de doces artesanais feitos com frutas regionais. A atividade é conduzida por guias locais que conhecem profundamente a região, com respeito à natureza e às comunidades do Rio Negro. Duração aproximada: 2 horas.",
        "operational_notes_de": "",
        "operational_notes_en": "",
        "operational_notes_es": "",
        "operational_notes_fr": "",
        "operational_notes_pt": "",
        "short_description_de": "Verkostung und Workshop mit handgemachten Süßigkeiten aus regionalen Früchten.",
        "short_description_en": "Tasting and workshop of artisanal sweets made with regional fruits.",
        "short_description_es": "Degustación y taller de dulces artesanales hechos con frutas regionales.",
        "short_description_fr": "Dégustation et atelier de douceurs artisanales à base de fruits régionaux.",
        "short_description_pt": "Degustação e oficina de doces artesanais feitos com frutas regionais.",
        "base_price_per_person": 150
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- profiles  (4 registros)
-- ============================================================
INSERT INTO public.profiles
SELECT * FROM jsonb_populate_recordset(null::public.profiles, $dados$
[
    {
        "id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "email": "cst.flavio@pousadaararaazul.com",
        "phone": null,
        "full_name": "Flavio Costa",
        "created_at": "2025-10-24T11:34:30.336899+00:00",
        "updated_at": "2025-10-24T11:34:30.336899+00:00",
        "preferred_language": "pt"
    },
    {
        "id": "7e1632aa-b7a2-4cfc-9089-64b51abf468d",
        "email": "kinha@pousadaararaazul.com.br",
        "phone": null,
        "full_name": "Jessica kinha",
        "created_at": "2025-11-02T17:57:43.795805+00:00",
        "updated_at": "2025-11-02T17:57:43.795805+00:00",
        "preferred_language": "pt"
    },
    {
        "id": "7d78ab2c-9f8b-47d5-b5d1-3d6b4987c29f",
        "email": "teste2@gmail.com",
        "phone": null,
        "full_name": "teste2",
        "created_at": "2025-11-21T03:33:21.55591+00:00",
        "updated_at": "2025-11-21T03:33:21.55591+00:00",
        "preferred_language": "pt"
    },
    {
        "id": "f2250b21-3e82-416a-864a-ef814197567a",
        "email": "laracabral@pousadararazul.com",
        "phone": null,
        "full_name": "Lara Cabral",
        "created_at": "2025-12-16T19:49:52.777864+00:00",
        "updated_at": "2025-12-16T19:49:52.777864+00:00",
        "preferred_language": "pt"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- user_roles  (4 registros)
-- ============================================================
INSERT INTO public.user_roles
SELECT * FROM jsonb_populate_recordset(null::public.user_roles, $dados$
[
    {
        "id": "01d86aa0-8969-4588-9409-777fee250b42",
        "role": "super_admin",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2025-10-24T11:34:30.336899+00:00"
    },
    {
        "id": "bbdca65b-e158-449f-a92c-606200347fbe",
        "role": "super_admin",
        "user_id": "7e1632aa-b7a2-4cfc-9089-64b51abf468d",
        "created_at": "2025-11-02T17:57:43.795805+00:00"
    },
    {
        "id": "d57b253a-b0a3-4fdb-ba2c-26c3ad3da544",
        "role": "admin",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "created_at": "2025-12-16T19:49:52.777864+00:00"
    },
    {
        "id": "05618943-ff25-4831-a825-1d419c43150e",
        "role": "admin",
        "user_id": "7d78ab2c-9f8b-47d5-b5d1-3d6b4987c29f",
        "created_at": "2025-11-21T03:33:21.55591+00:00"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- user_module_permissions  (0 registros)
-- ============================================================
-- (tabela vazia no banco de origem)

-- ============================================================
-- gallery_images  (33 registros)
-- ============================================================
INSERT INTO public.gallery_images
SELECT * FROM jsonb_populate_recordset(null::public.gallery_images, $dados$
[
    {
        "id": "4bf1835d-80b8-44e3-a72f-15a863b20b0e",
        "alt_text": "Pesca de piranha",
        "category": "experiences",
        "file_name": "IMG_7141.jpeg",
        "is_active": true,
        "created_at": "2025-11-18T19:33:00.184034+00:00",
        "updated_at": "2025-11-18T19:33:00.184034+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1763494378798_IMG_7141.jpeg",
        "bungalow_slug": null,
        "display_order": 2,
        "compression_stats": null
    },
    {
        "id": "2643b747-c9d1-4773-bd58-c9051c80dc6f",
        "alt_text": "torneira lavabo",
        "category": "bungalows",
        "file_name": "Captura de Tela 2025-11-18 à(s) 22.50.03.jpeg.webp",
        "is_active": true,
        "created_at": "2025-11-21T04:09:05.142667+00:00",
        "updated_at": "2025-12-16T21:46:26.823166+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1763698144235_Captura_de_Tela_2025-11-18_a__s__22.50.03.jpeg.webp",
        "bungalow_slug": "bangalo-peneira",
        "display_order": 4,
        "compression_stats": null
    },
    {
        "id": "ad6e9ee5-e1b1-46f8-8e63-b4e43e3acec4",
        "alt_text": "Bangalô Paneiro - Vista exterior com telhado de palha e varanda",
        "category": "bungalows",
        "file_name": "paneiro-exterior.jpg",
        "is_active": true,
        "created_at": "2025-11-18T22:50:04.270394+00:00",
        "updated_at": "2025-11-18T22:50:04.270394+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1763506201801_paneiro-exterior.jpg",
        "bungalow_slug": "bangalo-paneiro",
        "display_order": 1,
        "compression_stats": null
    },
    {
        "id": "bb5d8937-661f-40d0-91fd-622e32d8c382",
        "alt_text": "Bangalô Paneiro - Varanda privativa com vista para a floresta",
        "category": "bungalows",
        "file_name": "paneiro-balcony.jpg",
        "is_active": true,
        "created_at": "2025-11-18T22:50:08.418561+00:00",
        "updated_at": "2025-11-18T22:50:08.418561+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1763506207063_paneiro-balcony.jpg",
        "bungalow_slug": "bangalo-paneiro",
        "display_order": 2,
        "compression_stats": null
    },
    {
        "id": "c360b2f2-5bc5-4588-a0bf-7e4541a356d7",
        "alt_text": "Bangalô Paneiro - Interior espaçoso com camas confortáveis",
        "category": "bungalows",
        "file_name": "paneiro-interior.jpg",
        "is_active": true,
        "created_at": "2025-11-18T22:50:12.803932+00:00",
        "updated_at": "2025-11-18T22:50:12.803932+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1763506210232_paneiro-interior.jpg",
        "bungalow_slug": "bangalo-paneiro",
        "display_order": 3,
        "compression_stats": null
    },
    {
        "id": "02569f72-88f8-46b4-82d8-dd8bbd5897be",
        "alt_text": "Bangalô Paneiro - Entrada do banheiro com detalhes artesanais",
        "category": "bungalows",
        "file_name": "paneiro-entrance.jpg",
        "is_active": true,
        "created_at": "2025-11-18T22:50:15.972015+00:00",
        "updated_at": "2025-11-18T22:50:15.972015+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1763506214764_paneiro-entrance.jpg",
        "bungalow_slug": "bangalo-paneiro",
        "display_order": 4,
        "compression_stats": null
    },
    {
        "id": "e04b37bc-129b-4c8b-8a0d-4201b494ac2e",
        "alt_text": "Bangalô Paneiro - Banheiro rústico com acabamento em madeira",
        "category": "bungalows",
        "file_name": "paneiro-bathroom.jpg",
        "is_active": true,
        "created_at": "2025-11-18T22:50:19.616086+00:00",
        "updated_at": "2025-11-18T22:50:19.616086+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1763506218526_paneiro-bathroom.jpg",
        "bungalow_slug": "bangalo-paneiro",
        "display_order": 5,
        "compression_stats": null
    },
    {
        "id": "65580484-be3e-4b26-ab39-10ad90231ba7",
        "alt_text": "sanitario lavabo",
        "category": "bungalows",
        "file_name": "IMG_9589.webp",
        "is_active": false,
        "created_at": "2025-11-21T04:09:04.054272+00:00",
        "updated_at": "2025-12-16T21:54:21.236998+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1763698142049_IMG_9589.webp",
        "bungalow_slug": "bangalo-peneira",
        "display_order": 2,
        "compression_stats": null
    },
    {
        "id": "e2032765-b619-42a3-869f-60d2cc1cf59b",
        "alt_text": "Cheiro da Floresta",
        "category": "experiences",
        "file_name": "IMG_8708.webp",
        "is_active": true,
        "created_at": "2025-12-16T23:22:35.669655+00:00",
        "updated_at": "2025-12-16T23:24:18.836969+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765927353420_IMG_8708.webp",
        "bungalow_slug": null,
        "display_order": 8,
        "compression_stats": null
    },
    {
        "id": "719a5040-d2fd-4fed-9d62-a0277f78abe7",
        "alt_text": "Por do sol",
        "category": "experiences",
        "file_name": "IMG_8776.jpeg",
        "is_active": true,
        "created_at": "2025-11-18T19:32:56.49693+00:00",
        "updated_at": "2025-12-16T23:36:30.122204+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1763494373342_IMG_8776.jpeg",
        "bungalow_slug": null,
        "display_order": 1,
        "compression_stats": null
    },
    {
        "id": "95e97d16-173d-4f0c-99b8-be26e2665944",
        "alt_text": "arvore grande",
        "category": "experiences",
        "file_name": "IMG_9888.webp",
        "is_active": true,
        "created_at": "2025-11-18T22:18:36.838522+00:00",
        "updated_at": "2025-12-16T23:45:07.059603+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1763504315291_IMG_9888.webp",
        "bungalow_slug": null,
        "display_order": 6,
        "compression_stats": null
    },
    {
        "id": "d4c10f1a-292d-4ad8-b5c5-2cd22122ecb0",
        "alt_text": "Caminhada na Floresta",
        "category": "experiences",
        "file_name": "Captura de Tela 2025-12-16 às 20.28.26.webp",
        "is_active": true,
        "created_at": "2025-12-16T23:35:48.877635+00:00",
        "updated_at": "2025-12-16T23:49:17.93308+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765928146043_Captura_de_Tela_2025-12-16_a_s_20.28.26.webp",
        "bungalow_slug": null,
        "display_order": 5,
        "compression_stats": null
    },
    {
        "id": "f8d0b172-b3cf-4d85-95b2-881f024a88bb",
        "alt_text": "Tartarugas",
        "category": "experiences",
        "file_name": "Captura de Tela 2025-12-16 às 20.46.35.webp",
        "is_active": true,
        "created_at": "2025-12-16T23:52:53.987898+00:00",
        "updated_at": "2025-12-16T23:53:25.423215+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765929171000_Captura_de_Tela_2025-12-16_a_s_20.46.35.webp",
        "bungalow_slug": null,
        "display_order": 5,
        "compression_stats": null
    },
    {
        "id": "4d1cfeaa-fff5-4560-b3a7-c35d15d072fa",
        "alt_text": "Welcome Drink",
        "category": "experiences",
        "file_name": "IMG_8385.webp",
        "is_active": true,
        "created_at": "2025-12-17T00:27:02.519747+00:00",
        "updated_at": "2025-12-17T00:27:02.519747+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765931221206_IMG_8385.webp",
        "bungalow_slug": null,
        "display_order": 4,
        "compression_stats": null
    },
    {
        "id": "ebef90c3-17a4-4334-97f8-7e3fb6302c82",
        "alt_text": "Jantar Amazonico",
        "category": "experiences",
        "file_name": "Captura de Tela 2025-12-16 às 21.13.04.webp",
        "is_active": true,
        "created_at": "2025-12-17T00:26:58.485533+00:00",
        "updated_at": "2025-12-17T00:28:02.486187+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765931217261_Captura_de_Tela_2025-12-16_a_s_21.13.04.webp",
        "bungalow_slug": null,
        "display_order": 4,
        "compression_stats": null
    },
    {
        "id": "d0cd2e14-b2f2-4e04-8fae-17e416ca929b",
        "alt_text": "Cama de Casal ",
        "category": "bungalows",
        "file_name": "4893e27b-62ec-44a7-a6b4-68883356cefa.webp",
        "is_active": true,
        "created_at": "2025-12-17T00:36:11.525967+00:00",
        "updated_at": "2025-12-17T00:37:10.359134+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765931769040_4893e27b-62ec-44a7-a6b4-68883356cefa.webp",
        "bungalow_slug": "bangalo-peneira",
        "display_order": 3,
        "compression_stats": null
    },
    {
        "id": "032ff56a-00a9-4850-b34e-94a8ef1b03c8",
        "alt_text": "Bangalô Tupé",
        "category": "bungalows",
        "file_name": "Screenshot_2026-06-05-21-30-08-324_com.openai.chatgpt.webp",
        "is_active": true,
        "created_at": "2026-06-15T16:28:00.335413+00:00",
        "updated_at": "2026-06-15T19:52:13.229212+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1781540877463_Screenshot_2026-06-05-21-30-08-324_com.openai.chatgpt.webp",
        "bungalow_slug": "bangalo-tupe",
        "display_order": 3,
        "compression_stats": null
    },
    {
        "id": "0b57239a-9e1d-40a4-ade0-392da0ae56b7",
        "alt_text": "Bangalô Tupé",
        "category": "bungalows",
        "file_name": "IMG_0934.webp",
        "is_active": true,
        "created_at": "2026-06-15T19:46:28.402005+00:00",
        "updated_at": "2026-06-15T19:53:55.900356+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1781552755306_IMG_0934.webp",
        "bungalow_slug": "bangalo-abano",
        "display_order": 1,
        "compression_stats": null
    },
    {
        "id": "520f488f-bafc-45b0-81e1-a7fe9d9b0faf",
        "alt_text": "camas casal e solteiro",
        "category": "bungalows",
        "file_name": "IMG_9560.webp",
        "is_active": true,
        "created_at": "2025-11-21T04:09:07.549302+00:00",
        "updated_at": "2026-06-18T16:39:18.57822+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1763698146340_IMG_9560.webp",
        "bungalow_slug": "bangalo-paneiro",
        "display_order": 2,
        "compression_stats": null
    },
    {
        "id": "e8d36b2a-18e5-484f-837a-3bef84960203",
        "alt_text": "Frente Peneire",
        "category": "bungalows",
        "file_name": "448acfc3-6670-4015-8f5a-0daf95922d28.webp",
        "is_active": true,
        "created_at": "2025-12-16T21:21:01.733933+00:00",
        "updated_at": "2025-12-16T21:43:43.388281+00:00",
        "uploaded_by": null,
        "storage_path": "nature/1765920059593_448acfc3-6670-4015-8f5a-0daf95922d28.webp",
        "bungalow_slug": "bangalo-peneira",
        "display_order": 1,
        "compression_stats": null
    },
    {
        "id": "3da96d39-d6d4-4cb1-afa3-10af91e2f58a",
        "alt_text": "Quarto Peneira",
        "category": "bungalows",
        "file_name": "03dfbb4d-00c1-44fd-a929-f6dd2273817f.webp",
        "is_active": true,
        "created_at": "2025-12-16T21:18:20.06027+00:00",
        "updated_at": "2025-12-16T21:54:38.272733+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1765919898807_03dfbb4d-00c1-44fd-a929-f6dd2273817f.webp",
        "bungalow_slug": "bangalo-peneira",
        "display_order": 4,
        "compression_stats": null
    },
    {
        "id": "84a62fa0-dc78-4be9-b198-b5be6a59223c",
        "alt_text": "Bangalô Peneira Cheia",
        "category": "bungalows",
        "file_name": "1c25c1df-8011-4ed3-b4b1-17ac922c11d6.webp",
        "is_active": true,
        "created_at": "2025-12-16T21:17:39.166298+00:00",
        "updated_at": "2025-12-16T21:55:51.410316+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1765919856171_1c25c1df-8011-4ed3-b4b1-17ac922c11d6.webp",
        "bungalow_slug": "suite-peneira",
        "display_order": 2,
        "compression_stats": null
    },
    {
        "id": "6bb3fa17-71b6-4b66-ad69-0c2b4bb879d6",
        "alt_text": "Natureza Restaurante",
        "category": "experiences",
        "file_name": "46ea6323-8499-4eb7-92c1-5668c236bb59.webp",
        "is_active": true,
        "created_at": "2025-12-16T21:19:51.79417+00:00",
        "updated_at": "2025-12-16T22:26:27.240294+00:00",
        "uploaded_by": null,
        "storage_path": "nature/1765919989490_46ea6323-8499-4eb7-92c1-5668c236bb59.webp",
        "bungalow_slug": null,
        "display_order": 5,
        "compression_stats": null
    },
    {
        "id": "6d6ba90a-bf30-4434-8106-a559a03eed78",
        "alt_text": "Natureza Linda",
        "category": "experiences",
        "file_name": "a07bc276-eb99-45c9-9853-dde52d256838.webp",
        "is_active": true,
        "created_at": "2025-12-16T21:22:22.628621+00:00",
        "updated_at": "2025-12-16T22:27:04.03077+00:00",
        "uploaded_by": null,
        "storage_path": "nature/1765920140579_a07bc276-eb99-45c9-9853-dde52d256838.webp",
        "bungalow_slug": null,
        "display_order": 2,
        "compression_stats": null
    },
    {
        "id": "222e1430-0466-442f-b0f5-934dbbf65518",
        "alt_text": "Boto Cor de Rosa",
        "category": "experiences",
        "file_name": "IMG_8677.webp",
        "is_active": true,
        "created_at": "2025-12-16T23:35:50.23977+00:00",
        "updated_at": "2025-12-16T23:35:50.23977+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765928148857_IMG_8677.webp",
        "bungalow_slug": null,
        "display_order": 1,
        "compression_stats": null
    },
    {
        "id": "03734fd0-b74a-4ada-8a90-b4e0a3b6df34",
        "alt_text": "Interação com os Macacos do Ariaú",
        "category": "experiences",
        "file_name": "IMG_9634.webp",
        "is_active": true,
        "created_at": "2025-12-16T19:46:01.586268+00:00",
        "updated_at": "2025-12-16T23:55:12.712025+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765914357751_IMG_9634.webp",
        "bungalow_slug": null,
        "display_order": 4,
        "compression_stats": null
    },
    {
        "id": "e5e31fc0-169c-4868-a115-38d385eecea7",
        "alt_text": "Café da Manhã",
        "category": "experiences",
        "file_name": "IMG_8429.webp",
        "is_active": true,
        "created_at": "2025-12-17T00:26:59.887218+00:00",
        "updated_at": "2025-12-17T00:26:59.887218+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765931218401_IMG_8429.webp",
        "bungalow_slug": null,
        "display_order": 2,
        "compression_stats": null
    },
    {
        "id": "60a05188-146d-471d-9731-bb0569a617d6",
        "alt_text": "Sobremesa Amazonica",
        "category": "experiences",
        "file_name": "IMG_8492.webp",
        "is_active": true,
        "created_at": "2025-12-17T00:27:01.321795+00:00",
        "updated_at": "2025-12-17T00:27:01.321795+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765931219835_IMG_8492.webp",
        "bungalow_slug": null,
        "display_order": 3,
        "compression_stats": null
    },
    {
        "id": "fc128869-cc2a-4ce0-ab09-29dd8726399f",
        "alt_text": "Kemily Cocar",
        "category": "experiences",
        "file_name": "IMG_9797.webp",
        "is_active": true,
        "created_at": "2025-12-17T00:26:57.293724+00:00",
        "updated_at": "2025-12-17T00:27:51.940478+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1765931214872_IMG_9797.webp",
        "bungalow_slug": null,
        "display_order": 10,
        "compression_stats": null
    },
    {
        "id": "480aad6b-e9f1-47cc-9ce8-b3f9fef64fbb",
        "alt_text": "Natureza Arara Azul",
        "category": "bungalows",
        "file_name": "5cbf228f-789b-4842-b6ce-6b1f2dd13d45.webp",
        "is_active": true,
        "created_at": "2025-12-16T21:19:09.742135+00:00",
        "updated_at": "2025-12-17T00:38:25.765356+00:00",
        "uploaded_by": null,
        "storage_path": "nature/1765919947790_5cbf228f-789b-4842-b6ce-6b1f2dd13d45.webp",
        "bungalow_slug": "bangalo-peneira",
        "display_order": 5,
        "compression_stats": null
    },
    {
        "id": "c2cf9180-5faf-402b-85e8-e6822fd61dee",
        "alt_text": "família Ribeirinha ",
        "category": "experiences",
        "file_name": "WhatsApp Image 2026-01-05 at 15.14.56.webp",
        "is_active": true,
        "created_at": "2026-01-05T19:36:54.071708+00:00",
        "updated_at": "2026-01-05T19:36:54.071708+00:00",
        "uploaded_by": null,
        "storage_path": "experiences/1767641811539_WhatsApp_Image_2026-01-05_at_15.14.56.webp",
        "bungalow_slug": null,
        "display_order": 0,
        "compression_stats": null
    },
    {
        "id": "9fbc9071-4f01-489a-8763-5182c41a21e6",
        "alt_text": "Bangalô Tupé",
        "category": "bungalows",
        "file_name": "Captura de tela 2026-06-15 133504.webp",
        "is_active": true,
        "created_at": "2026-06-15T16:36:06.883724+00:00",
        "updated_at": "2026-06-15T19:52:35.335885+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1781541365210_Captura_de_tela_2026-06-15_133504.webp",
        "bungalow_slug": "bangalo-tupe",
        "display_order": 2,
        "compression_stats": null
    },
    {
        "id": "17a58aec-ca93-44d7-b5a1-ec57a56a8d3b",
        "alt_text": "Bangalô Abano",
        "category": "bungalows",
        "file_name": "Captura de tela 2026-06-18 120217.webp",
        "is_active": true,
        "created_at": "2026-06-18T15:04:46.946723+00:00",
        "updated_at": "2026-06-18T15:04:46.946723+00:00",
        "uploaded_by": null,
        "storage_path": "bungalows/1781795085228_Captura_de_tela_2026-06-18_120217.webp",
        "bungalow_slug": "bangalo-abano",
        "display_order": 0,
        "compression_stats": null
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- hero_slides  (1 registros)
-- ============================================================
INSERT INTO public.hero_slides
SELECT * FROM jsonb_populate_recordset(null::public.hero_slides, $dados$
[
    {
        "id": "d6b74e7b-e231-4bdf-a39e-5bb8f4b026a8",
        "title": "WelCome",
        "alt_text": "WelCome",
        "link_url": null,
        "is_active": true,
        "created_at": "2026-06-14T16:48:40.625612+00:00",
        "media_type": "video",
        "object_fit": "cover",
        "updated_at": "2026-07-01T17:41:16.782204+00:00",
        "hide_overlay": false,
        "display_order": 0,
        "background_color": null,
        "mobile_image_url": null,
        "desktop_image_url": "https://lhcjucaevoouqozihzpv.supabase.co/storage/v1/object/public/gallery/hero/desktop_1781455693704_lv_0_20260611183341.mp4"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- google_reviews_cache  (5 registros)
-- ============================================================
INSERT INTO public.google_reviews_cache
SELECT * FROM jsonb_populate_recordset(null::public.google_reviews_cache, $dados$
[
    {
        "id": "d6f99e0f-34f1-42c7-9bcf-2c266f8aec1e",
        "text": "Lugar acolhedor, sem dúvidas todos levam a sério a palavra hospitalidade, me senti tão em casa que nem queria vir embora...\nA comida típica é muito boa, bem feita e saborosissima, provei os melhores peixes da Amazônia, inclusive a própria piranha que eu pesquei...\nOs quartos contam com ar condicionado, trás conforto e ao mesmo tempo rusticidade, a cama é maravilhosa e a rede também pra quem quiser uma experiência mais imersiva...\nNão tenho palavras que definam exatamente tudo que vivi nesse lugar.\nSem contar nas experiências que estavam inclusas no pacote... Fala sério! Foi perfeito ❤️🫰",
        "rating": 5,
        "updated_at": "2026-06-10T03:00:03.488279+00:00",
        "author_name": "Lara Cabral",
        "review_date": "2026-03-03T14:27:48+00:00",
        "profile_photo_url": "https://lh3.googleusercontent.com/a-/ALV-UjXdv_8hb-Sfav7IGo1MSTNXpRem2Qyh4M89vQ_xt76gQV1OW7Fo9g=s128-c0x00000000-cc-rp-mo"
    },
    {
        "id": "031c004e-8bf2-4755-832c-e2a542a037fe",
        "text": "Sem dúvidas a melhor experiência que eu já tive! Me senti em casa todos os minutos da viagem, formando uma família amazônica que sentirei saudades\n\nOs passeios são nota mil! O guia Washington foi incrível! Conhece de tudo da Amazônia e faz questão de proporcionar experiências ótimas\n\nAlém disso, o atendimento desde a reserva foi excelente. Tive um problema com a minha passagem e rapidamente me ajudaram\n\nQuem não for para esse paraíso está perdendo e muito !",
        "rating": 5,
        "updated_at": "2026-06-10T03:00:03.527214+00:00",
        "author_name": "Allan Gomes",
        "review_date": "2026-02-20T17:33:14+00:00",
        "profile_photo_url": "https://lh3.googleusercontent.com/a-/ALV-UjVy965JcHnoTr2PJ9y0XMVHZL3Xw2UYxndlwF09qu8yo_3j1xe8=s128-c0x00000000-cc-rp-mo"
    },
    {
        "id": "421a6df1-043d-4803-bdb1-f8e1f145a80b",
        "text": "Amei ficar na Pousada Arara Azul. Comida típica da região e hospitalidade maravilhosa.",
        "rating": 5,
        "updated_at": "2026-06-10T03:00:03.550435+00:00",
        "author_name": "raquel nass",
        "review_date": "2026-02-17T17:12:06+00:00",
        "profile_photo_url": "https://lh3.googleusercontent.com/a/ACg8ocIG8Nw_r6R2CdX4-O7q9yXGzRJ90b2EzAUS2W3SmB3Vo89rLA=s128-c0x00000000-cc-rp-mo"
    },
    {
        "id": "1d946842-6c7a-4db8-9703-86a346bbbce8",
        "text": "Lugar incrível, atendimento de excelência super recomendo!!!!",
        "rating": 5,
        "updated_at": "2026-06-10T03:00:03.572109+00:00",
        "author_name": "Liliane Feitosa",
        "review_date": "2026-05-28T13:34:02+00:00",
        "profile_photo_url": "https://lh3.googleusercontent.com/a-/ALV-UjWPD6xxBfTeQRAgskqHXUsb_gYl9KIyAUa4iEY-mrg0XC_-MtyFUQ=s128-c0x00000000-cc-rp-mo"
    },
    {
        "id": "dd19465a-7ec0-4bef-9e2c-19ff7bb5e617",
        "text": "Inesquecível",
        "rating": 5,
        "updated_at": "2026-06-10T03:00:03.589088+00:00",
        "author_name": "Francillene de Oliveira Barroso",
        "review_date": "2026-05-28T03:06:58+00:00",
        "profile_photo_url": "https://lh3.googleusercontent.com/a/ACg8ocI8EpX9OIbjD3D1jqKmjik4PXesZ5yfuf9DcqQKknsak0SWjw=s128-c0x00000000-cc-rp-mo"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- reservations  (14 registros)
-- ============================================================
INSERT INTO public.reservations
SELECT * FROM jsonb_populate_recordset(null::public.reservations, $dados$
[
    {
        "id": "38328b73-0fe5-4601-806e-1a166e400897",
        "cpf": null,
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "11111111-1111-1111-1111-111111111111",
        "user_id": null,
        "check_in": "2026-08-04",
        "passport": "C84V1K7YJ",
        "check_out": "2026-08-07",
        "payer_cpf": null,
        "room_name": "Bangalô Peneira",
        "birth_date": null,
        "created_at": "2026-05-17T00:33:11.348795+00:00",
        "daily_rate": 2300,
        "guest_name": "Anne Kathrin Wegele",
        "is_foreign": false,
        "package_id": "3dcb216e-957f-4b88-80ca-ea37483dbd0b",
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "annewegele@gmx.de",
        "guest_phone": "+491525 5709159",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 10590.00,
        "situacao_fnrh": null,
        "accepted_terms": false,
        "documento_tipo": "PASSAPORTE",
        "guest_language": "de",
        "payment_method": null,
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": "* Jungle Walk\n* Piranha Fishing\n* Local Community Visit\n* Cayman Spotting\n* Anavilhanas Tour with lunch prepared on site\n* Bilingual guide during the toursecial de experiências:\n\n\nTotal package price: R$ 10,590.00",
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": null,
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "cpf": null,
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "f003cc14-eb49-464f-a2e2-14c970ae2dad",
        "user_id": null,
        "check_in": "2026-08-11",
        "passport": "22AF04504",
        "check_out": "2026-08-13",
        "payer_cpf": null,
        "room_name": "Bangalô Tupé",
        "birth_date": null,
        "created_at": "2026-07-29T16:56:11.415373+00:00",
        "daily_rate": 2392.4,
        "guest_name": "Florent Rossi",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "florent_rossi@yahoo.fr",
        "guest_phone": "+33 6 15 46 08 25",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 9060.00,
        "situacao_fnrh": "DADOS_INCOMPLETOS",
        "accepted_terms": false,
        "documento_tipo": "PASSAPORTE",
        "guest_language": "fr",
        "payment_method": null,
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": null,
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": null,
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": "Dados obrigatórios ausentes: Data de nascimento é obrigatória.",
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "cpf": "349.398.088-40",
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "22222222-2222-2222-2222-222222222222",
        "user_id": null,
        "check_in": "2026-07-24",
        "passport": null,
        "check_out": "2026-07-28",
        "payer_cpf": null,
        "room_name": "Bangalô Paneiro",
        "birth_date": null,
        "created_at": "2026-07-04T13:02:33.843969+00:00",
        "daily_rate": 11174.44,
        "guest_name": "Paola Veri Tufano ",
        "is_foreign": false,
        "package_id": "3dcb216e-957f-4b88-80ca-ea37483dbd0b",
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "paolaroma81@gmail.com",
        "guest_phone": "+39-3447159220",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 11174.44,
        "situacao_fnrh": null,
        "accepted_terms": false,
        "documento_tipo": "CPF",
        "guest_language": "en",
        "payment_method": null,
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": null,
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": "1 das hóspedes é vegetariana",
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "cpf": null,
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "11111111-1111-1111-1111-111111111111",
        "user_id": null,
        "check_in": "2026-02-05",
        "passport": "999999999999999",
        "check_out": "2026-02-08",
        "payer_cpf": null,
        "room_name": "Bangalô Peneira",
        "birth_date": null,
        "created_at": "2026-02-20T15:37:42.156828+00:00",
        "daily_rate": 2393.98,
        "guest_name": "Alejandra Urrutia Pinto",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "chalesepousadaararaazul@gmail.com",
        "guest_phone": "+55 84 9914-6408",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 1950.75,
        "situacao_fnrh": null,
        "accepted_terms": false,
        "documento_tipo": "PASSAPORTE",
        "guest_language": "pt",
        "payment_method": null,
        "payment_status": "pending",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": null,
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": "Pacote de experiências:\nPasseio pela floresta alagada: R$ 460,00\nArquipélago de Anavilhanas: R$ 720,00\nFocagem noturna de jacarés: R$ 770,00\nCaminhada na selva: R$ 460,00\n R$ 2.410,00\nAlimentação: R$1200,00\nTotal: R$3610,00 pago a parte\n",
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "booking",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "cpf": " 349.398.088-40",
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "user_id": null,
        "check_in": "2026-07-24",
        "passport": null,
        "check_out": "2026-07-28",
        "payer_cpf": null,
        "room_name": "Bangalô Abano",
        "birth_date": null,
        "created_at": "2026-07-04T12:58:23.579704+00:00",
        "daily_rate": 11174.44,
        "guest_name": "Paola Veri Tufano ",
        "is_foreign": false,
        "package_id": "3dcb216e-957f-4b88-80ca-ea37483dbd0b",
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "paolaroma81@gmail.com",
        "guest_phone": "+39-3447159220",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 11174.44,
        "situacao_fnrh": "DADOS_INCOMPLETOS",
        "accepted_terms": false,
        "documento_tipo": "CPF",
        "guest_language": "pt",
        "payment_method": null,
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": null,
        "checkin_completed": true,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": "1 das hóspedes é vegetariana",
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": "Dados obrigatórios ausentes: Data de nascimento é obrigatória.",
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "cpf": "10766658708",
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "33333333-3333-3333-3333-333333333333",
        "user_id": null,
        "check_in": "2026-01-20",
        "passport": null,
        "check_out": "2026-01-23",
        "payer_cpf": null,
        "room_name": "Bangalô Tipiti",
        "birth_date": null,
        "created_at": "2026-01-15T16:41:24.468618+00:00",
        "daily_rate": 1971.6,
        "guest_name": "Vinicius Cardoso Reis",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "vincreis@gmail.com",
        "guest_phone": "21986606262",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 9440.02,
        "situacao_fnrh": null,
        "accepted_terms": false,
        "documento_tipo": "CPF",
        "guest_language": "pt",
        "payment_method": "PIX",
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": "Comida Vegana",
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": null,
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "cpf": "07825414705",
        "genero": "NAO_INFORMADO",
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "user_id": null,
        "check_in": "2026-08-29",
        "passport": null,
        "check_out": "2026-09-02",
        "payer_cpf": null,
        "room_name": "Bangalô Abano",
        "birth_date": "1995-09-19",
        "created_at": "2026-07-01T15:15:28.890439+00:00",
        "daily_rate": 10794.96,
        "guest_name": "Simonie Ting",
        "is_foreign": false,
        "package_id": "3dcb216e-957f-4b88-80ca-ea37483dbd0b",
        "payer_name": null,
        "updated_at": "2026-09-03T14:04:26.725238+00:00",
        "accepted_at": null,
        "guest_email": "simonieting@yahoo.com.br",
        "guest_phone": "21 98272-5513",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 10794.96,
        "situacao_fnrh": "PRECHECKIN_PENDENTE",
        "accepted_terms": false,
        "documento_tipo": "CPF",
        "guest_language": "pt",
        "payment_method": null,
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": "3778116d-f52f-48c5-afa2-64e08a399060",
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": "experiências\n- Interação com botos\n- contemplação do nascer do sol\n- Caminhada na selva\n- Focagem noturna de jacarés\n- Interação com os Macacos do Ariaú\n- Samaúma gigante, árvore mãe da floresta\n- Pescaria de piranhas\n- Visita à comunidade São Thomé\n- Interação com pirarucú\n- Visita à aldeia Indígena Tatuio\n - Arquipélago de Anavilhanas com almoço ribeirinho na praia.",
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": "Reserva mãe e filho\nTer gelo disponível",
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": true,
        "operational_status": "confirmed",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": true,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": "2026-08-14T10:00:07.731+00:00",
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "cpf": null,
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "user_id": null,
        "check_in": "2026-08-11",
        "passport": "22AF04504",
        "check_out": "2026-08-13",
        "payer_cpf": null,
        "room_name": "Bangalô Abano",
        "birth_date": null,
        "created_at": "2026-07-29T16:51:08.100588+00:00",
        "daily_rate": 2392.4,
        "guest_name": "Florent Rossi",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "florent_rossi@yahoo.fr",
        "guest_phone": "+33 6 15 46 08 25",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 6040.00,
        "situacao_fnrh": "DADOS_INCOMPLETOS",
        "accepted_terms": false,
        "documento_tipo": "PASSAPORTE",
        "guest_language": "fr",
        "payment_method": null,
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": null,
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": null,
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": true,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": "Dados obrigatórios ausentes: Data de nascimento é obrigatória.",
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "cpf": null,
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "22222222-2222-2222-2222-222222222222",
        "user_id": null,
        "check_in": "2026-02-20",
        "passport": "999999999999999",
        "check_out": "2026-02-24",
        "payer_cpf": null,
        "room_name": "Bangalô Paneiro",
        "birth_date": null,
        "created_at": "2026-02-20T14:40:50.867143+00:00",
        "daily_rate": 598.99,
        "guest_name": "Alex Espinoza",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "chalesepousadaararaazul@gmail.com",
        "guest_phone": "+56 9 9640 7213",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 2754.00,
        "situacao_fnrh": null,
        "accepted_terms": false,
        "documento_tipo": "PASSAPORTE",
        "guest_language": "pt",
        "payment_method": "booking",
        "payment_status": "pending",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": null,
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": "Pacote de experiências: R$2009,00\nInteração com botos-cor-de-rosa\nVisita à Aldeia Indígena\nPesca de piranhas\nObservação noturna de jacarés\nCaminhada na selva amazônica\nRegime de pensão completa (café da manhã, almoço e jantar).\nValor total para duas pessoas: R$ 1.600,00.\n**vai pagar em dinheiro R$4259,00 referente a alimentação, experiências e transfer**\n",
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "booking",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "cpf": null,
        "genero": null,
        "guests": 2,
        "status": "confirmed",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "user_id": null,
        "check_in": "2026-09-27",
        "passport": "770641367",
        "check_out": "2026-09-30",
        "payer_cpf": null,
        "room_name": "Bangalô Abano",
        "birth_date": null,
        "created_at": "2026-08-22T12:40:13.677023+00:00",
        "daily_rate": 2392.4,
        "guest_name": "Irina Korchagina",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "bibikova.irina@list.ru",
        "guest_phone": "+79221572737",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 13011.00,
        "situacao_fnrh": "DADOS_INCOMPLETOS",
        "accepted_terms": false,
        "documento_tipo": "PASSAPORTE",
        "guest_language": "en",
        "payment_method": null,
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": "alergia a trigo\nexperiências:\nEncontro das águas \nfocagem noturna de jacarés\ncaminhada na selva\nbotos\npescaria de piranha\nanavilhanas com almoço na praia\nsão tomé + horta vovó vânia\nritual de ayahuaska\nnascer do sol\nsamauma\nmacaquinhos Ariaú",
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": null,
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "confirmed",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": true,
        "erro_sincronizacao_fnrh": "Dados obrigatórios ausentes: Data de nascimento é obrigatória.",
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": "2026-08-22T12:40:19.428+00:00",
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "cpf": "032.664.036-30",
        "genero": null,
        "guests": 3,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "22222222-2222-2222-2222-222222222222",
        "user_id": null,
        "check_in": "2026-07-16",
        "passport": null,
        "check_out": "2026-07-20",
        "payer_cpf": null,
        "room_name": "Bangalô Paneiro",
        "birth_date": null,
        "created_at": "2026-06-16T16:54:08.241173+00:00",
        "daily_rate": 2393.98,
        "guest_name": "Welington Pereira",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "wptonp@gmail.com",
        "guest_phone": "+55 31 9241-6921",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 11382.00,
        "situacao_fnrh": "PRECHECKIN_REALIZADO",
        "accepted_terms": false,
        "documento_tipo": "CPF",
        "guest_language": "en",
        "payment_method": "Crédito 6x",
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": "Pacote de experiências incluso no valor:\n- Pescaria de piranhas\n- Focagem noturna de jacarés\n- Interação com o boto-cor-de-rosa\n- Interação com os macaquinhos do Ariaú\n- Visita à Comunidade Corinthians e ao Projeto de Conservação dos Quelônios do Rio Negro\n- Visita à Aldeia Indígena Kubewa\n- Trilha guiada na selva\n- Visita à casa de farinha e experiência \"Cheiro da Floresta\"",
        "checkin_completed": true,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": null,
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 3
    },
    {
        "id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "cpf": "43418502881",
        "genero": null,
        "guests": 2,
        "status": "cancelled",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "33333333-3333-3333-3333-333333333333",
        "user_id": null,
        "check_in": "2026-02-20",
        "passport": null,
        "check_out": "2026-02-23",
        "payer_cpf": "43418502881",
        "room_name": "Bangalô Tipiti",
        "birth_date": "1994-04-04",
        "created_at": "2026-01-13T16:31:31.91061+00:00",
        "daily_rate": null,
        "guest_name": "Jeniffer Larrussa Leite da Silva",
        "is_foreign": false,
        "package_id": null,
        "payer_name": "Jeniffer Larrussa Leite da Silva",
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "larussajeniffer@gmail.com",
        "guest_phone": "5511979525665",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": "larussajeniffer@gmail.com",
        "total_price": 6550.00,
        "situacao_fnrh": null,
        "accepted_terms": false,
        "documento_tipo": "CPF",
        "guest_language": "pt",
        "payment_method": "pix",
        "payment_status": "failed",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": "00020126580014br.gov.bcb.pix0136b21cc3b2-c869-4e13-900e-9e150494234252040000530398654077181.955802BR5910JEARIANE096008So Paulo62250521mpqrinter1412059492796304E465",
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": null,
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": "141205949279",
        "operational_notes": null,
        "payment_intent_id": null,
        "payment_reference": "141205949279",
        "checkout_completed": false,
        "operational_status": "pending",
        "payment_ticket_url": "https://www.mercadopago.com.br/payments/141205949279/ticket?caller_id=3131718211&hash=be538fdb-f9d1-4fb8-882d-892795d4df1c",
        "reservation_source": "site",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAABWQAAAVkAQMAAABpQ4TyAAAABlBMVEX///8AAABVwtN+AAAKI0lEQVR42uzdQZIauRIGYBG9YMkR+ih9NDgaR+EILFkQ6MVjEJUpCTce90zEwPdvHC5j1Qc7SalUERERERERERERERERERERERERERERERERERERERERkX8xn3XM7vZv61qPpXwtD0opm1r3y9/W18/vS9n+/8/z9Z//Simr65/H6+e2t6en6ycO1wdhxCF7WlpaWlpaWlpaWlpaWtr30+77B7tSwtj729gf1wdl4X9cP3S4Pmg5thFrvUx+kFPCnSfff0aipaWlpaWlpaWlpaWlpf372vyy3eRz/Rx+dX3Zuml3twn5nV+WB3X5/vEVWRvm8LS0tLS0tLS0tLS0tLS0tGk9IW6Bt/WETb/Lfkib5Mdl+eASVhzKbYFhHb5BGJGWlpaWlpaWlpaWlpaW9t/UXkLd+MOxhz30YLnvsg+F5J/LJwotLS0tLS0tLS0tLS0tLe0vqtyvY9+L2gdte/WpvXq3vLrxL+HB9qY9pbPf5adq8mlpaWlpaWlpaWlpaWlpX0E7672W1xNaTXp4MKtyPwdtSQ+y9jCpIfijTnG0tLS0tLS0tLS0tLS0tM+nzb/LfIe8zb+DNs7QyzKHD/3G79+/veJcfii0tLS0tLS0tLS0tLS0tK+g/VWntLp0R4+fb93RT/MFiXAOPd8Idi+MbzeIDVeKrZevS0tLS0tLS0tLS0tLS0v7dtphqPkCw6/WE1ZtfeBzOXY+LBjE9YR2TP04ecWelpaWlpaWlpaWlpaWlvaPtWHs3Pt8lYfqu6MPVe5xxHb2+xxGzO3d2lnx3IC9hCk7LS0tLS0tLS0tLS0tLe27affT68pWqdVa6ce+5K+767//0Hst1M1/pm5ueVe+0tLS0tLS0tLS0tLS0tL+kDbvoR9THfj33cHzfDq+rN7qwIfOannL/MEdY4WWlpaWlpaWlpaWlpaW9v20Q7ZT7Ue/y/7Rxg7LAcf2/Usqex925bdpPSFXudPS0tLS0tLS0tLS0tLSvqH2M93BXdPywbrvvbZOvdTO86L2dn9Z/D55x7/hzvNX1O9vGKelpaWlpaWlpaWlpaWl/V7b/uelf3SfT7ct9nhnd+smHu4Mu/RV7jXP0OdV7jX1G39yPYGWlpaWlpaWlpaWlpaW9iW1X/2W+S4tMOznm+ph7NAdfVYVXyft3YZz6IFPS0tLS0tLS0tLS0tLS/ue2pZ1OiR+6W8bK5P1hPrwHHre8S/TKvf798nXgn9+t+NPS0tLS0tLS0tLS0tLS/uMNt8INjQ3L5Oxa68djnrnXflZu/T87eqzM3RaWlpaWlpaWlpaWlpa2lfVtuWDWY35Og12DtpwZ/fs1HjuvZYL6TfL94kH07dLIf0T59BpaWlpaWlpaWlpaWlpab/XPrgALAz1dTuYfe57r81yXG4Bf3xnd+kffC2XftPS0tLS0tLS0tLS0tLSvqd2VtS+vS0HxJPdbYP7mA5yh6zyUe+8h97Oip/m6wlfS3e2pzvF0dLS0tLS0tLS0tLS0tK+lDbM/tehZD2vErQa9lO/438fYLssH+Tea0FbJnXz6/5g+pqWlpaWlpaWlpaWlpaW9ue0eexckz40Az/OLwALJ7vr7fvXcIn3rG6+Pdv0d3bT0tLS0tLS0tLS0tLS0r6hNtwIltMtMPSd0u53dn/2/3Fohp7XEzaPRqxhxD0tLS0tLS0tLS0tLS0t7ftpZ9eVhWPkocr9NO8UVxfOZjlGHuvgt7U+czD9XJ4KLS0tLS0tLS0tLS0tLe3z2mE+nW8EK33Ze9shX7eD3I2/eXgjWC5qL6luft93c9vT0tLS0tLS0tLS0tLS0r6ptkzWE/KDeLnY0B09rCeEzmrnsHyQ99DrZD0hl8nT0tLS0tLS0tLS0tLS0v6I9mHd+LFvBj7bIX9YeJ5xl1w3Pp/zP7fjT0tLS0tLS0tLS0tLS0v7atqHG9yrVNQ+7Hhf2n8JF4B9hJPdDXDsX5HXH4YHtLS0tLS0tLS0tLS0tLTvqS2pJj3gVmE7vqSxh+34VuU+Wx/YTFYoSjqH/vtV7rS0tLS0tLS0tLS0tLS0v6MdKs7vNen7/obtcCNYmGDfj4b/xS8lNhTfLa8It3rPTnY/12+clpaWlpaWlpaWlpaWlvZVtbFTWltPiAl3ds8XGFb5n8MeenjFOvHPkweFlpaWlpaWlpaWlpaWlvattTVv8E923+/ar1T2XlKV+3F5Wfy6oaj9uCxZ5AFq+L1oaWlpaWlpaWlpaWlpaf9cG8Y+TTqllTT2jH+4feIyGfxj0s3tMT83YKelpaWlpaWlpaWlpaWlfTdtbl1+SBXnw4rDJp0yD3d2D7jaryes+ir3e75Sd7bD43UPWlpaWlpaWlpaWlpaWtrf0obp8IPea8PJ7t3tRrB1mn/nOfxqDj8uv9A5XzoWNtVpaWlpaWlpaWlpaWlpad9NG67czrhVKEEP57DD2MPsP1a555Pd235XPtfN5z30Ay0tLS0tLS0tLS0tLS3t+2lzlfvsEu+v+f583zpt1a4rGy7xHqrcD2mFItQExLp5WlpaWlpaWlpaWlpaWto/19Zlhr5Zhlr1Ve7n8LftWOW+CjvkbYZ+7uf8NfVemzVjq0+d7KalpaWlpaWlpaWlpaWlfU3tMLcPm+pf/ZXb+6XVWtjxHora7+3Sy/KJ0/yd+9sPUmlpaWlpaWlpaWlpaWlp31i7Tx889GPnQ+JBG2f/2/6UeUklANtpM7pzqCHIreZoaWlpaWlpaWlpaWlpaX9EW5cN7tzLPFset1rLVe6130P/TCfB7z/I0D/9N9YTaGlpaWlpaWlpaWlpaWlfTVuWU+MlFbXXnp9bl69y2Xv5xXLA8IMcHtXN09LS0tLS0tLS0tLS0tL+rHYo6r7Oli+5vfiEX9KUfdiEL23LPCfssg93fD/THZ2WlpaWlpaWlpaWlpaW9qW1ZbKecHq4wBDWHz4T/46bV7kP3y7fQvbx7HoCLS0tLS0tLS0tLS0tLe2raT8nKwJ5tWCoct8vO/65O3qucr883PGv05Pt9ffuL6OlpaWlpaWlpaWlpaWlrc/d2R0f7JaXbVIz8FPjhJcNM/RWw3751TZ920PPM/Ty3R46LS0tLS0tLS0tLS0tLe1ra3MJ+tAHLfcyLyWeQ/+cVLkPJ9u3k233SZX7M53iaGlpaWlpaWlpaWlpaWnfTntK6wnndjA99HU7Ldp4RXfQbvqi9k3qFHc/6j4sMNDS0tLS0tLS0tLS0tLS/jPatp997De4a8KdelwY8cEMfdO3Wrtr//4MnZaWlpaWlpaWlpaWlpb2RbSTKvc6OTVeJ2O3c+il3yGPB9NDv/UHI4YHtLS0tLS0tLS0tLS0tLQ/pf2m91qYT5elU9oll33v0iXeX7cZfX7FXXtY5vzlpzvF0dLS0tLS0tLS0tLS0tL+N7UiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiL/lfwvAAD//5ooLx9RWQ3DAAAAAElFTkSuQmCC",
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "cpf": null,
        "genero": null,
        "guests": 2,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "33333333-3333-3333-3333-333333333333",
        "user_id": null,
        "check_in": "2026-02-25",
        "passport": "999999999999999",
        "check_out": "2026-03-02",
        "payer_cpf": null,
        "room_name": "Bangalô Tipiti",
        "birth_date": null,
        "created_at": "2026-02-20T15:53:01.113045+00:00",
        "daily_rate": 2393.98,
        "guest_name": "Jansen Dominique Hunink",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "chalesepousadaararaazul@gmail.com",
        "guest_phone": "+31 6 53482782",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 3251.25,
        "situacao_fnrh": null,
        "accepted_terms": false,
        "documento_tipo": "PASSAPORTE",
        "guest_language": "pt",
        "payment_method": null,
        "payment_status": "pending",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": null,
        "checkin_completed": false,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": "Pacote de Experiências:\n**Passeios exclusivos com guia bilíngue** custo R$1800,00\nAlmoço e jantar incluídos\nExperiência com botos-cor-de-rosa\nVisita a cachoeira\nCaminhada privativa na selva\nValor total alimentação e experiências: R$ 5.690,00",
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "booking",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": null,
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 2
    },
    {
        "id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "cpf": "250.640.828-27",
        "genero": null,
        "guests": 1,
        "status": "finished",
        "address": null,
        "country": null,
        "is_test": false,
        "room_id": "33333333-3333-3333-3333-333333333333",
        "user_id": null,
        "check_in": "2026-07-24",
        "passport": null,
        "check_out": "2026-07-25",
        "payer_cpf": null,
        "room_name": "Bangalô Tipiti",
        "birth_date": null,
        "created_at": "2026-07-22T13:40:23.229104+00:00",
        "daily_rate": 1499.99,
        "guest_name": "Safira Celeste Perez De La Sala Gonzalez ",
        "is_foreign": false,
        "package_id": null,
        "payer_name": null,
        "updated_at": "2026-09-02T00:07:50.846004+00:00",
        "accepted_at": null,
        "guest_email": "safiradelasala@gmail.com",
        "guest_phone": "+55 11 98923-7347",
        "mp_order_id": null,
        "nationality": "BR",
        "payer_email": null,
        "total_price": 3900.00,
        "situacao_fnrh": "DADOS_INCOMPLETOS",
        "accepted_terms": false,
        "documento_tipo": "CPF",
        "guest_language": "en",
        "payment_method": null,
        "payment_status": "paid",
        "pessoa_id_fnrh": null,
        "fnrh_checkin_em": null,
        "hospede_id_fnrh": null,
        "link_precheckin": null,
        "payment_qr_code": null,
        "reserva_id_fnrh": null,
        "fnrh_checkout_em": null,
        "next_destination": null,
        "special_requests": "Visita à Samaúma Gigante, \nInteração com os botos na praia do Senhor Davi;\nInteração com os macaquinhos do Ariaú;\nVisita a uma praia de água doce.\nNascer do sol no rio negro",
        "checkin_completed": true,
        "emergency_contact": null,
        "mp_transaction_id": null,
        "operational_notes": null,
        "payment_intent_id": null,
        "payment_reference": null,
        "checkout_completed": false,
        "operational_status": "finished",
        "payment_ticket_url": null,
        "reservation_source": "manual",
        "transaction_amount": null,
        "channel_reference_id": null,
        "dietary_restrictions": null,
        "transaction_currency": "BRL",
        "payment_qr_code_base64": null,
        "pre_checkin_email_sent": false,
        "erro_sincronizacao_fnrh": "Dados obrigatórios ausentes: Data de nascimento é obrigatória.",
        "quantidade_hospede_menor": 0,
        "pre_checkin_email_sent_at": null,
        "quantidade_hospede_adulto": 1
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- reservation_rooms  (14 registros)
-- ============================================================
INSERT INTO public.reservation_rooms
SELECT * FROM jsonb_populate_recordset(null::public.reservation_rooms, $dados$
[
    {
        "id": "35389b67-090d-4530-bc0a-bf3cf6336adc",
        "guests": 2,
        "room_id": "33333333-3333-3333-3333-333333333333",
        "position": 0,
        "subtotal": 9440.02,
        "room_name": "Bangalô Tipiti",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 1971.6,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93"
    },
    {
        "id": "114442e8-f76a-48bd-8c94-cf30a33fcfe4",
        "guests": 2,
        "room_id": "22222222-2222-2222-2222-222222222222",
        "position": 0,
        "subtotal": 2754.00,
        "room_name": "Bangalô Paneiro",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 598.99,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c"
    },
    {
        "id": "47240518-54af-49de-bb71-17ef82006577",
        "guests": 2,
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "position": 0,
        "subtotal": 11174.44,
        "room_name": "Bangalô Abano",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 11174.44,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885"
    },
    {
        "id": "a5ab744d-fc38-42de-98a3-ac6e04a81c05",
        "guests": 2,
        "room_id": "22222222-2222-2222-2222-222222222222",
        "position": 0,
        "subtotal": 11174.44,
        "room_name": "Bangalô Paneiro",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 11174.44,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "4d4c0be6-3600-4148-9826-22f214f68bfe"
    },
    {
        "id": "cdbf0028-c2b5-4101-a91a-3e519416a07a",
        "guests": 2,
        "room_id": "11111111-1111-1111-1111-111111111111",
        "position": 0,
        "subtotal": 1950.75,
        "room_name": "Bangalô Peneira",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 2393.98,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9"
    },
    {
        "id": "8b905ffb-e4ae-4e88-ae2b-b05aae473099",
        "guests": 3,
        "room_id": "22222222-2222-2222-2222-222222222222",
        "position": 0,
        "subtotal": 11382.00,
        "room_name": "Bangalô Paneiro",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 2393.98,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2"
    },
    {
        "id": "1f3d2cf1-ab0d-4ba0-a6e5-a050d76f3df2",
        "guests": 1,
        "room_id": "33333333-3333-3333-3333-333333333333",
        "position": 0,
        "subtotal": 3900.00,
        "room_name": "Bangalô Tipiti",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 1499.99,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482"
    },
    {
        "id": "9473348a-92e4-45c2-a210-3b50037bdbc5",
        "guests": 2,
        "room_id": "33333333-3333-3333-3333-333333333333",
        "position": 0,
        "subtotal": 3251.25,
        "room_name": "Bangalô Tipiti",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 2393.98,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "455dfd11-89f9-4d05-a705-3a3887ffa048"
    },
    {
        "id": "2a3a08a6-b02d-46b4-8999-22b23cca9dd7",
        "guests": 2,
        "room_id": "33333333-3333-3333-3333-333333333333",
        "position": 0,
        "subtotal": 6550.00,
        "room_name": "Bangalô Tipiti",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": null,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245"
    },
    {
        "id": "a54d6251-cd68-4eea-a510-a794299bc872",
        "guests": 2,
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "position": 0,
        "subtotal": 10794.96,
        "room_name": "Bangalô Abano",
        "created_at": "2026-08-11T22:02:09.821001+00:00",
        "daily_rate": 10794.96,
        "updated_at": "2026-08-11T22:02:09.821001+00:00",
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398"
    },
    {
        "id": "2b48eb3b-57d5-4479-9730-2853fffcbbf9",
        "guests": 2,
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "position": 0,
        "subtotal": null,
        "room_name": "Bangalô Abano",
        "created_at": "2026-08-22T12:45:34.494442+00:00",
        "daily_rate": 2392.4,
        "updated_at": "2026-08-22T12:45:34.494442+00:00",
        "reservation_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5"
    },
    {
        "id": "c46bc852-52e9-4325-bc66-cfe873cc0df5",
        "guests": 2,
        "room_id": "11111111-1111-1111-1111-111111111111",
        "position": 0,
        "subtotal": null,
        "room_name": "Bangalô Peneira",
        "created_at": "2026-08-25T15:09:22.558841+00:00",
        "daily_rate": 2300,
        "updated_at": "2026-08-25T15:09:22.558841+00:00",
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897"
    },
    {
        "id": "19ec7384-2ae1-484f-92a5-8cf2abf0721d",
        "guests": 2,
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "position": 0,
        "subtotal": null,
        "room_name": "Bangalô Abano",
        "created_at": "2026-08-25T15:09:38.250276+00:00",
        "daily_rate": 2392.4,
        "updated_at": "2026-08-25T15:09:38.250276+00:00",
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd"
    },
    {
        "id": "07b523b4-a57d-4b50-9a4b-b6366cc1c9d6",
        "guests": 2,
        "room_id": "f003cc14-eb49-464f-a2e2-14c970ae2dad",
        "position": 0,
        "subtotal": null,
        "room_name": "Bangalô Tupé",
        "created_at": "2026-08-25T15:09:47.810146+00:00",
        "daily_rate": 2392.4,
        "updated_at": "2026-08-25T15:09:47.810146+00:00",
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- reservation_experiences  (0 registros)
-- ============================================================
-- (tabela vazia no banco de origem)

-- ============================================================
-- booking_checkins  (3 registros)
-- ============================================================
INSERT INTO public.booking_checkins
SELECT * FROM jsonb_populate_recordset(null::public.booking_checkins, $dados$
[
    {
        "id": "16395f88-05da-4883-ba6e-1613c061c56e",
        "notes": null,
        "address": "Rua Chefe Pereira, 220",
        "document": "032664036",
        "full_name": "Welington Pereira",
        "birth_date": "1977-02-26",
        "city_state": "Belo horizonte/MG",
        "created_at": "2026-07-16T13:44:22.85626+00:00",
        "nationality": "Brasileira",
        "travel_reason": "lazer",
        "accepted_terms": true,
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "transport_mode": "carro",
        "estimated_arrival_time": "12:00"
    },
    {
        "id": "faf21086-63d4-44f7-9ef9-1fc8892a61af",
        "notes": null,
        "address": "Aeroporto",
        "document": "YB8170803",
        "full_name": "Paola Veri Tufano",
        "birth_date": "1981-03-22",
        "city_state": "São Paulo",
        "created_at": "2026-07-23T10:56:47.68645+00:00",
        "nationality": "Italian",
        "travel_reason": "lazer",
        "accepted_terms": true,
        "reservation_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "transport_mode": "outro",
        "estimated_arrival_time": "10:40"
    },
    {
        "id": "c1c845a7-f396-47d5-a953-bce85e90bd16",
        "notes": "nao como ovo",
        "address": "Rua Abilio Soares, 353 apto 144",
        "document": "25064082827",
        "full_name": "Safira Celeste Perez De La Sala Gonzalez",
        "birth_date": "1988-12-17",
        "city_state": "Sao Paulo",
        "created_at": "2026-07-23T12:43:14.541956+00:00",
        "nationality": "Brasileira",
        "travel_reason": "negocios",
        "accepted_terms": true,
        "reservation_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "transport_mode": "aviao_barco",
        "estimated_arrival_time": "10"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- booking_checkouts  (2 registros)
-- ============================================================
INSERT INTO public.booking_checkouts
SELECT * FROM jsonb_populate_recordset(null::public.booking_checkouts, $dados$
[
    {
        "id": "778ef029-0744-40b1-93fa-5b85070f6b73",
        "issues": null,
        "rating": 5,
        "comment": null,
        "created_at": "2026-08-14T15:45:33.590093+00:00",
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd"
    },
    {
        "id": "d199bb1a-2c8b-468b-9a97-4e0065e606ae",
        "issues": "Pequenas coisas que poderiam melhorar pra deixar mais confortável, \na luz do quarto, que é muito escuro, principalmente a noite.. difícil de achar as coisas, fazer as coisas no quarto de tão escuro..  \nmas também, um dos motivos de estar tão escuro o quarto (de dia principalmente) é porque a cortina tem que ficar fechada, pro ar refrigerado não escapar..  então, colocar uma janela que não permita o ar escapar, e deixar a luz entrar, poderia ja melhorar muito! \noutra sugestão, deixar uma geladeira coletiva na área que fazemos as refeições.. porque ficar sem geladeira, Lene, Washington e Felipe foram ótimos, sempre levando e trazendo coisas pra mimda geladeira.. kkkk mas seria bem mais confortável ter uma geladeira na área comum..\n\nColocaria tela também na janelinha do banheiro, tive que tirar 2 vespas do chuveiro na minha estadia.. eu acho que entrou por lá.. \n\nAcho que são essas as mudanças que deixariam a estadia mais confortável.. \nEspero ter ajudado!",
        "rating": 4,
        "comment": "Gostei demais dessa viagem, me senti em casa, percebemos a boa intenção de todos de fazer a gente se sentir bem lá.. Achei isso o ponto forte de toda experiência.",
        "created_at": "2026-09-03T14:04:26.725238+00:00",
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- booking_tokens  (16 registros)
-- ============================================================
INSERT INTO public.booking_tokens
SELECT * FROM jsonb_populate_recordset(null::public.booking_tokens, $dados$
[
    {
        "id": "c6c29aff-c6f7-4309-adc4-e2fed8aa6e10",
        "type": "checkout",
        "used": false,
        "token": "43fbd35a1c574f99afd8bed90d4a21e230551238c3a64f5f",
        "created_at": "2026-03-03T13:32:03.880139+00:00",
        "expires_at": "2026-03-05T13:32:03.824+00:00",
        "reservation_id": "455dfd11-89f9-4d05-a705-3a3887ffa048"
    },
    {
        "id": "dcf9dd68-6a5c-4ab6-957b-6829612da5e3",
        "type": "checkin",
        "used": true,
        "token": "e150f68e5ec540a5937136604be14feb77a7ce3f764a425c",
        "created_at": "2026-07-15T10:00:04.083301+00:00",
        "expires_at": "2026-07-17T10:00:04.044+00:00",
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2"
    },
    {
        "id": "a4fe257a-6a8b-449e-8c51-a02beaea985e",
        "type": "checkout",
        "used": false,
        "token": "6c082d14979d41dc8522baca3bc9e80a68891deb8cff435f",
        "created_at": "2026-07-21T10:00:05.783476+00:00",
        "expires_at": "2026-07-23T10:00:05.747+00:00",
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2"
    },
    {
        "id": "afb6a948-85f4-4848-9af8-edfa7d986dd2",
        "type": "checkin",
        "used": false,
        "token": "df936aed00a94f40a6393f5bc8c48925139a39c68f794a89",
        "created_at": "2026-07-23T10:00:09.5872+00:00",
        "expires_at": "2026-07-25T10:00:09.573+00:00",
        "reservation_id": "4d4c0be6-3600-4148-9826-22f214f68bfe"
    },
    {
        "id": "e497e995-bb76-4438-a7a1-88743ad4833b",
        "type": "checkin",
        "used": true,
        "token": "ed76c8f828644afe84d0a94c5dcf9f33a45d3a745a70429d",
        "created_at": "2026-07-23T10:00:09.143115+00:00",
        "expires_at": "2026-07-25T10:00:09.126+00:00",
        "reservation_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885"
    },
    {
        "id": "77257599-c541-4049-a06c-67b25ca52c71",
        "type": "checkin",
        "used": true,
        "token": "d192a60c24704ef19174c6f522ff239797735b915ce94eab",
        "created_at": "2026-07-23T10:00:05.4916+00:00",
        "expires_at": "2026-07-25T10:00:05.455+00:00",
        "reservation_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482"
    },
    {
        "id": "32708fec-b69e-40e9-87ae-b31969667895",
        "type": "checkin",
        "used": false,
        "token": "150aa2c25430424690aaf3ff7488e15e66a9de74facd4326",
        "created_at": "2026-08-03T10:00:05.317112+00:00",
        "expires_at": "2026-08-05T10:00:05.28+00:00",
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897"
    },
    {
        "id": "51495449-0a12-463a-8189-fc40f1227bf8",
        "type": "checkout",
        "used": false,
        "token": "db17d3e8c2e64598a310f06a853d15a25697fc38bf0c4cbf",
        "created_at": "2026-08-08T10:00:05.187901+00:00",
        "expires_at": "2026-08-10T10:00:05.157+00:00",
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897"
    },
    {
        "id": "b738c5f3-9c53-45d2-a39b-60fcf9b53b57",
        "type": "checkin",
        "used": false,
        "token": "c1aa0d7c302544d29eaf2eea1387fa9ec7fa59f3b8c6404b",
        "created_at": "2026-08-10T10:00:03.752568+00:00",
        "expires_at": "2026-08-12T10:00:03.726+00:00",
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336"
    },
    {
        "id": "53f216ed-7e21-4079-b6f9-31bd96f693d6",
        "type": "checkin",
        "used": false,
        "token": "88f0ba9d36994fc18f3800e9611241feee89b13ca8754a8c",
        "created_at": "2026-08-10T10:00:05.233396+00:00",
        "expires_at": "2026-08-12T10:00:05.21+00:00",
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd"
    },
    {
        "id": "bcd4b913-9388-4366-8a8d-62da3ad1f316",
        "type": "checkout",
        "used": false,
        "token": "1db7253addcb4d1c8da191c35b0b7125b715928145774773",
        "created_at": "2026-08-14T10:00:04.639366+00:00",
        "expires_at": "2026-08-16T10:00:04.588+00:00",
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336"
    },
    {
        "id": "60218244-2522-474f-b490-f63c8f809fb2",
        "type": "checkout",
        "used": true,
        "token": "328f3e745a97480798c3b81226d0d8b367749b5c477b4071",
        "created_at": "2026-08-14T10:00:05.806134+00:00",
        "expires_at": "2026-08-16T10:00:05.771+00:00",
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd"
    },
    {
        "id": "34edb0e0-55f4-4cb0-9f3e-4305177417ba",
        "type": "pre_arrival",
        "used": false,
        "token": "7e2ff9c885bf472885ba44440c7f605461eea8c8ae2d4a82",
        "created_at": "2026-08-26T10:00:05.342822+00:00",
        "expires_at": "2026-09-03T12:00:00+00:00",
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398"
    },
    {
        "id": "5c032851-a647-46ac-9a2e-814794dc4986",
        "type": "checkin",
        "used": false,
        "token": "45fab5afa76a4404908d53784ffc5312e527249ee3d7423b",
        "created_at": "2026-08-28T10:00:06.078968+00:00",
        "expires_at": "2026-08-30T10:00:06.02+00:00",
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398"
    },
    {
        "id": "cee1bd47-1de5-44dc-b263-404911bdf912",
        "type": "pre_arrival",
        "used": false,
        "token": "a61247308b5c44438448fbcd839b95c158ed745a25fd45ab",
        "created_at": "2026-08-28T10:00:06.165109+00:00",
        "expires_at": "2026-09-03T12:00:00+00:00",
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398"
    },
    {
        "id": "c1afbd6d-e640-4e0e-9958-a7923899aa0f",
        "type": "checkout",
        "used": true,
        "token": "6292efd6a38e42a9a414e64e5d12836010e4664b837b414b",
        "created_at": "2026-09-03T10:00:06.513517+00:00",
        "expires_at": "2026-09-05T10:00:06.466+00:00",
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- pre_arrival_responses  (1 registros)
-- ============================================================
INSERT INTO public.pre_arrival_responses
SELECT * FROM jsonb_populate_recordset(null::public.pre_arrival_responses, $dados$
[
    {
        "id": "d6c958d2-0fa5-4c52-9683-58d54a270542",
        "status": "sent",
        "language": "pt",
        "created_at": "2026-08-26T10:00:05.847534+00:00",
        "updated_at": "2026-08-28T10:00:06.374441+00:00",
        "answered_at": null,
        "arrival_mode": null,
        "last_sent_at": "2026-08-28T10:00:06.334+00:00",
        "children_info": null,
        "first_sent_at": "2026-08-26T10:00:05.777+00:00",
        "foods_to_avoid": null,
        "reminders_sent": 1,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "additional_info": null,
        "transport_needs": null,
        "health_condition": null,
        "last_send_origin": "auto",
        "special_occasion": null,
        "dietary_restrictions": [
        ],
        "mobility_limitations": null,
        "continuous_medication": null,
        "estimated_arrival_time": null,
        "special_occasion_detail": null
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- payments  (1 registros)
-- ============================================================
INSERT INTO public.payments
SELECT * FROM jsonb_populate_recordset(null::public.payments, $dados$
[
    {
        "id": "f0f12b44-3915-47d5-879e-7612f24ab14e",
        "amount": 7181.95,
        "method": null,
        "status": "failed",
        "payer_cpf": "43418502881",
        "created_at": "2026-01-13T16:31:33.697905+00:00",
        "payer_name": "Jeniffer Larrussa Leite da Silva",
        "updated_at": "2026-01-14T16:36:12.768056+00:00",
        "mp_order_id": null,
        "paid_amount": null,
        "payer_email": "larussajeniffer@gmail.com",
        "refunded_at": null,
        "installments": 1,
        "payment_date": "2026-01-13T16:31:33.697905+00:00",
        "total_amount": 7181.95,
        "mp_payment_id": "141205949279",
        "refund_reason": null,
        "status_detail": "expired",
        "payment_method": "pix",
        "reservation_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "transaction_id": "141205949279",
        "mercado_pago_payment_id": "141205949279"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- payment_logs  (29 registros)
-- ============================================================
INSERT INTO public.payment_logs
SELECT * FROM jsonb_populate_recordset(null::public.payment_logs, $dados$
[
    {
        "id": "445e5b11-4a0b-4600-ad7d-53301ac9b4b2",
        "action": "webhook_processed",
        "status": "pending",
        "created_at": "2026-01-05T19:47:06.032662+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.215.140.160",
            "mp_status": "pending",
            "payment_id": "140773292958",
            "processed_at": "2026-01-05T19:47:05.971Z",
            "x_request_id": "c1fe572c-d2a5-4b81-9cd3-0947be93263a",
            "signature_valid": true
        }
    },
    {
        "id": "cab7510c-f4c2-4e5a-9f3c-04d41941f5dc",
        "action": "card_payment_failed",
        "status": "error",
        "created_at": "2025-12-16T18:56:41.501279+00:00",
        "error_code": "bad_request",
        "payment_id": null,
        "error_message": "Card Token not found",
        "reservation_id": null,
        "request_payload": {
            "payer": {
                "email": "cst.flavio@gmail.com",
                "last_name": "Augusto da Costa",
                "first_name": "Flávio",
                "identification": {
                    "type": "CPF",
                    "number": "38677495827"
                }
            },
            "token": "[REDACTED]",
            "description": "Reserva Pousada Arara Azul - Flávio Augusto da Costa",
            "installments": 1,
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "payment_method_id": "master",
            "external_reference": "df13b00b-96eb-4531-9134-73e0e2c2f4e4",
            "transaction_amount": 0.01
        },
        "response_payload": {
            "cause": [
                {
                    "code": 2006,
                    "data": "16-12-2025T18:56:41UTC;6a053ca7-5d94-4852-9bdb-7f1e964dd607",
                    "description": "Card Token not found"
                }
            ],
            "error": "bad_request",
            "status": 400,
            "message": "Card Token not found"
        }
    },
    {
        "id": "304d06ad-9486-4ba3-8139-b5e7c9a75ab6",
        "action": "card_payment_failed",
        "status": "error",
        "created_at": "2025-12-16T19:26:14.441649+00:00",
        "error_code": "bad_request",
        "payment_id": null,
        "error_message": "Card Token not found",
        "reservation_id": null,
        "request_payload": {
            "payer": {
                "email": "jeariane09@icloud.com",
                "last_name": "Ariane da Silva",
                "first_name": "Jessica",
                "identification": {
                    "type": "CPF",
                    "number": "38677495827"
                }
            },
            "token": "[REDACTED]",
            "description": "Reserva Pousada Arara Azul - Jessica Ariane da Silva",
            "installments": 1,
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "payment_method_id": "visa",
            "external_reference": "323f504d-7004-4909-a708-7426585c145e",
            "transaction_amount": 0.5
        },
        "response_payload": {
            "cause": [
                {
                    "code": 2006,
                    "data": "16-12-2025T19:26:14UTC;8b192a1c-aa42-498d-b6e3-bab7dd3447c5",
                    "description": "Card Token not found"
                }
            ],
            "error": "bad_request",
            "status": 400,
            "message": "Card Token not found"
        }
    },
    {
        "id": "c8395f90-9f30-4c46-b3b6-89ff350c48ce",
        "action": "pix_created",
        "status": "success",
        "created_at": "2025-12-23T12:49:40.546447+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": {
            "amount": 0.5,
            "external_reference": "413f1dd9-b70f-479e-9774-74e995b63882"
        },
        "response_payload": {
            "status": "pending",
            "payment_id": "138511577505"
        }
    },
    {
        "id": "1a121d92-3ec4-484e-a23f-ae2a76897768",
        "action": "pix_created",
        "status": "success",
        "created_at": "2026-08-12T01:20:47.445597+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": {
            "amount": 0.5,
            "external_reference": "eef5ccf3-603e-422c-833d-002130bf14a5"
        },
        "response_payload": {
            "status": "pending",
            "payment_id": "173316872398"
        }
    },
    {
        "id": "bccfc6b4-a8e7-4ced-8028-610a76f9d4c4",
        "action": "webhook_mp_api_error",
        "status": "error",
        "created_at": "2025-12-01T00:42:36.290512+00:00",
        "error_code": "404",
        "payment_id": null,
        "error_message": "Failed to fetch payment from MP API: {\"message\":\"Payment not found\",\"error\":\"not_found\",\"status\":404,\"cause\":[{\"code\":2000,\"description\":\"Payment not found\",\"data\":\"01-12-2025T00:42:36UTC;c2691cec-77dd-4d38-8ca1-7be63efb759a\"}]}",
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "mp_error": "{\"message\":\"Payment not found\",\"error\":\"not_found\",\"status\":404,\"cause\":[{\"code\":2000,\"description\":\"Payment not found\",\"data\":\"01-12-2025T00:42:36UTC;c2691cec-77dd-4d38-8ca1-7be63efb759a\"}]}",
            "payment_id": "123456",
            "webhook_body": {
                "id": "123456",
                "data": {
                    "id": "123456"
                },
                "type": "payment",
                "action": "payment.updated",
                "user_id": 115010275,
                "live_mode": false,
                "api_version": "v1",
                "date_created": "2021-11-01T02:02:02Z"
            }
        }
    },
    {
        "id": "87035f39-3e56-4c72-acc1-c4691064585d",
        "action": "webhook_processed",
        "status": "cancelled",
        "created_at": "2026-01-06T19:20:24.06947+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.206.34.84",
            "mp_status": "cancelled",
            "payment_id": "140769229456",
            "processed_at": "2026-01-06T19:20:23.994Z",
            "x_request_id": "b1c94a50-90b2-4e82-9cfc-55b25d492b1e",
            "signature_valid": true
        }
    },
    {
        "id": "25696588-452b-47f2-92e4-c1d29b1f2d0f",
        "action": "card_payment_failed",
        "status": "error",
        "created_at": "2025-12-16T19:05:21.062512+00:00",
        "error_code": "bad_request",
        "payment_id": null,
        "error_message": "Card Token not found",
        "reservation_id": null,
        "request_payload": {
            "payer": {
                "email": "cst.flavio@gmail.com",
                "last_name": "Augusto da Costa",
                "first_name": "Flávio",
                "identification": {
                    "type": "CPF",
                    "number": "38677495827"
                }
            },
            "token": "[REDACTED]",
            "description": "Reserva Pousada Arara Azul - Flávio Augusto da Costa",
            "installments": 1,
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "payment_method_id": "master",
            "external_reference": "df13b00b-96eb-4531-9134-73e0e2c2f4e4",
            "transaction_amount": 0.01
        },
        "response_payload": {
            "cause": [
                {
                    "code": 2006,
                    "data": "16-12-2025T19:05:20UTC;84f66198-8bfa-42f3-aab8-709177feac14",
                    "description": "Card Token not found"
                }
            ],
            "error": "bad_request",
            "status": 400,
            "message": "Card Token not found"
        }
    },
    {
        "id": "1c557cac-7b1f-4fbb-ab3c-aa5a88804bee",
        "action": "webhook_processed",
        "status": "pending",
        "created_at": "2025-12-23T12:49:41.112442+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "mp_status": "pending",
            "payment_id": "138511577505",
            "x_request_id": "f9467840-b471-40cd-bb74-f53449c039f5"
        }
    },
    {
        "id": "8972c222-1ad2-4402-a79b-877395d0a8db",
        "action": "webhook_processed",
        "status": "pending",
        "created_at": "2026-08-12T01:20:48.835906+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.206.34.84",
            "mp_status": "pending",
            "payment_id": "173316872398",
            "processed_at": "2026-08-12T01:20:48.619Z",
            "x_request_id": "b7dfdc44-1e14-4e2e-a412-7273eb47d34e",
            "signature_valid": true
        }
    },
    {
        "id": "969c9bab-2260-49f5-9881-206a3b5f1318",
        "action": "webhook_processed",
        "status": "cancelled",
        "created_at": "2026-01-06T19:20:29.165701+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.206.34.84",
            "mp_status": "cancelled",
            "payment_id": "140769229456",
            "processed_at": "2026-01-06T19:20:29.083Z",
            "x_request_id": "9876cf0d-beef-4870-b567-cc61ab82fe3f",
            "signature_valid": true
        }
    },
    {
        "id": "fb48bfff-0ac5-4748-ac63-cd87bafc048c",
        "action": "card_payment_failed",
        "status": "error",
        "created_at": "2025-12-16T19:07:01.077167+00:00",
        "error_code": "bad_request",
        "payment_id": null,
        "error_message": "Card Token not found",
        "reservation_id": null,
        "request_payload": {
            "payer": {
                "email": "cst.flavio@gmail.com",
                "last_name": "costa",
                "first_name": "flavio",
                "identification": {
                    "type": "CPF",
                    "number": "38677495827"
                }
            },
            "token": "[REDACTED]",
            "description": "Reserva Pousada Arara Azul - flavio costa",
            "installments": 1,
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "payment_method_id": "master",
            "external_reference": "f628d632-bc7d-48a9-a496-79bee709d817",
            "transaction_amount": 0.01
        },
        "response_payload": {
            "cause": [
                {
                    "code": 2006,
                    "data": "16-12-2025T19:07:00UTC;06693cec-3446-469b-a471-3f2d32e6d0b1",
                    "description": "Card Token not found"
                }
            ],
            "error": "bad_request",
            "status": 400,
            "message": "Card Token not found"
        }
    },
    {
        "id": "8a80734a-88a7-44cc-9f2a-9c021516a9d2",
        "action": "webhook_processed",
        "status": "approved",
        "created_at": "2025-12-23T12:50:09.226432+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "mp_status": "approved",
            "payment_id": "138511577505",
            "x_request_id": "61911024-f857-46be-8de2-1b32ed1fb88c"
        }
    },
    {
        "id": "b8935bed-4cf2-4c38-8749-17541005fe02",
        "action": "webhook_processed",
        "status": "approved",
        "created_at": "2026-08-12T01:21:58.278005+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.206.34.84",
            "mp_status": "approved",
            "payment_id": "173316872398",
            "processed_at": "2026-08-12T01:21:58.230Z",
            "x_request_id": "cbfe0be6-d4e7-45ff-8cde-29daaad6a2dd",
            "signature_valid": true
        }
    },
    {
        "id": "03d3ce75-4911-473b-811b-120642873895",
        "action": "pix_created",
        "status": "success",
        "created_at": "2026-01-13T16:31:34.113788+00:00",
        "error_code": null,
        "payment_id": "f0f12b44-3915-47d5-879e-7612f24ab14e",
        "error_message": null,
        "reservation_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "request_payload": {
            "amount": 7181.95,
            "external_reference": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245"
        },
        "response_payload": {
            "status": "pending",
            "payment_id": "141205949279"
        }
    },
    {
        "id": "4b813425-4846-4cf2-b7db-a45a1aef2621",
        "action": "pix_created",
        "status": "success",
        "created_at": "2026-01-05T19:17:14.752967+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": {
            "amount": 25335,
            "external_reference": "f14958b8-31c7-4f17-b339-a8ae91c75c90"
        },
        "response_payload": {
            "status": "pending",
            "payment_id": "140769229456"
        }
    },
    {
        "id": "ea126c98-57a8-4ac6-9984-cbf092e932f7",
        "action": "pix_created",
        "status": "success",
        "created_at": "2025-12-16T20:10:07.28597+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": {
            "payer": {
                "email": "faelamaral@yahoo.com.br",
                "last_name": "Amaral",
                "first_name": "Rafael",
                "identification": {
                    "type": "CPF",
                    "number": "31948720876"
                }
            },
            "description": "Reserva Bangalô Paneiro - Pousada Arara Azul",
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "payment_method_id": "pix",
            "external_reference": "6e66f186-ce0d-496e-b3e5-e8c6a7e555a8",
            "transaction_amount": 0.5
        },
        "response_payload": {
            "id": 138176735136,
            "card": {
            },
            "tags": null,
            "order": {
            },
            "payer": {
                "id": "2358503722",
                "type": null,
                "email": null,
                "phone": {
                    "number": null,
                    "area_code": null,
                    "extension": null
                },
                "last_name": null,
                "first_name": null,
                "entity_type": null,
                "operator_id": null,
                "identification": {
                    "type": null,
                    "number": null
                }
            },
            "pos_id": null,
            "status": "pending",
            "refunds": [
            ],
            "brand_id": null,
            "captured": true,
            "metadata": {
            },
            "store_id": null,
            "issuer_id": "12501",
            "live_mode": true,
            "sponsor_id": null,
            "binary_mode": false,
            "currency_id": "BRL",
            "description": "Reserva Bangalô Paneiro - Pousada Arara Azul",
            "fee_details": [
            ],
            "platform_id": null,
            "callback_url": null,
            "collector_id": 581121247,
            "date_created": "2025-12-16T16:10:06.275-04:00",
            "installments": 1,
            "release_info": null,
            "taxes_amount": 0,
            "accounts_info": null,
            "build_version": "3.135.0-rc-1",
            "coupon_amount": 0,
            "date_approved": null,
            "integrator_id": null,
            "status_detail": "pending_waiting_transfer",
            "corporation_id": null,
            "operation_type": "regular_payment",
            "payment_method": {
                "id": "pix",
                "type": "bank_transfer",
                "issuer_id": "12501"
            },
            "additional_info": {
                "tracking_id": "platform:v1-whitelabel,so:ALL,type:N/A,security:none"
            },
            "charges_details": [
            ],
            "financing_group": null,
            "merchant_number": null,
            "payment_type_id": "bank_transfer",
            "processing_mode": "aggregator",
            "shipping_amount": 0,
            "counter_currency": null,
            "deduction_schema": null,
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "date_last_updated": "2025-12-16T16:10:06.275-04:00",
            "marketplace_owner": null,
            "payment_method_id": "pix",
            "authorization_code": null,
            "date_of_expiration": "2025-12-17T16:10:06.080-04:00",
            "external_reference": "6e66f186-ce0d-496e-b3e5-e8c6a7e555a8",
            "money_release_date": null,
            "transaction_amount": 0.5,
            "merchant_account_id": null,
            "transaction_details": {
                "transaction_id": null,
                "overpaid_amount": 0,
                "bank_transfer_id": null,
                "total_paid_amount": 0.5,
                "acquirer_reference": null,
                "installment_amount": 0,
                "net_received_amount": 0,
                "external_resource_url": null,
                "financial_institution": null,
                "payable_deferral_period": null,
                "payment_method_reference_id": null
            },
            "money_release_schema": null,
            "money_release_status": "released",
            "point_of_interaction": {
                "type": "OPENPLATFORM",
                "location": {
                    "source": null,
                    "state_id": null
                },
                "business_info": {
                    "unit": "online_payments",
                    "branch": "Merchant Services",
                    "sub_unit": "default"
                },
                "application_data": {
                    "name": null,
                    "version": null,
                    "operating_system": null
                },
                "transaction_data": {
                    "e2e_id": null,
                    "qr_code": "00020126580014br.gov.bcb.pix0136b21cc3b2-c869-4e13-900e-9e150494234252040000530398654040.505802BR5910JEARIANE096008So Paulo62250521mpqrinter1381767351366304E3F6",
                    "bank_info": {
                        "payer": {
                            "id": null,
                            "branch": null,
                            "long_name": null,
                            "account_id": null,
                            "identification": {
                            },
                            "is_end_consumer": null,
                            "external_account_id": null
                        },
                        "collector": {
                            "long_name": null,
                            "account_id": null,
                            "account_alias": null,
                            "account_holder_name": "Jessica Ariane da Silva",
                            "transfer_account_id": null
                        },
                        "origin_bank_id": null,
                        "origin_wallet_id": null,
                        "is_same_bank_account_owner": null
                    },
                    "ticket_url": "https://www.mercadopago.com.br/payments/138176735136/ticket?caller_id=2358503722&hash=07e7fd88-5bee-416f-a375-a9397b7940c4",
                    "qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAABWQAAAVkAQMAAABpQ4TyAAAABlBMVEX///8AAABVwtN+AAAKGElEQVR42uzdQXLiOhMHcFMsWHIEjpKjhaP5KByBJQsKffVIhLslwZA3872qgd9/N07G/jk7q1utSURERERERERERERERERERERERERERERERERERERERP7D7Eqf/T8/WNV/zd+/ub7+6zhNH98/OE/TppTDcuHrx7vrfynlcv0vx/YRtwtVsB0IZlpaWlpaWlpaWlpaWlra99PO7YWqPV1vNU/T5z/3Xl8vTAl3u/dna6nv85X641PCnat2fkyipaWlpaWlpaWlpaWlpf332vz5vP++cBp8Ph/Ht/lcfuNwvVC/0L8uXF93lW+QteF9aGlpaWlpaWlpaWlpaWlpl/WErsB9bv/rOq0nXMbLAfl1v97/kFYoaGlpaWlpaWlpaWlpaWn/U235fvp2aSTPH+RfP94Mer4PqbO8q6HfLoT3oaWlpaWlpaWlpaWlpaWlHXe5d4awsztrv3D75dFVGxcYSrow0v5WTz4tLS0tLS0tLS0tLS0t7StoR7PXrvfe1FFr+++e9HBhlWev1Qs37ZQu1C73OxX/350UR0tLS0tLS0tLS0tLS0v7k3Sz13INPdbE8xd6WT7I1+H9u7b3MM3t90NLS0tLS0tLS0tLS0tL+/drP74tm/HstTlNVju209EP9y50JfNV7nLv7vgcn5aWlpaWlpaWlpaWlpb2JbW1pTyW40cJs8zLUuDPCwzndINVHpde/yBhfnrTZRCmqdPS0tLS0tLS0tLS0tLS/r52dAZ3+EK/c0R3ft3Kj79Ra+i3Q7yDNhTVN4PN47S0tLS0tLS0tLS0tLS076md0rbzujhwyffOFe/69d9VvLfpzO5pvMCQlw/yhcfT0WlpaWlpaWlpaWlpaWlpf6T9SLO/w8bsTcJNbcm829m9bhvJz6lvvGlNz6/73IlgtLS0tLS0tLS0tLS0tLQvrJ1SyTxvu76bS8bltvc6Hb0M9ooH/nq8efyJGjotLS0tLS0tLS0tLS0t7QtqP9IctN14PSGcX1bL9+d0g8ug4v+L6ehNl3t9RPnV6gctLS0tLS0tLS0tLS0t7TPaXLAeNanP6Xs6fMOfww0+03jxj+Ub/rh8kN8+2euqQJ7mNuVpbrS0tLS0tLS0tLS0tLS0b6Xtauh5Utqx7WE/Jm23HNBpv2rioYd9Wy8M7lieO8SblpaWlpaWlpaWlpaWlvYltV3BPt97TssHIXcmxdXp6GXc5b6993blufUEWlpaWlpaWlpaWlpaWtrntV1Rfb/U0KelBJ570mMP+zzsYV+FKvt+GcBeli/0O0eEHWhpaWlpaWlpaWlpaWlp308bSuZTKnCvBmd2h2Hoq3yhLgdsl+nozT70wYFm3fllz/wpaWlpaWlpaWlpaWlpaWl/qF2N+8ZLOwy8dnlf8g1qZ3nYt13GXeHb9AneHQt+oqWlpaWlpaWlpaWlpaV9S20+s3sa3Lu06wl5Z/dh4d8pqh8GZ3aXdCLY0+sJtLS0tLS0tLS0tLS0tLSvqu2OK8sLDFkbh5u3N4i5alehBWD6vlBql3uu+M/fSxBnWlpaWlpaWlpaWlpaWto/r20q3qGoPvqiL6mGPi9PP475oyO6c5l+Wo4Ff3xmNy0tLS0tLS0tLS0tLS3tq2rnNBitDLedx5p4mL3W7VQfrSfkyWq3cel5H3ooqu9oaWlpaWlpaWlpaWlpad9PG7JJ28i76ei3E7bDpLgStpGHlwnaaXzHqd123vXN09LS0tLS0tLS0tLS0tL+EW2ooXcngnUHalftOY1Oix/kJe0Vz430ty73sHl8Xv4gz3yh09LS0tLS0tLS0tLS0tK+nrbbh97xp6WHPXz9X3Lb+74psZfBtvPVoPc9ryeUwfA2WlpaWlpaWlpaWlpaWto/on2Uc32fj3Th0PaNd2d253nj4cJ68IjpB1/otLS0tLS0tLS0tLS0tLSvo73T1B7WE+7u244XPtthbFnblelLekRew3iiy52WlpaWlpaWlpaWlpaW9jW19WP/mBYYui73zYIr49PGun3o3fllx8F/mdsljpmWlpaWlpaWlpaWlpaW9re1u2Ufdixwdx3nuSd9and2hw/ykr7Qw3jxbrxbrMqH33jwhU5LS0tLS0tLS0tLS0tL+6ra8PRTOr9rNRhdPi2T0roTwS71x+Fh6/b9T/UvtE/v/7FcKLS0tLS0tLS0tLS0tLS0b6kddZx/pqfXyW/r9D6j88tuywfzYNRcno4e+Nt2H/pES0tLS0tLS0tLS0tLS/sntNNg6/Z+uj/LfDsumeem9tHstW5nd3uDJ9cTaGlpaWlpaWlpaWlpaWlfUjv6+h93uXc19JhaZQ/70KfA6d4/t72HLvdfrn7Q0tLS0tLS0tLS0tLS0j6pDX3j3Rf6acF1NfTbw7phbLukPbZt4tvlkz2+f367mZaWlpaWlpaWlpaWlpb2zbR5PaE7Yfu4bLvuzuyOFe/PtCDx8X2DuJ5Q2iWI+uNjWpDY/KCGTktLS0tLS0tLS0tLS0v7Utprx/md2WvbxxX/TdLGLvfQ9t6tP5T0/mFB4pkud1paWlpaWlpaWlpaWlra57WhYL0dnAg2nr321PuXhGvmjeeB5ft7JFpaWlpaWlpaWlpaWlraN9LmW9Xhapukvd8VP7frCfU34npCvWMumXdd7idaWlpaWlpaWlpaWlpa2nfVBlyeFHdKDyvhEO+gPSzLAetwYbAg0a04/Nsud1paWlpaWlpaWlpaWlraH+6Vzrm0Pel5XPqq3dl9CUX4afniDgeATfnM7nohT0ff/Gr2Gi0tLS0tLS0tLS0tLS3tS2qn5YTtW/Ktuop3ScsHd6ajl+VCyGZwZvdx+lFoaWlpaWlpaWlpaWlpaX+YVbvtepW3XYdJaVftqhbVd+2n/WHQWV7u7RXv8rhvnJaWlpaWlpaWlpaWlpb21bVNurb3fO9Q8T6kEvi2LjDk9YRH09y63zj8eHmBlpaWlpaWlpaWlpaWlvav1+4G99kPlgPGPem3G+yXUWt5H/pxWaEYVfxPy4lo5emefFpaWlpaWlpaWlpaWlraJ7VzeyGf2Z0L3N2JYLt0YZu2hq/TJ/40aJM/tZ31j0NLS0tLS0tLS0tLS0tL+9ra7us/bEyviwPncGHfTkfPXe4fi7YkfjwW/G6XOy0tLS0tLS0tLS0tLS0tbVpPKO2BZmWp+K/yvT+X5YNdi8stA90+9OPgD0JLS0tLS0tLS0tLS0tL+3/UjjrOc5f7evw9HQ4Ai1X5PIB9So8o7Xi3mZaWlpaWlpaWlpaWlpb2LbXje9/+Z15P6B5WD/GO+9CnKZ5wVg/9PqVHnPMj6vvvaGlpaWlpaWlpaWlpaWn/kPbR7LVbgbv+/rb9ZD+0JfDdYGf3tGi3A379jWdq6LS0tLS0tLS0tLS0tLS0L6kVERERERERERERERERERERERERERERERERERERERH5W/K/AAAA//8wUysEU8HpygAAAABJRU5ErkJggg==",
                    "transaction_id": null,
                    "bank_transfer_id": null,
                    "financial_institution": null,
                    "merchant_category_code": null
                }
            },
            "statement_descriptor": null,
            "call_for_authorize_id": null,
            "charges_execution_info": {
                "internal_execution": {
                    "date": "2025-12-16T16:10:06.263-04:00",
                    "execution_id": "01KCMCHJGPZ3R90N1QGRGAJPEV"
                }
            },
            "acquirer_reconciliation": [
            ],
            "differential_pricing_id": null,
            "transaction_amount_refunded": 0
        }
    },
    {
        "id": "e88db46f-9fa2-4fa3-a3df-139f7f77edae",
        "action": "card_payment_failed",
        "status": "error",
        "created_at": "2025-12-16T19:12:48.321701+00:00",
        "error_code": "bad_request",
        "payment_id": null,
        "error_message": "Invalid transaction_amount",
        "reservation_id": null,
        "request_payload": {
            "payer": {
                "email": "cst.flavio@gmail.com",
                "last_name": "a costa",
                "first_name": "flavio",
                "identification": {
                    "type": "CPF",
                    "number": "38677495827"
                }
            },
            "token": "[REDACTED]",
            "description": "Reserva Pousada Arara Azul - flavio a costa",
            "installments": 1,
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "payment_method_id": "master",
            "external_reference": "1f1a0ea6-1f5d-4462-b90b-c5c830ea207e",
            "transaction_amount": 0.01
        },
        "response_payload": {
            "cause": [
                {
                    "code": 4037,
                    "data": "16-12-2025T19:12:47UTC;cc8415ae-bb3d-416d-8c2a-7f0e234b5f34",
                    "description": "Invalid transaction_amount"
                }
            ],
            "error": "bad_request",
            "status": 400,
            "message": "Invalid transaction_amount"
        }
    },
    {
        "id": "240c515d-7479-4a87-b7bb-569cf963358f",
        "action": "webhook_processed",
        "status": "pending",
        "created_at": "2026-08-13T12:29:52.168438+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.215.140.160",
            "mp_status": "pending",
            "payment_id": "173610628504",
            "processed_at": "2026-08-13T12:29:51.931Z",
            "x_request_id": "5ea85b69-d8a5-4f79-a38e-5bc200d31593",
            "signature_valid": true
        }
    },
    {
        "id": "a95a6a74-9d85-4db0-99eb-585d52842206",
        "action": "pix_created",
        "status": "success",
        "created_at": "2026-08-13T12:29:51.121119+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": {
            "amount": 0.5,
            "external_reference": "d824044b-95c4-48f2-94aa-afb3bde4299d"
        },
        "response_payload": {
            "status": "pending",
            "payment_id": "173610628504"
        }
    },
    {
        "id": "37653c87-d44f-416e-a337-86cf346607ff",
        "action": "webhook_processed",
        "status": "pending",
        "created_at": "2026-01-13T16:31:34.959964+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.215.140.160",
            "mp_status": "pending",
            "payment_id": "141205949279",
            "processed_at": "2026-01-13T16:31:34.881Z",
            "x_request_id": "f42daad0-ec81-46d2-9344-22e27bdee08d",
            "signature_valid": true
        }
    },
    {
        "id": "3c8bc413-c23c-4f6c-b0a5-5cfca3f8456f",
        "action": "webhook_processed",
        "status": "approved",
        "created_at": "2026-08-13T12:32:54.788781+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.213.114.129",
            "mp_status": "approved",
            "payment_id": "173610628504",
            "processed_at": "2026-08-13T12:32:54.568Z",
            "x_request_id": "bbdec151-bd19-420d-b2ae-b44bdc2a3c65",
            "signature_valid": true
        }
    },
    {
        "id": "ff9113c2-5efc-4b26-b00f-7446d2d8bd51",
        "action": "card_payment_approved",
        "status": "approved",
        "created_at": "2025-12-17T00:43:53.36873+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": {
            "payer": {
                "email": "rayfotografia09@gmail.com",
                "last_name": "Souza Silva ",
                "first_name": "Raicony",
                "identification": {
                    "type": "CPF",
                    "number": "86647815597"
                }
            },
            "token": "[REDACTED]",
            "description": "Reserva Pousada Arara Azul - Raicony Souza Silva ",
            "installments": 1,
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "payment_method_id": "visa",
            "external_reference": "17ee79c7-44c1-4687-97e6-a896941cf46d",
            "transaction_amount": 0.5
        },
        "response_payload": {
            "id": 137579871781,
            "card": {
                "id": null,
                "bin": "47739346",
                "tags": [
                    "debit",
                    "credit"
                ],
                "country": "BRA",
                "cardholder": {
                    "name": "Raicony Souza Silva ",
                    "identification": {
                        "type": "CPF",
                        "number": "86647815597"
                    }
                },
                "date_created": "2025-12-16T20:43:49.000-04:00",
                "expiration_year": 2032,
                "expiration_month": 2,
                "first_six_digits": "477393",
                "last_four_digits": "8600",
                "date_last_updated": "2025-12-16T20:43:49.000-04:00"
            },
            "tags": null,
            "order": {
            },
            "payer": {
                "id": "2489099081",
                "type": null,
                "email": "rayfotografia09@gmail.com",
                "phone": {
                    "number": null,
                    "area_code": null,
                    "extension": null
                },
                "last_name": null,
                "first_name": null,
                "entity_type": null,
                "operator_id": null,
                "identification": {
                    "type": "CPF",
                    "number": "86647815597"
                }
            },
            "pos_id": null,
            "status": "approved",
            "refunds": [
            ],
            "brand_id": null,
            "captured": true,
            "metadata": {
            },
            "store_id": null,
            "issuer_id": "25",
            "live_mode": true,
            "sponsor_id": null,
            "binary_mode": false,
            "currency_id": "BRL",
            "description": "Reserva Pousada Arara Azul - Raicony Souza Silva ",
            "fee_details": [
                {
                    "type": "mercadopago_fee",
                    "amount": 0.02,
                    "fee_payer": "collector"
                }
            ],
            "platform_id": null,
            "collector_id": 581121247,
            "date_created": "2025-12-16T20:43:49.010-04:00",
            "installments": 1,
            "release_info": null,
            "taxes_amount": 0,
            "accounts_info": null,
            "build_version": "3.135.0-rc-1",
            "coupon_amount": 0,
            "date_approved": "2025-12-16T20:43:52.802-04:00",
            "integrator_id": null,
            "status_detail": "accredited",
            "corporation_id": null,
            "operation_type": "regular_payment",
            "payment_method": {
                "id": "visa",
                "data": {
                    "routing_data": {
                        "merchant_account_id": "7187497"
                    }
                },
                "type": "credit_card",
                "issuer_id": "25"
            },
            "additional_info": {
                "tracking_id": "platform:v1-whitelabel,so:ALL,type:N/A,security:none",
                "nsu_processadora": "512648263432116544"
            },
            "charges_details": [
                {
                    "id": "137579871781-001",
                    "name": "mercadopago_fee",
                    "type": "fee",
                    "amounts": {
                        "original": 0.02,
                        "refunded": 0
                    },
                    "accounts": {
                        "to": "mp",
                        "from": "collector"
                    },
                    "metadata": {
                        "reason": "",
                        "source": "proc-svc-charges",
                        "source_detail": "processing_fee_charge"
                    },
                    "client_id": 0,
                    "reserve_id": null,
                    "date_created": "2025-12-16T20:43:49.013-04:00",
                    "last_updated": "2025-12-16T20:43:49.013-04:00",
                    "refund_charges": [
                    ],
                    "external_charge_id": "01KCMW6RBX5AW00Z86V9FTMBN2"
                }
            ],
            "financing_group": null,
            "merchant_number": null,
            "payment_type_id": "credit_card",
            "processing_mode": "aggregator",
            "shipping_amount": 0,
            "counter_currency": null,
            "deduction_schema": null,
            "notification_url": "https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/mp-webhook",
            "date_last_updated": "2025-12-16T20:43:52.802-04:00",
            "marketplace_owner": null,
            "payment_method_id": "visa",
            "authorization_code": "635246",
            "date_of_expiration": null,
            "external_reference": "17ee79c7-44c1-4687-97e6-a896941cf46d",
            "money_release_date": "2025-12-16T20:43:52.802-04:00",
            "transaction_amount": 0.5,
            "merchant_account_id": null,
            "transaction_details": {
                "overpaid_amount": 0,
                "total_paid_amount": 0.5,
                "acquirer_reference": null,
                "installment_amount": 0.5,
                "net_received_amount": 0.48,
                "external_resource_url": null,
                "financial_institution": null,
                "payable_deferral_period": null,
                "payment_method_reference_id": "214163304"
            },
            "money_release_schema": null,
            "money_release_status": "released",
            "point_of_interaction": {
                "type": "UNSPECIFIED",
                "business_info": {
                    "unit": "online_payments",
                    "branch": "Merchant Services",
                    "sub_unit": "default"
                },
                "transaction_data": {
                }
            },
            "statement_descriptor": "EC *POUSADARARAZUL",
            "call_for_authorize_id": null,
            "charges_execution_info": {
                "internal_execution": {
                    "date": "2025-12-16T20:43:48.999-04:00",
                    "execution_id": "01KCMW6RB8CQ63Q0G9XPPRV9MW"
                }
            },
            "acquirer_reconciliation": [
            ],
            "differential_pricing_id": null,
            "transaction_amount_refunded": 0
        }
    },
    {
        "id": "0da5835c-64fa-4ba1-99b7-3a923bf1c6aa",
        "action": "webhook_processed",
        "status": "pending",
        "created_at": "2026-01-05T19:17:15.784718+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.213.114.129",
            "mp_status": "pending",
            "payment_id": "140769229456",
            "processed_at": "2026-01-05T19:17:15.711Z",
            "x_request_id": "16cc73fa-7f83-432a-b1ae-92205936eb78",
            "signature_valid": true
        }
    },
    {
        "id": "7bc6397a-5a59-4eb2-9d9c-14fb9c532530",
        "action": "webhook_processed",
        "status": "cancelled",
        "created_at": "2026-01-14T16:36:13.159832+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.215.140.160",
            "mp_status": "cancelled",
            "payment_id": "141205949279",
            "processed_at": "2026-01-14T16:36:13.088Z",
            "x_request_id": "0e989afa-af7e-41c2-a84d-405ffc7d7f34",
            "signature_valid": true
        }
    },
    {
        "id": "34774c8e-7298-4911-83c3-e02bce76267a",
        "action": "webhook_processed",
        "status": "approved",
        "created_at": "2026-01-05T19:47:52.889744+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "client_ip": "18.206.34.84",
            "mp_status": "approved",
            "payment_id": "140773292958",
            "processed_at": "2026-01-05T19:47:52.823Z",
            "x_request_id": "bed3675e-44f0-4619-80f7-6de93c13a996",
            "signature_valid": true
        }
    },
    {
        "id": "db7175d5-09f5-4c68-9993-a87644935b15",
        "action": "pix_created",
        "status": "success",
        "created_at": "2026-01-05T19:47:05.805078+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": {
            "amount": 0.5,
            "external_reference": "f6a6edcf-ef85-40e1-a231-303fbf62c930"
        },
        "response_payload": {
            "status": "pending",
            "payment_id": "140773292958"
        }
    },
    {
        "id": "95e6172e-f6fe-4217-892e-adf67bdf0341",
        "action": "webhook_processed",
        "status": "approved",
        "created_at": "2025-12-23T12:47:12.56071+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": null,
        "response_payload": {
            "mp_status": "approved",
            "payment_id": "138511787389",
            "x_request_id": "4d6bb05a-1ded-43ac-863d-7c1b5d043ac3"
        }
    },
    {
        "id": "4e157acb-3b66-4a71-a871-cdf365e524f2",
        "action": "card_payment_approved",
        "status": "approved",
        "created_at": "2025-12-23T12:47:12.131175+00:00",
        "error_code": null,
        "payment_id": null,
        "error_message": null,
        "reservation_id": null,
        "request_payload": {
            "amount": 0.51,
            "installments": 1,
            "external_reference": "a386d307-c6e2-4f09-908a-e20bc74a7460"
        },
        "response_payload": {
            "status": "approved",
            "payment_id": "138511787389"
        }
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- reservation_access_tokens  (14 registros)
-- ============================================================
INSERT INTO public.reservation_access_tokens
SELECT * FROM jsonb_populate_recordset(null::public.reservation_access_tokens, $dados$
[
    {
        "id": "361e902a-f191-46df-8b26-82663b940feb",
        "token": "Fw8xH3tYTy03nSaT9ousH3DF8JEtka",
        "used_at": null,
        "created_at": "2026-02-20T14:40:50.867143+00:00",
        "expires_at": "2026-02-27T14:40:50.867143+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c"
    },
    {
        "id": "dffce3e0-5286-4c37-9b9b-ca467c66f232",
        "token": "oDz31gKwnHFNxWUzgjqQ5RbfwNTymIa",
        "used_at": null,
        "created_at": "2026-02-20T15:53:01.113045+00:00",
        "expires_at": "2026-02-27T15:53:01.113045+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "455dfd11-89f9-4d05-a705-3a3887ffa048"
    },
    {
        "id": "e692a897-59a9-4ac2-829e-ebfe80375f00",
        "token": "aril0PemJp5ck4jdLdnNQun45Yhnsv6",
        "used_at": null,
        "created_at": "2026-07-01T15:15:28.890439+00:00",
        "expires_at": "2026-07-08T15:15:28.890439+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398"
    },
    {
        "id": "ad8569ec-fe49-4ead-b236-805eff71cdb9",
        "token": "VfB0rqTI9cFRBq8XbAyz0PxhXNPR0xtx",
        "used_at": null,
        "created_at": "2026-07-04T13:02:33.843969+00:00",
        "expires_at": "2026-07-11T13:02:33.843969+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "4d4c0be6-3600-4148-9826-22f214f68bfe"
    },
    {
        "id": "10be882a-85af-49b3-9454-5db902d6fb93",
        "token": "9SOMVhnpzqJMMKxJGdg3gSVGxVn6PUY",
        "used_at": null,
        "created_at": "2026-07-29T16:51:08.100588+00:00",
        "expires_at": "2026-08-05T16:51:08.100588+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd"
    },
    {
        "id": "763cec6b-dc26-43cd-b4ac-24e402753268",
        "token": "ggzuFhYY0noJPMcSlQUi7wDNp4DmXf",
        "used_at": null,
        "created_at": "2026-01-13T16:31:31.91061+00:00",
        "expires_at": "2026-01-20T16:31:31.91061+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245"
    },
    {
        "id": "f18de88e-e2a4-49b1-9710-8f59fba2cf0f",
        "token": "lskgDExbpgU1tCQpYBudQEzVOFIfTqvN",
        "used_at": null,
        "created_at": "2026-01-15T16:41:24.468618+00:00",
        "expires_at": "2026-01-22T16:41:24.468618+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93"
    },
    {
        "id": "d2202fe9-2ab8-4843-86eb-f456f6f0f86e",
        "token": "1C6kC1nsTdDD32Re9PEQY3MBqQhUfLpD",
        "used_at": null,
        "created_at": "2026-02-20T15:37:42.156828+00:00",
        "expires_at": "2026-02-27T15:37:42.156828+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9"
    },
    {
        "id": "c8a402e3-dd5f-46ee-801d-b19b17bf1e0f",
        "token": "pIS08OkDNAdt2hpDN40sZie2out6eCu",
        "used_at": null,
        "created_at": "2026-05-17T00:33:11.348795+00:00",
        "expires_at": "2026-05-24T00:33:11.348795+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897"
    },
    {
        "id": "7e4d9603-cb56-4dbd-8ed7-7aef44ff7a42",
        "token": "hL1RIq15jIHMVPpR6gWy132kVxu5Sh",
        "used_at": null,
        "created_at": "2026-06-16T16:54:08.241173+00:00",
        "expires_at": "2026-06-23T16:54:08.241173+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2"
    },
    {
        "id": "87702776-52b6-4591-8a60-7d5c6439e8e5",
        "token": "Bu2py0kmZHYlEUKLXy8ATVNcW4M9XsN5",
        "used_at": null,
        "created_at": "2026-07-04T12:58:23.579704+00:00",
        "expires_at": "2026-07-11T12:58:23.579704+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885"
    },
    {
        "id": "b0cdf747-2580-4b4a-96d0-46f35ce5b441",
        "token": "HCUrOEpDtr2ajDtSMgs5M1m7AWd8d7n",
        "used_at": null,
        "created_at": "2026-07-22T13:40:23.229104+00:00",
        "expires_at": "2026-07-29T13:40:23.229104+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482"
    },
    {
        "id": "3f65ef7c-9cd3-43f5-ad08-e92f3d7094df",
        "token": "CI53dwqxoDZRW2NLrPbhUR5wr7DVKy",
        "used_at": null,
        "created_at": "2026-07-29T16:56:11.415373+00:00",
        "expires_at": "2026-08-05T16:56:11.415373+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336"
    },
    {
        "id": "eaa4eef2-2815-4cf3-876e-d52c8eef38d4",
        "token": "CJxe7Vwiis3Ku8zMoqD1b2JK7VPR3TW",
        "used_at": null,
        "created_at": "2026-08-22T12:40:13.677023+00:00",
        "expires_at": "2026-08-29T12:40:13.677023+00:00",
        "ip_address": null,
        "user_agent": null,
        "reservation_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- email_logs  (129 registros)
-- ============================================================
INSERT INTO public.email_logs
SELECT * FROM jsonb_populate_recordset(null::public.email_logs, $dados$
[
    {
        "id": "744d2d3a-67eb-4eba-8bcb-e1ae21a47797",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "33246f34-23d0-403c-acf6-7aaa7407fb63",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-14T10:00:05.500255+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "a13711de-521e-4aa8-9e5c-1c818c74256c",
        "status": "sent",
        "sent_at": "2026-08-14T10:00:05.552+00:00",
        "subject": "Check-out digital - Florent Rossi",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-14T10:00:05.57134+00:00",
        "email_type": "checkout_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "419696b1-4d6a-45e1-852a-5ebffb48cee2",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "9e283796-22d9-46ab-8660-3705b93eb4c3",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-14T10:00:06.266136+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "c2cea85b-4562-48b9-a892-6e22735c404f",
        "status": "sent",
        "sent_at": "2026-08-14T10:00:06.288+00:00",
        "subject": "Check-out digital - Florent Rossi",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-14T10:00:06.300707+00:00",
        "email_type": "checkout_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "72f9404c-8134-4406-b723-325e85806ff2",
        "status": "sent",
        "sent_at": "2026-08-14T10:00:07.667+00:00",
        "subject": "Antecipe seu Check-in — Pousada Arara Azul",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "621771c1-c270-43e9-8ad1-618445ac85b8",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-14T10:00:07.70782+00:00",
        "email_type": "pre_checkin",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "recipient_email": "simonieting@yahoo.com.br"
    },
    {
        "id": "aa134cdf-8d0b-4fbf-b897-830d13557d34",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "018a4f55-f248-4b9e-9e46-e8df96f4fcd9",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-28T10:00:06.943718+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "recipient_email": "simonieting@yahoo.com.br"
    },
    {
        "id": "bc377953-2662-4042-bd32-fc43b44d7166",
        "status": "sent",
        "sent_at": "2026-08-31T00:52:23.555+00:00",
        "subject": "Novo questionário de pré-chegada — Reserva #PAA-C8759D",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "4f7dc3c1-1955-4d01-89ad-d4213184751a",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T00:52:23.660981+00:00",
        "email_type": "pre_arrival_internal",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "044d4cbd-c4d3-4904-879d-25fb4fb02654",
        "status": "sent",
        "sent_at": "2026-08-31T01:14:42.909+00:00",
        "subject": "Complete your Check-in in advance — Pousada Arara Azul",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "bc4ac77f-dd71-4e78-a41a-a9e10cb8cd56",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T01:14:43.313818+00:00",
        "email_type": "pre_checkin",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "c2daf230-2a64-4baa-835d-3cd26cce336a",
        "status": "sent",
        "sent_at": "2025-12-17T00:43:54.657+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "21f6db80-e46d-4e5e-9a5e-4857df39eb53"
            }
        },
        "opened_at": null,
        "resend_id": "21f6db80-e46d-4e5e-9a5e-4857df39eb53",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2025-12-17T00:43:54.731002+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "rayfotografia09@gmail.com"
    },
    {
        "id": "11c1730b-65a5-4440-b862-f0254a27944e",
        "status": "sent",
        "sent_at": "2026-01-05T19:47:54.031+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "103a1b72-2df6-4759-9ef9-2d9d4ae170fd"
            }
        },
        "opened_at": null,
        "resend_id": "103a1b72-2df6-4759-9ef9-2d9d4ae170fd",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-01-05T19:47:54.1088+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "flavio.cost@live.com"
    },
    {
        "id": "ec56e245-37f7-4ec9-b2ab-41dc92da6cbf",
        "status": "sent",
        "sent_at": "2025-12-23T12:47:13.489+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "54e3419a-66a7-497d-b754-f02d356154b5"
            }
        },
        "opened_at": null,
        "resend_id": "54e3419a-66a7-497d-b754-f02d356154b5",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2025-12-23T12:47:13.711882+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "jeariane09@icloud.com"
    },
    {
        "id": "c6043d71-afa3-4a2b-ba59-d81b25993870",
        "status": "sent",
        "sent_at": "2025-12-16T20:11:53.699+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "d6f00ba0-32a3-4c02-9a6a-b59c08b1155f"
            }
        },
        "opened_at": null,
        "resend_id": "d6f00ba0-32a3-4c02-9a6a-b59c08b1155f",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2025-12-16T20:11:53.762258+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "faelamaral@yahoo.com.br"
    },
    {
        "id": "3b4ccdfd-4940-4b0b-a1bc-66dec0d59761",
        "status": "sent",
        "sent_at": "2026-02-21T19:51:52.284+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "51aceae7-6522-4231-8d78-39d0c8bcd785"
            }
        },
        "opened_at": null,
        "resend_id": "51aceae7-6522-4231-8d78-39d0c8bcd785",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-21T19:51:52.361662+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "318b9505-3864-4cc9-8e4d-9e2469aa0cf5",
        "status": "sent",
        "sent_at": "2026-02-21T19:47:15.609+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "7964381b-85c8-4c43-b254-b9dfc91c4802"
            }
        },
        "opened_at": null,
        "resend_id": "7964381b-85c8-4c43-b254-b9dfc91c4802",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-21T19:47:15.696308+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "9a7b863d-e63a-46da-8cb8-a8fc2cf6ae3d",
        "status": "sent",
        "sent_at": "2026-02-21T19:41:03.457+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "06e3b3ce-1b6c-4f55-bcbd-cc3808d1083f"
            }
        },
        "opened_at": null,
        "resend_id": "06e3b3ce-1b6c-4f55-bcbd-cc3808d1083f",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-21T19:41:03.544697+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "d5877c7c-2c1d-477d-9099-8c41d3d775d9",
        "status": "sent",
        "sent_at": "2025-12-23T12:50:10.491+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "d503bf77-1fcd-4697-87ba-6f93e8529e53"
            }
        },
        "opened_at": null,
        "resend_id": "d503bf77-1fcd-4697-87ba-6f93e8529e53",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2025-12-23T12:50:10.547193+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "jeariane09@icloud.com"
    },
    {
        "id": "d32d8976-ce3d-443e-8eff-dd6edc3f0847",
        "status": "sent",
        "sent_at": "2026-02-21T20:46:47.428+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "c2871f60-2d2c-47e0-8ee3-5d212f5dc537"
            }
        },
        "opened_at": null,
        "resend_id": "c2871f60-2d2c-47e0-8ee3-5d212f5dc537",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-21T20:46:47.522784+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "c16a18ee-3e31-4122-ad64-55c19d3bfe6c",
        "status": "sent",
        "sent_at": "2026-02-21T23:00:44.334+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "51469f7a-564a-4a83-b9f6-47c8097ab319"
            }
        },
        "opened_at": null,
        "resend_id": "51469f7a-564a-4a83-b9f6-47c8097ab319",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-21T23:00:44.415032+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "c5f9a1bc-0898-4500-a710-02ee9eac9a4f",
        "status": "sent",
        "sent_at": "2026-02-21T23:25:31.931+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "0df2cf1f-e013-4ec1-8fe4-299572e6e81d"
            }
        },
        "opened_at": null,
        "resend_id": "0df2cf1f-e013-4ec1-8fe4-299572e6e81d",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-21T23:25:32.02957+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "ea49a794-a23c-4e16-aafa-888c49506b7e",
        "status": "sent",
        "sent_at": "2026-02-21T23:33:19.707+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "66aa5871-defa-45e6-89b8-ab143cbe16fa"
            }
        },
        "opened_at": null,
        "resend_id": "66aa5871-defa-45e6-89b8-ab143cbe16fa",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-21T23:33:19.790097+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "c4e5a7c4-aea5-493d-97a1-73cd754e09b5",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "1508cc37-fb52-4cb9-88dd-77a565b9af0b",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T01:33:19.055146+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "61c99774-8001-48b4-8850-87d217b91ded",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "6218a01d-b203-4062-bb46-e81da7c1f24c",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T01:33:59.996998+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "ece5a049-a00c-409a-9425-578089640844",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "f353b4d5-ac8f-4075-afee-49ff72c633f2",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T01:40:23.579633+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "18f27a21-af26-4077-a1d3-30c8a9044f3d",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "a35c3087-41aa-4d47-a7b4-8b008e307e3a",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T01:42:58.364578+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "5aeb9cb8-897b-4f3b-8745-b6c0a7fc9560",
        "status": "sent",
        "sent_at": "2026-08-22T12:40:18.128+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "5361d895-6a14-44a7-8a7c-ec2abe5257aa"
            }
        },
        "opened_at": null,
        "resend_id": "5361d895-6a14-44a7-8a7c-ec2abe5257aa",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-22T12:40:18.201876+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "recipient_email": "bibikova.irina@list.ru"
    },
    {
        "id": "b26b8a33-4b31-408d-89d7-1aadb5a59b0c",
        "status": "sent",
        "sent_at": "2026-08-28T10:00:06.982+00:00",
        "subject": "Check-in digital - Simonie Ting",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-28T10:00:07.00105+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "recipient_email": "simonieting@yahoo.com.br"
    },
    {
        "id": "3b6fea18-c7ae-44ec-b17e-3479c5c60a88",
        "status": "sent",
        "sent_at": "2026-02-22T00:06:48.506+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "795664b2-dabc-491a-8e11-6ae566d890ec"
            }
        },
        "opened_at": null,
        "resend_id": "795664b2-dabc-491a-8e11-6ae566d890ec",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-22T00:06:48.586561+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "8b449999-b44d-4e36-8290-39f821e82c05",
        "status": "sent",
        "sent_at": "2026-02-22T00:07:12.157+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "fcc2aeb0-310b-4445-8968-7053e38ea851"
            }
        },
        "opened_at": null,
        "resend_id": "fcc2aeb0-310b-4445-8968-7053e38ea851",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-22T00:07:12.247931+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "42d7c91e-b797-4f42-856d-bf398fbd0686",
        "status": "sent",
        "sent_at": "2026-02-24T20:26:42.502+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "a29e76a9-0bde-4d3c-90dd-3c2ffb4ced60"
            }
        },
        "opened_at": null,
        "resend_id": "a29e76a9-0bde-4d3c-90dd-3c2ffb4ced60",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-02-24T20:26:42.727884+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "6a5dec6c-30b1-4975-ab86-47e8ef53e259",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "f044f426-83d2-4734-b8f1-cedabd0916ff",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T00:53:30.66643+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "b4d2531b-314c-49e2-aff9-f9c67ed1a9ac",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "3227c137-737f-47b2-bb8a-934a69f41443",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T10:00:06.457426+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "e671dda2-26c6-4ef3-9b6b-2ccfcc00cd9d",
        "status": "sent",
        "sent_at": "2026-08-31T10:00:06.489+00:00",
        "subject": "Check-in digital - Flávio Augusto da Costa",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T10:00:06.522412+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "8f98704d-7963-4152-a7ae-6fd3451bd0d8",
        "status": "sent",
        "sent_at": "2026-03-02T22:36:50.412+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "9e92fbc2-118e-44d5-bf77-841ebfadd404"
            }
        },
        "opened_at": null,
        "resend_id": "9e92fbc2-118e-44d5-bf77-841ebfadd404",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:36:50.493994+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "f1345038-7eb3-4d18-ab1e-617d22ed4862",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "f62452cd-e554-4440-a47b-60651df62074",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:40:24.330268+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "40287f72-47ce-4619-a0d3-6b1e8a1a1d01",
        "status": "sent",
        "sent_at": "2026-03-02T22:45:16.686+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "4d948fec-7856-410e-8653-7ba57269f01f"
            }
        },
        "opened_at": null,
        "resend_id": "4d948fec-7856-410e-8653-7ba57269f01f",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:45:16.765606+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "680eae5c-306b-4888-8072-b04a0ac27dc8",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "fcb3814f-d4ac-434d-afa9-d0d52fd7c4c8",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:45:26.528468+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "c63feddf-724c-49e7-808f-fda3d2e18e40",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "0843489c-9722-4609-b5a9-52ce42234189",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:48:17.343735+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "9049d562-5410-4f91-890a-b4342e949e25",
        "status": "sent",
        "sent_at": "2026-03-02T22:13:38.439+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "4a026f9e-b5ee-4dbd-a8d9-2b9b86c89f4a"
            }
        },
        "opened_at": null,
        "resend_id": "4a026f9e-b5ee-4dbd-a8d9-2b9b86c89f4a",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:13:38.52328+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "a9915f8f-7009-43f4-9b39-903e323a6d19",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "674fe975-9c88-44c2-b9b6-2309097dcd56",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:16:58.860665+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "0f8d6d22-7212-4a7b-82be-4c68780d0633",
        "status": "sent",
        "sent_at": "2026-03-02T23:16:44.311+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "5192fb38-07a6-4e15-a46e-ab7f61d4d0af"
            }
        },
        "opened_at": null,
        "resend_id": "5192fb38-07a6-4e15-a46e-ab7f61d4d0af",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T23:16:44.38995+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "9388d99b-e8d4-4c54-b938-53406b3371f5",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "37d94911-8fb1-4193-b745-b97c60933c71",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T23:17:07.397386+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "6380d066-bc21-48b6-a77a-526d26092cac",
        "status": "sent",
        "sent_at": "2026-03-02T22:53:17.175+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "047a0e3c-ca97-4172-8bb6-d807bf3cae10"
            }
        },
        "opened_at": null,
        "resend_id": "047a0e3c-ca97-4172-8bb6-d807bf3cae10",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:53:17.233139+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "7f1efbeb-01b5-4385-8e78-5af0a72cd8dc",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "558a325c-64b8-4057-9163-b55045a126a4",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:53:25.025339+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "4e47d570-4060-4426-8eb4-45056c00d35b",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "21c2f2e6-c407-4af7-9316-312c93ea27d6",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-02T22:55:21.729317+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "658b3b6b-ad56-4f8b-a357-6b2252e8689f",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "77086418-e240-4002-8f91-98b8096ed7c3",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T13:32:04.139196+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "recipient_email": "chalesepousadaararaazul@gmail.com"
    },
    {
        "id": "3323ce69-c6cd-48c1-afae-0c303e0a6ccb",
        "status": "sent",
        "sent_at": "2026-03-03T13:32:04.183+00:00",
        "subject": "Check-out digital - Jansen Dominique Hunink",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T13:32:04.213582+00:00",
        "email_type": "checkout_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "recipient_email": "chalesepousadaararaazul@gmail.com"
    },
    {
        "id": "994bb9d2-f183-44d7-98df-b95b9f42e482",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "2d838327-7cdd-4c69-b683-a7bac17a3d97",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T13:32:00.534359+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "44aa135a-f692-4c7d-9423-6d5501c8bcd9",
        "status": "sent",
        "sent_at": "2026-03-03T13:32:00.558+00:00",
        "subject": "Check-in digital - Flávio Costa",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T13:32:00.586571+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "6ec2c1c7-5eb1-4504-819f-d32092094c32",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "1772f800-744a-47a7-96e7-d83ebdb0b092",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-07T10:00:11.831298+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "f62dbc18-08ab-49d3-aa12-8aa06fc00b24",
        "status": "sent",
        "sent_at": "2026-03-07T10:00:11.854+00:00",
        "subject": "Check-out digital - Flávio Costa",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-07T10:00:11.874538+00:00",
        "email_type": "checkout_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "cc706ecf-0d96-4f18-b5c3-1abe58fa7c16",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "697262e3-b8cb-44e0-99d2-5f4e3cd04b23",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T00:53:25.282668+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "edna.aparecida.cost@gmail.com"
    },
    {
        "id": "7568c6dd-0d13-4437-b99e-302d387201b9",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "36e71c92-7d6f-44c0-bbb7-bb9791d0d637",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T00:58:06.629752+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "3d9ed10f-fe36-4466-bb13-d0b4c57f948b",
        "status": "sent",
        "sent_at": "2026-03-03T14:05:24.206+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "2c0e1ace-a219-4fc5-8e9b-c47502ef18ca"
            }
        },
        "opened_at": null,
        "resend_id": "2c0e1ace-a219-4fc5-8e9b-c47502ef18ca",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T14:05:24.316745+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "laracabraloliver@outlook.com"
    },
    {
        "id": "4ceaea79-5aa9-471b-852b-04e40a8ed24e",
        "status": "sent",
        "sent_at": "2026-03-03T14:07:09.246+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "6e0c4865-fa28-409c-a966-1de07d700840"
            }
        },
        "opened_at": null,
        "resend_id": "6e0c4865-fa28-409c-a966-1de07d700840",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T14:07:09.341257+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "laracabraloliver@outlook.com"
    },
    {
        "id": "a91e8c75-d98e-47e6-b67f-b076daad3369",
        "status": "sent",
        "sent_at": "2026-03-03T14:07:33.017+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "f34e10e8-17f2-4f83-a1c8-43b63ea7a1c7"
            }
        },
        "opened_at": null,
        "resend_id": "f34e10e8-17f2-4f83-a1c8-43b63ea7a1c7",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T14:07:33.211456+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "24ce33a0-0c96-4d7e-b356-01d9521535e9",
        "status": "sent",
        "sent_at": "2026-03-03T14:10:22.409+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "d4850897-c212-4a46-99d3-edb1ce38233c"
            }
        },
        "opened_at": null,
        "resend_id": "d4850897-c212-4a46-99d3-edb1ce38233c",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T14:10:22.653977+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "1838d059-6493-4ce3-9e42-a920c0af955a",
        "status": "sent",
        "sent_at": "2026-03-03T14:11:18.894+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "f8509aeb-aa42-4fee-ac3f-723f20d07bae"
            }
        },
        "opened_at": null,
        "resend_id": "f8509aeb-aa42-4fee-ac3f-723f20d07bae",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T14:11:19.066524+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "laracabraloliver@outlook.com"
    },
    {
        "id": "36f6f8f4-822a-497c-9f37-335091df9845",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "8bc32b1b-260e-4151-96d9-55a3a6ea5d49",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T14:15:29.86304+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "laracabraloliver@outlook.com"
    },
    {
        "id": "cdd25bed-a3a9-4d21-9ec3-0ae734db80dd",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "e92ebe02-1901-4729-9270-992b07ffe864",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-03T14:25:10.0633+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "laracabraloliver@outlook.com"
    },
    {
        "id": "a3fc35ba-72ba-470c-8052-53d06cd6e874",
        "status": "sent",
        "sent_at": "2026-08-22T12:40:18.881+00:00",
        "subject": "Antecipe seu Check-in — Pousada Arara Azul",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "05a29201-de45-49b1-82ba-e6d6518b2433",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-22T12:40:19.31606+00:00",
        "email_type": "pre_checkin",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "recipient_email": "bibikova.irina@list.ru"
    },
    {
        "id": "5750adc9-4bd1-41b3-bfce-42bc0ac1ed3d",
        "status": "sent",
        "sent_at": "2026-03-31T22:46:32.129+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "86c19072-1998-44f4-9fff-8cda017c57b4"
            }
        },
        "opened_at": null,
        "resend_id": "86c19072-1998-44f4-9fff-8cda017c57b4",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-03-31T22:46:32.543492+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "a85f122d-decd-4968-acad-d4b19ed014f6",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "8a786190-7c9e-44c5-b150-eb62ab5ab776",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T01:07:08.645382+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "adf61ddd-c43c-42aa-b3f4-d3f46c3cded5",
        "status": "sent",
        "sent_at": "2026-04-22T22:21:21.512+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "23d2dab5-9bb7-437f-98dd-ae21250541cb"
            }
        },
        "opened_at": null,
        "resend_id": "23d2dab5-9bb7-437f-98dd-ae21250541cb",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-04-22T22:21:21.91627+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "flavio.cost@live.com"
    },
    {
        "id": "9de3eed6-f348-42bd-a41c-5c9d7378c196",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "db39b343-9075-4f37-985d-834412cc019f",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-04-22T22:25:34.204173+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "flavio.cost@live.com"
    },
    {
        "id": "870fd7f6-54b1-4320-a54a-8d4c43333c4e",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "517e18da-9daf-408d-ae37-ab2265e7b1a6",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-04-22T22:28:47.094157+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "flavio.cost@live.com"
    },
    {
        "id": "8fbb3ff8-d336-402f-aac9-879b39f69ad8",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "01a066b6-1f9d-7792-8d8b-35b811b59761",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-09-03T10:00:06.979579+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "recipient_email": "simonieting@yahoo.com.br"
    },
    {
        "id": "53f9e826-6f39-4779-992c-4cb6444ead21",
        "status": "sent",
        "sent_at": "2026-05-17T00:40:23.424+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "e795d381-2dbc-4367-ad3b-b0281324e691"
            }
        },
        "opened_at": null,
        "resend_id": "e795d381-2dbc-4367-ad3b-b0281324e691",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-05-17T00:40:23.848092+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "AnneWegele@gmx.de"
    },
    {
        "id": "4878d3e4-3085-4d94-b430-1be13146c9c6",
        "status": "sent",
        "sent_at": "2026-05-17T01:07:44.437+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "5df7f783-4c36-4256-ac36-afd34043423c"
            }
        },
        "opened_at": null,
        "resend_id": "5df7f783-4c36-4256-ac36-afd34043423c",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-05-17T01:07:44.51269+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "laracabraloliver@outlook.com"
    },
    {
        "id": "057ef89e-859e-4a0c-86a4-6d74fb2d6ac0",
        "status": "sent",
        "sent_at": "2026-05-17T01:11:46.163+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "b098114d-71f6-4eec-ba10-add821c5c2b2"
            }
        },
        "opened_at": null,
        "resend_id": "b098114d-71f6-4eec-ba10-add821c5c2b2",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-05-17T01:11:46.237063+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "laracabraloliver@outlook.com"
    },
    {
        "id": "a59bb81d-357c-49cb-b206-b6c17606324b",
        "status": "sent",
        "sent_at": "2026-05-17T01:17:10.786+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "63e8c4d3-6984-42fa-b3a4-47991e0c7782"
            }
        },
        "opened_at": null,
        "resend_id": "63e8c4d3-6984-42fa-b3a4-47991e0c7782",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-05-17T01:17:10.868105+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "AnneWegele@gmx.de"
    },
    {
        "id": "815052d8-de60-4baf-8176-fb19b3d6305d",
        "status": "sent",
        "sent_at": "2026-05-17T22:59:11.31+00:00",
        "subject": "Buchung bestätigt – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "3c27c788-de18-44b0-a24e-27e36bbebb97"
            }
        },
        "opened_at": null,
        "resend_id": "3c27c788-de18-44b0-a24e-27e36bbebb97",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-05-17T22:59:11.743711+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "AnneWegele@gmx.de"
    },
    {
        "id": "b60f17ad-7e0b-455e-b5a9-c4e2a6857473",
        "status": "sent",
        "sent_at": "2026-06-16T16:54:10.853+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "f26cac89-f5cf-4f7c-9fe2-fd26fb9907e2"
            }
        },
        "opened_at": null,
        "resend_id": "f26cac89-f5cf-4f7c-9fe2-fd26fb9907e2",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-06-16T16:54:10.937+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "recipient_email": "wptonp@gmail.com"
    },
    {
        "id": "740cf617-08ca-40e6-ac00-5695770477fb",
        "status": "sent",
        "sent_at": "2026-06-17T13:59:08.388+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "cfc820e9-8f02-42c4-98aa-d5417c8149a0"
            }
        },
        "opened_at": null,
        "resend_id": "cfc820e9-8f02-42c4-98aa-d5417c8149a0",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-06-17T13:59:08.777014+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "recipient_email": "wptonp@gmail.com"
    },
    {
        "id": "2b43c2e1-2fe3-4733-9d73-923bd2ff27b9",
        "status": "sent",
        "sent_at": "2026-07-01T15:32:30.002+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "a2aaa53d-13ef-4b75-a0cb-76bebd1f9041"
            }
        },
        "opened_at": null,
        "resend_id": "a2aaa53d-13ef-4b75-a0cb-76bebd1f9041",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-01T15:32:30.101472+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "recipient_email": "simonieting@yahoo.com.br"
    },
    {
        "id": "f5b9a503-b0c2-41cc-b1e6-0d8048d7f5dc",
        "status": "sent",
        "sent_at": "2026-07-04T13:03:18.628+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "8a69f958-d6c8-44b0-94b2-b6d580bf801c"
            }
        },
        "opened_at": null,
        "resend_id": "8a69f958-d6c8-44b0-94b2-b6d580bf801c",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-04T13:03:18.701957+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "recipient_email": "paolaroma81@gmail.com"
    },
    {
        "id": "73922523-d870-475f-8de1-5624833a13ea",
        "status": "sent",
        "sent_at": "2026-07-04T13:03:31.866+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "523dfe7e-a616-41e7-9863-b6b49642f85e"
            }
        },
        "opened_at": null,
        "resend_id": "523dfe7e-a616-41e7-9863-b6b49642f85e",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-04T13:03:31.941774+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "recipient_email": "paolaroma81@gmail.com"
    },
    {
        "id": "99a63160-2e41-4d73-a984-68f82290d34f",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "792d517a-0882-4128-a05d-cf16f34ecce2",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-15T10:00:05.299194+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "recipient_email": "wptonp@gmail.com"
    },
    {
        "id": "bf249a43-5017-4935-82c5-cda6a662bdca",
        "status": "sent",
        "sent_at": "2026-07-15T10:00:05.324+00:00",
        "subject": "Check-in digital - Welington Pereira",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-15T10:00:05.342087+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "recipient_email": "wptonp@gmail.com"
    },
    {
        "id": "d7015246-1829-4586-8c1b-93c5cd1a56b3",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "699e959f-2609-4033-8de1-bc4feb96e761",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-21T10:00:06.642357+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "recipient_email": "wptonp@gmail.com"
    },
    {
        "id": "84d519af-f58a-4934-9615-08b059af8bc6",
        "status": "sent",
        "sent_at": "2026-07-21T10:00:06.666+00:00",
        "subject": "Check-out digital - Welington Pereira",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-21T10:00:06.678608+00:00",
        "email_type": "checkout_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "recipient_email": "wptonp@gmail.com"
    },
    {
        "id": "14600246-55c8-4858-b142-96fee085df06",
        "status": "sent",
        "sent_at": "2026-07-22T13:40:56.16+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "e6181361-e086-4866-be04-c8edf0ae36d4"
            }
        },
        "opened_at": null,
        "resend_id": "e6181361-e086-4866-be04-c8edf0ae36d4",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-22T13:40:56.581778+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "recipient_email": "safiradelasala@gmail.com"
    },
    {
        "id": "34b3468d-125d-48bc-9a6e-2a2b4974c18e",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "2e3da5a8-a824-41ed-9355-007910d0107a",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-23T10:00:08.846214+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "recipient_email": "safiradelasala@gmail.com"
    },
    {
        "id": "9236429b-6b05-4160-8219-45b19ca7c193",
        "status": "sent",
        "sent_at": "2026-07-23T10:00:08.872+00:00",
        "subject": "Check-in digital - Safira Celeste Perez De La Sala Gonzalez ",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-23T10:00:08.90269+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "recipient_email": "safiradelasala@gmail.com"
    },
    {
        "id": "6e7f33b2-44c6-48bf-a194-f2c4d5fc057f",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "3ba16f8a-ff38-4d95-a265-80677cfba598",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-23T10:00:09.456029+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "recipient_email": "paolaroma81@gmail.com"
    },
    {
        "id": "54466b06-78af-42f5-86a0-08428a946b16",
        "status": "sent",
        "sent_at": "2026-07-23T10:00:09.472+00:00",
        "subject": "Check-in digital - Paola Veri Tufano ",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-23T10:00:09.485355+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "recipient_email": "paolaroma81@gmail.com"
    },
    {
        "id": "d4062f56-4811-4cc3-b6fb-7e8eccabdc6f",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "7735a71a-1e7c-4f87-ac0a-7ee967a31b6b",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-23T10:00:09.79693+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "recipient_email": "paolaroma81@gmail.com"
    },
    {
        "id": "3590a08a-030a-4b48-b100-c4eb283af8a3",
        "status": "sent",
        "sent_at": "2026-07-23T10:00:09.839+00:00",
        "subject": "Check-in digital - Paola Veri Tufano ",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-23T10:00:09.852051+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "recipient_email": "paolaroma81@gmail.com"
    },
    {
        "id": "903f7837-8ad2-4b55-bd00-eea33d6977d3",
        "status": "sent",
        "sent_at": "2026-07-29T16:51:10.235+00:00",
        "subject": "🌿 Réservation confirmée – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "1b6a2d8b-7293-4e82-b6a3-d39f1e250f00"
            }
        },
        "opened_at": null,
        "resend_id": "1b6a2d8b-7293-4e82-b6a3-d39f1e250f00",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-29T16:51:10.314381+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "f8260fb3-641c-42e5-b081-8be319f5873e",
        "status": "sent",
        "sent_at": "2026-07-29T16:56:12.926+00:00",
        "subject": "🌿 Réservation confirmée – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "302a649f-ce3d-4d2e-9511-03341ad90616"
            }
        },
        "opened_at": null,
        "resend_id": "302a649f-ce3d-4d2e-9511-03341ad90616",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-07-29T16:56:13.349632+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "fa59af9b-da34-4fb6-abb5-02bdd164d1b1",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "28b0d680-25c8-4c47-9c95-2f35aae66c43",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-03T10:00:06.055906+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "annewegele@gmx.de"
    },
    {
        "id": "3e9b6bec-2c9f-4761-81b7-c1663c85eb81",
        "status": "sent",
        "sent_at": "2026-08-03T10:00:06.083+00:00",
        "subject": "Check-in digital - Anne Kathrin Wegele",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-03T10:00:06.094481+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "annewegele@gmx.de"
    },
    {
        "id": "83cfaea3-53a6-4e7c-ad10-f60ae999f118",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-out Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "b08c097e-2ba0-4dfe-9375-6eb5791ea32c",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-08T10:00:05.522406+00:00",
        "email_type": "checkout_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "annewegele@gmx.de"
    },
    {
        "id": "f772b720-5685-48d7-b318-2c9587f8bbb6",
        "status": "sent",
        "sent_at": "2026-08-08T10:00:05.543+00:00",
        "subject": "Check-out digital - Anne Kathrin Wegele",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-08T10:00:05.562683+00:00",
        "email_type": "checkout_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "recipient_email": "annewegele@gmx.de"
    },
    {
        "id": "75f91251-a33c-4afe-9331-7ebc164eb16d",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "e53f89b3-2999-4e1d-9d10-b55f8f405eee",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-10T10:00:04.431737+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "cc4fc61f-7a93-4395-821f-adbdbf942507",
        "status": "sent",
        "sent_at": "2026-08-10T10:00:04.462+00:00",
        "subject": "Check-in digital - Florent Rossi",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-10T10:00:04.486956+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "cd9a4be7-4f20-4e2e-8009-f4f3b89ff187",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "ede02a4b-b411-4496-8fc5-e18a53129f29",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-10T10:00:05.43061+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "370fdd70-b0b6-4c97-b68b-446bb5de195f",
        "status": "sent",
        "sent_at": "2026-08-10T10:00:05.451+00:00",
        "subject": "Check-in digital - Florent Rossi",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-10T10:00:05.478385+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "recipient_email": "florent_rossi@yahoo.fr"
    },
    {
        "id": "d6dbdc6e-7506-455d-9e58-ed95cd8e0838",
        "status": "sent",
        "sent_at": "2026-08-22T12:45:54.575+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "2e52556d-aca9-4650-8513-0ea3833fffdb"
            }
        },
        "opened_at": null,
        "resend_id": "2e52556d-aca9-4650-8513-0ea3833fffdb",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-22T12:45:54.685827+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "recipient_email": "bibikova.irina@list.ru"
    },
    {
        "id": "493bd2bd-1ca4-4780-ba1f-fb4c17025751",
        "status": "sent",
        "sent_at": "2026-08-31T00:31:35.138+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "7dab253f-bd1f-4290-80e5-4f35bc7ed446"
            }
        },
        "opened_at": null,
        "resend_id": "7dab253f-bd1f-4290-80e5-4f35bc7ed446",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T00:31:35.230174+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "653fb0ab-5483-47a0-88c9-f5a36d858a2e",
        "status": "sent",
        "sent_at": "2026-08-31T00:31:35.648+00:00",
        "subject": "Antecipe seu Check-in — Pousada Arara Azul",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "1a7d55e4-f277-4e82-b2da-16323a092d53",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T00:31:35.726873+00:00",
        "email_type": "pre_checkin",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "d8d32c15-92c2-464a-90be-763adf3db68d",
        "status": "sent",
        "sent_at": "2026-09-03T10:00:07.021+00:00",
        "subject": "Check-out digital - Simonie Ting",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-09-03T10:00:07.05178+00:00",
        "email_type": "checkout_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "recipient_email": "simonieting@yahoo.com.br"
    },
    {
        "id": "f07893e4-8a21-44f9-9270-202cf908ab9b",
        "status": "error",
        "sent_at": null,
        "subject": "May we prepare your arrival at Pousada Rará Azul? 🌿",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T22:50:10.166016+00:00",
        "email_type": "pre_arrival_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": "{\"statusCode\":422,\"name\":\"validation_error\",\"message\":\"Invalid `to` field. Please use our testing email address instead of domains like `example.com`. See our documentation for more information.\"}",
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "teste.parte10@example.com"
    },
    {
        "id": "33b10ecf-ec13-48d9-ab74-1eab718f4e67",
        "status": "error",
        "sent_at": null,
        "subject": "May we prepare your arrival at Pousada Rará Azul? 🌿",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T22:50:11.006653+00:00",
        "email_type": "pre_arrival_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": "{\"statusCode\":422,\"name\":\"validation_error\",\"message\":\"Invalid `to` field. Please use our testing email address instead of domains like `example.com`. See our documentation for more information.\"}",
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "teste.parte10@example.com"
    },
    {
        "id": "2f04006f-81a2-42cc-b171-3630912ba5ae",
        "status": "error",
        "sent_at": null,
        "subject": "May we prepare your arrival at Pousada Rará Azul? 🌿",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T22:50:11.971534+00:00",
        "email_type": "pre_arrival_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": "{\"statusCode\":422,\"name\":\"validation_error\",\"message\":\"Invalid `to` field. Please use our testing email address instead of domains like `example.com`. See our documentation for more information.\"}",
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "teste.parte10@example.com"
    },
    {
        "id": "dd149fe8-14a0-4e72-98bd-44a93246064d",
        "status": "sent",
        "sent_at": "2026-08-11T22:52:55.219+00:00",
        "subject": "Novo questionário de pré-chegada — Reserva #PAA-A64AAD",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "6effb4de-4060-4be7-acad-b3fd71cfdf63",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T22:52:55.234706+00:00",
        "email_type": "pre_arrival_internal",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "b9ac38e9-b886-426a-b4a4-b6256da06448",
        "status": "sent",
        "sent_at": "2026-08-11T22:53:50.087+00:00",
        "subject": "Novo questionário de pré-chegada — Reserva #PAA-A64AAD",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "df0eb349-1806-475e-b28a-d82943cee575",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T22:53:50.10403+00:00",
        "email_type": "pre_arrival_internal",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "12189ee6-039c-4c59-8cb4-011cb39ca0ee",
        "status": "sent",
        "sent_at": "2026-08-11T21:25:37.654+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "b604118b-d8ce-489c-a961-61204709d760"
            }
        },
        "opened_at": null,
        "resend_id": "b604118b-d8ce-489c-a961-61204709d760",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T21:25:37.737012+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "1a2128a0-109d-4572-a9e3-2a0895a21c20",
        "status": "sent",
        "sent_at": "2026-08-11T23:18:13.728+00:00",
        "subject": "May we prepare your arrival at Pousada Rará Azul? 🌿",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "68e56ee0-b780-46c7-9001-b9f3bad1c405",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T23:18:14.192007+00:00",
        "email_type": "pre_arrival_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "856ec4a4-0d5c-46a9-bb69-ae3ae108e611",
        "status": "sent",
        "sent_at": "2026-08-11T23:55:32.138+00:00",
        "subject": "May we prepare your arrival at Pousada Arara Azul? 🌿",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "57d7af04-d726-4862-8208-dc8a6e888033",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T23:55:32.941331+00:00",
        "email_type": "pre_arrival_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "b13afb0b-7833-49c1-b215-3cb523e08cfc",
        "status": "sent",
        "sent_at": "2026-08-11T23:59:57.737+00:00",
        "subject": "Novo questionário de pré-chegada — Reserva #PAA-67B2A5",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "46fcda12-1e75-4ee9-a073-419c176029b0",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T23:59:57.820015+00:00",
        "email_type": "pre_arrival_internal",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "b0969e11-87ad-4bb3-a505-ad32e3a96849",
        "status": "sent",
        "sent_at": "2026-08-12T00:02:38.579+00:00",
        "subject": "Novo questionário de pré-chegada — Reserva #PAA-67B2A5",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "e638b9d2-522f-4a0c-b705-9d4c224dc4ca",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-12T00:02:38.661958+00:00",
        "email_type": "pre_arrival_internal",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "769d3ab2-0aa5-4deb-bb72-468af20c7146",
        "status": "sent",
        "sent_at": "2026-08-11T17:05:18.595+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "add9dd07-5d68-49b8-91fd-b458fae0542f"
            }
        },
        "opened_at": null,
        "resend_id": "add9dd07-5d68-49b8-91fd-b458fae0542f",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T17:05:18.702413+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "59f1b375-858c-4eb3-b257-95b8dfcc8e18",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "dc4b733c-36a3-41bc-9d35-73fd0a4a5de7",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-11T17:50:40.450689+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "11e8f0c6-53a3-4f95-b6cc-8a3cd4adaa47",
        "status": "sent",
        "sent_at": "2026-08-12T00:26:42.313+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "dcb8dd18-8acb-4aa7-bd89-08059252d5aa"
            }
        },
        "opened_at": null,
        "resend_id": "dcb8dd18-8acb-4aa7-bd89-08059252d5aa",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-12T00:26:42.387026+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "df7c110e-17a5-4d2f-9727-aed24f936def",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "d5a68141-6001-4149-a26d-1b9b104673cc",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-12T00:27:44.581769+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "162b01aa-aab4-4724-acab-4b612a1d4e0a",
        "status": "sent",
        "sent_at": "2026-08-12T00:32:30.161+00:00",
        "subject": "Novo questionário de pré-chegada — Reserva #PAA-68D9B7",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "7d863bbf-e550-405f-bcf2-f8b1db8a3b0d",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-12T00:32:30.267487+00:00",
        "email_type": "pre_arrival_internal",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "a3750caa-d53b-47e0-80ec-b3cd364cc833",
        "status": "sent",
        "sent_at": "2026-08-12T01:21:59.382+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "53957510-d966-4419-8ffb-1b6d3c3d28b9"
            }
        },
        "opened_at": null,
        "resend_id": "53957510-d966-4419-8ffb-1b6d3c3d28b9",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-12T01:21:59.601343+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "flavio.cost@live.com"
    },
    {
        "id": "28b3e7d0-f24e-44db-8ff6-7ac0b56b8c8d",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "10a33dd4-7f4a-47cf-af43-d7650f2b676b",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-12T10:00:07.859096+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "flavio.cost@live.com"
    },
    {
        "id": "10992d11-a885-4ec3-94ad-f0961b382cc1",
        "status": "sent",
        "sent_at": "2026-08-12T10:00:07.898+00:00",
        "subject": "Check-in digital - Flávio Augusto da Costa",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": null,
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-12T10:00:07.918865+00:00",
        "email_type": "checkin_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "flavio.cost@live.com"
    },
    {
        "id": "3d062599-0fcd-49f7-95a5-985e17a5de66",
        "status": "sent",
        "sent_at": "2026-08-13T11:45:52.059+00:00",
        "subject": "Antecipe seu Check-in — Pousada Arara Azul",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "16769851-9197-4a13-99fd-f7b6a2c194e9",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-13T11:45:52.143304+00:00",
        "email_type": "pre_checkin",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "flavio.cost@live.com"
    },
    {
        "id": "898b0afc-00f0-4a45-824f-c07a2cca0d08",
        "status": "sent",
        "sent_at": "2026-08-26T10:00:05.777+00:00",
        "subject": "Podemos preparar sua chegada à Pousada Arara Azul? 🌿",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "c356f320-8602-4a9a-8e7e-21cffdba5509",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-26T10:00:05.889548+00:00",
        "email_type": "pre_arrival_reminder",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "recipient_email": "simonieting@yahoo.com.br"
    },
    {
        "id": "e719f983-3f23-412f-95a1-9129be5bab22",
        "status": "sent",
        "sent_at": "2026-08-13T12:32:56.092+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "3622a467-6454-4425-88e8-a50edf2452ff"
            }
        },
        "opened_at": null,
        "resend_id": "3622a467-6454-4425-88e8-a50edf2452ff",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-13T12:32:56.153824+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "ab9433b4-4387-4681-9ccb-6434161741db",
        "status": "sent",
        "sent_at": "2026-08-13T12:32:56.898+00:00",
        "subject": "Antecipe seu Check-in — Pousada Arara Azul",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "5f11ddc7-e157-4a46-aff2-a93113b492fa",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-13T12:32:57.117725+00:00",
        "email_type": "pre_checkin",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "bc5f9100-dbe2-493a-8484-727c0624c0da",
        "status": "sent",
        "sent_at": "2026-08-13T12:45:49.616+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "25d68ce9-49b0-43d0-ba86-6246d5cee146"
            }
        },
        "opened_at": null,
        "resend_id": "25d68ce9-49b0-43d0-ba86-6246d5cee146",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-13T12:45:49.727086+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "23baaca4-9a50-4ff1-afb8-65b652499da1",
        "status": "sent",
        "sent_at": "2026-08-13T12:47:39.152+00:00",
        "subject": "🌿 Reserva confirmada – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "0b7271dc-4c2a-46e8-8f6e-05a1c505b648"
            }
        },
        "opened_at": null,
        "resend_id": "0b7271dc-4c2a-46e8-8f6e-05a1c505b648",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-13T12:47:39.230411+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "dacdb9ca-3f98-4f39-afdf-57b3a425b230",
        "status": "sent",
        "sent_at": null,
        "subject": "Check-in Digital",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "1a2cf830-ee7d-4701-9183-d7f90329ab0b",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-13T12:48:56.643592+00:00",
        "email_type": "checkin_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "692c6e44-08db-4d5f-ab9c-732a75ece2fc",
        "status": "sent",
        "sent_at": "2026-08-13T13:00:11.247+00:00",
        "subject": "Novo questionário de pré-chegada — Reserva #PAA-D82404",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "24c59d39-f1cf-4410-b4b0-4ff8383047af",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-13T13:00:11.3251+00:00",
        "email_type": "pre_arrival_internal",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "reservas@pousadararazul.com"
    },
    {
        "id": "52791a3d-2a57-4775-9e99-78bfbb38dda1",
        "status": "sent",
        "sent_at": "2026-08-31T00:49:42.724+00:00",
        "subject": "Podemos preparar sua chegada à Pousada Arara Azul? 🌿",
        "metadata": {
        },
        "opened_at": null,
        "resend_id": "32a96da5-d845-49dc-9954-f42d91466203",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T00:49:43.517118+00:00",
        "email_type": "pre_arrival_link",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    },
    {
        "id": "0a19c64e-7f39-46e8-8cd7-017c2ed8d38b",
        "status": "sent",
        "sent_at": "2026-08-31T01:14:42.758+00:00",
        "subject": "Booking confirmed – Pousada Arara Azul",
        "metadata": {
            "resend_response": {
                "id": "19dec095-69fe-4a31-84ac-9d8a13f4aa34"
            }
        },
        "opened_at": null,
        "resend_id": "19dec095-69fe-4a31-84ac-9d8a13f4aa34",
        "bounced_at": null,
        "clicked_at": null,
        "created_at": "2026-08-31T01:14:42.837474+00:00",
        "email_type": "reservation_confirmed",
        "last_event": null,
        "delivered_at": null,
        "complained_at": null,
        "error_message": null,
        "last_event_at": null,
        "reservation_id": null,
        "recipient_email": "cst.flavio@gmail.com"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- contact_messages  (1 registros)
-- ============================================================
INSERT INTO public.contact_messages
SELECT * FROM jsonb_populate_recordset(null::public.contact_messages, $dados$
[
    {
        "id": "02619047-6fef-49a5-98ec-cc5f99467c94",
        "name": "Alexandria Miskho",
        "email": "acmiskho@gmail.com",
        "phone": "5092055107",
        "status": "read",
        "message": "Hi there!\n\nI am looking to book 2 people from July 6 to July 9 (3 nights, 4 days). I was wondering what is included in booking? Meals, activities, etc? Is airport pick up from Manaus included as well? Can you accomodate someone with a food allergy to wheat? \n\nThank you!\nAlexandria Miskho",
        "created_at": "2026-06-09T00:37:33.634044+00:00"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- blocked_dates  (13 registros)
-- ============================================================
INSERT INTO public.blocked_dates
SELECT * FROM jsonb_populate_recordset(null::public.blocked_dates, $dados$
[
    {
        "id": "14e0e03f-95ca-421d-8c26-6d374ec0c2d8",
        "reason": "Retiros",
        "room_id": "22222222-2222-2222-2222-222222222222",
        "end_date": "2026-06-08",
        "block_type": "event",
        "created_at": "2026-01-15T16:01:13.397228+00:00",
        "created_by": "7e1632aa-b7a2-4cfc-9089-64b51abf468d",
        "start_date": "2026-05-14",
        "updated_at": "2026-01-15T16:01:13.397228+00:00"
    },
    {
        "id": "a37a5d99-5ef4-4f22-9cc7-f6c25e48d029",
        "reason": "Retiros",
        "room_id": "22222222-2222-2222-2222-222222222222",
        "end_date": "2026-06-08",
        "block_type": "event",
        "created_at": "2026-01-15T16:01:40.270743+00:00",
        "created_by": "7e1632aa-b7a2-4cfc-9089-64b51abf468d",
        "start_date": "2026-05-14",
        "updated_at": "2026-01-15T16:01:40.270743+00:00"
    },
    {
        "id": "f1e637bc-32f5-4986-a3e2-861279328c14",
        "reason": "Retiros",
        "room_id": "11111111-1111-1111-1111-111111111111",
        "end_date": "2026-06-08",
        "block_type": "event",
        "created_at": "2026-01-15T16:01:40.270743+00:00",
        "created_by": "7e1632aa-b7a2-4cfc-9089-64b51abf468d",
        "start_date": "2026-05-14",
        "updated_at": "2026-01-15T16:01:40.270743+00:00"
    },
    {
        "id": "1bd658bf-005c-44f0-a150-59e20a53efb0",
        "reason": "Retiros",
        "room_id": "33333333-3333-3333-3333-333333333333",
        "end_date": "2026-06-08",
        "block_type": "event",
        "created_at": "2026-01-15T16:01:40.270743+00:00",
        "created_by": "7e1632aa-b7a2-4cfc-9089-64b51abf468d",
        "start_date": "2026-05-14",
        "updated_at": "2026-01-15T16:01:40.270743+00:00"
    },
    {
        "id": "9ec78971-70e1-4610-9758-034e0e5ec928",
        "reason": "reserva booking",
        "room_id": "33333333-3333-3333-3333-333333333333",
        "end_date": "2026-07-18",
        "block_type": "other",
        "created_at": "2026-06-17T14:21:32.241982+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-07-14",
        "updated_at": "2026-06-17T14:21:32.241982+00:00"
    },
    {
        "id": "87091cb5-78b3-4e4b-bbcf-11102a13fefa",
        "reason": "reserva booking",
        "room_id": "f003cc14-eb49-464f-a2e2-14c970ae2dad",
        "end_date": "2026-07-18",
        "block_type": "other",
        "created_at": "2026-06-17T14:22:00.084172+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-07-14",
        "updated_at": "2026-06-17T14:22:11.543357+00:00"
    },
    {
        "id": "0d070fa6-3039-4f0e-80fb-cb87640f708c",
        "reason": "voluntariado",
        "room_id": "11111111-1111-1111-1111-111111111111",
        "end_date": "2026-08-17",
        "block_type": "other",
        "created_at": "2026-07-29T13:27:25.729847+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-08-14",
        "updated_at": "2026-07-29T13:27:25.729847+00:00"
    },
    {
        "id": "6639845b-4f41-4ff1-9aba-3aacfe5846b5",
        "reason": "retiro ",
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "end_date": "2026-08-20",
        "block_type": "event",
        "created_at": "2026-08-14T19:10:39.069316+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-08-15",
        "updated_at": "2026-08-14T19:10:39.069316+00:00"
    },
    {
        "id": "864b7293-74e1-4dfa-adc5-9bccfb1afa09",
        "reason": "retiro",
        "room_id": "098bde36-29bc-42e5-8ceb-43bd6f22c73a",
        "end_date": "2026-11-20",
        "block_type": "event",
        "created_at": "2026-08-14T19:11:21.841878+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-11-15",
        "updated_at": "2026-08-14T19:13:14.323011+00:00"
    },
    {
        "id": "49d6bed6-21eb-4632-8598-f9d5a6b67d43",
        "reason": null,
        "room_id": "22222222-2222-2222-2222-222222222222",
        "end_date": "2026-11-20",
        "block_type": "event",
        "created_at": "2026-08-14T19:14:38.599127+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-11-15",
        "updated_at": "2026-08-14T19:14:44.976401+00:00"
    },
    {
        "id": "dadcf470-2463-40aa-b22f-e0744b2bd320",
        "reason": "retiro",
        "room_id": "11111111-1111-1111-1111-111111111111",
        "end_date": "2026-11-20",
        "block_type": "event",
        "created_at": "2026-08-14T19:15:02.626866+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-11-15",
        "updated_at": "2026-08-14T19:15:12.293191+00:00"
    },
    {
        "id": "f45b1629-17da-4cba-8cb8-f4be06631ba0",
        "reason": "retiro",
        "room_id": "33333333-3333-3333-3333-333333333333",
        "end_date": "2026-11-20",
        "block_type": "event",
        "created_at": "2026-08-14T19:15:31.777226+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-11-15",
        "updated_at": "2026-08-14T19:15:41.057823+00:00"
    },
    {
        "id": "4203ad94-80b9-4a7b-ad2e-b62d517fb8c8",
        "reason": "retiro",
        "room_id": "f003cc14-eb49-464f-a2e2-14c970ae2dad",
        "end_date": "2026-11-20",
        "block_type": "event",
        "created_at": "2026-08-14T19:16:12.936925+00:00",
        "created_by": "f2250b21-3e82-416a-864a-ef814197567a",
        "start_date": "2026-11-15",
        "updated_at": "2026-08-14T19:16:12.936925+00:00"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- activity_log  (220 registros)
-- ============================================================
INSERT INTO public.activity_log
SELECT * FROM jsonb_populate_recordset(null::public.activity_log, $dados$
[
    {
        "id": "ac4ee268-f33a-49ce-b1fe-49187509a566",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T13:07:37.13864+00:00"
        },
        "entity_id": "87c4ac96-0789-4124-94fb-8cdd9c3af0be",
        "created_at": "2026-08-27T13:07:37.13864+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "1e364052-0985-4617-8bc6-c8b8910b1d5c",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T15:12:56.699163+00:00"
        },
        "entity_id": "17e5d790-928c-4000-87bc-d11131cf815c",
        "created_at": "2026-08-27T15:12:56.699163+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "67049c87-1cb0-46bd-95d6-77cbf74b0bce",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:26:08.570846+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-08-31T00:26:08.570846+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "afc9e0b8-2c92-46ad-8a3d-05a9630bb4d3",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:26:08.570846+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-08-31T00:26:08.570846+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e3be6f7a-2c99-45bd-9c25-d785c55a2e60",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:26:08.570846+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-08-31T00:26:08.570846+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "fda30fd5-d8e7-469a-bb19-ce07aa415103",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:26:08.570846+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-08-31T00:26:08.570846+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "a2d5fb85-48b8-4949-8d09-bfd83aafc858",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:26:08.570846+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-08-31T00:26:08.570846+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "a5711caa-2884-4e40-a3c4-7db13be1c6d2",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:26:08.570846+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-08-31T00:26:08.570846+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "94f8c82a-9433-4757-af05-7f7dcf580d63",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:14:43.663397+00:00"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T01:14:43.663397+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "97a3acf4-0ae3-43f8-9e9a-c02f34b0fcb1",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:14:43.663397+00:00"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T01:14:43.663397+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "ff3fa13d-e0a2-49c2-9f79-c7d28bf11b2d",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T13:10:38.360792+00:00"
        },
        "entity_id": "04b6505e-11df-4b6e-9c9b-5b0d6a2e1587",
        "created_at": "2026-08-27T13:10:38.360792+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "f055897a-38e9-4df4-b6ab-dad928d29bd8",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T15:19:12.667926+00:00"
        },
        "entity_id": "6ba24f36-b54e-4804-8166-fc771dc27be1",
        "created_at": "2026-08-27T15:19:12.667926+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "60f7fd7a-612f-4a38-9717-06c7079dcffb",
        "action": "create",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "INSERT",
            "timestamp": "2026-08-31T00:31:33.505638+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:31:33.505638+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Novo registro criado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "34f975df-46ec-4e35-a69d-a40a9a7f4d50",
        "action": "create",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "INSERT",
            "timestamp": "2026-08-31T00:31:33.505638+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:31:33.505638+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Novo registro criado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "44a4a05c-947c-4d89-b1ab-4f480efa4166",
        "action": "pre_arrival_sent_auto",
        "user_id": null,
        "metadata": {
            "origin": "auto",
            "trigger": "send-checkin-email"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T10:00:05.189891+00:00",
        "user_email": "system",
        "description": "Link de Pre-Chegada enviado automaticamente junto ao e-mail de check-in",
        "entity_type": "pre_arrival_responses"
    },
    {
        "id": "31829e5a-33d8-4e64-9b5e-62c55dd53d0a",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T13:13:43.99783+00:00"
        },
        "entity_id": "e846cc69-35bb-4a69-8d57-7ac321e52d36",
        "created_at": "2026-08-27T13:13:43.99783+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "1b80d22c-6774-4d86-83da-9c9b0eff57b0",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T15:20:11.09775+00:00"
        },
        "entity_id": "87c4ac96-0789-4124-94fb-8cdd9c3af0be",
        "created_at": "2026-08-27T15:20:11.09775+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "2898d90a-4c2c-4d6c-a7e1-a76bbb46e9d4",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:31:35.91017+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:31:35.91017+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "745b41bf-62b9-4361-8303-0e0e2c0ec7b2",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:31:35.91017+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:31:35.91017+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "84af4a7a-7b1e-43d3-8a37-92f249c1589c",
        "action": "delete",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "DELETE",
            "timestamp": "2026-08-31T11:56:34.608789+00:00"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T11:56:34.608789+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro excluído de reservations",
        "entity_type": "reservations"
    },
    {
        "id": "3e32b5a0-b285-4b2c-993c-01c0f2e46f01",
        "action": "delete",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "DELETE",
            "timestamp": "2026-08-31T11:56:34.608789+00:00"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T11:56:34.608789+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro excluído de reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0e273251-7b1d-46af-a1f0-b966f2057916",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T13:15:38.138392+00:00"
        },
        "entity_id": "2cb98cd2-1281-4dfe-ad0d-8dc082603dca",
        "created_at": "2026-08-27T13:15:38.138392+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "c7fb62ee-5d3b-4992-84f7-04e77424ba07",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T15:53:14.530271+00:00"
        },
        "entity_id": "87c4ac96-0789-4124-94fb-8cdd9c3af0be",
        "created_at": "2026-08-27T15:53:14.530271+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "ebe0e9b4-32dc-4adb-a591-d81ab314d78f",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:31:35.922105+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:31:35.922105+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "aeda4716-2eef-4de7-8b2c-803e3ca5a627",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:31:35.922105+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:31:35.922105+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "14d4f4f1-0676-4029-8602-618d2fe042c1",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "4423a43f-ae1e-41bf-9e38-2b42e49810ea",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "9dc6f9aa-2f02-4896-a6ae-935e8733a6c7",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "48d02f04-831f-4804-9b38-ea67d661af3a",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "b919718b-da0b-4401-84dd-5b96ac9c92a6",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "dd907289-cb05-462a-aec4-5a3224035af9",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "a01f113e-7e8c-40d1-859a-669ee6b0fb29",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "dcba83dd-4d1e-4e3d-bfb1-764251cf7e76",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "62c4f9b0-cbec-4a29-a13a-df340903d326",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "360bd114-1132-4500-8223-e0ce13307716",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "6d41cbb6-2036-4674-9a5c-6a3c573b8d84",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0852578f-27a1-49f7-be26-e0d836bf1738",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "eed04c64-1fcf-4f99-a0e3-7286b46718b0",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "55b4da16-8ab1-48c1-ad83-72381ec8506e",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "413f505e-2d4b-4a35-8718-17d70bccbd56",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "84a8fd6b-b23e-44dd-8d25-1ccab956bee5",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "25e0ac54-5296-4048-8cbb-9ef6968161a6",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "3e2f9cf7-674b-4fa0-b541-7b6b38011289",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "14d50e2f-9cf6-4230-8a1c-284eaff10271",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "8eb6375e-f1f3-4782-9ce0-3c46710f8f03",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "a179ef81-cd08-42cb-86fc-d793923c1c35",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e419895d-a079-4992-b869-691857ac8a0a",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "41807965-4d82-4a2a-ac79-b70cf1c81812",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "91516519-1c67-49a1-8fb7-9f60b3c0edfa",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "f31bd0ab-19d6-4c56-a3d4-9072a2ae0d8f",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "c539b5da-7d0d-4831-a296-b01af8738bf8",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "b1ce41e3-3ad5-43e5-9802-2b1e7a0a8b41",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "eed62bd7-81bf-40ac-b55e-1ce67ec05e62",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0a4e4d36-b4af-408a-9c4a-a3f95d95a7c5",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "223bf208-4af6-4107-b6ce-4e4155971809",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T13:30:36.013175+00:00"
        },
        "entity_id": "6f7542e3-a7db-4465-bc22-d738d4d9bb60",
        "created_at": "2026-08-27T13:30:36.013175+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "3f707b1c-2705-4e53-b212-4b286633d9a5",
        "action": "pre_arrival_sent_auto",
        "user_id": null,
        "metadata": {
            "origin": "auto",
            "trigger": "send-checkin-email"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-28T10:00:06.465549+00:00",
        "user_email": "system",
        "description": "Link de Pre-Chegada enviado automaticamente junto ao e-mail de check-in",
        "entity_type": "pre_arrival_responses"
    },
    {
        "id": "604a852a-c76f-4657-9010-26395d3d11ac",
        "action": "pre_arrival_sent_manual",
        "user_id": null,
        "metadata": {
            "origin": "manual",
            "language": "pt",
            "recipient": "cst.flavio@gmail.com"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:49:44.03427+00:00",
        "user_email": "admin_panel",
        "description": "Formulario de Pre-Chegada enviado manualmente pelo painel",
        "entity_type": "pre_arrival_responses"
    },
    {
        "id": "e648cb2c-02b5-4754-b418-8a20caf75633",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "09434f69-a97d-4a65-b411-1a8715eb9cfd",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "9befee3a-dc4f-4f52-8228-08da24f7b234",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "ddea21df-7af6-4c05-bc24-e08033b48a66",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "454ecc4c-98ba-4ab6-a120-6d73c4eb65fd",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "ad6b8c50-39e2-4062-bca7-70779cf8abf8",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "18e3a1d5-d708-4ea1-8bc7-68a548dab171",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "4bacb7d9-0848-4256-bf80-5b201805cbf4",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "f649a001-a13f-440a-b0cb-d1c6e0bf898e",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "781a95c0-d4d0-4119-8cbd-8fc267c35397",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "d9ec76d5-db63-4b65-9769-dc1b47186aff",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "906c08ce-2da8-47c5-b17c-7c26af650fba",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "7e0e16dd-5074-48c8-90b7-94ab95fd2e18",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0291a7ed-0899-447c-8b1e-b465670025a1",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "c5822bb9-3a75-47cc-b43b-c31f5b3349a8",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "de479a30-6443-402b-9d28-2f87574a488f",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "9071e56d-63b6-4c19-b403-3746112801fa",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0ecfb6da-19d5-42de-a400-aa78d5445256",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "270d655d-3224-4e4d-897c-5355454d7ef7",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "031e8e7d-87fe-40bd-b83d-7fe0061d5198",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "3bb10473-aeb5-4a2e-a512-7b7eecfe7283",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "dbbe4279-205a-459a-84aa-77db60739e19",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "90c4af45-be8d-41db-a1f4-b42684378039",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "6ba3bf0d-0f26-4da2-8e2d-6722afb0e255",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "d1f7c82b-7c22-4d15-a905-76aa64fc9908",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e1cf0c29-37fb-4d5c-ac32-38bd200a067e",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "843e0896-48b4-4931-b5f1-c06eda9b2750",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "80f2b6e0-fa58-49b1-ab54-f0c268d66d50",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "4c98f955-856c-42a2-a36a-b97c69e4be84",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "77cc64e1-d2cd-498e-9491-628ce582cfdd",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "6127bb7d-bb6f-456d-9cce-4603d3a1417e",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T13:37:53.230367+00:00"
        },
        "entity_id": "c0ad7a5e-7588-4106-805c-460138b6e3b0",
        "created_at": "2026-08-27T13:37:53.230367+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "72115b86-7687-4fbd-92bb-82e67c5ac25b",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:52:20.190793+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:52:20.190793+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e25c0a2b-3ce8-42e5-b350-aa5efb617c15",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T00:52:20.190793+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:52:20.190793+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "491dc508-ce79-4f56-af3b-527fa1da54ce",
        "action": "pre_arrival_answered",
        "user_id": null,
        "metadata": {
            "status": "answered",
            "language": "pt",
            "access_method": "public_token"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:52:20.190793+00:00",
        "user_email": "guest_token",
        "description": "Hospede respondeu o questionario de Pre-Chegada",
        "entity_type": "pre_arrival_responses"
    },
    {
        "id": "0cc3f8c6-cff2-441b-b8bb-ad79277506e3",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "033e3330-1017-4c21-94e9-95d8635efbab",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0c785d48-b838-4757-9952-974bf3c5b5dd",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "d026026d-f62e-40ca-8618-ff542f762e0d",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "9b4be14b-040f-444f-ae03-0842b3005d39",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "5fe6f2c3-6402-4816-b651-078ec5519fde",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "8871ada1-e6d5-42bd-970a-82c12624c2e3",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "fc8668de-33d0-4180-b0c0-99132b0b99c8",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "d4f2da80-eb38-4563-874f-64785d203dc8",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "8747dab1-235e-4dfd-8012-11368925801e",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "348fd57e-f17e-48a9-8c6a-1f8593c79731",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0b6efc8a-1ca7-42ef-97e0-bdee96193b8f",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "06a52225-eb5d-4727-b6ff-bcc43b20c2fe",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "bfda9bdc-6e15-4b19-ab74-7d5ae34d919e",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "511f1413-58b5-4a47-8aab-48825c42dfe2",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "2363b86c-ee32-4768-ab9f-02805313f234",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "b3007553-81e0-4b3f-a00b-181503677e85",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e1ea916f-b904-4ca0-a00f-39335548797f",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "2daf0c1a-8e82-4aff-9d89-0f460029f313",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "5027e904-223a-4de2-9497-15a587b514e8",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "8f9d25e3-91c8-4ed2-9a1e-00955bb4212e",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "62fec865-29fd-4217-806c-d28cea8d0d28",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "58e9e179-ff80-4190-b67d-f5527d2db464",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "3d230849-31ec-48bf-be23-7eaa99c38451",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0b6e27e9-78c1-4ce6-b688-ddc807be8972",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "9141f2b2-5da3-489a-9bba-996a18d3af2a",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "8c8d9c87-19f3-4df6-81e9-11cdeb0f9e7d",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "4d4c0be6-3600-4148-9826-22f214f68bfe",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "d307b307-657b-4b66-a997-ba660c11d234",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "f2582e92-a680-4296-a765-254b5a1261e7",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "5972f1cd-c6b2-4a9e-9fc7-a86f3b60c3e9",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "7b1d0e71-be4b-4bfc-9aae-54c947c73e89",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T14:23:19.55155+00:00"
        },
        "entity_id": "f5cb3acf-e14c-4fe6-936a-2f508d2e693e",
        "created_at": "2026-08-27T14:23:19.55155+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "c7a1a849-deb2-4090-a6c4-a4b13f47033e",
        "action": "pre_arrival_sent_auto",
        "user_id": null,
        "metadata": {
            "origin": "auto",
            "trigger": "send-checkin-email"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T00:53:30.262948+00:00",
        "user_email": "system",
        "description": "Link de Pre-Chegada enviado automaticamente junto ao e-mail de check-in",
        "entity_type": "pre_arrival_responses"
    },
    {
        "id": "139da741-9ff2-444e-bea7-eaabdeba6e06",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "d8b89eeb-8093-4399-a618-21b06a2c228d",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "d76f62a1-9157-4a55-ba71-8a7bdf151e5d",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "1793cdcf-7802-41da-b0b8-e80ae97febc1",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "04b48f81-8751-4dbf-b828-f0ecbf252c93",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "aaf20a47-b7a3-4d4d-b942-bb203fb33cd9",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "11955d24-5d7a-441e-a1d7-103b9541ac1b",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "cb4ac7ac-e4fb-4f44-bba7-95b4bb6d2245",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "3dcad214-a21e-44ad-800b-1c01ca48c209",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "1d4934ae-c456-4dc6-a612-90f4914eb694",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "dcf79860-54c3-4324-8a9f-66d4180b77d3",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "81bbf33a-d9c1-4497-a011-ac93f8328b78",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "6da96fa1-cf29-4a9a-95bd-ec721fcab40c",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "4cadab04-128a-4058-b277-7c8803e8fc61",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e9feeaf2-948d-47ac-9505-bfaedff5e1eb",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "b3ea271a-ed15-46c8-b470-640c3019e420",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "2a9091b6-387c-4c9e-be02-bcf6e3a60f34",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "af04725e-3c50-44a6-8a05-7f54f378efe2",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "f8ac576b-213b-47db-9b35-522b8cec0fd9",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "56f3fdcc-20a2-4647-88ae-28bb4a466127",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "455dfd11-89f9-4d05-a705-3a3887ffa048",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "20649499-d4a0-4ce9-a810-3c19d1ffd83b",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "c75bb126-9e50-4ee8-95f9-1a7c2370f800",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-02T00:07:50.846004+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-09-02T00:07:50.846004+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "6c2b11dc-79fb-4576-a9bd-b8ee390661a6",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:04:23.236738+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T01:04:23.236738+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "109de5de-a2c1-4ad8-ba20-898e95f1c93b",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:04:23.236738+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T01:04:23.236738+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "fbedc683-dd19-4cca-a66e-56671c834f0d",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-03T14:04:26.725238+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-09-03T14:04:26.725238+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "b5dd2104-32f7-4995-94fa-fa9d6ac91fe7",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-09-03T14:04:26.725238+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-09-03T14:04:26.725238+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e9c9bb06-3c9c-4f79-a06d-4699c59433b5",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T14:26:33.967266+00:00"
        },
        "entity_id": "788dd064-fad3-4cf7-b7df-d8b668216abb",
        "created_at": "2026-08-27T14:26:33.967266+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "3b067978-2861-4336-b3d0-2857973c7957",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:07:45.886355+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T01:07:45.886355+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "daeb90a4-b6bd-4dc8-a7de-da6fd62c5e64",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:07:45.886355+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T01:07:45.886355+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "fb54cee5-356e-49e5-bc9b-51c5b96df27d",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T14:30:40.347924+00:00"
        },
        "entity_id": "369fdf65-54d1-41f5-9907-e9824044fa54",
        "created_at": "2026-08-27T14:30:40.347924+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "dc7e4758-6ce5-4b5e-96e6-6dff7a238bcb",
        "action": "delete",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "DELETE",
            "timestamp": "2026-08-31T01:10:00.631378+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T01:10:00.631378+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro excluído de reservations",
        "entity_type": "reservations"
    },
    {
        "id": "9a62189b-9414-4551-adb8-4806ca051163",
        "action": "delete",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "DELETE",
            "timestamp": "2026-08-31T01:10:00.631378+00:00"
        },
        "entity_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "created_at": "2026-08-31T01:10:00.631378+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro excluído de reservations",
        "entity_type": "reservations"
    },
    {
        "id": "56138240-8540-495b-a6c6-35cd40f15b28",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:11:11.581118+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-08-31T01:11:11.581118+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "efc04d3c-6c33-4fec-ab1c-d0e1012881dd",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:11:11.581118+00:00"
        },
        "entity_id": "321f1e35-4dfb-4899-8ec2-6f7fd236d885",
        "created_at": "2026-08-31T01:11:11.581118+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "8ae5d043-0772-45db-95f6-866195386a72",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:11:21.653253+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-08-31T01:11:21.653253+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "ad9a70e6-74d6-4de6-bfa1-843eb54b4ae4",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:11:21.653253+00:00"
        },
        "entity_id": "a45c7f8a-e0ef-402c-9dae-9ee1deae5482",
        "created_at": "2026-08-31T01:11:21.653253+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "535bd75f-d21e-4f08-8b98-99f6dc38afc5",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "e3d690cc-d7fb-4508-8481-4b9134889c2e",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "14a067bf-9b8b-47f9-9599-138b245f45c2",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "31d3312e-a234-4d4c-8f58-7446cf0ac5bb",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "890d9095-45e6-42d0-93bd-5a86929f110f",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "04b6505e-11df-4b6e-9c9b-5b0d6a2e1587",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "0445b98f-2374-4b46-87b3-16c1eb2f1d73",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "e846cc69-35bb-4a69-8d57-7ac321e52d36",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "7c6d44f7-305f-439b-b666-022043fe5b99",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "2cb98cd2-1281-4dfe-ad0d-8dc082603dca",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "c4d9a812-4d72-4ac9-bc9a-947dfb563805",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "6f7542e3-a7db-4465-bc22-d738d4d9bb60",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "fefa9205-e6a1-446b-8516-0eaf6f70d2ad",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "c0ad7a5e-7588-4106-805c-460138b6e3b0",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "49e7918a-0f0b-442a-8ba0-4c04a430e4f1",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "f5cb3acf-e14c-4fe6-936a-2f508d2e693e",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "5f966881-0b2e-4d54-865b-a0a6f77752e9",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "788dd064-fad3-4cf7-b7df-d8b668216abb",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "8183e8d1-5e9a-4cc4-9456-1c225626ae86",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "369fdf65-54d1-41f5-9907-e9824044fa54",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "9443a9ec-01df-4d41-8132-03535b59e95d",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "3f0b7566-d873-40fe-9a66-6175cdd7cdf4",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "c3ae17b2-b2ef-45f6-9567-9cd32e4ca7e8",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "87e176b2-256a-4240-9698-b59dc91dca32",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "ea45af9f-64e7-493f-a6e4-0254b543fd85",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "17e5d790-928c-4000-87bc-d11131cf815c",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "69c0bd32-a2db-4679-af86-a7c3199320b4",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "6ba24f36-b54e-4804-8166-fc771dc27be1",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "2882c06c-7f63-41c0-b305-584784872a31",
        "action": "create",
        "user_id": null,
        "metadata": {
            "table": "experiences",
            "operation": "INSERT",
            "timestamp": "2026-08-20T11:56:28.994329+00:00"
        },
        "entity_id": "87c4ac96-0789-4124-94fb-8cdd9c3af0be",
        "created_at": "2026-08-20T11:56:28.994329+00:00",
        "user_email": "system",
        "description": "Novo registro criado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "b4b6e0c9-c01b-4310-99ab-aa089265cfb7",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-20T12:59:59.659861+00:00"
        },
        "entity_id": "e3d690cc-d7fb-4508-8481-4b9134889c2e",
        "created_at": "2026-08-20T12:59:59.659861+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "5c387cef-5aeb-4597-a77b-56a27a50084b",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T02:06:46.591975+00:00"
        },
        "entity_id": "6f7542e3-a7db-4465-bc22-d738d4d9bb60",
        "created_at": "2026-08-21T02:06:46.591975+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "d42d42c1-b418-4a4b-b8e7-0b5a88d62e30",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T02:07:08.328262+00:00"
        },
        "entity_id": "f5cb3acf-e14c-4fe6-936a-2f508d2e693e",
        "created_at": "2026-08-21T02:07:08.328262+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "0ae265e3-f9ef-48be-8e56-819d7fe03e63",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 76,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:08:07.536835+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "0cb11a21-b73f-45c8-bc25-8be1c317ca97",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 76,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:10:12.341227+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "e2f3fab3-c518-4088-871b-b6f119d33622",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T02:30:54.997506+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-21T02:30:54.997506+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "fe440977-0dce-4a24-b275-f81de8292ef5",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T02:30:54.997506+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-21T02:30:54.997506+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "8e5337ae-d28f-41f0-a516-b511c2d1a7ec",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 76,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:39:06.340698+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "23e5c26b-e524-44a8-9235-39c3fb597186",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 76,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:44:58.680247+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "941d1bb9-bef6-4f3a-9f03-20c22d6a7c03",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 20,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:46:27.384684+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "7eac4582-8f1e-43de-a51b-33d5a68c9f35",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 20,
            "usuario_tamanho": 32
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:48:24.041174+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "62a77e44-6fb7-4ba2-ac01-b7a2b927fbc2",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 72,
            "usuario_tamanho": 32
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:53:43.173179+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "334c446f-1374-4a56-bc8c-8b35c733d90c",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 72,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:54:05.544049+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "123a220b-9183-4da2-9ade-1a8a6e2d83a1",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 72,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:54:53.231155+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "12896869-8089-432e-ac23-040fb0f53b43",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 72,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T02:59:35.36802+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "9530561e-eeab-49bd-9675-8dc8ebb08522",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 71,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T03:00:15.509724+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "7a5e06fc-c266-4a6d-9318-8221bf7b3830",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 71,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T03:00:41.884655+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "6b8130df-4c47-4e77-a89d-3b5e50d84039",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 20,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T03:01:19.027816+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "7b328df5-796b-4abd-be32-6719a272732d",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T03:01:48.242681+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-21T03:01:48.242681+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0b20cda3-bb0f-43e6-a927-5e677efbe704",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T03:01:48.242681+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-21T03:01:48.242681+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "ca57c8d5-af7c-4052-8dfa-d9c7f064693f",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T03:02:05.086372+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-21T03:02:05.086372+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "aef8f6d4-5741-46be-b5d9-60937795c198",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T03:02:05.086372+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-21T03:02:05.086372+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "6da08079-980f-4175-b0a9-6be591702a27",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T03:10:48.883751+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-21T03:10:48.883751+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "53dcc325-9239-46fd-a746-3ef971d909ab",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T03:10:48.883751+00:00"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-21T03:10:48.883751+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "cf850414-1d08-45b0-9b05-1b72cef5593a",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "env": "producao",
            "senha_tamanho": 20,
            "usuario_tamanho": 36
        },
        "entity_id": null,
        "created_at": "2026-08-21T19:13:21.780411+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Credenciais da FNRH (produção) atualizadas pelo painel",
        "entity_type": "fnrh_credentials"
    },
    {
        "id": "c4fde5bc-052e-47d9-9bcd-47e0754f8ff2",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T19:16:15.460118+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-08-21T19:16:15.460118+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e3549ffc-eb69-4932-9a85-6cc0eacf8429",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T19:16:15.460118+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-08-21T19:16:15.460118+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "1080c128-694f-4439-9fd4-cfa11ebf19f8",
        "action": "update",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-21T19:42:51.879138+00:00"
        },
        "entity_id": "31d3312e-a234-4d4c-8f58-7446cf0ac5bb",
        "created_at": "2026-08-21T19:42:51.879138+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "9ec02dc1-fccb-48c4-ae25-fe80c3d6d6fc",
        "action": "create",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "INSERT",
            "timestamp": "2026-08-22T12:40:13.677023+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-08-22T12:40:13.677023+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Novo registro criado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "8de4d7ca-9d0c-42a7-8be5-1469b18dc330",
        "action": "create",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "INSERT",
            "timestamp": "2026-08-22T12:40:13.677023+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-08-22T12:40:13.677023+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Novo registro criado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "f9f51a07-6b2c-48b7-a3b0-dfd88ba751cb",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-22T12:40:17.119263+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-08-22T12:40:17.119263+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "a6d1bffd-02aa-44f2-88de-418a30742340",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-22T12:40:17.119263+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-08-22T12:40:17.119263+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "e717ff52-2e96-44a4-8f0a-1dbf82ec1899",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-22T12:40:19.860671+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-08-22T12:40:19.860671+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "18363935-4180-48aa-8790-ea6a8c0591b4",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-22T12:40:19.860671+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-08-22T12:40:19.860671+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "5171fb11-3a06-49e4-bdfa-e462871328cd",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-22T12:45:33.356101+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-08-22T12:45:33.356101+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "965ec14e-8166-449e-b325-d7bf444173b0",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-22T12:45:33.356101+00:00"
        },
        "entity_id": "ca555531-6c8f-4b38-a986-3a9a20ba3fe5",
        "created_at": "2026-08-22T12:45:33.356101+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "0ff7a88a-28cc-41f0-9816-80a41c451522",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-25T15:09:21.936142+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-08-25T15:09:21.936142+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "bbbb3226-ea98-4c11-99fd-78a228112b35",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-25T15:09:21.936142+00:00"
        },
        "entity_id": "38328b73-0fe5-4601-806e-1a166e400897",
        "created_at": "2026-08-25T15:09:21.936142+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "52fe254b-a9fb-4cd4-a189-7dc7725f04c9",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-25T15:09:29.793539+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-08-25T15:09:29.793539+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "406ce704-c078-45ea-b681-15da3368a2fa",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-25T15:09:29.793539+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-08-25T15:09:29.793539+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "9f902166-9f2d-4ff4-8eb1-0001a57ec853",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-25T15:09:37.647782+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-08-25T15:09:37.647782+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "527b5d9a-f717-4061-8a90-2a8a93279926",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-25T15:09:37.647782+00:00"
        },
        "entity_id": "b703077a-2766-47ed-bf35-27b4dff6f1fd",
        "created_at": "2026-08-25T15:09:37.647782+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "cd745511-e994-412a-8686-cdf9c196a814",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T14:53:24.043377+00:00"
        },
        "entity_id": "3f0b7566-d873-40fe-9a66-6175cdd7cdf4",
        "created_at": "2026-08-27T14:53:24.043377+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "f00103c7-28f7-4431-b36c-0d9a8dc07251",
        "action": "create",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "INSERT",
            "timestamp": "2026-08-31T01:14:40.990008+00:00"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T01:14:40.990008+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Novo registro criado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "f5717581-b469-41c7-ad7d-0e30cfeb24fb",
        "action": "create",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "metadata": {
            "table": "reservations",
            "operation": "INSERT",
            "timestamp": "2026-08-31T01:14:40.990008+00:00"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T01:14:40.990008+00:00",
        "user_email": "cst.flavio@pousadaararaazul.com",
        "description": "Novo registro criado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "6f2f2e93-9f15-45e4-a468-d55059d9cc4c",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-25T15:09:47.257071+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-08-25T15:09:47.257071+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "6caf5b73-136d-4db0-b16f-8b0ea1104726",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-25T15:09:47.257071+00:00"
        },
        "entity_id": "afd5d6f6-5ccf-4ad4-b976-89de44211336",
        "created_at": "2026-08-25T15:09:47.257071+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "d2d4a4d6-37d2-4fd6-b8f7-4a82dee26334",
        "action": "pre_arrival_reminder_sent",
        "user_id": null,
        "metadata": {
            "origin": "auto",
            "language": "pt",
            "recipient": "simonieting@yahoo.com.br"
        },
        "entity_id": "ec033a24-3d4d-4970-a27e-315e8aea6398",
        "created_at": "2026-08-26T10:00:05.931508+00:00",
        "user_email": "system",
        "description": "Lembrete de Pre-Chegada enviado automaticamente",
        "entity_type": "pre_arrival_responses"
    },
    {
        "id": "ed171b92-306f-400a-ac69-85f2cf0cd0a3",
        "action": "update",
        "user_id": "f2250b21-3e82-416a-864a-ef814197567a",
        "metadata": {
            "table": "experiences",
            "operation": "UPDATE",
            "timestamp": "2026-08-27T15:05:42.339218+00:00"
        },
        "entity_id": "87e176b2-256a-4240-9698-b59dc91dca32",
        "created_at": "2026-08-27T15:05:42.339218+00:00",
        "user_email": "laracabral@pousadararazul.com",
        "description": "Registro atualizado em experiences",
        "entity_type": "experiences"
    },
    {
        "id": "b2416181-277c-44ba-b0f8-e6deca5d7dfc",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:14:43.504067+00:00"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T01:14:43.504067+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    },
    {
        "id": "2957f834-5c05-429d-8f52-41eccd42003d",
        "action": "update",
        "user_id": null,
        "metadata": {
            "table": "reservations",
            "operation": "UPDATE",
            "timestamp": "2026-08-31T01:14:43.504067+00:00"
        },
        "entity_id": "9c1defb3-548b-43e8-bcf9-1d445ed0837f",
        "created_at": "2026-08-31T01:14:43.504067+00:00",
        "user_email": "system",
        "description": "Registro atualizado em reservations",
        "entity_type": "reservations"
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- sensitive_data_access_log  (13 registros)
-- ============================================================
INSERT INTO public.sensitive_data_access_log
SELECT * FROM jsonb_populate_recordset(null::public.sensitive_data_access_log, $dados$
[
    {
        "id": "dd56d71f-aac7-4244-b113-9b4cd9d4ee5d",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-11T22:55:24.574121+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "a64aada2-146c-40ba-92b7-59c9988d8dc7",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "f60d186a-d5e7-4202-8185-13a42da5dc3d",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-11T23:17:00.192564+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "a64aada2-146c-40ba-92b7-59c9988d8dc7",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "e012d0ba-0cc3-4f89-90ac-11055a910ece",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-11T23:17:53.116128+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "a64aada2-146c-40ba-92b7-59c9988d8dc7",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "82b34de1-45c6-4c77-82cd-91d4b9caedf6",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-12T00:00:45.667671+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "67b2a510-9647-4277-a3a5-27ee705fbd63",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "e1eaf573-99c9-4aa1-9339-a09e18cae34f",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-12T00:01:38.431134+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "67b2a510-9647-4277-a3a5-27ee705fbd63",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "5ede7827-b107-4b5b-bba1-791f3845d873",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-12T00:02:46.524383+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "67b2a510-9647-4277-a3a5-27ee705fbd63",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "eebb0042-d3ac-4dee-a19d-78556402e169",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-12T00:19:54.183136+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "a64aada2-146c-40ba-92b7-59c9988d8dc7",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "1ecd78db-ce2c-4bcd-92e9-728366153433",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-12T00:20:04.808545+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "67b2a510-9647-4277-a3a5-27ee705fbd63",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "4b002747-e54e-42f9-a0f2-6b5e4d3152e5",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-12T00:32:55.959779+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "68d9b7e6-d77d-49cd-9ab7-5308869e62bd",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "29abd81a-ebdd-4115-a834-00cb25431c20",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-12T00:33:29.144573+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "68d9b7e6-d77d-49cd-9ab7-5308869e62bd",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "d73beb6a-1c62-4f11-aacb-35e4ddef6fa9",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-13T13:00:22.983728+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "d824044b-95c4-48f2-94aa-afb3bde4299d",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "0777799c-4289-42c6-acaa-897597967f58",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-31T01:09:27.488702+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    },
    {
        "id": "7ba6eade-a79c-4e82-bb55-8a99bef04879",
        "user_id": "631d2468-c2a6-4eff-926c-d3fda28048b4",
        "created_at": "2026-08-31T01:09:38.384487+00:00",
        "ip_address": null,
        "user_agent": null,
        "access_type": "pre_arrival_health",
        "access_method": "dashboard",
        "reservation_id": "c8759db3-fcc1-48e0-88c9-8a9db1db9ee3",
        "accessed_fields": [
            "health_condition",
            "mobility_limitations",
            "continuous_medication"
        ]
    }
]
$dados$::jsonb)
ON CONFLICT DO NOTHING;

