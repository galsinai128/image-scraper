const validUrl = require('valid-url')
const cheerio = require('cheerio')
const download = require('node-image-downloader')
const request = require('request')
const fs = require('fs');
var sizeOf = require('image-size');

const myArgs = process.argv.slice(2); 
var imgsUrl = [];
const url = myArgs[0];
const path = myArgs[1];

checkArgs(); //checking arguments validity

//Get web page
request(url, (error, response, body) => {
    if(error) {
        console.log("Error: " + error);
    }

    //Get all images
    getImages(body);
    if (!imgsUrl.length){
        console.log('Could not find images on ', url);
        process.exit();
    }
    //node image downloader format
    var imgs = [];    
    formatImages(imgs);

    //download all images
    download({imgs,dest: path})
        .then((downloadedImages) => {
            console.log('all done', downloadedImages)
            //create index html file
            fs.appendFile(`${path}/index.html`, buildHtml(downloadedImages,imgsUrl), function (err) {
                if (err) throw err;
                console.log('Web Page Created!');
                });
            })
        .catch((error, response, body) => {
            console.log('something goes bad!')
            console.log(error)
        })
    
    });
    


function checkArgs(){
    if (!validUrl.isWebUri(url) || !fs.existsSync(path) || (fs.existsSync(path) && !fs.lstatSync(path).isDirectory())){
        if (!validUrl.isWebUri(url)){
            console.log('Invalid URL!')
        }
        if (!fs.existsSync(path)){
            console.log('Invalid path!')
        }
        if (fs.existsSync(path) && !fs.lstatSync(path).isDirectory()){
            console.log('Not a folder')
        }
    process.exit();
    }

}

function getImages(body){
    var $ = cheerio.load(body);
    $("img").each(function(i, image){
        imgsUrl.push($(image).attr('src'));
    })
}

function formatImages(imgs){
    imgsUrl.map(imgUrl =>{
        imgs.push({
            uri: validUrl.isWebUri(imgUrl) ? imgUrl : url + imgUrl
        }) 
    })
}

function buildHtml(imgs,imgsUrl) {
    var header = '';
    var body = '';
    body+= '<h1 style="margin: 15px">Downloaded Images</h1>'
    imgs.map((img,i)=>{
        let imgName = img.path.replace(/^.*[\\\/]/, '')
        let imgFormat = img.path.split('.').pop();
        let dimensions = {};
        try {
            dimensions = sizeOf(img.path);
        }
        catch (error) {
            console.error(error);
        }


        body+=`
            <div style="
                display:flex; 
                margin: 15px;     
                border: 2px black solid;
                padding: 10px;
                border-radius: 5px;
                max-width: 95%;
                ">
                <div style="min-width:130px; display:flex; align-items:center; justify-content:center">
                    <img src="${imgName}" style="max-width:120px;">
                </div>
                <div style="margin-left: 10px; max-width: 90%; display:flex; flex-direction:column; justify-content:center">
                    <div>original url: </div>
                    <div style="    
                        overflow: hidden;
                        padding-right: 80px;
                        white-space: nowrap;
                        text-overflow: ellipsis"
                    >${validUrl.isWebUri(imgsUrl[i]) ? imgsUrl[i] : url + imgsUrl[i]}</div>
                    <div>width: ${dimensions.width}</div>
                    <div>height: ${dimensions.height}</div>
                    <div>format: ${imgFormat}</div>
                </div>
            </div>`
    })

  
    return '<!DOCTYPE html>'
         + '<html><head>' + header + '</head><body>' + body + '</body></html>';
  };