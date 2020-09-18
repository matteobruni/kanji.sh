const os = require('os');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const {default: PQueue} = require('p-queue');

const kanjiVgPrefix = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/";
const cssForSvg = '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/css" href="../../css/svg-writing.css" ?>'

const outDir = "build"
const svgOutputDir = `${outDir}/svg`
const pdfOutputDir = `${outDir}/pdf`

const templateAbsolutePath = path.relative("/", "template/page.html");

const logStart = (message) => console.log(`[START] ${message}`);
const logDone = (message) => console.log(`[DONE✓] ${message}`);
const logError = (message) => console.error(`[ERROR] ${message}`);

const ensureDirectories = (...dirNames) => {
    for (const dirName of dirNames) {
        fs.existsSync(dirName) || fs.mkdirSync(dirName);
    }
}

async function processSources(...sourceDirs) {
    await Promise.all(sourceDirs.map(sourceDir => processSourceDir(sourceDir)))
}

async function generatePDFs(...sourceDirs) {
    for (const sourceDir of sourceDirs) {
        try {
            let destinationDir = path.join(pdfOutputDir, sourceDir)
            ensureDirectories(destinationDir)

            let filenames = fs.readdirSync(sourceDir);
            console.log(`Filenames in source Dir ${sourceDir} are ${filenames}`)
            for (let sourceFile of filenames) {
                const inputFilePath = path.join(sourceDir, sourceFile)
                const outputDirectoryPath = path.join(pdfOutputDir, sourceDir)
                await generatePDF(inputFilePath, outputDirectoryPath, sourceFile.split('.')[0])
            }
        } catch (error) {
            logError(`Error while reading directory ${sourceDir}: ${error}`);
        }
    }
}

async function generatePDF(inputFilePath, outputDirectoryPath, sourceGroup) {
    const tempDirPath = path.join(outputDirectoryPath, sourceGroup);
    ensureDirectories(outputDirectoryPath, tempDirPath);

    try {
        logStart(`Reading file ${inputFilePath}...`);
        const content = fs.readFileSync(inputFilePath, {encoding: 'utf-8', flag: 'r'})
        const data = content.split('\n').filter(Boolean)

        const timeout = 60 * 1000
        const browser = await puppeteer.launch({
            waitNetworkIdle: true,
            timeout: timeout,
            args: [
                '--disable-web-security',
            ],
        });

        // To avoid timeout, if the number of pages are too much, 5 pages per core
        const browserPageQueue = new PQueue({concurrency: os.cpus().length * 5, autoStart: true});

        let times = 0
        for (let index = 0; index < data.length; index += 5) {
            const processing = async function (index, kanjiArray) {
                console.log(`${inputFilePath}: Index ${index} start`)
                const page = await browser.newPage();
                page.setDefaultTimeout(timeout)

                page.on('console', consoleObj => console.log(consoleObj.text()));
                await page.goto(`file:///${templateAbsolutePath}?data=${kanjiArray.join("")}`, {
                    waitUntil: ['load', 'networkidle0', 'networkidle2', 'domcontentloaded']
                });

                await page.pdf({
                    path: path.join(tempDirPath, `${index}.pdf`),
                    displayHeaderFooter: false,
                    printBackground: false,
                    format: 'A4',
                });

                await page.close()
                console.log(`${inputFilePath}: Index ${index} finished ${kanjiArray}`)
            }

            browserPageQueue.add(async () => processing(times++, data.slice(index, index + 5))).then((any) => {
                console.log(`${inputFilePath}: Index Added to queue`)
            })
        }

        await browserPageQueue.onIdle()
        await browser.close();
    } catch (error) {
        logError(`Error on reading file ${inputFilePath} : ${error}`);
    }
}

// Read sources and download SVG if doesnt exists
async function processSourceDir(sourceDir) {
    logStart(`Reading directory ${sourceDir}...`)
    try {
        let filenames = fs.readdirSync(sourceDir);
        for (let sourceFile of filenames) {
            const inputFile = path.join(sourceDir, sourceFile)
            logStart(`Reading file ${inputFile}...`);
            try {
                const content = fs.readFileSync(inputFile, {encoding: 'utf-8', flag: 'r'})
                logDone(`Finished reading ${inputFile}`);
                logStart(`Downloading kanji in file ${inputFile}`);
                const downloads = content.split('\n').filter(Boolean).map(kanji => downloadSvg(kanji))
                await Promise.all(downloads)
                logDone(`Downloading kanji in file ${inputFile}`);
            } catch (error) {
                logError(`Error on reading file ${inputFile} : ${error}`);
            }
        }
    } catch (error) {
        logError(`Error while reading directory ${sourceDir}: ${error}`);
    }
}

// Downloads SVG from KanjiVG
async function downloadSvg(kanji) {
    const readFileUrl = kanjiVgPrefix + "0" + kanji.charCodeAt(0).toString(16) + ".svg";
    const svgOutFilePath = path.join(svgOutputDir, `${kanji}.svg`);
    const writingSvgOutFilePath = path.join(svgOutputDir, `${kanji}.w.svg`);
    if (fs.existsSync(svgOutFilePath)) {
        // File already downloaded
        return
    }
    const response = await fetch(readFileUrl)
    const content = await response.buffer();

    // Create SVG with stroke numbers
    await fs.writeFileSync(svgOutFilePath, content)

    //Create SVG without stroke
    const localContent = content.toString().split("\n")
    localContent[0] = cssForSvg
    await fs.writeFileSync(writingSvgOutFilePath, localContent.join('\n'))
}

async function downloadKanjiData() {
    logStart("Downloading Kanji data")
    const response = await fetch("https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json")
    const json = await response.buffer();
    await fs.writeFileSync(`${outDir}/all-data.json`, json)
    logDone("Kanji data downloaded")
}

async function generateData() {
    await ensureDirectories(outDir, svgOutputDir, pdfOutputDir)
    await downloadKanjiData();
    await processSources("frequency", "jlpt", "grade", "wanikani")
    await generatePDFs("frequency", "jlpt", "grade", "wanikani")
}

console.time('GenerateData');
generateData().then(function () {
    console.log(`Data Generation finished`);
    console.timeEnd('GenerateData')
    process.exit(0)
}).catch(function () {
    process.exit(1)
});
