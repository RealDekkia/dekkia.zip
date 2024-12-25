const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

var posts = JSON.parse(fs.readFileSync(path.join(__dirname, '../blog/posts.json'), 'utf-8'));

//sort newest to oldest by post date
posts.sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
});

//==== Build main index ====
const mainIndexDom = new JSDOM('<!--THIS FILE HAS BEEN AUTOMATICALLY GENERATED PLEASE DO NOT MODIFY-->\n' + fs.readFileSync(path.join(__dirname, 'indexTemplate.html'), 'utf-8'));

var LinkBox = mainIndexDom.window.document.getElementById("LinkBox");

posts.forEach(blogPost => {

    var linkContainer = mainIndexDom.window.document.createElement("a");
    linkContainer.href = "./post?uri=" + encodeURIComponent("https://dekkia.com") + "&id=" + encodeURIComponent(blogPost.startPostID) + "&title=" + encodeURIComponent(blogPost.description);
    linkContainer.className = "linkContainer";

    var linkImage = mainIndexDom.window.document.createElement("img");
    linkImage.src = "postimg/" + blogPost.img;
    linkImage.className = "linkImage";
    linkContainer.appendChild(linkImage);

    var linkTitle = mainIndexDom.window.document.createElement("div");
    linkTitle.innerHTML = blogPost.title;
    linkTitle.className = "linkTitle";
    linkContainer.appendChild(linkTitle);

    var linkDescription = mainIndexDom.window.document.createElement("div");
    linkDescription.innerHTML = blogPost.description + " Posted: " + new Date(blogPost.createdAt).toLocaleDateString();
    linkDescription.className = "linkDescription";
    linkContainer.appendChild(linkDescription);

    LinkBox.appendChild(linkContainer);

});

fs.writeFileSync(path.join(__dirname, '../blog/index.html'), mainIndexDom.serialize(), { encoding: 'utf-8' });

//==== Build single pages ====
//TODO