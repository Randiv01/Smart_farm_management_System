const User = require("../model/UserModel"); // Fixed path

// Get all users
const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!users || users.length === 0) {
    return res.status(404).json({ message: "Users not found" });
  }

  return res.status(200).json({ users });
};

// Add a new user
const addUser = async (req, res, next) => {
  const { name, email, password, mobile, address, gender, dob } = req.body;

  let newUser;
  try {
    newUser = new User({ name, email, password, mobile, address, gender, dob });
    await newUser.save();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add user", error: err.message });
  }

  return res.status(201).json({ message: "User added successfully", user: newUser });
};

//Get by id
const getById = async (req, res, next) => {
  const id = req.params.id;
  let user;

  try {
    user = await User.findById(id);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving user", error: error.message });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ user });
};

// Update user by ID
const updateUser = async (req, res, next) => {
  const id = req.params.id;
  const { name, email, password, mobile, address, gender, dob } = req.body;

  let user;
  try {
    user = await User.findByIdAndUpdate(
      id,
      { name, email, password, mobile, address, gender, dob },
      { new: true, runValidators: true } // return updated user, enforce schema validation
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating user", error: error.message });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ message: "User updated successfully", user });
};

// Delete user by ID
const deleteUser = async (req, res, next) => {
  const id = req.params.id;

  let user;
  try {
    user = await User.findByIdAndDelete(id);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting user", error: error.message });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ message: "User deleted successfully" });
};



exports.getAllUsers = getAllUsers;
exports.addUser = addUser;
exports.getById = getById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;

