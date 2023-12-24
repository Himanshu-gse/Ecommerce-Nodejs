const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Product = require("../models/productModel");
const ApiFeatures = require("../utils/apiFeatures");
const ErrorHandler = require("../utils/errorHandler");

// Create Product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  req.body.user = req.user.id;
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

// Get All Products
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 8;
  const productCount = await Product.countDocuments();
  const apifeatures = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await apifeatures.query;
  let filteredProductsCount = products.length;
  apifeatures.pagination(resultPerPage);
  products = await apifeatures.query;

  res.status(200).json({
    success: true,
    products,
    productCount,
    resultPerPage,
    filteredProductsCount,
  });
});

//Update Products -- Admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  // try {
  let product = Product.findById(req.params.id);
  // if (!product) {
  //   return res.status(404),json({
  //       success: false,
  //       Message: "Product Not Found",
  //     })
  // }
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    data: product,
  });
  // } catch (err) {
  //   console.error("Error updating product:", err.message);
  //   res.status(500).json({
  //     success: false,
  //     message: "Internal Server Error",
  //   });
  // }
});

//Delete Products -- Admin
exports.deleteProduct = catchAsyncErrors(async (req, res) => {
  // try {
  const product = await Product.findById(req.params.id);

  // if (!product) {
  //   return res.status(404).json({
  //     success: false,
  //     message: 'Product Not Found',
  //   });
  // }
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    // data: product,
    message: "Product deleted successfully",
  });
  // } catch (err) {
  //   console.error("Error deleting product:", err.message);
  //   res.status(500).json({
  //     success: false,
  //     message: "Internal Server Error",
  //   });
  // }
});

// Get Single Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  // try {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  res.status(200).json({
    success: true,
    data: product,
  });
  // } catch (err) {
  //   console.error("Error deleting product:", err.message);
  //   res.status(500).json({
  //     success: false,
  //     message: "Internal Server Error",
  //   });
  // }
});

//Create new Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { productId, rating, comment } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });
  console.log(product);

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a product

exports.getProductReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
  });
});
