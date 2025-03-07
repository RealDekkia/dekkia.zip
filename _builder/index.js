const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const threadUnroll = require('../lib/unroll-ninja/thread/js/main');
var xml = require('xml');

var posts = JSON.parse(fs.readFileSync(path.join(__dirname, '../blog/posts.json'), 'utf-8'));

//sort newest to oldest by post date
posts.sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
});

//==== Build single pages ====

//Check if post-folder exists
if (!fs.existsSync(path.join(__dirname, '../blog/post/'))) {
    fs.mkdirSync(path.join(__dirname, '../blog/post/'));
} else {
    //Get rid of everything in th post folder
    fs.readdir(path.join(__dirname, '../blog/post/'), (err, files) => {
        files.forEach(file => {
            fs.unlinkSync(path.join(__dirname, '../blog/post/', file));
        });
    });
}
//Delete rss-file
try { fs.unlinkSync(path.join(__dirname, '../blog/rss.xml')); } catch (e) { console.warn(e); }
var rssItems = {};

var postcnt = 0;
posts.forEach(blogPost => {
    threadUnroll.initPageAsApi('https://dekkia.com', blogPost.startPostID, blogPost.title, function (dom, arr) {
        const postDom = new JSDOM('<!--THIS FILE HAS BEEN AUTOMATICALLY GENERATED PLEASE DO NOT MODIFY-->\n' + fs.readFileSync(path.join(__dirname, 'postTemplate.html'), 'utf-8'));
        dom.className = "mainBody";
        postDom.window.document.getElementById('mainPage').appendChild(dom);
        fs.writeFileSync(path.join(__dirname, '../blog/post/' + blogPost.startPostID + '.html'), postDom.serialize(), { encoding: 'utf-8' });

        rssItems[blogPost.startPostID] = {
            description: dom.innerHTML,
            title: blogPost.title,
            link: 'https://dekkia.zip/blog/post/' + blogPost.startPostID + '.html'
        };

        try {
            blogPost.oldestPost = arr[0].created_at;
            if (arr[arr.length - 1]) {
                blogPost.newestPost = arr[arr.length - 1].created_at;
            } else {
                //Sometimes the last array-entry is undefined.
                blogPost.newestPost = arr[arr.length - 2].created_at;
            }
        } catch (error) {
            console.warn(error);
            console.warn(blogPost);
            console.warn(arr.length);
            for (let index = 0; index < arr.length; index++) {
                if (arr[index]) {
                    console.warn(index, arr[index].id);
                } else {
                    console.warn(index, "missing");
                }
            }
        }

        postcnt++;
        if (postcnt >= posts.length) makeIndex();
    }, false, blogPost.statusBlocklist, blogPost.brokenThreadContinue);

});

//Create index in blog-dir
const postIndexDom = new JSDOM('<!--THIS FILE HAS BEEN AUTOMATICALLY GENERATED PLEASE DO NOT MODIFY-->\n' + fs.readFileSync(path.join(__dirname, 'postTemplate.html'), 'utf-8'));
fs.writeFileSync(path.join(__dirname, '../blog/post/index.html'), postIndexDom.serialize(), { encoding: 'utf-8' });

//Start of RSS feed
var rssDOM = {
    rss: [
        {
            _attr: { version: '2.0', 'xmlns:atom': 'http://www.w3.org/2005/Atom' },
        },
        {
            channel: [
                { title: 'Dekkia\'s Blog' },
                { link: 'https://dekkia.zip/blog/' },
                { description: 'Auto-generated Blog based on my Posts on Mastodon.' },
                { language: 'en' },
                { pubDate: new Date().toUTCString() },
                { lastBuildDate: '' }, //leave this at index 5 if you don't want to break further code
                { generator: 'https://github.com/RealDekkia/dekkia.zip' },
                { docs: 'https://www.rssboard.org/rss-specification' },
                { managingEditor: 'dekkia@dekkia.de (Dekkia)' },
                { 'atom:link href="https://dekkia.zip/blog/rss.xml" rel="self" type="application/rss+xml"': {} }
                //Items go here
            ]
        }
    ]
};

//==== Build main index and rss items ====
var newestUpdateDate = new Date(0);
function makeIndex() {

    const mainIndexDom = new JSDOM('<!--THIS FILE HAS BEEN AUTOMATICALLY GENERATED PLEASE DO NOT MODIFY-->\n' + fs.readFileSync(path.join(__dirname, 'indexTemplate.html'), 'utf-8'));

    var LinkBox = mainIndexDom.window.document.getElementById('LinkBox');

    posts.forEach(blogPost => {

        var linkContainer = mainIndexDom.window.document.createElement('a');
        linkContainer.href = './post/' + blogPost.startPostID + '.html';
        linkContainer.className = 'linkContainer';

        var linkImage = mainIndexDom.window.document.createElement('img');
        linkImage.src = 'postimg/' + blogPost.img;
        linkImage.className = 'linkImage';
        linkContainer.appendChild(linkImage);

        var linkTitle = mainIndexDom.window.document.createElement('div');
        linkTitle.innerHTML = blogPost.title;
        linkTitle.className = 'linkTitle';
        linkContainer.appendChild(linkTitle);

        var linkDescription = mainIndexDom.window.document.createElement('div');

        var oldDate = new Date(blogPost.oldestPost);
        var newDate = new Date(blogPost.newestPost);


        linkDescription.innerHTML = blogPost.description + '<br>Posted: ' + oldDate.getFullYear() + "-" + (oldDate.getMonth() + 1) + "-" + oldDate.getDate() + ', Last Updated: ' + newDate.getFullYear() + "-" + (newDate.getMonth() + 1) + "-" + newDate.getDate();
        linkDescription.className = 'linkDescription';
        linkContainer.appendChild(linkDescription);

        LinkBox.appendChild(linkContainer);

        //RSS Stuff
        if (newDate > newestUpdateDate) newestUpdateDate = newDate;

        rssDOM.rss[1].channel.push({
            item: [
                { title: rssItems[blogPost.startPostID].title },
                { link: rssItems[blogPost.startPostID].link },
                { description: rssItems[blogPost.startPostID].description },
                { guid: rssItems[blogPost.startPostID].link },
                { pubDate: newDate.toUTCString() }
            ]
        });
    });

    fs.writeFileSync(path.join(__dirname, '../blog/index.html'), mainIndexDom.serialize(), { encoding: 'utf-8' });

    finalizeRSS();
}

function finalizeRSS() {
    //Write RSS file

    rssDOM.rss[1].channel[5].lastBuildDate = newestUpdateDate.toUTCString();
    var rssTxt = xml(rssDOM, { indent: '\t' }).replaceAll('&lt;img ', '&lt;img width=500px ').replaceAll('&lt;video ', '&lt;video width=500px ');

    fs.writeFileSync(path.join(__dirname, '../blog/rss.xml'), rssTxt);
}
