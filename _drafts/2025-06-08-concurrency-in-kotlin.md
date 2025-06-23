---
layout: post
title: "Concurrency and Kotlin"
date: 2025-6-7 16:00:00 +0800
categories: concurrency threads coroutines kotlin
description: What is concurrency and how can you leverage it in Kotlin
---

When I was first introduced to a Kotlin codebase, there were a lot of terms scattered throughout the project; `suspend`, `runBlocking`, `Flux` just to name a few.

I didn't know what most of these meant or why they were used so I thought I'd do a little investigating. Turns out it's all about concurrency and generally our codebase wasn't really leveraging these tools. 

Kotlin is a powerful, modern, compiled programming language and is a great language to use for many types of projects.

This post aims to help you understand some of the concurrency tools offered by the language as well as how concurrency is enabled under the hood.


# Serial, Concurrent, and Parallel tasks

Let's get this out of the way.

![serial tasks](/assets/2025-06-16-concurrency/ser-tasks.png)

Serial means each task is executed one after the other. When a task is blocked, nothing is being executed.

![concurrent tasks](/assets/2025-06-16-concurrency/con-tasks.png)

Concurrent means tasks are still only executed one at a time, but this time execution is interleaved between tasks.

This is particularly useful as when one task is paused (e.g. waiting for an API response), another task can begin execution in the meantime.

![parallel tasks](/assets/2025-06-16-concurrency/par-tasks.png)

Parallel means multiple tasks are executed at the same time. Completing all tasks only take as long as the longest running task. Parallel execution requires multiple processing units to run in parallel.

For the most part, we will be talking about concurrent processes here. 

# threads, processes, and the CPU

## The CPU

Before we get into how concurrency works in Kotlin, let's establish a basic understanding of how computers enable concurrency.

The CPU (Central Processing Unit) is responsible for executing all* of the instructions of our programs. 

The CPU is made up of:
* the Control Unit (CU), which interprets machine instructions
* the Arithmetic-Logic Unit (ALU), which performs arithmetic and bitwise operations sent from the CU
* the cache, which stores temporary memory for quickly accessing information 

![properties of the CPU](/assets/2025-06-16-concurrency/cpu.png)

When processes are started up, its program instructions and data are loaded into RAM, then into the CPU cache as needed. The cache controller is responsible for managing what data is in the cache predicting what program data should be added next.


## CPU execution cycles

The CPU is always performing a continuous execution cycle of 4 stages:

1. Fetch instruction from cache
2. Decode the instruction
3. Execute the instruction
4. Store the result of the instruction

In a single core computer, all instructions are run serially. The CPU doesnt have a concept of "different tasks". This is managed beyond the hardware layer.

![stages of a CPU cycle](/assets/2025-06-16-concurrency/cpu-stages.png)

That is a woefully basic description of the CPU, there's a lot more going on but for our sake this is enough detail to continue.

> If you're reading this article you're probably familiar with the "other PU", the GPU. This is also responsible for executing instructions and is incredibly fast due to its massive amounts of cores which enable parallelism however GPUs have far limited instruction set compared to CPUs so they can only perform a limited set of tasks, like BitCoin mining

## Processes

A process is simply a running program. It is a set of instructions waiting to be executed.

Most of the programs we build never need to directly interface with the hardware running on a computer. The operating system (aka kernel space) is responsible for those operations. 

Instead, most software runs above the operating system as an isolated Process in User Space and uses the APIs provided by the OS. 

![user space, kernel space, and hardware separation](/assets/2025-06-16-concurrency/spaces.png)

Processes in an OS share hardware resourses which are managed by the OS. To facilitate this, processes are given their own independent address space and file table.

### Properties of a process

* Process ID (PID)
* Process state - created → ready ↔ running → terminated
* Executable - The executable file containing the machine instructions
* Files required by the process
* Address space of the process


![properties of a process](/assets/2025-06-16-concurrency/process.png)

In general, processes are completely independent and isolated from each other, which can make communication between processes challenging.

While processes can spawn their own child processes, these child processes are still independent from the parent process and cannot directly communicate.

> Spawning child processes from a parent process is a method of achieving concurrency however these processes cannot directly communicate

## Threads

Threads are defined as an independent stream of instructions whose execution can be scheduled by the OS.

Threads share the resources and memory space of the process they're created in, which enables concurrent processing of instructions and simplifies sharing resources between threads.

With this division of responsibilities, the process can be viewed as the container for the process resources (address space, active connections, etc) and the thread the container of the process instruction set.

![separation of process and its threads](/assets/2025-06-16-concurrency/process-threads.png)

Threads are managed in the kernel space via a scheduler which allocates CPU time to threads. Thread management is limited by the number of CPU cores as the more threads need to be scheduled the more time the CPU will need to spend scheduling each thread.

## Virtual Threads 

Virtual threads act in the same way as traditional threads but are managed by the process in user space. These are lighter-weight than traditional threads which allows for many virtual threads to run at the same time.

![separation of process and its threads](/assets/2025-06-16-concurrency/virtual-threads.png)

When a traditional thread is blocked the underlying OS thread is also blocked, which prevents its use from other resources.

When a virtual thread is blocked, it is considered `suspended`. Its state is stored and the underlying OS thread is freed up to perform other tasks until the virtual thread is resumed.

# Concurrency in Kotlin

OK. With all that out of the way, let's get into the code! Concurrency is enabled in Kotlin via the use of traditional threads and virtual threads, known as `coroutines`. 

Coroutines are a built in feature of Kotlin, but most projects use the official [kotlinx-coroutines](https://github.com/Kotlin/kotlinx.coroutines) library for it's intuitive coroutine builders, so these examples will be using that library.

## suspend functions

When working in a Kotlin project you will see a lot of function definitions with the `suspend` keyword about.

suspend functions can only be called in a coroutine context. As the name suggests, this enables the function to be `suspended` in which the current context stops executing, the state is saved, allowing the underlying thread to execute another coroutine. 

```kotlin
suspend fun foo() {
  bar()
  // this is a suspension point
  yield()
  baz()
}
```

In the above example `foo` is a suspending function. It can call other suspending functions just the same as any non-suspending function. 

Here, it is calling `yield` which is a suspend function provided by the kotlinx library which suspends the current coroutine and immediately schedules it so another coroutine can execute.

Calling suspend functions in a coroutine context wont run concurrently by default. For that we need some additional coroutine builders.

# launching a coroutine

`launch` Creates a new Job and runs it concurrently so it doesn't block the current execution context. When run within a coroutine scope (which is a blocking operation) the scope will not exit until all launched Jobs have completed.

```kotlin 
// create a coroutine context
runBlocking {
    // launch a new job (coroutine) so that it can be run
    // concurrently in the current coroutine scope
    launch {
        println("task 1 step 1")
        // suspend the current job and immediately schedule it
        // for when the thread becomes available
        yield()
        println("task 1 step 2")
        yield()
        println("task 1 step 3")
    }
    launch {
        println("task 2 step 1")
        yield()
        println("task 2 step 2")
        yield()
        println("task 2 step 3")
    }
}
```
![launch output](/assets/2025-06-16-concurrency/launch-output.png)

[See here](https://github.com/kstolen0/kotlin-coroutines/blob/launch/src/main/kotlin/Main.kt) for the full code.

## Waiting for the Job to complete (join)

Often you may want to run multiple jobs concurrently, and only run other tasks once the previous jobs are completed. For this you can use the `join` method from the launched job which suspends the coroutine until the job has completed.

Take the following code:

```kotlin
// create a coroutine context
runBlocking {
  // launch a new job to run concurrently
  val job1 = launch {
      delay(100)
      println("job 1 complete")
  }

  // launch a new job to run concurrently
  val job2 = launch {
      delay(50)
      println("job 2 complete")
  }

  // suspend until all jobs have completed
  job1.join()
  job2.join()
  println("all jobs completed")
}
```

Which produces the output:

![output of joining jobs](/assets/2025-06-16-concurrency/join-output.png)

Another method of achieving this is to launch the jobs in a new `coroutineScope` which creates a new coroutine context, inheriting the existing context, and suspends the current coroutine until all jobs in its scope have completed.

```kotlin
// create a coroutine context
runBlocking {
    // suspend until jobs have completed
    coroutineScope {
        launch {
            delay(100)
            println("job 1 complete")
        }

        launch {
            delay(50)
            println("job 2 complete")
        }
    }
    println("all jobs completed")
}
```

[See here](https://github.com/kstolen0/kotlin-coroutines/blob/join/src/main/kotlin/Main.kt) for the full code.

# Returning values from a Job (async)

`async` operates similar to `launch` however this returns a `Deferred` object. `Deferred` objects are a form of future object. A future object is a form of a "promise" that at some point a value will be returned, or an error is thrown. To access the result you can call `await` on the object.

```kotlin
// create coroutine context
runBlocking {
  // async is a coroutine builder which launches a Job
  // and returns a Deferred object.
  // A Deferred object will eventually return a result, or it will fail
  //
  // taskOne immediately suspends the current job 
  // before returning "world"
  val taskOne = async {
      yield()
      "world"
  }
  // taskTwo immediately returns "hello"
  val taskTwo = async {
      // uncomment the below line to also cancel the
      // job awaiting the result from taskTwo
      // cancel()
      "hello"
  }

  // await the results in another coroutine so we dont block
  launch {
      // await suspends the current coroutine
      // until the result is available.
      // if the job was cancelled then this job will also be cancelled
      println(taskOne.await())
  }
  
  launch {
      println(taskTwo.await())
  }
}
```
![async output](/assets/2025-06-16-concurrency/async-output.png)

# structured concurrency

Kotlin uses structured concurrency to manage concurrent tasks. This ensures Jobs are not lost and avoids memory leaks and makes concurrent processes safer to manage. Within a coroutine context, coroutines are managed in a hierarchy such that parent jobs can keep track of the state of  its children. 

![job hierarchy](/assets/2025-06-16-concurrency/job-context.png)

`runBlocking` is the first step in introducing structured concurrency. `runBlocking` creates a coroutine context which bridges the gap between blocking (serial) and non-blocking (concurrent) code. 

This function blocks the current thread until all Jobs within its scope have completed.

`runBlocking` does not preserve the existing coroutine context so avoid scattering this throughout your code. Typically this is only run at the entry point of a program.

`coroutineScope` is similar to `runBlocking` however it maintains the current context when creating new Jobs. Unlike `runBlocking`, `coroutineScope` doesn't block the underlying thread, it only suspends its context. 

New coroutines can be created within these scopes (via `launch` and `async`). Kotlin will keep track of these jobs so that the parent jobs will not complete until all its child jobs have completed. 

Additionally, if a job is cancelled, so will its child jobs, or any jobs dependant on its result.

![job being cancelled](/assets/2025-06-16-concurrency/job-context-cancelled.png)

# Conclusion

Hopefully this article gave 
