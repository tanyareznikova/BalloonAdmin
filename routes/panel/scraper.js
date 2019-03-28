var express = require("express");
var router = express.Router();
var Product = require("../../model/product");
var Category = require("../../model/category");
var Review = require("../../model/productReview");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

/* GET home page. */
router.get("/", function(req, res, next) {
  Product.find({})
    .sort([["createdAt", -1]])
    .exec(function(err, docs) {
      var totalArticles = docs.length;
      var articleChunks = [];
      var chunkSize = 3;
      for (var i = 0; i < docs.length; i += chunkSize) {
        articleChunks.push(docs.slice(i, i + chunkSize));
      }

      res.render("../views/productScraper/shop/index", {
        title: "NYT Article Scraper",
        articles: articleChunks,
        qty: totalArticles
      });
    });
});

router.get("/saved", function(req, res, next) {
  Product.find({ isSaved: true })
    .sort([["createdAt", -1]])
    .exec(function(err, docs) {
      var totalSavedArticles = docs.length;
      var articleChunks = [];
      var chunkSize = 3;
      for (var i = 0; i < docs.length; i += chunkSize) {
        articleChunks.push(docs.slice(i, i + chunkSize));
      }

      res.render("../views/productScraper/saved/index", {
        title: "Saved",
        articles: articleChunks,
        qty: totalSavedArticles
      });
    });
});

// Clean up databased by removing unsaved articles
router.get("/delete", function(req, res, next) {
  Product.deleteMany({ isSaved: false }, function(err, data) {
    if (err) return handleError(err);
    res.redirect("/");
  });
});

router.get("/save-article/:id", function(req, res) {
  var articleId = req.params.id;
  Product.findById(articleId, function(err, article) {
    if (article.isSaved) {
      Product.findByIdAndUpdate(
        // id
        req.params.id,
        // update
        { isSaved: false, buttonStatus: "Save" },
        // options:  set 'new' to 'true' to return the modified document rather than the original
        { new: true },
        // callback
        function(err, data) {
          res.redirect("/");
        }
      );
    } else {
      Product.findByIdAndUpdate(
        // id
        req.params.id,
        // update
        { isSaved: true, buttonStatus: "Remove" },
        // option
        { new: true },
        // callback
        function(err, data) {
          res.redirect("/saved");
        }
      );
    }
  });
});

router.get("/scrape/:section", function(req, res) {
  var smartfony = req.params.smartfony;
  var sectionUrl = "";

  switch (smartfony) {
    case "all":
      sectionUrl = "https://www.citilink.ru/catalog/mobile/smartfony/";
      break;
    case "huawei":
      sectionUrl = "https://www.citilink.ru/catalog/mobile/smartfony/?available=1&status=55395790&p=1&f=1376_214HUAWEI";
      break;
    case "honor":
      sectionUrl = "https://www.citilink.ru/catalog/mobile/smartfony/?available=1&status=55395790&p=1&f=1376_214HONOR";
      break;
    case "apple":
      sectionUrl = "https://www.citilink.ru/catalog/mobile/smartfony/?available=1&status=55395790&p=1&f=1376_214APPLE";
      break;
    case "samsung":
      sectionUrl = "https://www.citilink.ru/catalog/mobile/smartfony/?available=1&status=55395790&p=1&f=1376_214SAMSUNG";
      break;
    default:
    // code block
  }
  axios.get(sectionUrl).then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    var result = {};
    $("div.js--subcategory-product-item").each(function(i, element) {
      var link = $(element)
        .find("a")
        .attr("href");
      var title = $(element)
        .find("span.h3")
        .text()
        .trim();
      /*
      var description = $(element)
        .find("div.b-product-view-about__tech-block")
        .text()
        .trim();
      var attribute = $(element)
          .find("table.b-product-view-box__tech-chars-table")
          .find("tr")
          .text()
          .trim();
          */
      var price = $(element)
          .find("ins.subcategory-product-item__price-num")
          .text()
          .trim();
      var imgUrl = $(element)
        .parent()
        .find("div.wrap-img")
        .find("img")
        .attr("src");
      var baseURL = "https://www.citilink.ru";
      result.link = baseURL + link;
      result.title = title;
      /*
      if (description) {
        result.description = description;
      }
      if (attribute) {
        result.attribute = attribute;
      }
      */
      if (price) {
        result.price = price;
      }
      if (imgUrl) {
        result.imgUrl = imgUrl;
      } else {
        result.imgUrl =
          "https://via.placeholder.com/205x137.png?text=No%20Image%20from%20NYTimes";
      }

      if (smartfony !== "all") {
        result.smartfony = smartfony;
      } else {
        result.smartfony = "Все смартфоны";
      }

      // Create a new Article using the `result` object built from scraping
      Product.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log("---------------------------");
          console.log("View the added result in the console", dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });
    console.log("Scrape Complete");
    res.redirect("/");
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
router.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Product.findOne({ _id: req.params.id })
    // ..and populate all of the comments associated with it
    .populate("productReviews")
    .then(function(dbArticle) {
      // If there are comments in the article
      var commentsToDisplay = [];

      if (dbArticle.productReviews === undefined || dbArticle.productReviews.length === 0) {
        commentsToDisplay = [
          {
            message: "Your are the first person to comment.",
            name: "N/A"
          }
        ];
      } else {
        commentsToDisplay = dbArticle.productReviews;
      }

      res.render("../views/productScraper/article/index", {
        productID: dbArticle._id,
        imgUrl: dbArticle.imgUrl,
        title: dbArticle.title,
        //description: dbArticle.description,
        //attribute: dbArticle.attribute,
        price: dbArticle.price,
        smartfony: dbArticle.smartfony,
        link: dbArticle.link,
        productReviews: commentsToDisplay,
        date: dbArticle.date,
        isSaved: dbArticle.isSaved,
        buttonStatus: dbArticle.buttonStatus
      });
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Comment
router.post("/articles/:id", function(req, res) {
  var redirectBackToArticle = `/articles/${req.params.id}`;
  var productID = req.params.id;

  // Grab the request body
  var body = req.body;
  // Each property on the body all represent our text boxes in article/index.hbs as specified by the name attribute on each of those input fields
  var res_body = {
    message: body.new_comment_body,
    name: body.new_comment_username,
    productID: productID
  };

  // Create a new note and pass the req.body to the entry
  Review.create(res_body)
    .then(function(dbComment) {
      // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated Article -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return Product.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { productReviews: dbComment._id } },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.redirect(redirectBackToArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Clean up databased by removing unsaved articles
router.get("/deletecomment/:id", function(req, res, next) {
  var productID = "";

  // Grab article Id from the database
  Review.findById({ _id: req.params.id }).exec(function(err, doc) {
    console.log(doc);
    productID = doc.productID;

    var redirectBackToArticle = `/articles/${productID}`;
    console.log(redirectBackToArticle);

    Review.deleteOne({ _id: req.params.id }, function(err, data) {
      if (err) return handleError(err);
      res.redirect(redirectBackToArticle);
    });
  });
});

module.exports = router;
