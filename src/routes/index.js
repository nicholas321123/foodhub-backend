const express = require("express");
const router = express.Router();

const authRoutes = require('./auth');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const restauranteRoutes = require('./restaurantes');
const favoritesRoutes = require('./favorites');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/restaurantes', restauranteRoutes);
router.use('/favorites', favoritesRoutes);

router.get("/", (req, res) => {
  res.send("API rodando!");
});

module.exports = router;
