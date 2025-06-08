---
layout: post
title: "Concurrency in Kotlin"
date: 2025-6-7 16:00:00 +0800
categories: concurrency threads coroutines kotlin
description: What is concurrency and how can you leverage it in Kotlin
---

Kotlin is a really powerful modern, compiled programming language which has a lot of tools for easily building concurrent programs. In this blog we'll talk a bit about these tools and how to use them, but first, let's give a little context about the systems that enable concurrent, and parallel programs.

# threads, processes, and the CPU

## The CPU

Before we get into how concurrency works in Kotlin specifically, let's establish a basic understanding of how computers enable concurrency.

The CPU (Central Processing Unit) is responsible for executing all* of the instructions of our programs. 

The CPU is made up of:
* the Control Unit (CU)
* the Arithmetic-Logic Unit (ALU)
* the cache, which stores temporary memory for quickly accessing information. 

[cpu diagram here]

When processes are started up, its program instructions and data are loaded into RAM, then into the CPU cache as needed. The cache controller is responsible for managing what data is in the cache predicting what program data should be added next.


## CPU execution cycles

The CPU is always performing a continuous execution cycle of 4 stages:

1. Fetch instruction from cache
2. Decode the instruction
3. Execute the instruction in the ALU
4. Store the result of the instruction in cache/RAM

[image here describing steps]

That is a whoefully basic description of the CPU, there's a lot more going on but for our sake this is enough detail to continue.

> If you're reading this article you're probably familiar with the "other PU", the GPU. This is also responible for executing instructions and is incredibly fast due to its massive amounts of cores which enable parallelism however GPUs have far limited instruction set compared to CPUs so they can only perform a limited set of tasks, like BitCoin mining

## Processes

A process is simply a running program. It is a set of instructions waiting to be executed.

Most of the programs we build never need to directly interface with the hardware running on a computer. The operating system (aka kernel space) is responsible for those operations. Instead, most software runs above the operating system in what is referred to as User Space and uses the APIs provided by the OS. 

[user space/kernel space/hardware image]

Processes in an OS share hardware resourses which are managed by the OS. To facilitate this, processes are given their own independant address space and file table.

### Properties of a process

* Process ID (PID)
* Process state - created → ready ↔ running → terminated
* Executable - The executable file containing the machine instructions
* Files required by the process
* Address space of the process

In general, processes are completely independant and isolated from eachother, which can make communication between processes challenging.

While processes can spawn their own child processes, these child processes are still independant from the parent process and cannot directly communicate.

> Spawning child processes from a parent process is a method of achieving concurrency however these processes cannot directly communicte

## Threads

Threads are defined as an independent stream of instructions whose execution can be scheduled by the OS.

Threads share the resources and memory space of the process they're created in, which enables concurrent processing of instructions and simplifies sharing resources between threads.

With this division of responsibilities, the process can be viewed as the container for the process resources (address space, active connections, etc) and the thread the container of the process instruction set.

[image of process and threads]

Threads are managed in the kernal space via a scheduler which allocates CPU time to threads. Thread management is limited by the number of CPU cores as the more threads need to be scheduled the more time the CPU will need to spend scheduling each thread.

## Virtual Threads 

Virtual threads act in the same way as traditional threads but are managed in user space (e.g. the JVM). These are lighter-weight than traditional threads which allows for many virtual threads to run at the same time.

When a traditional thread is blocked (e.g. while waiting for a network response), the underlying OS thread is also blocked, which prevents its use from other resources.

When a virtual thread is blocked, it is considered `suspended`. Its state is stored and the underlying OS thread is freed up to perform other tasks until the virtual thread is resumed.

# Concurrency in Kotlin

OK. With all that out of the way, let's get into the code! Concurrency is enabled in Kotlin via the use of traditional threads and virtual threads, known as `coroutines`. We will focus on concurrency via coroutines as that is the more idiomatic approach and satisfies most use-cases.

## suspend functions

When working in a Kotlin project you will see a lot of function definitions with the `suspend` prefix about. Suspending functions enable the use of Kotlins built-in coroutine functions for concurrency, such as `async` and `delay`. 

Naturally, suspend functions aren't concurrent by default (that would lead to alot of unexpected bugs), but by defining a suspending function, when the thread is blocked (e.g. while waiting for a database), the underlying thread is freed up to run other tasks. 

# structured concurrency

# launch and async

