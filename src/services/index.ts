/**
 * Point d'entrée centralisé pour tous les services
 */
export { default as api } from './api';
export { default as authService } from './authService';
export { default as documentService } from './documentService';
export { default as folderService } from './folderService';
export { default as userService } from './userService';
export { default as tagService } from './tagService';
export { default as shareService } from './shareService';
export { default as categoryService } from './categoryService';
export { default as courrierService } from './courrierService';
export { default as circuitAffectationService } from './circuitAffectationService';

// Export des types
export type { DocumentFilters, PaginatedResponse } from './documentService';
export type { CreateShareData, CreateShareRequestData } from './shareService';

// Export des hooks
export * from './documentHooks';
export * from './userHooks';
export * from './categoryHooks';
