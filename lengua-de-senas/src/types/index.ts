export interface SignDefinition {
  letter: string;
  name: string;
  description: string;
  viewBox: string; // e.g. "0 0 100 130"
  outerPath: string; // closed outer contour
  innerPaths: string[]; // detail engraving paths
  width: number;
  height: number;
  wristAnchor: [number, number]; // [startX, endX] at y = height
}

export type LaserCutMode = 'organic_contour' | 'keychain' | 'silhouette' | 'plaque';

export interface LaserConfig {
  mode: LaserCutMode;
  targetHeightMm: number; // e.g. 40 mm
  contourOffsetMm: number; // e.g. 5 mm (desfase exterior del llavero orgánico)
  baseBarHeightMm: number; // e.g. 10 mm
  addKeychainHole: boolean; // true/false
  holeDiameterMm: number; // e.g. 4 mm
  includeTextEngraving: boolean; // engrave latin text under signs
  includeBranding: boolean; // engrave MakerBox / UTalca
  signSpacingMm: number; // spacing between signs in mm (default 3mm)
  materialThicknessMm: number; // e.g. 3 mm (MDF/Acrílico)
  cutStrokeColor: string; // #FF0000 (standard Lightburn/RDWorks cut)
  engraveStrokeColor: string; // #0000FF (standard vector score)
  engraveFillColor: string; // #000000 (raster engrave)
}

export interface GeneratedLaserSvg {
  svgString: string;
  widthMm: number;
  heightMm: number;
  signCount: number;
  estimatedCutLengthMm: number;
}
