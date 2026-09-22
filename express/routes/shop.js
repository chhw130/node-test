const express = require('express')
const path = require('path')

const rootDir = require('../util/generatPath')
const admin = require('./admin')

const router = express.Router()

router.get('/',(req, res, next)=> {
    console.log(admin.shopData)
    res.sendFile(path.join(rootDir, 'views', 'shop.html'))
})

module.exports = router