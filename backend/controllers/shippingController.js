import Shipping from "../models/shippingModel.js";

// Get all shipping details (admin only)
export const getShippingDetails = async (req, res) => {
  try {
    const shippingDetails = await Shipping.find();
    res.json(shippingDetails);
  } catch (error) {
    console.error("Error fetching shipping details:", error);
    res.status(500).json({ error: "Failed to fetch shipping details" });
  }
};

// Create new shipping info (user or admin)
export const createShipping = async (req, res) => {
  try {
    const { address, city, postalCode, country } = req.body;

    if (!address || !city || !postalCode || !country) {
      return res.status(400).json({ error: "Please provide all required fields" });
    }

    const newShipping = new Shipping({
      user: req.user.id,
      address,
      city,
      postalCode,
      country,
    });

    const savedShipping = await newShipping.save();
    res.status(201).json(savedShipping);
  } catch (error) {
    console.error("Error creating shipping info:", error);
    res.status(500).json({ error: "Failed to create shipping info" });
  }
};

// Update shipping info by ID (admin only)
export const updateShipping = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedShipping = await Shipping.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedShipping) {
      return res.status(404).json({ error: "Shipping info not found" });
    }

    res.json(updatedShipping);
  } catch (error) {
    console.error("Error updating shipping info:", error);
    res.status(500).json({ error: "Failed to update shipping info" });
  }
};

// Delete shipping info by ID (admin only)
export const deleteShipping = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedShipping = await Shipping.findByIdAndDelete(id);

    if (!deletedShipping) {
      return res.status(404).json({ error: "Shipping info not found" });
    }

    res.json({ message: "Shipping info deleted successfully" });
  } catch (error) {
    console.error("Error deleting shipping info:", error);
    res.status(500).json({ error: "Failed to delete shipping info" });
  }
};
