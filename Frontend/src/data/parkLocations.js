
export const PARK_CENTER = { lat: 8.45, lng: 80.02 }
export const PARK_DEFAULT_ZOOM = 11

export const LOCATION_CATEGORIES = {
  hotspot: { label: 'Species hotspot', color: '#dc2626' }, // red-600
  entrance: { label: 'Entrance', color: '#954f2c' }, // clay-500
  camp: { label: 'Campsite / bungalow', color: '#4a3a2e' }, // bark-500
}

export const PARK_LOCATIONS = [
  {
    id: 'hunuwilagama-entrance',
    name: 'Hunuwilagama Entrance',
    category: 'entrance',
    lat: 8.4103,
    lng: 80.0537,
    notes: 'Main park entrance and ticketing office.',
  },
  {
    id: 'maha-villu',
    name: 'Maha Villu',
    category: 'hotspot',
    speciesSlugs: ['water-buffalo', 'asian-elephant'],
    lat: 8.4602,
    lng: 80.0179,
    notes: 'One of the larger natural lakes — reliable spot for waterbirds and grazing herbivores.',
  },
  {
    id: 'tala-wila',
    name: 'Tala Wila',
    category: 'hotspot',
    speciesSlugs: ['asian-elephant', 'wild-boar'],
    lat: 8.5183,
    lng: 79.9822,
    notes: 'Northern villu, quieter track with good elephant sightings in the dry season.',
  },
  {
    id: 'kokkari-villu',
    name: 'Kokkari Villu',
    category: 'hotspot',
    speciesSlugs: ['crested-serpent-eagle', 'mugger-crocodile'],
    lat: 8.4021,
    lng: 80.0605,
    notes: 'Frequently visited villu near the main loop road, good for raptors and waterbirds.',
  },
  {
    id: 'panikkar-villu',
    name: 'Panikkar Villu',
    category: 'hotspot',
    speciesSlugs: ['sri-lankan-leopard', 'spotted-deer'],
    lat: 8.4711,
    lng: 80.0012,
    notes: 'Known leopard sighting area, especially early morning.',
  },
  {
    id: 'kudiramalai-point',
    name: 'Kudiramalai Point',
    category: 'hotspot',
    speciesSlugs: ['mugger-crocodile', 'fishing-cat'],
    lat: 8.3204,
    lng: 79.8536,
    notes: 'Coastal viewpoint at the park\u2019s western edge.',
  },
  {
    id: 'maradanmaduwa',
    name: 'Maradanmaduwa',
    category: 'hotspot',
    speciesSlugs: ['golden-jackal', 'sambar-deer'],
    lat: 8.4885,
    lng: 80.0421,
    notes: 'Open scrubland area — jackals frequently heard at dusk, sambar near the tree line.',
  },
  {
    id: 'kokmotai-villu',
    name: 'Kokmotai Villu',
    category: 'hotspot',
    speciesSlugs: ['sloth-bear', 'sri-lankan-grey-langur'],
    lat: 8.4453,
    lng: 79.9654,
    notes: 'Dense forest edge villu — sloth bear activity around termite mounds, langur troops overhead.',
  },
  {
    id: 'nelum-wila',
    name: 'Nelum Wila',
    category: 'hotspot',
    speciesSlugs: ['sri-lankan-jungle-fowl', 'sri-lankan-peacock'],
    lat: 8.3892,
    lng: 80.0287,
    notes: 'Lotus-covered villu with good ground-bird activity in the early morning.',
  },
  {
    id: 'manikapola-uttu',
    name: 'Manikapola Uttu',
    category: 'hotspot',
    speciesSlugs: ['bengal-monitor-lizard', 'spotted-deer'],
    lat: 8.5029,
    lng: 79.9938,
    notes: 'Sandy clearing along the loop road — monitors regularly seen basking near the track.',
  },
  {
    id: 'park-bungalow',
    name: 'Wilpattu Bungalow',
    category: 'camp',
    lat: 8.4315,
    lng: 80.0298,
    notes: 'Department of Wildlife Conservation bungalow — book in advance.',
  },
]
