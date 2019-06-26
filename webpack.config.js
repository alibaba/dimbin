var webpack = require('webpack')
var path = require('path')
var fs = require('fs')

process.noDeprecation = true

// 遍历demo下面所有目录层级，使用所有js作为entry
function getDemoEntry(dirPath, entries) {
    var reg = /.js$/
    var pageDir = fs.readdirSync(dirPath) || []

    for (var j = 0; j < pageDir.length; j++) {
        var filePath = path.resolve(dirPath, pageDir[j])
        var fileStat = fs.statSync(filePath)

        if (fileStat.isFile()) {
            if (reg.test(pageDir[j])) {
                var name = pageDir[j].replace('.js', '')

                if (entries[name]) {
                    console.log('\x1b[31m')
                    console.log('entry name 冲突: ' + name)
                    console.log('\t', entries[name][0])
                    console.log('\t', filePath)
                    console.log('\x1b[0m')
                }

                entries[name] = [filePath]
            }
        } else if (fileStat.isDirectory()) {
            getDemoEntry(filePath, entries)
        }
    }
    return entries
}

var ENTRY = process.env.ENTRY
var entry = {}
if (ENTRY) {
    entry[ENTRY] = ['./demo/' + ENTRY + '.js']
} else {
    // 查找demo目录下所有的js文件作为entry
    getDemoEntry(path.resolve(__dirname, 'demo/'), entry)
}

var plugins, devtool, output, mode

if (process.env.NODE_ENV === 'production') {
    console.log('publishing')

    entry = {
        v3: [path.resolve('./src/v3.ts')],
        v2: [path.resolve('./src/v2.js')],
    }

    plugins = [
        new webpack.NoEmitOnErrorsPlugin(), // 出错时不发布
    ]

    devtool = 'source-map'

    output = {
        path: path.resolve('./'),
        publicPath: '/', // 为使内网可访问, 不指明host
        filename: '[name].js',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        globalObject: 'this',
    }

    mode = 'production'
} else {
    console.log('deving')

    plugins = [
        new webpack.NoEmitOnErrorsPlugin(), // 出错时不发布
    ]

    devtool = 'inline-source-map'

    output = {
        filename: '[name].demo.js',
        publicPath: '/static/',
    }

    mode = 'development'
}

var config = {
    entry: entry,
    output: output,
    devtool: devtool,
    plugins: plugins,
    mode: mode,
    resolve: {
        alias: {
            src: path.join(__dirname, 'src'),
        },
        extensions: ['.js', '.scss', '.css'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                include: /src|demo/,
                use: 'ts-loader',
            },
            {
                test: /\.js$/,
                include: /src|demo/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                },
            },
        ],
    },
}

module.exports = config
