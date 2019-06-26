/**
 * Copyright (c) 2017 Alibaba Group Holding Limited
 * @author Simon <gaomeng1900@gmail.com>
 */

const express = require('express')
const webpack = require('webpack')
const path = require('path')
const comp = require('compression')

// create normal express app
const app = express()

// create a webpack conpiter
const config = require('./webpack.config')
const compiler = webpack(config)

// set dev_option
var devOption = {
    noInfo: true,
    publicPath: config.output.publicPath, // 静态文件位置
    stats: 'minimal',
    historyApiFallback: true,
    headers: {
        'Access-Control-Allow-Origin': '*',
    },
}

app.use(comp())

app.use(require('webpack-dev-middleware')(compiler, devOption))

app.use('/assets', express.static(path.join(__dirname, '/assets')))

app.get('/favicon.ico', (req, res) => {
    res.end('')
})

// compit jade & route '/'to index.html
app.get('/html/:demoName', (req, res) => {
    console.log('visiting demo:', req.params.demoName)
    res.sendFile(path.join(__dirname, `/demo/${req.params.demoName}.html`))
})

// listen
app.listen(3112, '0.0.0.0', err => {
    if (err) {
        console.log(err)
    } else {
        console.log('Listening @ http://localhost:3112')
    }
})
