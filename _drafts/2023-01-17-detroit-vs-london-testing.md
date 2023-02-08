---
layout: post
title: "Unit Testing - Detroit vs London"
date: 2023-01-17 16:00:00 +0800
categories: unit testing london classical detroit test
---

Software entropy is the phenomenon wherein a software system will eventually rot over time so that small changes to code take longer and are more at risk of introducing regressions. Unit tests help overturn this tendency, and act as a tool to defend against a majority of regressions.

The aim of unit testing is to enable the sustainable growth of software systems.

Tests still require some overhead, first when introducing a test suite, and on-going when adding tests for new features or updating tests to reflect changes in the application.

# What is a unit test?

A unit test is an automated test that has the following three attributes: 
1. It verifies a small piece of code (a unit)
2. It runs quickly
3. It runs in an isolated manner

# The difference between the Detroit and London Styles of Unit Testing

The primary difference between the detroit and london styles of unit testing lie in what we mean by "isolated". 

## The London Take

The London take on this means isolating the system under test from its collaborators. If a class has a dependency on another class, that dependency should be replaced with a test double. This enables the tester to isolate the class behaviour from any external influences.

![dependencies become mocks](/assets/2023-01-17-testing/dependencies-become-mocks.PNG)

A benefit to this approach is that if a test fails you know exactly where the bug has surfaced, within the class that's being tested. 

Additionally this approach helps split the object graph of the system, which can become complicated over time.

![break the dependency graph with mocks](/assets/2023-01-17-testing/break-the-dependency-graph.PNG)

It also simplifies testing guidelines for a project. Instead of figuring out how to cover your code-base with tests, each class should have a corresponding test suite.

![every class has a test class](/assets/2023-01-17-testing/every-class-has-a-test-class.PNG)


## The Detroit Take

The Detroit take (aka the Classical take) on isolation means to attempt to isolate the unit tests from each other.

This approach takes a less strict approach on test doubles. They are still used, but these are usually for replacing shared, volatile, or out-of-process dependencies.

In this case a unit can refer to a single class, or multiple classes