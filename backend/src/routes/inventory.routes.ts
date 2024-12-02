// src/routes/inventory.routes.ts

import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';

const router = Router();
const inventoryController = new InventoryController();

// Ingredient routes
router.post('/ingredients', inventoryController.createIngredient);
router.get('/ingredients', inventoryController.getIngredients);
router.get('/ingredients/:id', inventoryController.getIngredient);
router.patch('/ingredients/:id', inventoryController.updateIngredient);
router.delete('/ingredients/:id', inventoryController.deleteIngredient);

// Product routes
router.post('/products', inventoryController.createProduct);
router.get('/products', inventoryController.getProducts);
router.get('/products/:id', inventoryController.getProduct);
router.patch('/products/:id', inventoryController.updateProduct);
router.delete('/products/:id', inventoryController.deleteProduct);

// Category routes
router.post('/categories', inventoryController.createCategory);
router.get('/categories', inventoryController.getCategories);

export { router as inventoryRoutes };
