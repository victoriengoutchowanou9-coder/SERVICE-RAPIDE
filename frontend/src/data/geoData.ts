// Base de données géographique hiérarchique : Pays -> Départements/Régions -> Communes -> Villes/Localités
// Couvrant l'Afrique de l'Ouest et Centrale (Bénin, Côte d'Ivoire, Sénégal, Togo, Cameroun, Burkina Faso, Mali, Guinée, etc.)

export interface GeoCity {
  id: string;
  name: string;
}

export interface GeoCommune {
  id: string;
  name: string;
  cities: GeoCity[];
}

export interface GeoDepartment {
  id: string;
  name: string;
  communes: GeoCommune[];
}

export interface GeoCountry {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  departments: GeoDepartment[];
}

export const GEO_DATA: GeoCountry[] = [
  // 1. BÉNIN (BJ) - 12 Départements, 77 Communes
  {
    code: 'BJ',
    name: 'Bénin',
    dialCode: '+229',
    flag: '🇧🇯',
    departments: [
      {
        id: 'bj-littoral',
        name: 'Littoral',
        communes: [
          {
            id: 'bj-com-cotonou',
            name: 'Cotonou',
            cities: [
              { id: 'bj-cit-cotonou-1', name: '1er Arrondissement (Dandji, Donaten)' },
              { id: 'bj-cit-cotonou-2', name: '2e Arrondissement (Sènadé, Kowégbo)' },
              { id: 'bj-cit-cotonou-3', name: '3e Arrondissement (Adogléta, Kpankpan)' },
              { id: 'bj-cit-cotonou-4', name: '4e Arrondissement (Akpakpa Dodomè)' },
              { id: 'bj-cit-cotonou-5', name: '5e Arrondissement (Guinkomey, Tokpa)' },
              { id: 'bj-cit-cotonou-6', name: '6e Arrondissement (Ahouansori)' },
              { id: 'bj-cit-cotonou-7', name: '7e Arrondissement (Saint-Michel, Gbégamey)' },
              { id: 'bj-cit-cotonou-8', name: '8e Arrondissement (Mènontin, Sainte-Rita)' },
              { id: 'bj-cit-cotonou-9', name: '9e Arrondissement (Vèdoko, Fifadji)' },
              { id: 'bj-cit-cotonou-10', name: '10e Arrondissement (Zogbo, Missèbo)' },
              { id: 'bj-cit-cotonou-11', name: '11e Arrondissement (Vodjè, Gbégamey Ouest)' },
              { id: 'bj-cit-cotonou-12', name: '12e Arrondissement (Cadjèhoun, Haie Vive)' },
              { id: 'bj-cit-cotonou-13', name: '13e Arrondissement (Fidjrossè, Agbato)' },
            ],
          },
        ],
      },
      {
        id: 'bj-atlantique',
        name: 'Atlantique',
        communes: [
          {
            id: 'bj-com-abomey-calavi',
            name: 'Abomey-Calavi',
            cities: [
              { id: 'bj-cit-calavi-centre', name: 'Calavi Centre' },
              { id: 'bj-cit-godomey', name: 'Godomey' },
              { id: 'bj-cit-akassato', name: 'Akassato' },
              { id: 'bj-cit-zinvie', name: 'Zinvié' },
              { id: 'bj-cit-ouedo', name: 'Ouèdo' },
              { id: 'bj-cit-glo-djigbe', name: 'Glo-Djigbé' },
              { id: 'bj-cit-hevie', name: 'Hêvié' },
              { id: 'bj-cit-togba', name: 'Togba' },
            ],
          },
          {
            id: 'bj-com-ouidah',
            name: 'Ouidah',
            cities: [
              { id: 'bj-cit-ouidah-centre', name: 'Ouidah Centre' },
              { id: 'bj-cit-pahou', name: 'Pahou' },
              { id: 'bj-cit-djidje', name: 'Djidjè' },
              { id: 'bj-cit-agbanakin', name: 'Agbanakin' },
            ],
          },
          {
            id: 'bj-com-allada',
            name: 'Allada',
            cities: [
              { id: 'bj-cit-allada-centre', name: 'Allada Centre' },
              { id: 'bj-cit-attogon', name: 'Attogon' },
              { id: 'bj-cit-sehoue', name: 'Sékou' },
            ],
          },
          {
            id: 'bj-com-kpomassè',
            name: 'Kpomassè',
            cities: [
              { id: 'bj-cit-kpomasse-c', name: 'Kpomassè Centre' },
              { id: 'bj-cit-agbanto', name: 'Agbanto' },
            ],
          },
          {
            id: 'bj-com-toffo',
            name: 'Toffo',
            cities: [
              { id: 'bj-cit-toffo-c', name: 'Toffo Centre' },
              { id: 'bj-cit-houegbo', name: 'Houègbo' },
            ],
          },
          {
            id: 'bj-com-tori-bossito',
            name: 'Tori-Bossito',
            cities: [
              { id: 'bj-cit-tori-c', name: 'Tori-Bossito Centre' },
              { id: 'bj-cit-tori-cada', name: 'Tori-Cada' },
            ],
          },
          {
            id: 'bj-com-ze',
            name: 'Zè',
            cities: [
              { id: 'bj-cit-ze-c', name: 'Zè Centre' },
              { id: 'bj-cit-dodji-bata', name: 'Dodji-Bata' },
            ],
          },
          {
            id: 'bj-com-so-ava',
            name: 'Sô-Ava',
            cities: [
              { id: 'bj-cit-so-ava-c', name: 'Sô-Ava Centre' },
              { id: 'bj-cit-ganvie', name: 'Ganvié' },
            ],
          },
        ],
      },
      {
        id: 'bj-oueme',
        name: 'Ouémé',
        communes: [
          {
            id: 'bj-com-porto-novo',
            name: 'Porto-Novo',
            cities: [
              { id: 'bj-cit-pn-1', name: '1er Arrondissement (Olougbé)' },
              { id: 'bj-cit-pn-2', name: '2e Arrondissement (Djassin)' },
              { id: 'bj-cit-pn-3', name: '3e Arrondissement (Avakpa)' },
              { id: 'bj-cit-pn-4', name: '4e Arrondissement (Ananvié)' },
              { id: 'bj-cit-pn-5', name: '5e Arrondissement (Ouando)' },
            ],
          },
          {
            id: 'bj-com-seme-kpodji',
            name: 'Sèmè-Kpodji',
            cities: [
              { id: 'bj-cit-seme-c', name: 'Sèmè Centre' },
              { id: 'bj-cit-ekpe', name: 'Ekpè' },
              { id: 'bj-cit-djeke', name: 'Djèrègbé' },
              { id: 'bj-cit-krake', name: 'Kraké Plage' },
            ],
          },
          {
            id: 'bj-com-akpro-misserete',
            name: 'Akpro-Missérété',
            cities: [
              { id: 'bj-cit-misserete-c', name: 'Missérété Centre' },
              { id: 'bj-cit-katagon', name: 'Katagon' },
            ],
          },
          {
            id: 'bj-com-adjohoun',
            name: 'Adjohoun',
            cities: [{ id: 'bj-cit-adjohoun-c', name: 'Adjohoun Centre' }],
          },
          {
            id: 'bj-com-avrankou',
            name: 'Avrankou',
            cities: [{ id: 'bj-cit-avrankou-c', name: 'Avrankou Centre' }],
          },
          {
            id: 'bj-com-bonou',
            name: 'Bonou',
            cities: [{ id: 'bj-cit-bonou-c', name: 'Bonou Centre' }],
          },
          {
            id: 'bj-com-dangbo',
            name: 'Dangbo',
            cities: [{ id: 'bj-cit-dangbo-c', name: 'Dangbo Centre' }],
          },
          {
            id: 'bj-com-aguegues',
            name: 'Aguégués',
            cities: [{ id: 'bj-cit-aguegues-c', name: 'Aguégués Centre' }],
          },
        ],
      },
      {
        id: 'bj-borgou',
        name: 'Borgou',
        communes: [
          {
            id: 'bj-com-parakou',
            name: 'Parakou',
            cities: [
              { id: 'bj-cit-pk-1', name: '1er Arrondissement (Titirou)' },
              { id: 'bj-cit-pk-2', name: '2e Arrondissement (Banikanni)' },
              { id: 'bj-cit-pk-3', name: '3e Arrondissement (Guéma)' },
            ],
          },
          {
            id: 'bj-com-tchaourou',
            name: 'Tchaourou',
            cities: [{ id: 'bj-cit-tchaourou-c', name: 'Tchaourou Centre' }],
          },
          {
            id: 'bj-com-bembereke',
            name: 'Bembèrèkè',
            cities: [{ id: 'bj-cit-bembereke-c', name: 'Bembèrèkè Centre' }],
          },
          {
            id: 'bj-com-ndi',
            name: "N'Dali",
            cities: [{ id: 'bj-cit-ndali-c', name: "N'Dali Centre" }],
          },
          {
            id: 'bj-com-nikki',
            name: 'Nikki',
            cities: [{ id: 'bj-cit-nikki-c', name: 'Nikki Centre' }],
          },
          {
            id: 'bj-com-kalale',
            name: 'Kalalé',
            cities: [{ id: 'bj-cit-kalale-c', name: 'Kalalé Centre' }],
          },
          {
            id: 'bj-com-sinende',
            name: 'Sinendé',
            cities: [{ id: 'bj-cit-sinende-c', name: 'Sinendé Centre' }],
          },
          {
            id: 'bj-com-perere',
            name: 'Pèrèrè',
            cities: [{ id: 'bj-cit-perere-c', name: 'Pèrèrè Centre' }],
          },
        ],
      },
      {
        id: 'bj-zou',
        name: 'Zou',
        communes: [
          {
            id: 'bj-com-abomey',
            name: 'Abomey',
            cities: [
              { id: 'bj-cit-abomey-c', name: 'Abomey Centre' },
              { id: 'bj-cit-djegbe', name: 'Djègbé' },
            ],
          },
          {
            id: 'bj-com-bohicon',
            name: 'Bohicon',
            cities: [
              { id: 'bj-cit-bohicon-1', name: 'Bohicon 1' },
              { id: 'bj-cit-bohicon-2', name: 'Bohicon 2' },
              { id: 'bj-cit-passagon', name: 'Passagon' },
            ],
          },
          {
            id: 'bj-com-covè',
            name: 'Covè',
            cities: [{ id: 'bj-cit-cove-c', name: 'Covè Centre' }],
          },
          {
            id: 'bj-com-za-kpota',
            name: 'Za-Kpota',
            cities: [{ id: 'bj-cit-zakpota-c', name: 'Za-Kpota Centre' }],
          },
          {
            id: 'bj-com-zogbodomey',
            name: 'Zogbodomey',
            cities: [{ id: 'bj-cit-zogbodomey-c', name: 'Zogbodomey Centre' }],
          },
          {
            id: 'bj-com-djidja',
            name: 'Djidja',
            cities: [{ id: 'bj-cit-djidja-c', name: 'Djidja Centre' }],
          },
          {
            id: 'bj-com-ouinhi',
            name: 'Ouinhi',
            cities: [{ id: 'bj-cit-ouinhi-c', name: 'Ouinhi Centre' }],
          },
          {
            id: 'bj-com-zagnanado',
            name: 'Zagnanado',
            cities: [{ id: 'bj-cit-zagnanado-c', name: 'Zagnanado Centre' }],
          },
          {
            id: 'bj-com-tohviko',
            name: 'Agbangnizoun',
            cities: [{ id: 'bj-cit-agbangnizoun-c', name: 'Agbangnizoun Centre' }],
          },
        ],
      },
      {
        id: 'bj-mono',
        name: 'Mono',
        communes: [
          {
            id: 'bj-com-lokossa',
            name: 'Lokossa',
            cities: [{ id: 'bj-cit-lokossa-c', name: 'Lokossa Centre' }],
          },
          {
            id: 'bj-com-grand-popo',
            name: 'Grand-Popo',
            cities: [
              { id: 'bj-cit-gp-c', name: 'Grand-Popo Centre' },
              { id: 'bj-cit-avlo', name: 'Avlo' },
            ],
          },
          {
            id: 'bj-com-come',
            name: 'Comè',
            cities: [{ id: 'bj-cit-come-c', name: 'Comè Centre' }],
          },
          {
            id: 'bj-com-athieme',
            name: 'Athiémé',
            cities: [{ id: 'bj-cit-athieme-c', name: 'Athiémé Centre' }],
          },
          {
            id: 'bj-com-bopa',
            name: 'Bopa',
            cities: [{ id: 'bj-cit-bopa-c', name: 'Bopa Centre' }],
          },
          {
            id: 'bj-com-houeyogbe',
            name: 'Houéyogbé',
            cities: [{ id: 'bj-cit-houeyogbe-c', name: 'Houéyogbé Centre' }],
          },
        ],
      },
      {
        id: 'bj-couffo',
        name: 'Couffo',
        communes: [
          {
            id: 'bj-com-aplahoue',
            name: 'Aplahoué',
            cities: [{ id: 'bj-cit-aplahoue-c', name: 'Aplahoué Centre' }],
          },
          {
            id: 'bj-com-djakotomey',
            name: 'Djakotomey',
            cities: [{ id: 'bj-cit-djakotomey-c', name: 'Djakotomey Centre' }],
          },
          {
            id: 'bj-com-dogbo',
            name: 'Dogbo',
            cities: [{ id: 'bj-cit-dogbo-c', name: 'Dogbo Centre' }],
          },
          {
            id: 'bj-com-klouekanme',
            name: 'Klouékanmè',
            cities: [{ id: 'bj-cit-klouekanme-c', name: 'Klouékanmè Centre' }],
          },
          {
            id: 'bj-com-lalo',
            name: 'Lalo',
            cities: [{ id: 'bj-cit-lalo-c', name: 'Lalo Centre' }],
          },
          {
            id: 'bj-com-toviklin',
            name: 'Toviklin',
            cities: [{ id: 'bj-cit-toviklin-c', name: 'Toviklin Centre' }],
          },
        ],
      },
      {
        id: 'bj-atacora',
        name: 'Atacora',
        communes: [
          {
            id: 'bj-com-natitingou',
            name: 'Natitingou',
            cities: [{ id: 'bj-cit-natitingou-c', name: 'Natitingou Centre' }],
          },
          {
            id: 'bj-com-tanguieta',
            name: 'Tanguiéta',
            cities: [{ id: 'bj-cit-tanguieta-c', name: 'Tanguiéta Centre' }],
          },
          {
            id: 'bj-com-kouande',
            name: 'Kouandé',
            cities: [{ id: 'bj-cit-kouande-c', name: 'Kouandé Centre' }],
          },
          {
            id: 'bj-com-boukoumbe',
            name: 'Boukoumbé',
            cities: [{ id: 'bj-cit-boukoumbe-c', name: 'Boukoumbé Centre' }],
          },
          {
            id: 'bj-com-kerou',
            name: 'Kérou',
            cities: [{ id: 'bj-cit-kerou-c', name: 'Kérou Centre' }],
          },
          {
            id: 'bj-com-cobly',
            name: 'Cobly',
            cities: [{ id: 'bj-cit-cobly-c', name: 'Cobly Centre' }],
          },
          {
            id: 'bj-com-matero',
            name: 'Matéri',
            cities: [{ id: 'bj-cit-materi-c', name: 'Matéri Centre' }],
          },
          {
            id: 'bj-com-pehunco',
            name: 'Péhunco',
            cities: [{ id: 'bj-cit-pehunco-c', name: 'Péhunco Centre' }],
          },
          {
            id: 'bj-com-toucountouna',
            name: 'Toucountouna',
            cities: [{ id: 'bj-cit-toucountouna-c', name: 'Toucountouna Centre' }],
          },
        ],
      },
      {
        id: 'bj-alibori',
        name: 'Alibori',
        communes: [
          {
            id: 'bj-com-kandi',
            name: 'Kandi',
            cities: [{ id: 'bj-cit-kandi-c', name: 'Kandi Centre' }],
          },
          {
            id: 'bj-com-malanville',
            name: 'Malanville',
            cities: [{ id: 'bj-cit-malanville-c', name: 'Malanville Centre' }],
          },
          {
            id: 'bj-com-banikoara',
            name: 'Banikoara',
            cities: [{ id: 'bj-cit-banikoara-c', name: 'Banikoara Centre' }],
          },
          {
            id: 'bj-com-gogounou',
            name: 'Gogounou',
            cities: [{ id: 'bj-cit-gogounou-c', name: 'Gogounou Centre' }],
          },
          {
            id: 'bj-com-segbana',
            name: 'Ségbana',
            cities: [{ id: 'bj-cit-segbana-c', name: 'Ségbana Centre' }],
          },
          {
            id: 'bj-com-karimama',
            name: 'Karimama',
            cities: [{ id: 'bj-cit-karimama-c', name: 'Karimama Centre' }],
          },
        ],
      },
      {
        id: 'bj-donga',
        name: 'Donga',
        communes: [
          {
            id: 'bj-com-djougou',
            name: 'Djougou',
            cities: [{ id: 'bj-cit-djougou-c', name: 'Djougou Centre' }],
          },
          {
            id: 'bj-com-bassila',
            name: 'Bassila',
            cities: [{ id: 'bj-cit-bassila-c', name: 'Bassila Centre' }],
          },
          {
            id: 'bj-com-copargo',
            name: 'Copargo',
            cities: [{ id: 'bj-cit-copargo-c', name: 'Copargo Centre' }],
          },
          {
            id: 'bj-com-ouake',
            name: 'Ouaké',
            cities: [{ id: 'bj-cit-ouake-c', name: 'Ouaké Centre' }],
          },
        ],
      },
      {
        id: 'bj-collines',
        name: 'Collines',
        communes: [
          {
            id: 'bj-com-dassa',
            name: 'Dassa-Zoumè',
            cities: [{ id: 'bj-cit-dassa-c', name: 'Dassa Centre' }],
          },
          {
            id: 'bj-com-savalou',
            name: 'Savalou',
            cities: [{ id: 'bj-cit-savalou-c', name: 'Savalou Centre' }],
          },
          {
            id: 'bj-com-save',
            name: 'Savè',
            cities: [{ id: 'bj-cit-save-c', name: 'Savè Centre' }],
          },
          {
            id: 'bj-com-bantè',
            name: 'Bantè',
            cities: [{ id: 'bj-cit-bante-c', name: 'Bantè Centre' }],
          },
          {
            id: 'bj-com-glesse',
            name: 'Glazoué',
            cities: [{ id: 'bj-cit-glazoue-c', name: 'Glazoué Centre' }],
          },
          {
            id: 'bj-com-ouesse',
            name: 'Ouèssè',
            cities: [{ id: 'bj-cit-ouesse-c', name: 'Ouèssè Centre' }],
          },
        ],
      },
      {
        id: 'bj-plateau',
        name: 'Plateau',
        communes: [
          {
            id: 'bj-com-pobe',
            name: 'Pobè',
            cities: [{ id: 'bj-cit-pobe-c', name: 'Pobè Centre' }],
          },
          {
            id: 'bj-com-sakete',
            name: 'Sakété',
            cities: [{ id: 'bj-cit-sakete-c', name: 'Sakété Centre' }],
          },
          {
            id: 'bj-com-ketou',
            name: 'Kétou',
            cities: [{ id: 'bj-cit-ketou-c', name: 'Kétou Centre' }],
          },
          {
            id: 'bj-com-ifangni',
            name: 'Ifangni',
            cities: [{ id: 'bj-cit-ifangni-c', name: 'Ifangni Centre' }],
          },
          {
            id: 'bj-com-adja-ouere',
            name: 'Adja-Ouèrè',
            cities: [{ id: 'bj-cit-adjaouere-c', name: 'Adja-Ouèrè Centre' }],
          },
        ],
      },
    ],
  },

  // 2. CÔTE D'IVOIRE (CI)
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    dialCode: '+225',
    flag: '🇨🇮',
    departments: [
      {
        id: 'ci-abidjan',
        name: "District Autonome d'Abidjan",
        communes: [
          {
            id: 'ci-com-cocody',
            name: 'Cocody',
            cities: [
              { id: 'ci-cit-riviera', name: 'Riviera (2, 3, Palmeraie, Faya)' },
              { id: 'ci-cit-angre', name: 'Angré (8e Tranche, Château, Djibi)' },
              { id: 'ci-cit-deux-plateaux', name: 'Deux Plateaux (Vallons, Aghien)' },
              { id: 'ci-cit-ambassades', name: 'Cocody Centre / Ambassades' },
              { id: 'ci-cit-anono', name: 'Anono / M’Pouto' },
            ],
          },
          {
            id: 'ci-com-yopougon',
            name: 'Yopougon',
            cities: [
              { id: 'ci-cit-maroc', name: 'Yopougon Maroc' },
              { id: 'ci-cit-niangon', name: 'Niangon (Nord, Sud)' },
              { id: 'ci-cit-siporex', name: 'Siporex / Selmer' },
              { id: 'ci-cit-toits-rouges', name: 'Toits Rouges / Sideci' },
              { id: 'ci-cit-zone-ind', name: 'Zone Industrielle Yopougon' },
            ],
          },
          {
            id: 'ci-com-plateau',
            name: 'Le Plateau',
            cities: [
              { id: 'ci-cit-plateau-c', name: 'Plateau Centre Administratif' },
              { id: 'ci-cit-plateau-com', name: 'Plateau Commercial' },
            ],
          },
          {
            id: 'ci-com-marcory',
            name: 'Marcory',
            cities: [
              { id: 'ci-cit-zone4', name: 'Zone 4C / Biétry' },
              { id: 'ci-cit-residentiel', name: 'Marcory Résidentiel' },
              { id: 'ci-cit-anoumabo', name: 'Anoumabo' },
            ],
          },
          {
            id: 'ci-com-treichville',
            name: 'Treichville',
            cities: [
              { id: 'ci-cit-ar检验', name: 'Avenue 16 / Belleville' },
              { id: 'ci-cit-zone3', name: 'Zone 3 / Port Autonome' },
            ],
          },
          {
            id: 'ci-com-koumassi',
            name: 'Koumassi',
            cities: [
              { id: 'ci-cit-remi', name: 'Remblais / Prodomo' },
              { id: 'ci-cit-sopim', name: 'Sopim / Grand Campement' },
            ],
          },
          {
            id: 'ci-com-port-bouet',
            name: 'Port-Bouët',
            cities: [
              { id: 'ci-cit-aeroport', name: 'Zone Aéroportuaire' },
              { id: 'ci-cit-vrille', name: 'Vridi' },
              { id: 'ci-cit-gonzaque', name: 'Gonzagueville' },
            ],
          },
          {
            id: 'ci-com-abobo',
            name: 'Abobo',
            cities: [
              { id: 'ci-cit-abobo-gare', name: 'Abobo Gare' },
              { id: 'ci-cit-pk18', name: 'PK 18 / Samaké' },
              { id: 'ci-cit-sagbe', name: 'Sagbé / Avocatier' },
            ],
          },
          {
            id: 'ci-com-adjame',
            name: 'Adjamé',
            cities: [
              { id: 'ci-cit-adjame-marche', name: 'Adjamé Grand Marché' },
              { id: 'ci-cit-220-logements', name: '220 Logements' },
            ],
          },
          {
            id: 'ci-com-attecoube',
            name: 'Attécoubé',
            cities: [{ id: 'ci-cit-attecoube-c', name: 'Attécoubé Centre / Locodjro' }],
          },
          {
            id: 'ci-com-bingerville',
            name: 'Bingerville',
            cities: [
              { id: 'ci-cit-bingerville-c', name: 'Bingerville Centre' },
              { id: 'ci-cit-feh-kesse', name: 'Feh Kessé / Sebroko' },
            ],
          },
          {
            id: 'ci-com-songon',
            name: 'Songon',
            cities: [{ id: 'ci-cit-songon-dagbe', name: 'Songon Dagbé' }],
          },
        ],
      },
      {
        id: 'ci-yamoussoukro',
        name: 'District Autonome de Yamoussoukro',
        communes: [
          {
            id: 'ci-com-yakro',
            name: 'Yamoussoukro',
            cities: [
              { id: 'ci-cit-yakro-centre', name: 'Yamoussoukro Centre' },
              { id: 'ci-cit-habitat', name: 'Habitat / Morofé' },
              { id: 'ci-cit-assabou', name: 'Assabou' },
            ],
          },
          {
            id: 'ci-com-attiégouakro',
            name: 'Attiégouakro',
            cities: [{ id: 'ci-cit-attiegouakro-c', name: 'Attiégouakro Centre' }],
          },
        ],
      },
      {
        id: 'ci-gbeke',
        name: 'Gbêkê (Bouaké)',
        communes: [
          {
            id: 'ci-com-bouake',
            name: 'Bouaké',
            cities: [
              { id: 'ci-cit-commerce', name: 'Le Commerce' },
              { id: 'ci-cit-air-france', name: 'Air France 1 & 2' },
              { id: 'ci-cit-kennedy', name: 'Kennedy / Koko' },
              { id: 'ci-cit-belle-ville', name: 'Belle-Ville' },
            ],
          },
          {
            id: 'ci-com-beoumi',
            name: 'Béoumi',
            cities: [{ id: 'ci-cit-beoumi-c', name: 'Béoumi Centre' }],
          },
          {
            id: 'ci-com-sakassou',
            name: 'Sakassou',
            cities: [{ id: 'ci-cit-sakassou-c', name: 'Sakassou Centre' }],
          },
        ],
      },
      {
        id: 'ci-san-pedro',
        name: 'San-Pédro',
        communes: [
          {
            id: 'ci-com-sp',
            name: 'San-Pédro',
            cities: [
              { id: 'ci-cit-sp-cite', name: 'Cité San-Pédro' },
              { id: 'ci-cit-sp-bardot', name: 'Bardot' },
              { id: 'ci-cit-sp-port', name: 'Zone Portuaire' },
            ],
          },
          {
            id: 'ci-com-sassandra',
            name: 'Sassandra',
            cities: [{ id: 'ci-cit-sassandra-c', name: 'Sassandra Centre' }],
          },
        ],
      },
      {
        id: 'ci-poro',
        name: 'Poro (Korhogo)',
        communes: [
          {
            id: 'ci-com-korhogo',
            name: 'Korhogo',
            cities: [
              { id: 'ci-cit-khg-centre', name: 'Korhogo Centre' },
              { id: 'ci-cit-khg-sinistre', name: 'Sinistré / Petit Paris' },
            ],
          },
          {
            id: 'ci-com-ferke',
            name: 'Ferkessédougou',
            cities: [{ id: 'ci-cit-ferke-c', name: 'Ferké Centre' }],
          },
        ],
      },
      {
        id: 'ci-haut-sassandra',
        name: 'Haut-Sassandra (Daloa)',
        communes: [
          {
            id: 'ci-com-daloa',
            name: 'Daloa',
            cities: [
              { id: 'ci-cit-daloa-c', name: 'Daloa Centre' },
              { id: 'ci-cit-lobia', name: 'Lobia / Tazibouo' },
            ],
          },
          {
            id: 'ci-com-issia',
            name: 'Issia',
            cities: [{ id: 'ci-cit-issia-c', name: 'Issia Centre' }],
          },
        ],
      },
    ],
  },

  // 3. SÉNÉGAL (SN)
  {
    code: 'SN',
    name: 'Sénégal',
    dialCode: '+221',
    flag: '🇸🇳',
    departments: [
      {
        id: 'sn-dakar',
        name: 'Région de Dakar',
        communes: [
          {
            id: 'sn-com-dakar-plateau',
            name: 'Dakar-Plateau / Médina',
            cities: [
              { id: 'sn-cit-plateau', name: 'Plateau Centre' },
              { id: 'sn-cit-medina', name: 'Médina' },
              { id: 'sn-cit-gueule-tapee', name: 'Gueule Tapée / Fass' },
            ],
          },
          {
            id: 'sn-com-almadies',
            name: 'Les Almadies',
            cities: [
              { id: 'sn-cit-almadies-p', name: 'Pointe des Almadies' },
              { id: 'sn-cit-ngor', name: 'Ngor' },
              { id: 'sn-cit-ouakam', name: 'Ouakam' },
              { id: 'sn-cit-yoff', name: 'Yoff' },
            ],
          },
          {
            id: 'sn-com-grand-dakar',
            name: 'Grand Dakar',
            cities: [
              { id: 'sn-cit-mermoz', name: 'Mermoz / Sacré-Cœur' },
              { id: 'sn-cit-liberte', name: 'Sicap Liberté (1 à 6)' },
              { id: 'sn-cit-dieuppeul', name: 'Dieuppeul-Derklé' },
            ],
          },
          {
            id: 'sn-com-parcelles',
            name: 'Parcelles Assainies',
            cities: [
              { id: 'sn-cit-pa-unites', name: 'Unités 1 à 26' },
              { id: 'sn-cit-grand-medine', name: 'Grand Médine' },
            ],
          },
          {
            id: 'sn-com-guediawaye',
            name: 'Guédiawaye',
            cities: [
              { id: 'sn-cit-golf-sud', name: 'Golf Sud' },
              { id: 'sn-cit-sam-notaire', name: 'Sam Notaire' },
              { id: 'sn-cit-wakhinane', name: 'Wakhinane Nimzatt' },
            ],
          },
          {
            id: 'sn-com-pikine',
            name: 'Pikine',
            cities: [
              { id: 'sn-cit-pikine-nord', name: 'Pikine Nord' },
              { id: 'sn-cit-thiaroye', name: 'Thiaroye' },
              { id: 'sn-cit-keur-massar', name: 'Keur Massar' },
            ],
          },
          {
            id: 'sn-com-rufisque',
            name: 'Rufisque',
            cities: [
              { id: 'sn-cit-rufisque-c', name: 'Rufisque Ville' },
              { id: 'sn-cit-diamniadio', name: 'Diamniadio Pôle Urbain' },
              { id: 'sn-cit-bargny', name: 'Bargny' },
            ],
          },
        ],
      },
      {
        id: 'sn-thies',
        name: 'Région de Thiès',
        communes: [
          {
            id: 'sn-com-thies-ville',
            name: 'Thiès Ville',
            cities: [
              { id: 'sn-cit-thies-nord', name: 'Thiès Nord' },
              { id: 'sn-cit-thies-est', name: 'Thiès Est' },
              { id: 'sn-cit-thies-ouest', name: 'Thiès Ouest' },
            ],
          },
          {
            id: 'sn-com-mbour',
            name: 'Mbour / Petite Côte',
            cities: [
              { id: 'sn-cit-mbour-c', name: 'Mbour Centre' },
              { id: 'sn-cit-saly', name: 'Saly Portudal' },
              { id: 'sn-cit-somone', name: 'Somone' },
            ],
          },
          {
            id: 'sn-com-tivaouane',
            name: 'Tivaouane',
            cities: [{ id: 'sn-cit-tiv-c', name: 'Tivaouane Centre' }],
          },
        ],
      },
      {
        id: 'sn-saint-louis',
        name: 'Région de Saint-Louis',
        communes: [
          {
            id: 'sn-com-sl-ville',
            name: 'Saint-Louis',
            cities: [
              { id: 'sn-cit-ile-sl', name: 'Île de Saint-Louis' },
              { id: 'sn-cit-sor', name: 'Sor' },
            ],
          },
        ],
      },
    ],
  },

  // 4. TOGO (TG)
  {
    code: 'TG',
    name: 'Togo',
    dialCode: '+228',
    flag: '🇹🇬',
    departments: [
      {
        id: 'tg-maritime',
        name: 'Région Maritime (Grand Lomé)',
        communes: [
          {
            id: 'tg-com-golfe',
            name: 'Préfecture du Golfe (Lomé)',
            cities: [
              { id: 'tg-cit-golfe1', name: 'Golfe 1 (Bè Afédomé, Bè-Kpota)' },
              { id: 'tg-cit-golfe2', name: 'Golfe 2 (Tokoin, Hédzranawoé)' },
              { id: 'tg-cit-golfe3', name: 'Golfe 3 (Doumasséssé, Tokoin Ouest)' },
              { id: 'tg-cit-golfe4', name: 'Golfe 4 (Nyékonakpoè, Kodjoviakopé)' },
              { id: 'tg-cit-golfe5', name: 'Golfe 5 (Aflao Gakli, Totsi)' },
              { id: 'tg-cit-golfe6', name: 'Golfe 6 (Baguida, Dévikinmé)' },
              { id: 'tg-cit-golfe7', name: 'Golfe 7 (Aflao Sagbado)' },
            ],
          },
          {
            id: 'tg-com-agoe',
            name: 'Préfecture d’Agoè-Nyivé',
            cities: [
              { id: 'tg-cit-agoe1', name: 'Agoè-Nyivé 1 (Centre, Cacaveli)' },
              { id: 'tg-cit-agoe2', name: 'Agoè-Nyivé 2 (Legbassito)' },
              { id: 'tg-cit-agoe3', name: 'Agoè-Nyivé 3 (Vakpossito)' },
            ],
          },
          {
            id: 'tg-com-tsevie',
            name: 'Tsévié (Zio)',
            cities: [{ id: 'tg-cit-tsevie-c', name: 'Tsévié Ville' }],
          },
          {
            id: 'tg-com-aneho',
            name: 'Aného (Lacs)',
            cities: [{ id: 'tg-cit-aneho-c', name: 'Aného Centre' }],
          },
        ],
      },
      {
        id: 'tg-plateaux',
        name: 'Région des Plateaux',
        communes: [
          {
            id: 'tg-com-kpalime',
            name: 'Kpalimé (Kloto)',
            cities: [{ id: 'tg-cit-kpalime-c', name: 'Kpalimé Centre' }],
          },
          {
            id: 'tg-com-atakpame',
            name: 'Atakpamé (Ogou)',
            cities: [{ id: 'tg-cit-atakpame-c', name: 'Atakpamé Centre' }],
          },
        ],
      },
      {
        id: 'tg-centrale',
        name: 'Région Centrale',
        communes: [
          {
            id: 'tg-com-sokode',
            name: 'Sokodé (Tchaoudjo)',
            cities: [{ id: 'tg-cit-sokode-c', name: 'Sokodé Centre' }],
          },
        ],
      },
      {
        id: 'tg-kara',
        name: 'Région de la Kara',
        communes: [
          {
            id: 'tg-com-kara',
            name: 'Kara (Kozah)',
            cities: [{ id: 'tg-cit-kara-c', name: 'Kara Centre' }],
          },
        ],
      },
    ],
  },

  // 5. CAMEROUN (CM)
  {
    code: 'CM',
    name: 'Cameroun',
    dialCode: '+237',
    flag: '🇨🇲',
    departments: [
      {
        id: 'cm-centre',
        name: 'Région du Centre (Yaoundé)',
        communes: [
          {
            id: 'cm-com-yaounde',
            name: 'Communauté Urbaine de Yaoundé',
            cities: [
              { id: 'cm-cit-yde1', name: 'Yaoundé 1er (Nlongkak, Bastos)' },
              { id: 'cm-cit-yde2', name: 'Yaoundé 2e (Tsinga, Mokolo)' },
              { id: 'cm-cit-yde3', name: 'Yaoundé 3e (Efoulan, Nsam)' },
              { id: 'cm-cit-yde4', name: 'Yaoundé 4e (Ekounou, Mimboman)' },
              { id: 'cm-cit-yde5', name: 'Yaoundé 5e (Essos, Ngousso)' },
              { id: 'cm-cit-yde6', name: 'Yaoundé 6e (Biyem-Assi, Mendong)' },
              { id: 'cm-cit-yde7', name: 'Yaoundé 7e (Nkolbisson)' },
            ],
          },
        ],
      },
      {
        id: 'cm-littoral',
        name: 'Région du Littoral (Douala)',
        communes: [
          {
            id: 'cm-com-douala',
            name: 'Communauté Urbaine de Douala',
            cities: [
              { id: 'cm-cit-dla1', name: 'Douala 1er (Bonanjo, Akwa)' },
              { id: 'cm-cit-dla2', name: 'Douala 2e (New-Bell, Babylone)' },
              { id: 'cm-cit-dla3', name: 'Douala 3e (Logbaba, Ndokoti)' },
              { id: 'cm-cit-dla4', name: 'Douala 4e (Bonabéri)' },
              { id: 'cm-cit-dla5', name: 'Douala 5e (Bonamoussadi, Makepe)' },
            ],
          },
        ],
      },
      {
        id: 'cm-ouest',
        name: 'Région de l’Ouest',
        communes: [
          {
            id: 'cm-com-bafoussam',
            name: 'Bafoussam',
            cities: [{ id: 'cm-cit-baf-c', name: 'Bafoussam Centre' }],
          },
        ],
      },
    ],
  },

  // 6. BURKINA FASO (BF)
  {
    code: 'BF',
    name: 'Burkina Faso',
    dialCode: '+226',
    flag: '🇧🇫',
    departments: [
      {
        id: 'bf-centre',
        name: 'Région du Centre (Kadiogo)',
        communes: [
          {
            id: 'bf-com-ouaga',
            name: 'Ouagadougou',
            cities: [
              { id: 'bf-cit-ouaga-c', name: 'Ouagadougou Centre' },
              { id: 'bf-cit-ouaga-2000', name: 'Ouaga 2000' },
              { id: 'bf-cit-gounghin', name: 'Gounghin / Koulouba' },
              { id: 'bf-cit-karpala', name: 'Karpala / Rayongo' },
            ],
          },
        ],
      },
      {
        id: 'bf-hauts-bassins',
        name: 'Région des Hauts-Bassins',
        communes: [
          {
            id: 'bf-com-bobo',
            name: 'Bobo-Dioulasso',
            cities: [{ id: 'bf-cit-bobo-c', name: 'Bobo-Dioulasso Centre' }],
          },
        ],
      },
    ],
  },

  // 7. MALI (ML)
  {
    code: 'ML',
    name: 'Mali',
    dialCode: '+223',
    flag: '🇲🇱',
    departments: [
      {
        id: 'ml-bamako',
        name: 'District de Bamako',
        communes: [
          {
            id: 'ml-com-bamako',
            name: 'Communes de Bamako (I à VI)',
            cities: [
              { id: 'ml-cit-com1', name: 'Commune I (Korofina, Djélibougou)' },
              { id: 'ml-cit-com2', name: 'Commune II (Médina-Coura, Bozola)' },
              { id: 'ml-cit-com3', name: 'Commune III (Centre Commercial, Badialan)' },
              { id: 'ml-cit-com4', name: 'Commune IV (Hamdallaye, Lafiabougou)' },
              { id: 'ml-cit-com5', name: 'Commune V (Badalabougou, Baco-Djicoroni)' },
              { id: 'ml-cit-com6', name: 'Commune VI (Faladié, Sogoniko)' },
            ],
          },
        ],
      },
    ],
  },

  // 8. GUINÉE (GN)
  {
    code: 'GN',
    name: 'Guinée',
    dialCode: '+224',
    flag: '🇬🇳',
    departments: [
      {
        id: 'gn-conakry',
        name: 'Région Spéciale de Conakry',
        communes: [
          {
            id: 'gn-com-kaloum',
            name: 'Kaloum',
            cities: [{ id: 'gn-cit-kaloum-c', name: 'Kaloum Centre' }],
          },
          {
            id: 'gn-com-dixinn',
            name: 'Dixinn',
            cities: [{ id: 'gn-cit-dixinn-c', name: 'Dixinn Centre / Minière' }],
          },
          {
            id: 'gn-com-matam',
            name: 'Matam',
            cities: [{ id: 'gn-cit-matam-c', name: 'Matam Centre' }],
          },
          {
            id: 'gn-com-ratoma',
            name: 'Ratoma',
            cities: [{ id: 'gn-cit-ratoma-kipé', name: 'Kipé / Lambanyi / Taouyah' }],
          },
          {
            id: 'gn-com-matoto',
            name: 'Matoto',
            cities: [{ id: 'gn-cit-matoto-c', name: 'Matoto Centre / Entag' }],
          },
        ],
      },
    ],
  },

  // 9. GABON (GA)
  {
    code: 'GA',
    name: 'Gabon',
    dialCode: '+241',
    flag: '🇬🇦',
    departments: [
      {
        id: 'ga-estuaire',
        name: 'Province de l’Estuaire',
        communes: [
          {
            id: 'ga-com-libreville',
            name: 'Libreville',
            cities: [
              { id: 'ga-cit-centre-ville', name: 'Centre-Ville / Bord de Mer' },
              { id: 'ga-cit-akanda', name: 'Akanda / Angondjé' },
              { id: 'ga-cit-owendo', name: 'Owendo' },
              { id: 'ga-cit-louis', name: 'Quartier Louis' },
            ],
          },
        ],
      },
    ],
  },

  // 10. CONGO RDC (CD)
  {
    code: 'CD',
    name: 'RD Congo',
    dialCode: '+243',
    flag: '🇨🇩',
    departments: [
      {
        id: 'cd-kinshasa',
        name: 'Ville-Province de Kinshasa',
        communes: [
          {
            id: 'cd-com-gombe',
            name: 'Gombe',
            cities: [{ id: 'cd-cit-gombe-c', name: 'Gombe Centre Administratif' }],
          },
          {
            id: 'cd-com-lingwala',
            name: 'Lingwala / Kintambo',
            cities: [{ id: 'cd-cit-kintambo-c', name: 'Kintambo Magasin' }],
          },
          {
            id: 'cd-com-ngaliema',
            name: 'Ngaliema',
            cities: [{ id: 'cd-cit-ma-campagne', name: 'Ma Campagne / Binza' }],
          },
          {
            id: 'cd-com-lemba',
            name: 'Lemba / Matete',
            cities: [{ id: 'cd-cit-lemba-c', name: 'Lemba Échangeur' }],
          },
        ],
      },
    ],
  },
];

// Helper functions for easy lookup
export function findCountry(codeOrName: string): GeoCountry | undefined {
  if (!codeOrName) return undefined;
  const target = codeOrName.trim().toUpperCase();
  return GEO_DATA.find(
    (c) => c.code.toUpperCase() === target || c.name.toUpperCase() === target
  );
}

export function getDialCodeForCountry(countryCode: string): string {
  const c = findCountry(countryCode);
  return c ? c.dialCode : '+225';
}
