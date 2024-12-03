import { Router, Response } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types/express';

const router = Router();
const productController = new ProductController();

// Helper function to wrap controller methods
const wrapHandler = (
  handler: (req: AuthenticatedRequest, res: Response) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    return handler(req as AuthenticatedRequest, res).catch(next);
  };
};

// Public routes
router.get('/', wrapHandler(productController.getProducts));
router.get('/:id', wrapHandler(productController.getProduct));
router.get('/categories', wrapHandler(productController.getCategories));
router.get('/categories/:id', wrapHandler(productController.getCategory));
router.get('/ingredients', wrapHandler(productController.getIngredients));
router.get('/ingredients/:id', wrapHandler(productController.getIngredient));
router.get('/suppliers', wrapHandler(productController.getSuppliers));

// Protected routes
router.post('/', authenticate, wrapHandler(productController.createProduct));
router.put('/:id', authenticate, wrapHandler(productController.updateProduct));
router.delete('/:id', authenticate, wrapHandler(productController.deleteProduct));

router.post('/categories', authenticate, wrapHandler(productController.createCategory));
router.put('/categories/:id', authenticate, wrapHandler(productController.updateCategory));
router.delete('/categories/:id', authenticate, wrapHandler(productController.deleteCategory));

router.post('/ingredients', authenticate, wrapHandler(productController.createIngredient));
router.put('/ingredients/:id', authenticate, wrapHandler(productController.updateIngredient));
router.delete('/ingredients/:id', authenticate, wrapHandler(productController.deleteIngredient));

router.post('/suppliers', authenticate, wrapHandler(productController.createSupplier));
router.put('/suppliers/:id', authenticate, wrapHandler(productController.updateSupplier));
router.delete('/suppliers/:id', authenticate, wrapHandler(productController.deleteSupplier));

export { router as productRoutes };
