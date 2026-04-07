export interface MockDoctor {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  city: string;
  uf: string;
  crm: string;
  bio: string;
  photoUrl: string;
  consultationPrice: number;
  calendarLink: string;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  reviews: { patientName: string; rating: number; comment: string; date: string }[];
}

export const specialties = [
  "Endocrinologia",
  "Nutrologia",
  "Dermatologia",
  "Psiquiatria",
  "Ortopedia",
  "Nutrição",
  "Cardiologia",
  "Ginecologia",
];

export const cities = [
  "São Paulo - SP",
  "Rio de Janeiro - RJ",
  "Belo Horizonte - MG",
  "Curitiba - PR",
  "Porto Alegre - RS",
  "Brasília - DF",
  "Salvador - BA",
  "Florianópolis - SC",
];

export const mockDoctors: MockDoctor[] = [
  {
    id: "1", slug: "dra-camila-santos", name: "Dra. Camila Santos", specialty: "Endocrinologia",
    city: "São Paulo", uf: "SP", crm: "123456/SP",
    bio: "Endocrinologista com 12 anos de experiência, especializada em metabolismo e emagrecimento saudável. Formada pela USP com residência no Hospital das Clínicas.",
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 350, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.9, reviewCount: 127,
    reviews: [
      { patientName: "Maria L.", rating: 5, comment: "Excelente profissional, muito atenciosa.", date: "2024-01-15" },
      { patientName: "João P.", rating: 5, comment: "Mudou minha vida com o tratamento hormonal.", date: "2024-01-10" },
      { patientName: "Ana C.", rating: 4, comment: "Ótima consulta, recomendo.", date: "2024-01-05" },
    ],
  },
  {
    id: "2", slug: "dr-rafael-oliveira", name: "Dr. Rafael Oliveira", specialty: "Nutrologia",
    city: "Rio de Janeiro", uf: "RJ", crm: "654321/RJ",
    bio: "Nutrólogo focado em performance esportiva e composição corporal. Pós-graduado pela ABRAN com 8 anos de experiência.",
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 280, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.8, reviewCount: 95,
    reviews: [
      { patientName: "Carlos M.", rating: 5, comment: "Transformou minha alimentação.", date: "2024-02-10" },
      { patientName: "Fernanda S.", rating: 5, comment: "Muito didático e paciente.", date: "2024-02-05" },
    ],
  },
  {
    id: "3", slug: "dra-juliana-costa", name: "Dra. Juliana Costa", specialty: "Dermatologia",
    city: "Belo Horizonte", uf: "MG", crm: "789012/MG",
    bio: "Dermatologista com foco em estética e saúde da pele. Membro da SBD com especialização em laserterapia.",
    photoUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 400, calendarLink: "https://cal.com/example", isOnline: false,
    rating: 4.7, reviewCount: 82,
    reviews: [
      { patientName: "Lucia R.", rating: 5, comment: "Resultado incrível no tratamento de acne.", date: "2024-01-20" },
    ],
  },
  {
    id: "4", slug: "dr-marcos-silva", name: "Dr. Marcos Silva", specialty: "Psiquiatria",
    city: "Curitiba", uf: "PR", crm: "345678/PR",
    bio: "Psiquiatra especializado em ansiedade, depressão e TDAH. Abordagem integrativa com 15 anos de experiência clínica.",
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 320, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.9, reviewCount: 203,
    reviews: [
      { patientName: "Pedro A.", rating: 5, comment: "Melhor psiquiatra que já consultei.", date: "2024-03-01" },
      { patientName: "Beatriz F.", rating: 5, comment: "Muito humano e competente.", date: "2024-02-28" },
    ],
  },
  {
    id: "5", slug: "dr-andre-lima", name: "Dr. André Lima", specialty: "Ortopedia",
    city: "Porto Alegre", uf: "RS", crm: "901234/RS",
    bio: "Ortopedista esportivo, referência em lesões de joelho e ombro. Ex-médico da seleção gaúcha de futebol.",
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 380, calendarLink: "https://cal.com/example", isOnline: false,
    rating: 4.6, reviewCount: 68,
    reviews: [
      { patientName: "Roberto G.", rating: 5, comment: "Operou meu joelho, recuperação perfeita.", date: "2024-01-25" },
    ],
  },
  {
    id: "6", slug: "dra-patricia-mendes", name: "Dra. Patrícia Mendes", specialty: "Nutrição",
    city: "São Paulo", uf: "SP", crm: "567890/SP",
    bio: "Nutricionista funcional com foco em saúde intestinal e autoimunidade. Formada pela UNIFESP.",
    photoUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 200, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.8, reviewCount: 156,
    reviews: [
      { patientName: "Mariana T.", rating: 5, comment: "Abordagem funcional excelente.", date: "2024-02-15" },
    ],
  },
  {
    id: "7", slug: "dr-lucas-ferreira", name: "Dr. Lucas Ferreira", specialty: "Endocrinologia",
    city: "Brasília", uf: "DF", crm: "112233/DF",
    bio: "Endocrinologista com foco em tireoide e diabetes. Pesquisador ativo com publicações internacionais.",
    photoUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 300, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.5, reviewCount: 43,
    reviews: [
      { patientName: "Sandra K.", rating: 4, comment: "Bom profissional, pontual.", date: "2024-03-10" },
    ],
  },
  {
    id: "8", slug: "dra-amanda-rocha", name: "Dra. Amanda Rocha", specialty: "Dermatologia",
    city: "Salvador", uf: "BA", crm: "445566/BA",
    bio: "Dermatologista com expertise em peles negras e tratamento de melasma. 10 anos de experiência.",
    photoUrl: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 350, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.9, reviewCount: 112,
    reviews: [
      { patientName: "Camila D.", rating: 5, comment: "Finalmente encontrei quem entende minha pele!", date: "2024-02-20" },
    ],
  },
  {
    id: "9", slug: "dr-gabriel-nunes", name: "Dr. Gabriel Nunes", specialty: "Nutrologia",
    city: "Florianópolis", uf: "SC", crm: "778899/SC",
    bio: "Nutrólogo e médico do esporte. Trabalha com atletas e praticantes de atividade física intensa.",
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 250, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.7, reviewCount: 78,
    reviews: [
      { patientName: "Thiago B.", rating: 5, comment: "Entende muito de suplementação.", date: "2024-01-30" },
    ],
  },
  {
    id: "10", slug: "dra-isabela-cardoso", name: "Dra. Isabela Cardoso", specialty: "Psiquiatria",
    city: "São Paulo", uf: "SP", crm: "334455/SP",
    bio: "Psiquiatra infantojuvenil com formação em terapia cognitivo-comportamental. Atende crianças e adolescentes.",
    photoUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 450, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.8, reviewCount: 91,
    reviews: [
      { patientName: "Renata M.", rating: 5, comment: "Salvou a vida do meu filho.", date: "2024-03-05" },
    ],
  },
  {
    id: "11", slug: "dr-henrique-alves", name: "Dr. Henrique Alves", specialty: "Cardiologia",
    city: "Rio de Janeiro", uf: "RJ", crm: "556677/RJ",
    bio: "Cardiologista com foco em prevenção cardiovascular e check-up executivo. Fellow da ACC.",
    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 500, calendarLink: "https://cal.com/example", isOnline: false,
    rating: 4.6, reviewCount: 54,
    reviews: [
      { patientName: "Marcelo V.", rating: 5, comment: "Check-up completo e detalhado.", date: "2024-02-12" },
    ],
  },
  {
    id: "12", slug: "dra-larissa-barbosa", name: "Dra. Larissa Barbosa", specialty: "Ginecologia",
    city: "Belo Horizonte", uf: "MG", crm: "889900/MG",
    bio: "Ginecologista com foco em saúde hormonal feminina e fertilidade. Abordagem humanizada.",
    photoUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=200&h=200&fit=crop&crop=face",
    consultationPrice: 300, calendarLink: "https://cal.com/example", isOnline: true,
    rating: 4.9, reviewCount: 189,
    reviews: [
      { patientName: "Juliana S.", rating: 5, comment: "Melhor ginecologista de BH.", date: "2024-03-15" },
      { patientName: "Priscila O.", rating: 5, comment: "Atendimento humanizado e acolhedor.", date: "2024-03-10" },
    ],
  },
];
