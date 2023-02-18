---
layout: post
title: "Refactoring towards valuable unit tests"
date: 2023-02-08 16:00:00 +0800
categories: unit testing refactoring humble object
---

The aim of unit testing is to enable the sustainable growth of software systems. This means more than just writing tests that "prove" your code does what you expect, but also to ensure that further changes are not hindered by the existing code base (including the test suite). Enabling the use of effective unit tests often requires some refactoring of production code. 

All code can be categorized along two dimensions: 
1. Complexity / Domain significance
2. Number of collaborators (aka dependencies)

An indication of complex code can be a high cyclomatic complexity. 

Domain significance describes how significant the code is to your core-domain. In a hexagonal architecture, this is typically all the code within your domain layer.

A collaborator is a type of dependency that is either mutable (e.g. a class that changes state), or an out-of-process dependency (e.g. a database). Immutable dependencies (values / value objects) do not count towards the number of collaborators. 

These two dimensions provide us with four types of code: 

# Domain model & algorithms

The domain model and algorithms not specific to the domain may often require complex code, but the number of collaborators should be limited.

# Trivial code 

Examples of this code are parameterless constructors or simple object properties. This code also has little domain significance.

# Controllers 

This code has many collaborators but doesn't contain any complex logic and instead coordinates the work between other components with domain significance.

# Overcomplicated code 

This is code that has a high number of collaborators, and also contains complex business logic or algorithms.

![the four code quadrants](/assets/2023-02-08-refactoring-to-valuable-unit-tests/code-quadrants.PNG)

Focusing your unit tests on the top left quadrant typically gives you the greatest return on your efforts and results in valuable test that are easy to write and maintain.

Trivial code should not require testing at all as these tests provide little value.

Testing controllers should be reserved for a limited number of integration tests.

Overcomplicated code should be split into it's two its adjacent quadrants.

![remove overcomplicated code](/assets/2023-02-08-refactoring-to-valuable-unit-tests/remove-overcomplicated-code.PNG)

## Welcome the Humble Object Pattern

One method of simplifying overcomplicated code can be achieved using the humble object pattern. Complicated code that is difficult to test is often coupled to a framework dependency, such as UI or database. 

![hard to test code](/assets/2023-02-08-refactoring-to-valuable-unit-tests/humble-object-before.PNG)

The humble object pattern removes the testable parts of the code out of the difficult to test component, the resulting component becomes a humble wrapper around the testable code.

![easy to test code](/assets/2023-02-08-refactoring-to-valuable-unit-tests/humble-object-after.PNG)

This pattern also follows the single responsibility principle, which states that each class should have only one responsibility. In this case it means separating out the business logic (code depth) from the orchestration of the system (code width). Your domain logic should be deep, but narrow (having few collaborators), and your controllers should be wide, but shallow (having little complexity).

![shallow controllers and deep business logic](/assets/2023-02-08-refactoring-to-valuable-unit-tests/shallow-controller-narrow-logic.PNG)
