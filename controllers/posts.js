const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require("../models/Like");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id }).populate('likes').sort({ createdAt: "desc" });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().populate('likes').sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
      .populate('user')
      .populate('likes')  
      .populate({ path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments' } } } } } } } } } });

      const comments = post.comments

      console.log(comments)
      
      res.render("post.ejs", { post: post, user: req.user, comments: comments });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      const obj = {
        user: req.user.id,
        post: req.params.id
      }
      if ((await Like.deleteOne(obj)).deletedCount) {
        console.log("Likes -1");
        return res.redirect('back');  
      }
      await Like.create(obj);
      console.log("Likes +1");
      res.redirect('back');
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id }).populate({ path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments', populate: { path: 'comments' } } } } } } } } } });;
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db

      const commentIds = []
      const comments = post.comments
      while (comments.length) {
        const comment = comments.pop()
        comments.push(...comment.comments)
        commentIds.push(comment.id)
      }
      await Comment.deleteMany({ _id: { $in: commentIds } })
      await Like.deleteMany({ post: req.params.id })
      await Post.deleteOne({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      console.error(err)
      res.redirect("/profile");
    }
  },
};
