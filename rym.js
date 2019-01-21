const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: './csv-output.csv',
    header: [
        {id: 'title', title: 'TITLE'},
        {id: 'year', title: 'YEAR'},
        {id: 'rating', title: 'RATING'}
    ]
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomize(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
 
async function parseFilmInfo(page, pagenumber) {
    await page.screenshot({path: 'page'+pagenumber+'.png'});
    return await page.evaluate(() => {
        try {
            const votes = document.querySelectorAll('.or_q_albumartist');
            const numberOfVotes = votes.length;
            let movies = []
            for (let i = 0; i < numberOfVotes; i++) {
                movie = {
                    title: votes[i].querySelector('a').innerText,
                    year: votes[i].querySelector('span.smallgray').innerText.slice(1, -1),
                    rating: votes[i].parentElement.previousElementSibling.getElementsByTagName('img')[0].title.substring(0, 4)
                }
                movies.push(movie);
            }
            return movies;
        } catch(e) {
            return e;
        }
    });
}

function run () {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            let moviesTotal = [];
            await page.goto("https://rateyourmusic.com/film_collection/euroshopper/recent/");
            await page.screenshot({path: 'main.png'});
            page.title().then(function(res) {
                if( res === "IP blocked") {
                    return reject("IP is blocked");
                }
            });
            const numberOfPages = await page.evaluate(() => {
                const nodes = document.querySelectorAll("a.navlinknum");
                return parseInt(nodes[nodes.length-1].innerText);
            });
            let moviesFromPage = [];
            for (let i = 1; i < 10+1; i++) {
                await page.goto("https://rateyourmusic.com/film_collection/euroshopper/recent/"+i);
                moviesFromPage = await parseFilmInfo(page, i);
                moviesTotal = moviesTotal.concat(moviesFromPage);
                //Need to wait a while between requests, because RYM is sensitive towards bots
                await sleep(randomize(10000) + 60000);  
            }
            browser.close();
            csvWriter.writeRecords(moviesTotal)
                .then(() => {
                    console.log('DONE!');
                });
            return resolve();
        } catch (e) {
            return reject(e);
        }
    })
}

run().then(console.log).catch(console.error);