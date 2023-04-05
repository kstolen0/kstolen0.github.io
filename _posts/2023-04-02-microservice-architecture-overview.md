---
layout: post
title: "An Introduction to Microservice Architectures"
date: 2023-04-05 16:00:00 +0800
categories: ddd domain driven design microservices architecture
---

The microservice architectural style is heavily influenced by Domain Driven Design (DDD), in particular, the concept of a Bounded Context. A bounded context is the domain in which a system is built. This system may contain many entities and behaviours implemented in the form of code and database schemas which would be coupled together. Within a bounded context, these internal models (e.g. database schema) are never coupled to anything outside the bounded context. This allows a context to only define what it needs and not accommodate other contexts. 

The primary goal of a microservice architecture is low coupling.

# Microservice topology

![microservice topology](/assets/2023-04-02-microservices/microservice-topology.PNG)

As the name suggests, a service size in a microservice architecture is much smaller than other distributed architectures. Each service should include all the necessary parts to operate independently. Other characteristics can be describes as follows: 

## Distributed

Microservices form a distributed architecture, meaning each service runs in its own process. These processes could be virtual machines, containers, or even individual physical hardware. This reduces the operational overhead of shared, multitenant infrastructure which can become an overly complex bottleneck for applications as they scale.

Performance can be a negative quality of distributed architectures due to more network calls as well as security verifications at each api endpoint. 

## Bounded Context

The bounded context is the driving philosophy of microservices; Each service modals a single domain. Therefore, each service should include everything necessary to operate within the application. By contrast, in a monolith architecture, many domains of the service may share common classes, e,g, Customer. This couples those domains together. Within a microservice architecture, coupling is avoided and instead each service would define its own Customer class.
Microservices can be considered the implementation of the logical concepts in Domain Driven Design.

## Granularity

It is important not to focus on creating the smallest possible service but to instead define the granularity of a single service. The purpose of the service boundary is to capture a domain or workflow, these boundaries might not always be so "small". Below are some guidelines to help define the granularity of a bounded context.

#### Define the purpose
What is the inspiration for the service boundary?

#### Identify transactions
Identifying entities that need to cooperate in a transaction may help identify a service boundary. It is best to avoid transactions across distributed systems as these can introduce additional complexity.

#### Choreographed services
If a collection of services require extensive communication to function, it may be worth bundling these services into a single service.

## Data Isolation
Many architectural styles may share a single database between services. However, given the emphasis on low coupling in microservices, this activity is highly discouraged. This provides flexibility for teams. Services aren't forced to use a particular tool, each service and can use the most appropriate tool for data storage.

## API Layer
An API layer is an optional feature in microservice architectures however it does offer a good location to perform useful tasks, such as defining a proxy, or to tie into operational facilities. It can also enable the flexibility of the architecture, as services can be added and removed without affecting the external interface. This layer should not be used as a mediator or orchestration tool. Those processes belong within the bounded context.

## Operational Re-use
While the microservice approach prefers duplication over coupling, there are common architectural elements that do benefit from coupling overall such as monitoring and logging. While some architectural styles emphases reuse of everything, microservices decouple domain concerns, but may still get value from coupling operational concerns. 

The sidecar pattern allows coupling of operations while decoupling domain concerns. With this pattern all operational concerns exist inside each service as a distinct component. When it comes time to update the monitoring tooling, the component can be updated and all microservices get the new functionality.

## Pros and Cons 

| Pros | Cons |
| --- | --- |
| Scalability - Within a microservice architecture, each domain can be scaled independently | Complexity - Microservice architectures can be more complex to design and develop as it involves managing multiple interconnected domains | 
| Resilience - If one service fails, other services will still be available | Performance - Communication between domains requires calls over the network instead of within a single system |
| Faster deployments - builds and deployments can be isolated between domains | |
| Testability - domains can be tested in isolation resulting in simpler tests | |

For more information on microservices and software architecture check out these resources: 

[https://martinfowler.com/articles/microservices.html](https://martinfowler.com/articles/microservices.html)  
  
[https://www.oreilly.com/library/view/fundamentals-of-software/9781492043447/](https://www.oreilly.com/library/view/fundamentals-of-software/9781492043447/)