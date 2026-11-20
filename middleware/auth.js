const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  if (req.path.startsWith("/api")) return res.status(401).json({ message: "Unauthorized" });
  return res.redirect("/");
};

const ownsNote = async (req, res, next) => {
  try {
    const Note = require("../models/Note");
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.note = note;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { isAuthenticated, ownsNote };
