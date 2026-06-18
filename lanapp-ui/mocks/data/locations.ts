import type { ApiLocation } from "@/lib/api/types"
import { IDS } from "../ids"

export const seedLocations: ApiLocation[] = [
  {
    id: IDS.locations.sanAlfonso,
    name: "G San Alfonso",
    address: "Riobamba, Chimborazo",
    latitude: -1.6646,
    longitude: -78.6543,
    description: "Potrero principal",
  },
  {
    id: IDS.locations.potreroNorte,
    name: "Potrero Norte",
    address: "Riobamba, Chimborazo",
    latitude: -1.6601,
    longitude: -78.6512,
    description: "Área norte",
  },
  {
    id: IDS.locations.potreroSur,
    name: "Potrero Sur",
    address: "Riobamba, Chimborazo",
    latitude: -1.6702,
    longitude: -78.6571,
    description: "Área sur",
  },
]
