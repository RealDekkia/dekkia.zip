const blog = {
    init: function () {
        fetch('./posts.json')
            .then((response) => response.json())
            .then((json) => blog.processJson(json));
    },
    processJson: function (j) {
        var LinkBox = document.getElementById("LinkBox");

        //sort newest to oldest by post date
        j.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        j.forEach(blogPost => {
            console.log(blogPost);

            var linkContainer = document.createElement("a");
            linkContainer.href = "./post?uri=" + encodeURIComponent("https://dekkia.com") + "&id=" + encodeURIComponent(blogPost.startPostID) + "&title=" + encodeURIComponent(blogPost.description);
            linkContainer.className = "linkContainer";

            var linkImage = document.createElement("img");
            linkImage.src = "postimg/" + blogPost.img;
            linkImage.className = "linkImage";
            linkContainer.appendChild(linkImage);

            var linkTitle = document.createElement("div");
            linkTitle.innerHTML = blogPost.title;
            linkTitle.className = "linkTitle";
            linkContainer.appendChild(linkTitle);

            var linkDescription = document.createElement("div");
            linkDescription.innerHTML = blogPost.description + " Posted: " + new Date(blogPost.createdAt).toLocaleDateString();
            linkDescription.className = "linkDescription";
            linkContainer.appendChild(linkDescription);

            LinkBox.appendChild(linkContainer);

        });
    }
};

blog.init();