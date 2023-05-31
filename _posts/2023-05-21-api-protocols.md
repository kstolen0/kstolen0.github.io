---
layout: post
title: "API Protocols: SOAP, REST & More"
date: 2023-05-30 12:00:00 +0800
categories: api protocol rest soap grpc graphql
---

![web services talking to eachother](/assets/2023-05-21-api-protocols/web.PNG)

Web apis enable systems to share information across the internet. You are probably familiar with REST APIs, however there a many alternatives to REST which may fit your use-case. Below we talk about multiple API protocols including SOAP, REST, GraphQL, and gRPC.

Each of these descriptions also include an example implementation of a Library web service that allows a client to query for books, borrow, return, add, and remove books.

# SOAP
## Simple Object Access Protocol

![a cartoon computer washing itself with soap in a bath in the syle of edvard munch](/assets/2023-05-21-api-protocols/soap-api.PNG)
That was an AI generated image...

Introduced in the late 1990s, SOAP is a message specification for exchanging information between web services. Unlike some other protocols, SOAP is transport independent and as such, can be used over HTTP, SMTP, TCP, UDP, etc.
Given that these messages are structured in XML, and have multiple parts, SOAP messages may be much larger and therefore slower than its counterparts.

The structure of a SOAP message are as follows: 

* Envelope
    * The envelope encapsulates the entirety of the message and identifies the document as a SOAP message
* Header
    * The header contains additional information about the message such as client credentials
* Body
    * The body includes details of the actual message that is being sent. This includes call and response information
* Fault (optional)
    * Fault messages are returned as a http 500 response and include a fault code, a string, actor and detail



SOAP services typically include a WSDL (Web Service Description Language) document.
This document describes the operations available on a given service, and the messages that can be exchanged. These documents are used as a contract between a client and server for exchanging messages and can even be imported into tools such as SoapUI and Postman.

[See here](https://codesandbox.io/p/sandbox/2023-05-21-soap-api-example-yrov40) for the example Library api using SOAP as its messaging protocol.

# REST
## REpresentational State Transfer 
![a computer sleeping in bed the syle of vincent van gogh](/assets/2023-05-21-api-protocols/rest-api.PNG)  

REST is the most common protocol used for modern web apis. Many messaging formats can be used, JSON is common.
RESTful apis share the following six guiding constraints:

1. **Uniform Interface:** Multiple architectural constraints are required to ensure a uniform way of interacting with a given service, regardless of the device or application type
2. **Stateless:** All the necessary state to handle the request is contained within the request. The server should not have to store anything related to the session.
3. **Cacheable:** Responses should include whether the response is cacheable or not, and the cache duration.
4. **Client-server based:** A RESTful service should have a client-server architecture. A client should not be concerned with data-storage or business logic. The server should not be concerned with the UI or user state.
5. **Layered System:** The a restful architecture may be composed of multiple layers. Each layer should not know of any other layers other than the immediate layers with which they're interfacing.
6. **Code on Demand:** Server can also provide executable code to the client

## More on Uniform Interfaces
REST Apis are resource based and expose these resources via their URIs. Resources can be accessed or modified via a set of common HTTP methods: 
* **GET** - Request a given resource e.g. `GET my.service.com/api/books/1`
* **PUT** - Modify a given resource e.g. `PUT my.service.com/api/books/1`
* **POST** - Create a new resource e.g. `POST my.service.com/api/books`
* **DELETE** - Delete a resource e.g. `DELETE my.service.com/api/books/1`

Given a client has a representation of a resource, it should have enough information to be able to modify or delete the resource on the server. e.g. Getting a book (or books) may include the book id which can be used to call DELETE on that book.  
Where appropriate, responses should include links so the client can discover other resources easily, following HATEOAS practices.

## HATEOAS
Hypermedia as the Engine of Application State is the practice of including links to related URIs in api responses so that the client needs minimal knowledge of a web service. This practice decouples the client from needing to hardcode all a web server's URIs thus making the server easier to change.

[See here](https://codesandbox.io/p/sandbox/2023-05-27-rest-api-example-m2btd0) for the same example api using REST as its messaging protocol.

# GraphQL

![graph ql](/assets/2023-05-21-api-protocols/graphql.PNG)

Developed by Meta (Facebook?) in 2012 and open-sourced in 2015, GraphQL provides a flexible and efficient approach to querying and manipulating data over the internet.
One of the problems with REST endpoints is often a given URI doesn't include exactly what a client needs. The response may contain not enough information, thus requiring follow-up requests from other resources, or possibly too much information, unnecessarily increasing the payload size.

GraphQL allows a client to specify only exactly what it requires from a single endpoint. Take the Library Service for example. A Book resource may have many properties associated with it which most clients aren't necessarily concerned with. Instead of requesting the entire Book resource (or list of resources) the client can query just the book title and author. The server will return only the values the client requests.

GraphQL APIs can also be used a an API Gateway for multiple web servers.

Resources exposed by GraphQL services are defined in a Schema Definition Language (SDL). Similar to a SOAP's wsdl files (but more consise), this schema defines the types, fields, relationships, an operations supported by a given API and serves as the contract between a client and server.

[See here](https://codesandbox.io/p/sandbox/2023-05-27-graphql-api-example-1dw1fk) for the same example api, but this time using GraphQL.

# gRPC

Google Remote Procedure Call, developed by Google and now maintained by the Cloud Native Computing Foundation, is an open-source, highly performant, lightweight messaging protocol for communicating between web services. With gRPC, a client can directly call a method on a server as if it were a local method. 

This protocol is based around the concept of defining a shared API interface which describes the operations available on a given server, and the messages that can be exchanged between the client and server. Unlike in SOAP, which uses XML as its Shared Definition Language (IDL), gRPC uses a [protocol buffers](https://protobuf.dev/) as its IDL, resulting in much simpler contracts.

As gRPC relies on HTTP/2 as its transport layer it is able to parse data in binary format which is more light-weight than JSON and XML.

gRPC also supports bidirectional streaming wherein both the client and server send a sequence of messages using a read-write stream.

Before you run away to add gRPC layers to all your APIs, it should be worth noting that HTTP/2 is not supported by most modern browsers, so this protocol is best suited between system-system communication.

Finally, [see here](https://codesandbox.io/p/sandbox/2023-05-27-grpc-example-dbmwpc) for the same example api with a gRPC interface.

# Summary

This was just an introduction to some current and emerging web service messaging protocols you will likely encounter throughout your career. 

 _ | Pros | Cons
---|---|---
SOAP | * Supports Message Level Security<br/>* Widely supported <br/>* Structured interfaces * Transport layer independent <br /> | * Heavy-weight messages <br />* Complex to configure
REST | * Simple protocol built on widely adopted standards <br />* Supports response caching <br /> | * Limited realtime communication support <br />* Not suited for complex or hierarchical data structures
GraphQL |* flexible data fetching, no over/under fetching<br />* Introspection enables clients to explore api schema | * Lack of standardized caching and authn
gRPC |* Highly performant <br />* Strong client/server contracts <br />* supports bidirectional streaming | * Limited browser support
