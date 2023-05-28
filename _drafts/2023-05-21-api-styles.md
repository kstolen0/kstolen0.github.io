---
layout: post
title: "API Protocols: SOAP, REST & More"
date: 2023-05-21 12:00:00 +0800
categories: api
---

Web apis enable systems to share information across the internet. 

client and service communicate using a shared web language, e.g. JSON or XML.

## SOAP
# Simple Object Access Protocol
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

## REST
# REpresentational State Transfer 
REST is the most common protocol used for modern web apis. Many messaging formats can be used, JSON is common.
RESTful apis share the following six guiding constraints:

1. **Uniform Interface:** Multiple architectural constraints are required to ensure a uniform way of interacting with a given service, regardless of the device or application type
2. **Stateless:** All the necessary state to handle the request is contained within the request. The server should not have to store anything related to the session.
3. **Cacheable:** Responses should include whether the response is cacheable or not, and the cache duration.
4. **Client-server based:** A RESTful service should have a client-server architecture. A client should not be concerned with data-storage or business logic. The server should not be concerned with the UI or user state.
5. **Layered System:** The a restful architecture may be composed of multiple layers. Each layer should not know of any other layers other than the immediate layers with which they're interfacing.
6. **Code on Demand:** Server can also provide executable code to the client

# More on Uniform Interfaces
REST Apis are resource based and expose these resources via their URIs. Resources can be accessed or modified via a set of common HTTP methods: 
* **GET** - Request a given resource e.g. `GET my.service.com/api/books/1`
* **PUT** - Modify a given resource e.g. `PUT my.service.com/api/books/1`
* **POST** - Create a new resource e.g. `POST my.service.com/api/books`
* **DELETE** - Delete a resource e.g. `DELETE my.service.com/api/books/1`

Given a client has a representation of a resource, it should have enough information to be able to modify or delete the resource on the server. e.g. Getting a book (or books) may include the book id which can be used to call DELETE on that book.  
Where appropriate, responses should include links so the client can discover other resources easily. Following HATEOAS practices.

# HATEOAS
Hypermedia as the Engine of Application State is the practice of including links to related URIs in api responses so that the client needs minimal knowledge of a web service. This practice decouples the client from needing to hardcode all a web server's URIs thus making the server easier to change.

## GraphQL
Developed by Meta (the Facebook) in 2012 and open-sourced in 2015, GraphQL provides a flexible and efficient approach to querying and manipulating data over the internet.
One of the problems with REST endpoints is often a given URI doesn't include exactly what a client needs. The response may contain no enough information, thus requiring follow-up requests from other resources, or possibly too much information, unnecessarily increasing the payload size.

GraphQL allows a client to specify only exactly what it requires from a single endpoint. Take the Library Service for example. A Book resource may have many properties associated with it which most clients aren't necessarily concerned with. Instead of requesting the entire Book resource (or list of resources) the client can query just the book title and author. The server will return only the values the client requests.

GraphQL APIs can also be used a an API Gateway for multiple web servers.

Resources exposed by GraphQL services are defined in a Schema Definition Language (SDL). Similar to a SOAP's wsdl files (but more consise), this schema defines the types, fields, relationships, an operations supported by a given API and serves as the contract between a client and server.




## gRPC
Relies on HTTP for its transport layer. 
gRPC allows a web api to define any kind of function calls, as opposed to a set of predefined ones (e.g. GET POST PUT etc).

