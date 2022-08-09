const puppeteer = require('puppeteer')
const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty")
var readline = require('readline');
const reader = require('xlsx')
const fs = require("fs");
const Excel = require('exceljs');
const { title } = require('process');


let result = [];

const unique = (value, index, self) => {
        return self.indexOf(value) === index
    }
    // Async function which scrapes the data
async function scrapeData() {



    const browser = await puppeteer.launch({ headless: true, ignoreHTTPSErrors: true })
    try {
        var array = [];
        var input = null;
        var rd = readline.createInterface({
            input: fs.createReadStream(__dirname + '/contactList.tsv')

        });

        rd.on('line', function(line) {
            console.log(line)
            array.push(line);
        });


        rd.on('close', async function(d) {
            console.log(array.length)
            array = array.filter(unique);

            console.log("TOTAL Property FOUND", array.length)
            let workbook = new Excel.Workbook()
            let worksheet = workbook.addWorksheet('Property Contacts')
            worksheet.columns = [
                { header: 'Url', key: 'url' },
                { header: 'Address', key: 'Address' },
                { header: 'Name', key: 'propName' },
                { header: 'Email', key: 'propEmail' },
                { header: 'Phone', key: 'propNo' },


            ]

            //await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
            for (let index = 0; index < array.length; index++) {

                const element = array[index];
                console.log("RUNNING index===> ", index)
                try {
                    const [page] = await browser.pages();
                    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");

                    // newly added line after every new page
                    console.log(`https://www.boardpackager.com/buildings/${element}`)


                    await page.goto(`https://www.boardpackager.com/buildings/${element}`);

                    var Address = ''

                    try {
                        await page.waitForSelector('.building-address__title--bold')
                        let element = await page.$('.building-address__title--bold')
                        Address = await page.evaluate(el => el.textContent, element)
                    } catch (ex) {
                        console.log("Address ERROR", ex)
                    }

                    try {
                        await page.waitForSelector('.building-address__hood--grey')
                        let value = await page.$$eval(".building-address__hood--grey",
                            elements => elements.map(item => item.textContent))

                        Address = Address.trim();

                        for (let m = 0; m < value.length; m++) {

                            value[m] = value[m].replace('\n\g', '');
                            value[m] = value[m].replace('\t\g', '');
                            value[m] = (value[m].replace(/\s+/g, ' ').trim());

                            Address = Address + " | " + value[m];
                        }
                    } catch (ex) {
                        console.log("Address ERROR", ex)
                    }


                    try {
                        await page.waitForSelector(".building-section-contents ul li h6", { timeout: 5000 });
                        propName = await page.$$eval(".building-section-contents ul li h6",
                            elements => elements.map(item => item.textContent))
                    } catch (ex) {
                        console.log("80", ex)
                    }


                    var propName = [];
                    try {
                        await page.waitForSelector(".building-section-contents ul li h6", { timeout: 5000 });
                        propName = await page.$$eval(".building-section-contents ul li h6",
                            elements => elements.map(item => item.textContent))
                    } catch (ex) {
                        console.log("90", ex)
                    }

                    var propNo = [];
                    try {
                        await page.waitForSelector(".building-section-contents ul li small a", { timeout: 5000 });
                        propNo = await page.$$eval(".building-section-contents ul li small a",
                            elements => elements.map(item => item.href))
                    } catch (ex) {
                        console.log("99", ex)
                    }

                    var Title = [];
                    try {
                        await page.waitForSelector(".building-section-contents ul li small:nth-child(1)", { timeout: 5000 });
                        Title = await page.$$eval(".building-section-contents ul li small:nth-child(1)",
                            elements => elements.map(item => item.textContent))
                    } catch (ex) {
                        console.log("99", ex)
                    }

                    let titleDisplay = [];
                    for (let m = 0; m < Title.length; m++) {
                        Title[m] = Title[m].replace('\n\g', '');
                        Title[m] = Title[m].replace('\t\g', '');
                        Title[m] = (Title[m].replace(/\s+/g, ' ').trim());
                        if (m % 2 == 0) {
                            titleDisplay.push(Title[m])
                        }

                    }




                    var propEmail = [];
                    try {
                        await page.waitForSelector(".building-section-contents ul li a.lead", { timeout: 5000 });
                        propEmail = await page.$$eval(".building-section-contents ul li a.lead",
                            elements => elements.map(item => item.href))
                    } catch (ex) {
                        console.log("108", ex)
                    }
                    console.log(propName, propNo, propEmail)
                    for (let q = 0; q < propName.length; q++) {
                        result.push({
                            url: "/buildings/" + element,
                            propName: propName[q] ? propName[q] : "",
                            propNo: propNo[q] ? propNo[index] : "",
                            propEmail: propEmail[q] ? propEmail[q] : "",
                            Address: Address
                        })
                        titleDisplay[q] = titleDisplay[q] ? titleDisplay[q] : "-";
                        worksheet.addRow({
                            url: "/buildings/" + element,
                            propName: propName[q] ? propName[q] + ` (${titleDisplay[q]}) ` : "",
                            propNo: propNo[q] ? propNo[q].replace("tel:", "") : "",
                            propEmail: propEmail[q] ? propEmail[q].replace("mailto:", "") : "",
                            Address: Address
                        })

                    }
                } catch (ex) {
                    console.log("108", ex)
                }

            }

            browser.close()
            worksheet.columns.forEach(column => {
                column.width = 50
            })
            worksheet.getRow(1).font = { bold: true }

            workbook.xlsx.writeFile(`Property_Contacts_${new Date().getTime()}.xlsx`)


        })
    } catch (err) {
        console.error(err);
    }
}
// Invoke the above function
scrapeData();