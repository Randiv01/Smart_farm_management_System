// src/utils/userUtils.js
export const isManager = (user) => {
    return user?.email && user.email.includes('@mountolive.com');
  };
  
  export const isCustomer = (user) => {
    return !isManager(user);
  };