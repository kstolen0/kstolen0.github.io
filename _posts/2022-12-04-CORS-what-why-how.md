---
layout: post
title: "CORS...  What? Why? How?"
date: 2022-12-04 16:00:00 +0800
categories: CORS
---

# What is CORS?

Cross Origin Resource Sharing (CORS) is a web standard created to allow a server to indicate which origin other than its own from which a browser should permit loading resources. This allows web clients to make http requests to services hosted on different origins.

# Why is CORS?

By default, web browsers define a [same-origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) policy that prevents client code requests to different origins. This is a critical security control that helps isolate potentially malicious web documents from accessing third party services. CORS was created to help work around this policy by enabling the server to define which origins .

# How is CORS?

Let's enable CORS for a cross-origin request between two locally running services. One service (our client) is running on `http://localhost:1111`, the other service (our api) is running on `http://localhost:2222`. Our api contains a single get endpoint `/hello` which when called responds with a 200 response code and a response body of `hello there!`. Our client page contains a title and a single `click me` button that when pressed, will make a get request to our api's `/hello` endpoint and will print the response text to the console. 

{% tabs startingcode %}
    {% tab startingcode client code %}
    {% highlight html %}
<!DOCTYPE html>
<head>
</head>
<script>
    const btnClick = () => {
        fetch('http://localhost:2222/hello')
            .then(response => response.text())
            .then(data => console.log(data));
    }
</script>
<body>
    <h1>A very useful website</h1>
    <button onclick="btnClick()">click me</button>
</body>
    {% endhighlight %}
    {% endtab %}

    {% tab startingcode server code %}
    {% highlight javascript%}
import express from 'express';

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

Given that this is a cross-origin request, when we press the `click me` button, instead of printing `hello there!` to the console, instead we see the following error message:

![cross-origin error: no 'Access-Control-Allow-Origin' header](/assets/cors-error-no-header.PNG)

The browser has detected a cross-origin request and in doing so checks for an [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) response header in the server response. If one is not present then the server response is rejected. Given that this is a response header, we need to update our server to include this. This can be done by defining our own custom middleware, or by using the popular [cors](https://www.npmjs.com/package/cors) library. I'll include examples of using both: 

{% tabs addingcors %}
    {% tab addingcors custom middleware %}
    {% highlight javascript%}
import express from 'express';

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
    {% endtab %}
    {% tab addingcors cors library %}
    {% highlight javascript%}
import express from 'express';
import cors from 'cors';

const service = express();

// add cors
const corsOptions = {
    origin: 'localhost:1111',
};
service.use(cors(corsOptions));

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})

service.listen(2222, () => {
    console.log('listening on port 2222');
});
    {% endhighlight %}
    {% endtab %}
{% endtabs %}

When we restart our server with the above changes and try running our client code we should see this in our developer console:

![cross-origin error: allowed origin not equal to supplied origin](/assets/cors-wrong-header-error.PNG)

It seems we haven't configured the correct allowed origin in our api. So what exactly is an 'origin'?

[mdn webdocs](https://developer.mozilla.org/en-US/docs/Glossary/Origin) defines an origin as: 
> Web content's origin is defined by the scheme (protocol), hostname (domain), and port of the URL used to access it.

![the origin is composed of the protocol hostname and port of a url](/assets/cors-url-origin.PNG)

In our fix above, we only defined the hostname and port, not the protocol. Let's update this once more to include the actual origin: 

{% tabs cors-valid-origin %}
    {% tab cors-valid-origin custom middleware %}
    {% highlight javascript %}
import express from 'express';

const service = express();

// add middleware to handle cross-origin requests
service.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1111');
    next();
});

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})
service.listen(2222, () => {
    console.log('listening on port 2222');
});
{% endhighlight %}
    {% endtab %}
    {% tab cors-valid-origin cors library %}
    {% highlight javascript %}
import express from 'express';
import cors from 'cors';

const service = express();

// add cors
const corsOptions = {
    origin: 'http://localhost:1111',
};
service.use(cors(corsOptions));

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})

service.listen(2222, () => {
    console.log('listening on port 2222');
});
    {% endhighlight %}
    {% endtab %}
{% endtabs %}

Now when we restart our server once more and press the `click me` button on the client we will see the expected api response in our console log:

![valid cross-origin request](/assets/cors-valid-response.PNG)

## How do I allow requests from multiple origins?

The `Access-Control-Allow-Origin` header only accepts a single origin. If your api needs to be used by multiple clients on different origins you may need to add additional behavior in your cors middleware to enable this. We can update our cors middleware to accept requests from both `http://localhost:1111` and `http://localhost:1234`.

{% tabs cors-multiple-origins %}
    {%tab cors-multiple-origins custom middleware %}
    {% highlight javascript%}
import express from 'express';

const service = express();

const allowedOrigins = new Set()
    .add('http://localhost:1111')
    .add('http://localhost:1234');

// add middleware to handle cross-origin requests
service.use((req, res, next) => {
    const origin = req.headers.origin;
    // if origin is one of the allowed origins
    // set Access-Control-Allow-Origin header
    // to the provided origin
    if (allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    next();
});

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})
service.listen(2222, () => {
    console.log('listening on port 2222');
});
    {% endhighlight %}
    {% endtab %}
    {% tab cors-multiple-origins cors library %}
    {% highlight javascript %}
import express from 'express';
import cors from 'cors';

const service = express();

// add middleware to handle cross-origin requests
const allowedOrigins = new Set()
    .add('http://localhost:1111')
    .add('http://localhost:1234');
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.has(origin)) {
            // if origin is one of the allowed origins
            // execute callback with null Error and the origin
            callback(null, origin);
        } else {
            // otherwise execute the callback with an Error
            callback(new Error('Not allowed by CORS'));
        }
    },
};
service.use(cors(corsOptions));

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})

service.listen(2222, () => {
    console.log('listening on port 2222');
});
    {% endhighlight %}
    {% endtab %}
{% endtabs %}

The two implementations above are similar, but how they handle an invalid origin slightly differs. In the custom middleware, we still accept and continue processing the request, whereas the cors library will throw an Error and we'll stop processing the request. The client call will still fail in both cases, however the response status code would be 200 in the former case, and 500 in the latter case. Throwing an error would be the safer action in this case as this helps protect against CSRF attacks. CSRF is beyond the scope of this article.

### Side effects of allowing multiple origins

A side-effect of allowing multiple origins is that the `Access-Control-Allowed-Origin` header may vary between requests which can cause caching issues.

![allowed origin header in client on port 1111](/assets/cors-allow-origin-header-one.PNG)

![allowed origin header in client on port 1234](/assets/cors-allow-origin-header-two.PNG)

In order to protect against these issues, you should add the `Vary` response header with the value `Origin`. This instructs any proxy server to consider the `Origin` header in a request when deciding to use a cached response.

{% tabs cors-vary-header %}
    {% tab cors-vary-header custom middleware %}
    {% highlight javascript%}
import express from 'express';
const service = express();

const allowedOrigins = new Set()
    .add('http://localhost:1111')
    .add('http://localhost:1234');

// add middleware to handle cross-origin requests
service.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    next();
});

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})
service.listen(2222, () => {
    console.log('listening on port 2222');
});
    {% endhighlight %}
    {% endtab %}
    {% tab cors-vary-header cors library %}
    {% highlight javascript %}
import express from 'express';
import cors from 'cors';

const service = express();

// cors adds the Origin to the Vary header by default
// so no changes are needed
const allowedOrigins = new Set()
    .add('http://localhost:1111')
    .add('http://localhost:1234');
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.has(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};
service.use(cors(corsOptions));

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})

service.listen(2222, () => {
    console.log('listening on port 2222');
});
    {% endhighlight %}
    {% endtab %}
{% endtabs %}

## How do I allow requests from any origin?

In some cases you may be building a public api and want any website to be able to reach your service. This is much simpler than allowing only a sub-set of origins and doesn't incur any caching side-effects. In our custom middleware, we just give `Access-Control-Allow-Origin` the value `*`. In the cors library, we just don't provide an origin in our cors options (we could also not define any options in this case as it's an optional parameter).

{% tabs cors-allow-all %}
    {% tab cors-allow-all custom middleware %}
    {% highlight javascript %}
import express from 'express';
const service = express();

// add middleware to handle cross-origin requests
service.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})
service.listen(2222, () => {
    console.log('listening on port 2222');
});
{% endhighlight %}
    {% endtab %}
    {% tab cors-allow-all cors library %}
    {% highlight javascript %}
import express from 'express';
import cors from 'cors';

const service = express();

const corsOptions = {};
service.use(cors(corsOptions));

service.get('/hello', (_req, res) => {
    res.send('hello there!');
})

service.listen(2222, () => {
    console.log('listening on port 2222');
});
    {% endhighlight %}
    {% endtab %}
{% endtabs %}

# How are Pre-flight Requests?

At some point in time your client requests might become complex enough that before sending the request, the browser will first send a `pre-flight` request to the server to see if the client request has an allowed method and headers prior to sending the actual request. For more information about what triggers the browser to send the preflight request, [see here.](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)

{% highlight html %}
<!DOCTYPE html>
<head>
</head>
<script>
    const btnClick = () => {
        const options = {
            headers: {
                'X-Correlation-Id': 'a guid'
            },
        };
        fetch('http://localhost:2222/hello', options)
            .then(response => response.text())
            .then(data => console.log(data));
    }
</script>
<body>
    <h1>A very useful website</h1>
    <button onclick="btnClick()">click me</button>
</body>
{% endhighlight %}

Our client has been updated to also send a correlation id header in our api requests. Now when we try pressing the `click me` button we see the following:

![cors preflight request blocked the post request](/assets/cors-preflight-blocked.PNG)

We need to add the blocked header to our `Access-Control-Allow-Headers` in our pre-flight response. From now on we'll just show the relevant cors code that needs to be udpated.

{% tabs cors-update-options %}
    {% tab cors-update-options custom middleware %}
    {% highlight javascript%}
service.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1111');
    const method = req.method && req.method.toUpperCase && req.method.toUpperCase();

    if (method === 'OPTIONS') {
        // set the custom allowed to be sent by the client
        res.setHeader('Access-Control-Allow-Headers', 'X-Correlation-Id');
    }

    next();
});
    {% endhighlight %}
    {% endtab %}

    {% tab cors-update-options cors library %}
    {% highlight javascript%}
const options = {
    origin: 'http://localhost:1111',
    allowedHeaders: 'content-type'
}
service.use(cors(options));
    {% endhighlight %}
    {% endtab %}
{% endtabs %}

If you're not sure what custom headers your clients might include and you don't care what they are, the pre-flight request includes the request headers that will be used so you can update `Access-Control-Allow-Headers` to the following:

{% tabs cors-allow-all-headers %}
    {% tab cors-allow-all-headers custom middleware %}
    {% highlight javascript%}
service.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1111');
    const method = req.method && req.method.toUpperCase && req.method.toUpperCase();

    if (method === 'OPTIONS') {
        const requestHeaders = req.headers['access-control-request-headers'];
        res.setHeader('Access-Control-Allow-Headers', requestHeaders);

        // Vary Access-Control-Request-Headers to prevent cached responses
        res.setHeader('Vary', 'Access-Control-Request-Headers');
    }

    next();
});
    {% endhighlight %}
    {% endtab %}

    {% tab cors-allow-all-headers cors library %}
    {% highlight javascript%}
// at the time of writing, the cors library
// copies 'access-control-request-headers' by default
// so all headers are allowed
const options = {
    origin: 'http://localhost:1111',
}
service.use(cors(options));
    {% endhighlight %}
    {% endtab %}
{% endtabs %}

The following headers may be used in preflight checks: 

 header | description 
---|---
 Access-Control-Allow-Origin | This header is also used in preflight requests 
 Access-Control-Allow-Credentials | Indicates whether the response can be shared the the request includes credentials 
Access-Control-Allow-Methods | Indicates which methods are supported with cross-origin requests
Access-Control-Allow-Headers | Indicates which headers are supported with cross-origin requests
Access-Control-Max-Age | Indicates the number of seconds `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` can be cached

# Conclusion

That about covers the basics of CORS. Hopefully this shed some light on what CORS is, why it exists, and how to start making cross-origin requests to your apis. There are a few more topics around this which are beyond the scope of this article such as sending cookies and custom headers in cross-origin requests which we cant go over now but maybe there'll be another article on this.

If you're interested in learning more about CORS I would recommend [this book](https://www.manning.com/books/cors-in-action) by Monsur Hossain which goes into great detail on how to effectively enable your services for cross-origin requests. 

<script src="/assets/js/tabs.js"></script>
<link rel="stylesheet" href="/assets/css/tabs.css">