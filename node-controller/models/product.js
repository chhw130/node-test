const fs = require('fs')
const path = require('path')

const getProductsFromFile = (callback) => {
    const p = path.join(path.dirname(process.mainModule.filename), 'data', 'products.json')

    fs.readFile(p, (err, fileData) => {
        if(err){
            return callback([])
        }
        return callback(JSON.parse(fileData))
    })
}

module.exports = class Product{
    constructor(title){
        this.title = title
    }

    save(){
        products.push(this)
        const p = path.join(path.dirname(process.mainModule.filename), 'data', 'products.json')

        fs.readFile(p, (err, fileData) => {
            let products = []
            if(!err){
                products = JSON.parse(fileData)
            }
            products.push(this)
            fs.writeFile(p, JSON.stringify(products))
        })
    }

    static fetchAll(callback){
        getProductsFromFile(callback)
    }
}