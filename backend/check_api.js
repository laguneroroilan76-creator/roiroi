const express = require('express');
const userController = require('./src/controllers/user.controller');
// Mock req, res
const req = {};
const res = {
  json: function(data) {
    console.log("API OUTPUT:", data.filter(u => u.role === 'Driver'));
  },
  status: function(code) {
    return this;
  }
};
userController.getUsers(req, res);
