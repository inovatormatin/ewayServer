const express = require("express");
const fetchuser = require("../middleware/fetchuser");
const requireAdmin = require("../middleware/requireAdmin");
const { body } = require("express-validator");
router = express.Router();
const { getallblogs, getblogbyid, addblog, updateblog, deleteblog } = require("../controllers/blogRoutes");

// get all blogs
router.get("/getallblogs", getallblogs);

// get all blog by ID
router.get(
    "/getblogbyid",
    fetchuser,
    getblogbyid
);

// Create new blog (admin required)
router.post(
    "/addblog",
    fetchuser,
    requireAdmin,
    body("title", "Title is required").exists(),
    body("description", "Description should be more then 20 letter").isLength({
        min: 20,
    }),
    body("img", "Image is required").exists(),
    body("author", "Author name is required").exists(),
    addblog
);

// updating blog
router.put(
    '/updateblog/:id',
    fetchuser,
    requireAdmin,
    updateblog
)

// delete blog
router.delete(
    '/deleteblog/:id',
    fetchuser,
    requireAdmin,
    deleteblog
)

module.exports = router;