const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const csvParse = require('csv-parse/lib/sync')

const app = express()
const upload = multer()
const port = process.env.PORT || 9000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post('/virtual-stock/return/payload', upload.single('file'), function (req, res, next) {
    const rawString = req.file.buffer.toString('utf-8')
    const requireHeaders = [
        'sku',
        'quantity'
    ]
    const headers = csvParse(rawString, {to_line: 1, trim: true})[0]
    const isCorrectHeader = requireHeaders.every(requireHeader => headers.some(actualHeader => requireHeader == actualHeader) )
    
    if (!isCorrectHeader) {
        res.status(400).send({
            message: `generate virtual-stock return payload require ${requireHeaders} but got ${headers}`
        })
        return
    }
    
    const csvRows = csvParse(rawString, {
            trim: true,
            columns: true,
            skip_empty_lines: true,
        })
    const toDay = new Date()
    const addZeroIfUnderDecimal = (integer) => integer < 10 ? `0${integer}` : integer
    const stampDate = `${toDay.getFullYear()}` +
        `${addZeroIfUnderDecimal(toDay.getMonth())}` +
        `${addZeroIfUnderDecimal(toDay.getDate())}-` +
        `${addZeroIfUnderDecimal(toDay.getHours())}-` +
        `${addZeroIfUnderDecimal(toDay.getMinutes())}`

    const payloads = csvRows.map(csvRow => {
        return {
            op: 'return',
            id: csvRow.sku,
            refId: csvRow.sku,
            payload: {
                quantity: parseInt(csvRow.quantity, 10),
                orderId: `manual-return-${stampDate}`
            }
        }
    })
    res.status(200).send(payloads)
})

app.listen(port, () => {
    console.log(`listening on ${port}`)
})