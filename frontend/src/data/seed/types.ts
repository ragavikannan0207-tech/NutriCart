import type { Category, DietType, Product } from '@/types';


export interface ProductSeed {
  id: number;
  code: string;
  name: string;
  category: Category;
  secondaryCategories?: Category[];
  price: number;
  mrp?: number;
  unit: string;
  packSize: number;
  packUnit: Product['packUnit'];
  nutritionBasis: string;
  description: string;
  rating: number;
  reviewCount: number;
  availability?: Product['availability'];
  stockCount?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  dietType: DietType;
  tags: string[];
  keywords: string[];
  healthyBenefits: string[];
  relatedCodes?: string[];
  alternativeCodes?: string[];
  isNew?: boolean;
  isBestseller?: boolean;
}
