export type AnimalType = 'dog' | 'cat' | 'other';
export type AnimalSize = 'mini' | 'small' | 'medium' | 'large' | 'giant';
export type AnimalLifeStage = 'puppy' | 'junior' | 'adult' | 'senior';
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'working';

export interface PetProfile {
  id: string;
  name: string;
  animalType: AnimalType;
  breed?: string;
  dateOfBirth?: string;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  ageYears?: number;
  ageMonths?: number;
  weightKg?: number;
  photoUrl?: string;
  microchipNumber?: string;
  passportNumber?: string;
  size?: AnimalSize;
  lifeStage?: AnimalLifeStage;
  activityLevel?: ActivityLevel;
  allergies: string[];
  intolerances: string[];
  healthConditions: string[];
  chronicConditions?: { id: string; title: string; description?: string }[];
  procedures?: { id: string; title: string; date: string; notes?: string }[];
  notes?: string;
}

export interface AnalysisRequest {
  composition?: string;
  sourceType?: 'text' | 'file';
  attachment?: {
    fileName: string;
    mimeType: string;
    base64Data: string;
  };
  petProfile?: PetProfile;
}

export interface Ingredient {
  name: string;
  category: 'protein' | 'carb' | 'fat' | 'fiber' | 'additive' | 'mineral' | 'vitamin';
  percentage?: number;
  quality: 'excellent' | 'good' | 'average' | 'poor' | 'harmful';
}

export interface AllergenWarning {
  severity: 'critical' | 'high' | 'moderate';
  allergen: string;
  ingredientName: string;
  message: string;
}

export interface HealthWarning {
  severity: 'critical' | 'high' | 'moderate';
  condition: string;
  message: string;
}

export interface Recommendation {
  suitableFor: string[];
  notRecommendedFor: string[];
}

export interface PersonalizedNote {
  petName: string;
  overallVerdict: string;
  explanation: string;
}

export interface AnalysisResult {
  score: number;
  pros: string[];
  cons: string[];
  recommendation: Recommendation;
  ingredients: Ingredient[];
  summary: string;
  allergenWarnings: AllergenWarning[];
  healthWarnings: HealthWarning[];
  personalizedNote?: PersonalizedNote;
}

export interface FileExtractionResult {
  extractedText: string;
  source: 'google-vision+openai' | 'google-vision' | 'openai' | 'pdf-parser';
  contextAnalysis?: {
    documentType: string;
    confidence: 'high' | 'medium' | 'low';
    summary: string;
    keyFindings: string[];
    recommendedActions: string[];
  };
  feedAnalysis?: AnalysisResult;
}

export interface ApiError {
  error: string;
  status: number;
}
