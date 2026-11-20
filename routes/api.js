const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const { isAuthenticated, ownsNote } = require("../middleware/auth");
const { generatePdfBuffer } = require("../utils/pdf");

function getDateRange(age) {
  const now = new Date();
  const ranges = {
    week: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 3600 * 1000),
    threeMonths: new Date(now.getTime() - 90 * 24 * 3600 * 1000),
  };
  return ranges[age];
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHighlighter(search) {
  if (!search) return null;
  const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${safeSearch})`, "ig");
  return (title) => escapeHtml(title).replace(re, "<mark>$1</mark>");
}

router.get("/notes", isAuthenticated, async (req, res) => {
  try {
    const { age, search, page = 1 } = req.query;
    const limit = 20;
    const filter = { userId: req.user._id };

    if (age === "archive") {
      filter.archived = true;
    } else {
      filter.archived = false;
      const from = getDateRange(age);
      if (from) filter.createdAt = { $gte: from };
    }

    if (search) filter.title = { $regex: search, $options: "i" };

    const highlightFn = buildHighlighter(search);
    const total = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const items = notes.map((n) => ({
      ...n,
      highlights: highlightFn ? highlightFn(n.title) : undefined,
    }));

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/notes", isAuthenticated, async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    const note = await Note.create({ title, content: text || "", userId: req.user._id });
    req.app.get("broadcast")(req.user._id, { type: "note:updated" });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/notes/:id", isAuthenticated, ownsNote, (req, res) => res.json(req.note));

router.put("/notes/:id", isAuthenticated, ownsNote, async (req, res) => {
  try {
    const { title, text } = req.body;
    if (title !== undefined) req.note.title = title;
    if (text !== undefined) req.note.content = text;
    await req.note.save();
    req.app.get("broadcast")(req.user._id, { type: "note:updated" });
    res.json(req.note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/notes/:id/archive", isAuthenticated, ownsNote, async (req, res) => {
  req.note.archived = true;
  await req.note.save();
  req.app.get("broadcast")(req.user._id, { type: "note:updated" });
  res.json(req.note);
});

router.patch("/notes/:id/unarchive", isAuthenticated, ownsNote, async (req, res) => {
  req.note.archived = false;
  await req.note.save();
  req.app.get("broadcast")(req.user._id, { type: "note:updated" });
  res.json(req.note);
});

router.delete("/notes/:id", isAuthenticated, ownsNote, async (req, res) => {
  if (!req.note.archived) return res.status(400).json({ message: "Only archived notes can be deleted" });
  await req.note.deleteOne();
  req.app.get("broadcast")(req.user._id, { type: "note:updated" });
  res.json({ success: true });
});

router.delete("/notes", isAuthenticated, async (req, res) => {
  await Note.deleteMany({ userId: req.user._id, archived: true });
  req.app.get("broadcast")(req.user._id, { type: "note:updated" });
  res.json({ success: true });
});

router.get("/notes/:id/pdf", isAuthenticated, ownsNote, async (req, res) => {
  try {
    const buffer = await generatePdfBuffer(req.note.title, req.note.content);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(req.note.title)}.pdf"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
