const express = require('express')
const path = require('path')

const rootDir = require('../util/generatPath')

const router = express.Router()

const shopData = []

router.get('/add-product',(req, res, next)=> {
    res.sendFile(path.join(rootDir, 'views', 'add-product.html'))
})

router.post('/add-product', (req, res) => {
    shopData.push({title : req.body.title})
    res.redirect('/')
})

module.exports = {router, shopData}