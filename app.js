const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");


dotenv.config();
const app = express();
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true, // Force TLS connection
    tlsAllowInvalidCertificates: false, // Ensure certificates are valid
    serverSelectionTimeoutMS: 5000 // Timeout after 5s if MongoDB is unreachable
  });
  

// Define Mongoose Schema & Model
const ruleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    condition: { type: String, required: true },
    action: {
      type: String,
      enum: ["flag for review", "block transaction", "require additional verification"],
      required: true,
    },
    priority: { type: Number, min: 1, max: 10, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    performance: {
      triggers: { type: Number, default: 0 },
      effectiveness: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Rule = mongoose.model("Rule", ruleSchema);

// Create a new fraud detection rule
app.post("/rules", async (req, res) => {
  try {
    const rule = new Rule(req.body);
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all fraud detection rules with filters & pagination
app.get("/rules", async (req, res) => {
  try {
    const { category, status, limit = 20, offset = 0 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const rules = await Rule.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Rule.countDocuments(filter);

    res.json({ total, limit: parseInt(limit), offset: parseInt(offset), rules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing rule
app.put("/rules/:rule_id", async (req, res) => {
  try {
    const rule = await Rule.findByIdAndUpdate(
      req.params.rule_id,
      { ...req.body, updated_at: Date.now() },
      { new: true, runValidators: true }
    );
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a rule (optional but useful)
app.delete("/rules/:rule_id", async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.rule_id);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    res.json({ message: "Rule deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
