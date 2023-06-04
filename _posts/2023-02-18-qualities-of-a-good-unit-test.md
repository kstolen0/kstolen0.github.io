---
layout: post
title: "The four qualities of a good unit test"
date: 2023-02-18 16:00:00 +0800
categories: unit testing engineering practices quality assurance QA CI CD
description: Good tests enable the sustainable growth of software systems. Here we describe some of the qualities of what "good" means when talking about tests.
---

The aim of unit testing is to enable the sustainable growth of software systems. This means more than just writing tests that "prove" your code does what you expect, but also to ensure that further changes are not hindered by the existing code base (including the test suite).

There are many examples of software design patterns and code smells which help guide application code design. While these patterns can also be used to build test suites, there are four metrics in particular that should be used to determine the quality of a unit test.

1. Fast Feedback
2. Maintainability
3. Protection against regressions
4. Resistance to refactoring

# Fast feedback

Fast feedback is an essential quality of a unit test. Faster tests enable more tests to be run, as well as enabling the tests to be run more often. Tests that run quickly drastically shorten the development feedback loop, notifying you of any regressions, and reduce the cost of fixing those regressions.

Slow tests dissuade developers from running them more often, and writing more tests. This also delays the development feedback loop and prolong the period during which bugs remain unnoticed.

# Maintainability

Test maintainability consists of two components: 
## How hard is it to understand the test

This relates to the size of the test, the fewer the lines of code of a test, the easier it is to understand. It's also easier to change a small test.

## How hard is it to run the test

If a test works with out-of-process dependencies, those dependencies will need to be maintained and operational during the test's lifetime.

# Protection against regressions

A regression happens when a feature unexpectedly stops working after change. The more features in a system, the more likely changes to one feature will result in regressions in other features. For this reason it is crucial to develop protections against these regressions before they're identified by the users of your system. 

To evaluate how well a given test scores against protecting against regressions, the following factors need to be considered: 
* The amount of code being executed
* The complexity of the code
* The domain significance of the code

# Resistance to refactoring

A test's resistance to refactoring is the degree to which a test can sustain a refactoring of the underlying application code without failing. 

Refactor means to change the internal structure of existing code without changing its observable behaviour.

If a test fails due to a refactoring of the system under test, then this is considered a false-positive.

To evaluate how well a given test scores against resistance to refactoring, measure the number of false-positives it generates, the fewer the better.

For more information on unit testing practices, check out [Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing) by Vladimir Khorikov. 
![unit testing principles practices and patterns](/assets/book-references/unit-testing-principles-practices-and-patterns.jpg)