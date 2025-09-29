// src/utils/userUtils.js
export const isManager = (user) => {
  // Check if user has manager roles (animal, plant, inv, emp, health, owner)
  const managerRoles = ['animal', 'plant', 'inv', 'emp', 'health', 'owner'];
  return user?.role && managerRoles.includes(user.role);
};

export const isCustomer = (user) => {
  // Check if user is a normal customer (no role, customer role, normal role, or empty role)
  return !user?.role || user.role === 'customer' || user.role === 'normal' || user.role === '';
};

export const isNormalUser = (user) => {
  // Normal users are customers (not managers)
  return isCustomer(user);
};

export const hasAccessToUserHome = (user) => {
  // Only normal users (customers) should access UserHome
  return isNormalUser(user);
};