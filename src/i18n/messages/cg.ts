import { frMessages, type AppMessages } from "@/src/i18n/messages/fr";

export const cgMessages = {
  ...frMessages,
  header: {
    ...frMessages.header,
    navHome: "Ebandeli",
    navProjects: "Tala ba projets",
    navDocuments: "Mikanda",
    accountFallback: "Compte na ngai",
    connectedAccount: "Compte ekangami",
    menuSupport: "Lisungi",
    logout: "Kobima",
    login: "Kokota",
    signup: "Kosala compte",
  },
  locale: {
    ...frMessages.locale,
    label: "Lokota",
    fr: "FR",
    en: "EN",
    cg: "CG",
  },
  landing: {
    ...frMessages.landing,
    hero: {
      ...frMessages.landing.hero,
      badge: "Plateforme Congo-Brazzaville",
      titleBefore: "Tonga entreprise na yo na",
      titleHighlight: "molongani ya bondimi.",
      description:
        "Mon partenaire ezali kosunga yo na etape nyonso: kobongisa apports, kopona ba profils, mpe kobanda projet kino na kokoma legale.",
      primaryCta: "Tia projet",
      secondaryCta: "Tala ba projets",
      features: [
        {
          title: "Apports polele",
          description: "Bongisa mbongo, materiel mpe mayele banda lelo.",
        },
        {
          title: "Boyokani ya sure",
          description: "Landa bokaboli ya parts mpe makambo ya boyokani.",
        },
      ],
      stats: [
        { value: "120+", label: "ba projets actifs" },
        { value: "93%", label: "match na profils ciblés" },
        { value: "4 semaines", label: "kino cadrage ya suka" },
      ],
      floatingCardTopTitle: "Projet ya sika",
      floatingCardBottomSubtitle: "objectif ekokisami",
      dashboardStatus: "Actif",
      dashboardTitle: "Landa engagement nyonso na tango ya solo.",
      dashboardCta: "Tala mobembo mobimba",
    },
    steps: {
      ...frMessages.landing.steps,
      eyebrow: "Esalaka ndenge nini",
      title: "Parcours ya polele mpo boyokani ekangama malamu.",
      description:
        "Etape moko na moko ebotaka livrables oyo okoki kokabola na ba partenaires: recap ya apports, cadrage ya projet, mpe previsions financieres.",
      items: [
        {
          title: "Lakisa projet na yo",
          description: "Lobela activite, besoins, mpe apports oyo ozali na yango.",
        },
        {
          title: "Pona partenaire ya malamu",
          description:
            "Tala ba profils, ba competences mpe niveau ya engagement oyo esengeli.",
        },
        {
          title: "Formalisa boyokani",
          description:
            "Bongisa parts, salisa echange ezala sure, mpe bongisa ba statuts.",
        },
      ],
      deliverablesEyebrow: "Livrables",
      deliverablesTitle: "Esaleli ya mobimba, ready mpo na kosigna.",
    },
    audience: {
      ...frMessages.landing.audience,
      eyebrow: "Mpo na nani?",
      title: "Ba profils ekokani mpo na kokende liboso elongo.",
      description:
        "Soki ozali porteur ya idee to opesi ressources, plateforme ebongisaka bilikya banda na ebandeli.",
      founderTitle: "Porteur ya projet",
      partnerTitle: "Partenaire financier to competence",
      partnerBoxTitle: "Okozwa nini",
    },
    examples: {
      ...frMessages.landing.examples,
      eyebrow: "Bandakisa ya projets",
      title: "Ba projets ya solo, besoins ya polele.",
      viewAll: "Tala nyonso",
      noProjects: "Projet publie ezali nanu te.",
    },
    trust: {
      ...frMessages.landing.trust,
      eyebrow: "Bondimi & cadre",
      title: "Polele banda na contact ya liboso.",
      description:
        "Parcours guidé mpo kopekisa confusion mpe kosala ba decisions noki.",
      scoreTitle: "Niveau ya bondimi",
    },
    cta: {
      ...frMessages.landing.cta,
      title: "Pesa partenariat na yo structure ya polele.",
      description:
        "Banda projet na yo to kota na equipe ya tina na bondimi nyonso.",
      primaryCta: "Kosala compte",
      secondaryCta: "Komona cadre",
      includedTitle: "Ezali na kati",
    },
    faq: {
      ...frMessages.landing.faq,
      title: "Mituna oyo batunaka mingi",
      supportTitle: "Lisungi",
    },
    footer: {
      ...frMessages.landing.footer,
      infosTitle: "Ba informations",
      privacy: "Politique ya confidentialité",
      terms: "Conditions generales",
      about: "Na tina na biso",
    },
  },
  documents: {
    ...frMessages.documents,
    page: {
      ...frMessages.documents.page,
      eyebrow: "Bibliotheque ya modeles",
      title: "Mikanda mpe modeles oyo ezali ready",
      description:
        "Tala ba modeles ya pratique mpo na kobongisa projet na yo: business plan, mikanda juridiques, financement, mpe templates métiers mpo na Congo.",
      statsAvailable: "Modeles disponibles",
      statsCongo: "Modeles secteurs congolais",
      statsInteractive: "Mode interactif",
      interactiveEnabled:
        "Actif: okoki kosalela ba modeles uta na dashboard na yo.",
      interactiveDisabled:
        "Kokota liboso mpo na kobongola modele na brouillon ya projet.",
      suggestionsTitle: "Ba suggestions ya modeles ya kobakisa",
    },
    library: {
      ...frMessages.documents.library,
      modeDownloadTitle: "Mode A - Téléchargement simple",
      modeDownloadDescription:
        "Telecharger modele, bongisa yango na contexte na yo, mpe salela yango lisusu.",
      modeInteractiveTitle: "Mode B - Mode interactif",
      modeInteractiveDescription:
        "Salela modele uta na compte na yo mpo na kobongisa brouillon ya projet na dashboard.",
      filtersTitle: "Filtres intelligents",
      filtersDescription:
        "Sangisa secteur, niveau, type ya fichier, mpe objectif.",
      tabDownload: "Télécharger",
      tabInteractive: "Interactif",
      filterSector: "Secteur",
      filterSectorAll: "Ba secteurs nyonso",
      filterLevel: "Niveau",
      filterLevelAll: "Ba niveaux nyonso",
      filterType: "Type",
      filterTypeAll: "Ba types nyonso",
      filterObjective: "Objectif",
      filterObjectiveAll: "Ba objectifs nyonso",
      filterSearch: "Boluki",
      filterSearchPlaceholder: "business plan, statuts...",
      availableCountSuffix: "modele(s) disponibles",
      resetFilters: "Zongisa filtres",
      emptyTitle: "Modele moko te emonani",
      emptyDescription:
        "Bongisa filtres to boluki mpo na komona ba resultats mingi.",
      groupedCountSuffix: "modele(s)",
      actionUse: "Salela modele oyo",
      actionLoginToUse: "Kokota mpo na kosalela",
      actionDownload: "Télécharger modele",
    },
  },
} satisfies AppMessages;
