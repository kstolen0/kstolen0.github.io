---
layout: post
title: "CORs! What? Why? How?"
date: 2022-11-29 13:00:00 +0800
categories: CORS
---

# (Get an Image Here)

# What is CORs?

Cross Origin Resource Sharing (CORs) was created to enable web clients to make http requests to services hosted on different origins. CORs is configured on both the server and client. The server defines which type of cross-origin requests are allowed, and the client defines how the requests are made.

# Why is CORs?

By default, web browsers define a [same-origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) policy that prevents client code requests to different origins. This is a critical security control that helps isolate potentially malicious web documents from accessing third party services. Working around this policy required significant effort, now the process is much simpler thanks to CORs.

# How is CORs?

Say you have a website, and an api, and your website needs to call that api. If both are on the same origin everything is hunky-dory and you don't need to worry about CORs. However, if the api is hosted on a different origin then you'll need to use CORs to allow your client origin.

{% tabs log %}
    {% tab log client code %}
    {% highlight html %}
<!DOCTYPE html>
<head>
</head>
<script>
    const btnClick = () => {
    let xhr = new XMLHttpRequest();
    // cross-origin GET request
    xhr.open('GET', 'http://localhost:2222/hello', true);
    xhr.onload = function() {
        console.log(xhr.responseText);
    }
    xhr.send();
}
</script>
<body>
    <h1>Hello world</h1>
    <button onclick="btnClick()">click me</button>
</body>
    {% endhighlight %}
    {% endtab %}

    {% tab log server code %}
    {% highlight javascript%}
let express = require('express');
const service = express();
service.get('/hello', (req, res) => {
    res.send('hello there!');
});
service.listen(2222, () => {
    console.log('listening on port 2222');
});
    {% endhighlight %}
    {% endtab %}

{% endtabs %}

If you try run the above code, instead of seeing `Hello there!` you'll see this error in the developer console:

![cross-origin error: no 'Access-Control-Allow-Origin' header](/assets/cors-error-no-header.PNG)

The browser has detected a cross-origin request and in doing so checks for an [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) header. If one is not present then the server response is rejected. This header is defined on the server. We can update this like so: 

{% highlight javascript%}
let express = require('express');
const service = express();

// add middleware to handle cross-origin requests
service.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'localhost:1111');
    next();
});

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})
service.listen(2222, () => {
    console.log('listening on port 2222');
});
{% endhighlight %}

When we restart our server with the above changes and try running our client code we should see this in our developer console:

![cross-origin error: allowed origin not equal to supplid origin](/assets/cors-wrong-header-error.PNG)

It seems we haven't configured the correct allowed origin in our api. So what exactly is an 'origin'?

TODO: talk about 'origin' where it is in a url and how to view it in the network tab.

<script src="/assets/js/tabs.js"></script>
<link rel="stylesheet" href="/assets/css/tabs.css">