export const DOCUMENT_CATEGORIES = [
  "Business & Strategie",
  "Juridique & Creation",
  "Finance & Investissement",
  "Secteurs congolais",
] as const;

export const DOCUMENT_LEVELS = ["Debutant", "Avance"] as const;
export const DOCUMENT_FILE_TYPES = ["PDF", "DOCX", "Editable online"] as const;
export const DOCUMENT_OBJECTIVES = [
  "Creer entreprise",
  "Lever des fonds",
  "Formaliser partenariat",
] as const;
export const DOCUMENT_SECTORS = [
  "Tous secteurs",
  "Agribusiness",
  "Commerce",
  "Services",
  "Juridique",
  "Finance",
  "Pisciculture",
  "Elevage avicole",
  "Transformation agro",
  "E-commerce",
  "Transport urbain",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export type DocumentLevel = (typeof DOCUMENT_LEVELS)[number];
export type DocumentFileType = (typeof DOCUMENT_FILE_TYPES)[number];
export type DocumentObjective = (typeof DOCUMENT_OBJECTIVES)[number];
export type DocumentSector = string;

export type DocumentTemplate = {
  slug: string;
  title: string;
  summary: string;
  category: DocumentCategory;
  level: DocumentLevel;
  fileType: DocumentFileType;
  objective: DocumentObjective;
  sectorTags: DocumentSector[];
  highlight: string;
};

type DashboardProjectCategory =
  | "AGRIBUSINESS"
  | "TECH"
  | "HEALTH"
  | "EDUCATION"
  | "INFRASTRUCTURE"
  | "OTHER";

type DashboardProjectEquityModel = "NONE" | "EQUITY" | "REVENUE_SHARE";

export type ProjectFormTemplatePrefill = {
  title: string;
  city: string;
  summary: string;
  description: string;
  category: DashboardProjectCategory;
  equityModel: DashboardProjectEquityModel;
  visibility: "PUBLIC";
  legalForm: "SARL";
  totalCapital: string;
  ownerContribution: string;
  equityNote: string;
  companyCreated: false;
  country: "CG";
};

export const DEFAULT_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    slug: "business-plan-complet",
    title: "Business plan complet",
    summary: "Plan complet pour lancer et structurer votre projet.",
    category: "Business & Strategie",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Creer entreprise",
    sectorTags: ["Tous secteurs"],
    highlight: "Inclut resume, marche, operations et projection financiere.",
  },
  {
    slug: "business-model-canvas",
    title: "Business Model Canvas",
    summary: "Modele simple pour clarifier proposition de valeur et revenus.",
    category: "Business & Strategie",
    level: "Debutant",
    fileType: "Editable online",
    objective: "Creer entreprise",
    sectorTags: ["Tous secteurs", "Services", "Commerce"],
    highlight: "Parfait pour aligner equipe et associes au demarrage.",
  },
  {
    slug: "etude-marche-simplifiee",
    title: "Etude de marche simplifiee",
    summary: "Cadre rapide pour valider demande, clients et concurrence locale.",
    category: "Business & Strategie",
    level: "Debutant",
    fileType: "PDF",
    objective: "Creer entreprise",
    sectorTags: ["Tous secteurs", "Commerce"],
    highlight: "Focus terrain avec check-list actionnable.",
  },
  {
    slug: "plan-financier-previsionnel-3-ans",
    title: "Plan financier previsionnel (3 ans)",
    summary: "Hypotheses de ventes, charges et besoin de financement.",
    category: "Business & Strategie",
    level: "Avance",
    fileType: "Editable online",
    objective: "Lever des fonds",
    sectorTags: ["Tous secteurs", "Finance"],
    highlight: "Structure attendue par banques et investisseurs.",
  },
  {
    slug: "executive-summary",
    title: "Executive summary",
    summary: "Synthese professionnelle pour presenter le projet en 2 pages.",
    category: "Business & Strategie",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Lever des fonds",
    sectorTags: ["Tous secteurs"],
    highlight: "Ideale pour vos premiers rendez-vous de financement.",
  },
  {
    slug: "statuts-sarl-congo",
    title: "Modele de statuts SARL (adapte Congo)",
    summary: "Base de statuts pour formaliser une SARL en contexte local.",
    category: "Juridique & Creation",
    level: "Avance",
    fileType: "DOCX",
    objective: "Formaliser partenariat",
    sectorTags: ["Juridique", "Tous secteurs"],
    highlight: "Inclut clauses clefs de gouvernance et repartition des roles.",
  },
  {
    slug: "pacte-associes",
    title: "Pacte d'associes",
    summary: "Regles de decision, sortie et protection entre associes.",
    category: "Juridique & Creation",
    level: "Avance",
    fileType: "DOCX",
    objective: "Formaliser partenariat",
    sectorTags: ["Juridique", "Tous secteurs"],
    highlight: "Reduit les conflits et clarifie la collaboration.",
  },
  {
    slug: "proces-verbal-assemblee-constitutive",
    title: "Proces-verbal d'assemblee constitutive",
    summary: "Document de reference pour la creation officielle de societe.",
    category: "Juridique & Creation",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Formaliser partenariat",
    sectorTags: ["Juridique", "Tous secteurs"],
    highlight: "Format utilisable pour demarches administratives.",
  },
  {
    slug: "contrat-entre-associes",
    title: "Modele de contrat entre associes",
    summary: "Cadre contractuel pour engagements et obligations mutuelles.",
    category: "Juridique & Creation",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Formaliser partenariat",
    sectorTags: ["Juridique", "Tous secteurs"],
    highlight: "Version concise et facile a adapter.",
  },
  {
    slug: "contrat-partenariat",
    title: "Contrat de partenariat",
    summary: "Accord type pour partenariat commercial ou operationnel.",
    category: "Juridique & Creation",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Formaliser partenariat",
    sectorTags: ["Juridique", "Commerce", "Services"],
    highlight: "Definit objectifs, duree, responsabilites et clauses de sortie.",
  },
  {
    slug: "term-sheet-simple",
    title: "Term sheet simple",
    summary: "Points essentiels d'un accord d'investissement.",
    category: "Finance & Investissement",
    level: "Avance",
    fileType: "DOCX",
    objective: "Lever des fonds",
    sectorTags: ["Finance", "Tous secteurs"],
    highlight: "Structure lisible pour aligner rapidement fondateurs et investisseurs.",
  },
  {
    slug: "convention-apport-capital",
    title: "Convention d'apport en capital",
    summary: "Documente l'apport financier et les conditions associees.",
    category: "Finance & Investissement",
    level: "Avance",
    fileType: "DOCX",
    objective: "Lever des fonds",
    sectorTags: ["Finance", "Tous secteurs"],
    highlight: "Traite montant, calendrier de versement et contreparties.",
  },
  {
    slug: "tableau-repartition-parts",
    title: "Tableau de repartition des parts",
    summary: "Vision claire de la cap table entre associes et investisseurs.",
    category: "Finance & Investissement",
    level: "Debutant",
    fileType: "Editable online",
    objective: "Lever des fonds",
    sectorTags: ["Finance", "Tous secteurs"],
    highlight: "Utile avant chaque discussion de levee ou d'entree d'un associe.",
  },
  {
    slug: "plan-tresorerie",
    title: "Plan de tresorerie",
    summary: "Suivi mensuel des entrees/sorties pour piloter la liquidite.",
    category: "Finance & Investissement",
    level: "Debutant",
    fileType: "Editable online",
    objective: "Creer entreprise",
    sectorTags: ["Finance", "Tous secteurs"],
    highlight: "Aide a anticiper les tensions de cash.",
  },
  {
    slug: "demande-financement",
    title: "Modele de demande de financement",
    summary: "Trame prete a envoyer aux partenaires financiers.",
    category: "Finance & Investissement",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Lever des fonds",
    sectorTags: ["Finance", "Tous secteurs"],
    highlight: "Resume besoins, garanties et plan de remboursement.",
  },
  {
    slug: "business-plan-pisciculture",
    title: "Business plan pisciculture",
    summary: "Modele operationnel adapte aux projets d'elevage de poissons.",
    category: "Secteurs congolais",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Creer entreprise",
    sectorTags: ["Pisciculture", "Agribusiness"],
    highlight: "Inclut cycle de production, cout alimentation et vente locale.",
  },
  {
    slug: "business-plan-elevage-poulet",
    title: "Business plan elevage poulet",
    summary: "Trame terrain pour elevage avicole en cycle court.",
    category: "Secteurs congolais",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Creer entreprise",
    sectorTags: ["Elevage avicole", "Agribusiness"],
    highlight: "Dimensionnement, mortalite cible et marge par lot.",
  },
  {
    slug: "business-plan-transformation-manioc",
    title: "Business plan transformation manioc",
    summary: "Modele pour activites de transformation agroalimentaire locale.",
    category: "Secteurs congolais",
    level: "Debutant",
    fileType: "DOCX",
    objective: "Creer entreprise",
    sectorTags: ["Transformation agro", "Agribusiness"],
    highlight: "Approche orientee production, emballage et distribution locale.",
  },
  {
    slug: "business-plan-ecommerce-local",
    title: "Business plan e-commerce local",
    summary: "Plan pour boutique en ligne avec logistique de proximite.",
    category: "Secteurs congolais",
    level: "Debutant",
    fileType: "Editable online",
    objective: "Creer entreprise",
    sectorTags: ["E-commerce", "Commerce"],
    highlight: "Inclut acquisition clients, livraison et service client.",
  },
  {
    slug: "business-plan-transport-urbain",
    title: "Business plan transport urbain",
    summary: "Trame pour service de transport local ou navette urbaine.",
    category: "Secteurs congolais",
    level: "Avance",
    fileType: "DOCX",
    objective: "Creer entreprise",
    sectorTags: ["Transport urbain", "Services"],
    highlight: "Modelise flotte, remplissage, carburant et maintenance.",
  },
];

export const DOCUMENT_TEMPLATES = DEFAULT_DOCUMENT_TEMPLATES;

export function getDocumentTemplateBySlug(slug: string) {
  return DEFAULT_DOCUMENT_TEMPLATES.find((template) => template.slug === slug);
}

function mapTemplateToProjectCategory(template: DocumentTemplate): DashboardProjectCategory {
  if (
    template.sectorTags.includes("Agribusiness") ||
    template.sectorTags.includes("Pisciculture") ||
    template.sectorTags.includes("Elevage avicole") ||
    template.sectorTags.includes("Transformation agro")
  ) {
    return "AGRIBUSINESS";
  }

  if (template.sectorTags.includes("E-commerce")) {
    return "TECH";
  }

  if (template.sectorTags.includes("Transport urbain")) {
    return "INFRASTRUCTURE";
  }

  return "OTHER";
}

function mapTemplateToEquityModel(template: DocumentTemplate): DashboardProjectEquityModel {
  if (template.objective === "Formaliser partenariat") {
    return "REVENUE_SHARE";
  }

  if (template.objective === "Lever des fonds") {
    return "EQUITY";
  }

  return "NONE";
}

function resolveTemplateCapital(template: DocumentTemplate) {
  if (template.objective === "Lever des fonds") {
    return {
      totalCapital: "25000000",
      ownerContribution: "5000000",
    };
  }

  if (template.level === "Avance") {
    return {
      totalCapital: "18000000",
      ownerContribution: "3500000",
    };
  }

  return {
    totalCapital: "8000000",
    ownerContribution: "1500000",
  };
}

export function buildProjectFormPrefillFromTemplate(
  template: DocumentTemplate
): ProjectFormTemplatePrefill {
  const category = mapTemplateToProjectCategory(template);
  const equityModel = mapTemplateToEquityModel(template);
  const capital = resolveTemplateCapital(template);

  return {
    title: template.title,
    city: "Brazzaville",
    summary: template.summary,
    description: [
      `Projet prepare a partir du modele: ${template.title}.`,
      "",
      "Contexte:",
      "Ce brouillon sert de base operationnelle pour cadrer la proposition de valeur,",
      "les hypotheses de marche, le modele economique et les besoins de partenariat.",
      "",
      "Priorites a completer:",
      "1. Positionnement et client cible",
      "2. Plan commercial et execution",
      "3. Hypotheses financieres",
      "4. Gouvernance et feuille de route",
      "",
      `Point cle du modele: ${template.highlight}`,
    ].join("\n"),
    category,
    equityModel,
    visibility: "PUBLIC",
    legalForm: "SARL",
    totalCapital: capital.totalCapital,
    ownerContribution: capital.ownerContribution,
    equityNote: template.highlight,
    companyCreated: false,
    country: "CG",
  };
}

export function buildTemplateDraftContent(template: DocumentTemplate) {
  return [
    `# ${template.title}`,
    "",
    "## Objectif",
    template.objective,
    "",
    "## Resume du projet",
    "- Contexte:",
    "- Opportunite:",
    "- Proposition de valeur:",
    "",
    "## Sections a completer",
    "1. Vision et positionnement",
    "2. Offre et client cible",
    "3. Plan commercial",
    "4. Plan operationnel",
    "5. Plan financier",
    "6. Risques et mitigations",
    "",
    "## Notes de personnalisation",
    `- Niveau recommande: ${template.level}`,
    `- Type de support: ${template.fileType}`,
    `- Secteur(s): ${template.sectorTags.join(", ")}`,
    "",
    "Document genere automatiquement par Mon partenaire.",
  ].join("\n");
}
