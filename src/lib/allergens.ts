import raw from '../allergens.json';
import type { Allergen } from './types';

export const ALLERGENS: Allergen[] = raw as Allergen[];
export const byNo = new Map(ALLERGENS.map((a) => [a.no, a]));
