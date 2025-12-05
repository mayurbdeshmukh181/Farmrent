const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "Data.json";

// Validate + sanitize equipment object
function validateEquipment(item) {
  return {
    equipmentName: item.equipmentName || "",
    name: item.name || "",  // owner
    category: item.category || "",
    description: item.description || "",
    dailyRate: Number(item.dailyRate) || 0,
    hourlyRate: Number(item.hourlyRate) || 0,
    location: item.location || "",
    equipmentUrl: item.equipmentUrl || "",
    ordered: "",                     // ALWAYS empty string by schema
    rented: "false"                  // ALWAYS string
  };
}

// GET → return all items
app.get("/equipment", (req, res) => {
  try {
    const data = fs.readFileSync(FILE, "utf-8");
    const equipment = JSON.parse(data);
    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to read data" });
  }
});

// POST → add new equipment
app.post("/equipment", (req, res) => {
  try {
    const rawData = fs.readFileSync(FILE, "utf-8");
    const equipmentList = JSON.parse(rawData);

    // Validate and sanitize
    const newItem = validateEquipment(req.body);

    // Require owner + equipmentName
    if (!newItem.name || !newItem.equipmentName) {
      return res.status(400).json({
        error: "Missing required fields: name and equipmentName"
      });
    }

    // Add new equipment
    equipmentList.push(newItem);

    // Save updated list
    fs.writeFileSync(FILE, JSON.stringify(equipmentList, null, 2), "utf-8");

    res.json({
      message: "Equipment added successfully",
      newItem,
      total: equipmentList.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add equipment" });
  }
});
app.post("/equipment/order", (req, res) => {
  const { equipmentName, orderedBy } = req.body;

  try {
    // Load JSON
    const data = JSON.parse(fs.readFileSync(FILE, "utf-8"));

    // Find the equipment
    const index = data.findIndex(item => item.equipmentName === equipmentName);

    if (index === -1) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    // Update fields
    data[index].rented = "true";
    data[index].ordered = orderedBy;

    // Save JSON
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");

    res.json({ message: "Order placed", updated: data[index] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
