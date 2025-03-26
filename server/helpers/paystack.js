const axios = require("axios");

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer sk_test_1771d228830ef20ed9c51085bd62317dd4300174`, // Replace with your Paystack secret key
    "Content-Type": "application/json",
  },
});

module.exports = paystack;
