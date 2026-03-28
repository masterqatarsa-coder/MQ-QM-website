import serviceAutomation from "@/assets/door8.png";
import serviceElv from "@/assets/service-elv.jpg";
import serviceFacility from "@/assets/service-fm.jpg";
import serviceMep from "@/assets/service-mep.jpg";
import mepElectricalWorksImg from "@/assets/MEP/electrical-works.jpg";
import mepFireFightingImg from "@/assets/MEP/fire-fighting.jpg";
import mepHvacImg from "@/assets/MEP/hvac.jpg";
import mepOverviewImg from "@/assets/MEP/mep-sector.jpg";
import mepPlumbingImg from "@/assets/MEP/plumbing.jpg";
import elvAccessControlImg from "@/assets/ELV/accesscontrollsystem.jpeg";
import elvAirflowControlImg from "@/assets/ELV/airflow-control-system.jpg";
import elvBmsImg from "@/assets/ELV/bms1.jpeg";
import elvHomeAutomationImg from "@/assets/ELV/homeautomation.jpeg";
import elvLightingControlImg from "@/assets/ELV/lighting-controll-system.jpg";
import elvPublicAddressImg from "@/assets/ELV/public-address-system.jpg";
import elvRoomPressureImg from "@/assets/ELV/rpms.jpeg";
import elvSecurityImg from "@/assets/ELV/security.jpg";
import elvStructuredCableImg from "@/assets/ELV/structured-cable-solution.jpg";
import automationSlidingDoorImg from "@/assets/doors5.jpg";
import automationSwingDoorImg from "@/assets/doors6.jpg";
import automationRevolvingDoorImg from "@/assets/doors7.jpg";
import automationRollerShutterImg from "@/assets/door8.png";
import automationHighSpeedDoorImg from "@/assets/doors9.jpg";
import productAcousticLouvers from "@/assets/acoustic-louvers.jpg";
import productCeilingDiffusers from "@/assets/ceiling-diffusers.jpg";
import productConstantAirVolume from "@/assets/constant-air-volume.jpg";
import productDiscValves from "@/assets/disc-valves.jpg";
import productFireDampers from "@/assets/fire-dampers.jpg";
import productFreshAirLouvers from "@/assets/fresh-air-louvers.jpg";
import productGrilles from "@/assets/grilles.jpg";
import productJetDiffusers from "@/assets/jet-diffusers.jpg";
import productLinearDiffusers from "@/assets/linear-diffusers.jpg";
import productLinearSlotDiffusers from "@/assets/linear-slot-diffusers.jpg";
import productNonReturnDampers from "@/assets/non-return-damper-1000x1000.png";
import productPressureReliefDampers from "@/assets/pressure-relief-dampers.jpg";
import projectAirport from "@/assets/project-airport.jpg";
import projectHotel from "@/assets/project-hotel.jpg";
import projectRailway from "@/assets/project-railway.jpg";
import projectStadium from "@/assets/project-stadium.jpg";
import productRegisters from "@/assets/registers.jpg";
import productRoundCeilingDiffusers from "@/assets/round-ceiling-diffusers.jpg";
import productSandTrapLouvers from "@/assets/sand-trap-louvers.jpg";
import productSoundAttenuators from "@/assets/sound-attenuators.jpg";
import productSwirlDiffusers from "@/assets/swirl-diffusers.jpg";
import productVariableAirVolume from "@/assets/variable-air-volume.jpg";
import productVolumeControlDamper from "@/assets/volume-control-damper.jpg";
import type { ContentItem, ContentType } from "@/lib/cmsApi";

type PartialContent = Pick<ContentItem, "type" | "title" | "slug" | "imageUrl" | "metadata">;

const certificateModules = import.meta.glob("../assets/certificate/*.{jpg,jpeg,png,JPG,JPEG,PNG}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const projectModules = import.meta.glob("../assets/projects/*.{jpg,jpeg,png,JPG,JPEG,PNG}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const clientLogoModules = import.meta.glob("../assets/c*.{jpg,jpeg,png,JPG,JPEG,PNG}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const nestedClientLogoModules = import.meta.glob("../assets/client-logo/c*.{jpg,jpeg,png,JPG,JPEG,PNG}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function fileNameFromPath(path: string): string {
  return path.split("/").pop() || path;
}

function isNumericClientLogoPath(path: string): boolean {
  return /^c\d+\.(jpg|jpeg|png)$/i.test(fileNameFromPath(path));
}

function valuesSortedByName(
  modules: Record<string, string>,
  filter?: (path: string) => boolean,
): string[] {
  return Object.entries(modules)
    .filter(([path]) => (filter ? filter(path) : true))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, url]) => url);
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

const certificateImages = valuesSortedByName(certificateModules);
const projectImages = valuesSortedByName(projectModules);
const clientImages = uniqueValues([
  ...valuesSortedByName(clientLogoModules, isNumericClientLogoPath),
  ...valuesSortedByName(nestedClientLogoModules, isNumericClientLogoPath),
]);
const serviceProductAssetMap: Record<string, string[]> = {
  mep: [
    mepOverviewImg,
    mepElectricalWorksImg,
    mepPlumbingImg,
    mepHvacImg,
    mepFireFightingImg,
  ],
  elv: [
    elvBmsImg,
    elvAccessControlImg,
    elvSecurityImg,
    elvLightingControlImg,
    elvPublicAddressImg,
    elvStructuredCableImg,
    elvHomeAutomationImg,
    elvAirflowControlImg,
    elvRoomPressureImg,
  ],
  automation: [
    automationSlidingDoorImg,
    automationSwingDoorImg,
    automationRevolvingDoorImg,
    automationRollerShutterImg,
    automationHighSpeedDoorImg,
  ],
  trading: [
    productFreshAirLouvers,
    productVolumeControlDamper,
    productNonReturnDampers,
    productAcousticLouvers,
    productSoundAttenuators,
    productPressureReliefDampers,
    productConstantAirVolume,
    productSandTrapLouvers,
    productLinearSlotDiffusers,
    productRoundCeilingDiffusers,
    productSwirlDiffusers,
    productJetDiffusers,
    productCeilingDiffusers,
    productLinearDiffusers,
    productRegisters,
    productGrilles,
    productVariableAirVolume,
    productFireDampers,
    productDiscValves,
  ],
};

const serviceProductTitleMap: Record<string, string> = {
  "mep sector overview": mepOverviewImg,
  "electrical works": mepElectricalWorksImg,
  "plumbing systems": mepPlumbingImg,
  "hvac systems": mepHvacImg,
  "fire fighting systems": mepFireFightingImg,
  "building management systems (bms)": elvBmsImg,
  "access control systems": elvAccessControlImg,
  "security & surveillance": elvSecurityImg,
  "lighting control systems": elvLightingControlImg,
  "public address systems": elvPublicAddressImg,
  "structured cable solutions": elvStructuredCableImg,
  "home automation": elvHomeAutomationImg,
  "airflow control systems": elvAirflowControlImg,
  "room pressure monitoring systems": elvRoomPressureImg,
  "automatic sliding doors": automationSlidingDoorImg,
  "automatic swing doors": automationSwingDoorImg,
  "revolving doors": automationRevolvingDoorImg,
  "roller shutters": automationRollerShutterImg,
  "high-speed doors": automationHighSpeedDoorImg,
  "fresh air louvers": productFreshAirLouvers,
  "volume control damper": productVolumeControlDamper,
  "non return dampers": productNonReturnDampers,
  "acoustic louvers": productAcousticLouvers,
  "sound attenuators": productSoundAttenuators,
  "pressure relief dampers": productPressureReliefDampers,
  "constant air volume (cav)": productConstantAirVolume,
  "sand trap louvers": productSandTrapLouvers,
  "linear slot diffusers": productLinearSlotDiffusers,
  "round ceiling diffusers": productRoundCeilingDiffusers,
  "swirl diffusers": productSwirlDiffusers,
  "jet diffusers": productJetDiffusers,
  "ceiling diffusers": productCeilingDiffusers,
  "linear diffusers": productLinearDiffusers,
  "registers": productRegisters,
  "grilles": productGrilles,
  "variable air volume (vav)": productVariableAirVolume,
  "fire dampers": productFireDampers,
  "disc valves": productDiscValves,
};

function numericMetadata(item: PartialContent, key: string): number | null {
  const value = item.metadata?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function indexedAsset(images: string[], index: number | null): string | null {
  if (index === null || images.length === 0) {
    return null;
  }

  const safeIndex = Math.max(0, Math.min(images.length - 1, index - 1));
  return images[safeIndex] || null;
}

function serviceFallback(item: PartialContent): string | null {
  const key = `${normalize(item.slug)} ${normalize(item.title)}`;

  if (key.includes("mep")) {
    return serviceMep;
  }
  if (key.includes("elv")) {
    return serviceElv;
  }
  if (key.includes("automation")) {
    return serviceAutomation;
  }
  if (key.includes("facility") || key.includes("fm")) {
    return serviceFacility;
  }

  return serviceMep;
}

function projectFallback(item: PartialContent, index?: number): string | null {
  const key = `${normalize(item.slug)} ${normalize(item.title)}`;

  if (key.includes("airport")) {
    return projectAirport;
  }
  if (key.includes("stadium")) {
    return projectStadium;
  }
  if (key.includes("hotel")) {
    return projectHotel;
  }
  if (key.includes("rail")) {
    return projectRailway;
  }

  return projectImages[index || 0] || projectAirport;
}

function serviceProductServiceKey(item: PartialContent): keyof typeof serviceProductAssetMap {
  const metadataService =
    typeof item.metadata?.service === "string" ? normalize(item.metadata.service) : "";
  const key = `${metadataService} ${normalize(item.slug)} ${normalize(item.title)}`;

  if (key.includes("mep")) {
    return "mep";
  }
  if (key.includes("elv")) {
    return "elv";
  }
  if (key.includes("automation") || key.includes("door")) {
    return "automation";
  }

  return "trading";
}

function serviceProductFallback(item: PartialContent): string | null {
  const titleKey = normalize(item.title);
  const directMatch = serviceProductTitleMap[titleKey];
  if (directMatch) {
    return directMatch;
  }

  const serviceKey = serviceProductServiceKey(item);
  const serviceAssets = serviceProductAssetMap[serviceKey];
  const byIndex = indexedAsset(serviceAssets, numericMetadata(item, "assetIndex"));
  if (byIndex) {
    return byIndex;
  }

  return serviceAssets[0] || serviceMep;
}

export function resolveContentImage(item: PartialContent, index = 0): string | null {
  if (item.imageUrl) {
    return item.imageUrl;
  }

  if (item.type === "services") {
    return serviceFallback(item);
  }

  if (item.type === "service_products") {
    return serviceProductFallback(item);
  }

  if (item.type === "projects") {
    return indexedAsset(projectImages, numericMetadata(item, "assetIndex")) || projectFallback(item, index);
  }

  if (item.type === "certificates") {
    return indexedAsset(certificateImages, numericMetadata(item, "assetIndex")) || certificateImages[index] || null;
  }

  if (item.type === "clients") {
    return indexedAsset(clientImages, numericMetadata(item, "logoIndex")) || clientImages[index] || null;
  }

  if (item.type === "gallery") {
    return indexedAsset(projectImages, numericMetadata(item, "assetIndex")) || projectImages[index] || null;
  }

  return null;
}

export type ClientLogoDisplayItem = {
  key: string;
  logo: string;
  metadata: Record<string, unknown>;
  item: ContentItem | null;
  managed: boolean;
};

export function allClientLogos(): string[] {
  return clientImages;
}

export function buildClientLogoDisplayItems(items: ContentItem[]): ClientLogoDisplayItem[] {
  const managedItems = items.map((item, index) => ({
    key: `${item.id}`,
    logo: resolveContentImage(item, index) || clientImages[index % Math.max(clientImages.length, 1)] || "",
    metadata: item.metadata || {},
    item,
    managed: true,
  }));

  const usedLogos = new Set(managedItems.map((item) => item.logo).filter(Boolean));
  const fallbackItems = clientImages
    .filter((logo) => !usedLogos.has(logo))
    .map((logo, index) => ({
      key: `fallback-${index}`,
      logo,
      metadata: {},
      item: null,
      managed: false,
    }));

  return [...managedItems, ...fallbackItems];
}

export function defaultBrandName(type: "primary" | "secondary", settings: { site_name: string; secondary_brand_name: string }): string {
  return type === "primary" ? settings.site_name : settings.secondary_brand_name;
}

export function contentTypesNeedingMedia(): ContentType[] {
  return ["services", "service_products", "clients", "gallery", "projects", "certificates"];
}
