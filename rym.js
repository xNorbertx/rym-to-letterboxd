const puppeteer = require('puppeteer');
//const username = process.argv0[2];

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
            for (let i = 1; i < numberOfPages+1; i++) {
                await page.goto("https://rateyourmusic.com/film_collection/euroshopper/recent/"+i);
                moviesFromPage = await parseFilmInfo(page, i);
                moviesTotal = moviesTotal.concat(moviesFromPage);
                //Need to wait a while between requests, because RYM is sensitive towards bots
                await sleep(randomize(10000) + 60000);  
            }
            browser.close();
            return resolve(JSON.stringify(moviesTotal));
        } catch (e) {
            return reject(e);
        }
    })
}

run().then(console.log).catch(console.error);