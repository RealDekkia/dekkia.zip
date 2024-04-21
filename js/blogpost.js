const blogPost = {
    init: function () {
        var params = new URLSearchParams(window.location.search);
        if (params.size <= 1) {
            document.location = "../";
        } else {
            var instanceUri = params.get("uri");
            var statusID = params.get("id");
            var title = params.get("title");

            if (instanceUri && statusID && title) {
                threadUnroll.initPageAsApi(instanceUri, statusID, title, function (postDOM) {

                    postDOM.className = "mainBody";
                    document.getElementById("mainPage").appendChild(postDOM);
                });
            } else {
                document.location = "../";
            }
        }
    }
}

blogPost.init();