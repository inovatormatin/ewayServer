const express = require("express");
router = express.Router();
const { body } = require("express-validator");
const fetchuser = require("../middleware/fetchuser");
const requireAdmin = require("../middleware/requireAdmin");
const { getallproducts, addproduct, updateproduct, deleteproduct } = require("../controllers/productRoutes");
const { getReviews, addReview } = require("../controllers/reviewRoutes");

// get all products
router.get("/getallproducts", getallproducts);

// add new product
router.post(
    "/addproduct",
    fetchuser,
    requireAdmin,
    body("name", "Name is required").exists(),
    body("description", "Description should be more then 20 letter").isLength({
        min: 20,
    }),
    body("img1", "Image is required").exists(),
    body("img2", "Image is required").exists(),
    body("price", "Price is required").exists().isNumeric(),
    body("category", "Assign category").exists(),
    addproduct
);

// updating product
router.put('/updateproduct/:id', fetchuser, requireAdmin, updateproduct)

// delete product
router.delete('/deleteproduct/:id', fetchuser, requireAdmin, deleteproduct)

// get reviews for a product
router.get('/getreviews/:productId', getReviews);

// add review (auth required)
router.post(
    '/addreview/:productId',
    fetchuser,
    body('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    body('comment', 'Comment must be at least 5 characters').isLength({ min: 5 }),
    body('userName', 'User name is required').exists(),
    addReview
);

module.exports = router;