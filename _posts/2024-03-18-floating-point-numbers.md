---
layout: post
title: "0.1 + 0.2 or You Dont Understand Floating Point Numbers"
date: 2024-03-17 16:00:00 +0800
categories: javascript math numbers ieee-754 floating point
description: Why does your programming language sometimes not know how to do math? The answer may surprise you!
---


What is 0.1 + 0.2? Most people might say "0.3", and normally they'd be right. Javascript begs to differ. I invite you to open your developer terminal in this browser and enter `0.1 + 0.2` into the console. What is the result? 

![0.1 plus 0.2 is in fact 0.30000000000000004 When using floating point numbers](/assets/2024-03-08-floating-point-numbers/01-plus-02.PNG)

Once again, Javascript proves itself to be one of the quirkiest programming languages... But we shouldn't give Javascript all the credit here. Javascript has simply implemented its `Number` type to follow a widely used double floating point number standard known as IEEE-754.  

How many numbers are there? Quite a few... There's 1, 2, 3, 42, and much, much more! And how many numbers are between 1 and 2?  
There's 1.1, 1.01, 1.001, 1.945671456000000012314440014444000148478, we're just scratching the surface here, but let's say also a lot! How many bits of memory are available in your computer? Probably fewer than there are numbers.

## The IEEE-754 Standard for Floating Point Arithmetic

Computers need a way to capture all these numbers with a limited amount of space. IEEE-754 floating point number system was developed to help standardize this process. So how does it work? The double floating point standard uses 64 bits, let's use 16 bit floating point for example. 


Given 16 bits:

* 1 bit represents the `sign` (if the number is positive or negative)
* 5 bits represents the `exponent` (This determines where the floating decimal will be placed)
* 10 bits represents the `mantissa` (The number being stored) 

![the bit allocations in a 16 bit floating point number system](/assets/2024-03-08-floating-point-numbers/16-bit-fp-allocations.PNG)

## Lets do the math!

Given the number `12.5`, we can do some math to convert it into floating point binary number:

As the number is positive, we set `sign` to `0`.

`sign = 0`

To calculate the mantissa, we first continuously divide the left-hand side of the decimal by 2 until the whole number is 0. 
Then we multiply the right-hand side of the decimal by 2 until the result has no remainder.

whole number | decimal 
--- | --- 
`12 / 2 = 6` - remainder 0(0) | `0.5 * 2 = 1.0` - 1
`6 / 2 = 3`  - remainder 0(0) | 
`3 / 2 = 1.5` - remainder 5(1) | 
`1 / 2 = 0.5` - remainder 5(1) | 
result: `1100` | result `1`

This results in `1100.1`.

We then normalize the mantissa to get the exponent: 

`1100.1 = 1.1001*2^3`

Determine the biased exponent by adding the number of non-signed bits to the exponent value.

`3 + 15 = 18 = 10010`

Removing the leading `1`  from the mantissa results in:

`0 10010 1001000000`

![12.5 in half floating point binary is 01001010010000000](/assets/2024-03-08-floating-point-numbers/12-point-5-16-bit-fp.PNG)

## So What?

OK, that's cool and all but this still doesn't explain why `0.1 + 0.2 = 0.30000000000000004`!  

Yeah, I hear yah. Why don't we do this calculation again, but this time we'll convert `0.1` into 16 bit floating point binary.

`0.1` is a positive number, so `sign` is easy:

`sign = 0`.

Now to get our mantissa:

whole number | decimal 
--- | --- 
`0 / 2 = 0 ` - remainder 0(0) | `0.1 * 2 = 0.2` 0
                              | `0.2 * 2 = 0.4` 0
                              | `0.4 * 2 = 0.8` 0
                              | `0.8 * 2 = 1.6` 1
                              | `0.6 * 2 = 1.2` 1
                              | `0.2 * 2 = 0.4` 0  !!
result: `0`                   | result `0001100110`

The calculation loops back on itself after calculating  `0.6 * 2`! 

Using the 11 bits of space we have available we get: 

`0.0001100110`.

To get the exponent, we normalize the value:

`1.1*2^-4`

`-4 + 15 = 11 = 01011`

result:
`0 01011 0001100110`

The issue here is that we haven't captured the exact value of 0.1 in our conversion. There's an infinite series of `0011` that follows here.  
The same issue occurs when calculating `0.2`.  

Now you might be seeing why some number result in unexpected calculations. Just as `1/3` cannot be precisely captured in decimal notation, (there's an infinite amount of recurring 3s), some decimal values cannot be precisely captured in floating point numbers.  

When converting numbers too large for the bit capacity, the number may be rounded up or rounded down to the nearest bit depending on if the next bit is a `0` or `1`. 

In the case of `0.1 + 0.2`, here we can see that both 64bit floating point binary numbers are rounded up to the next bit which results in the `0100` (4) at the tail end of our result.

---|---
0.1 | 0 01111111011 1001100110011001100110011001100110011001100110011010
0.2 | 0 01111111100 1001100110011001100110011001100110011001100110011010
0.3 | 0 01111111101 0011001100110011001100110011001100110011001100110100

## In Conclusion

The IEEE-754 floating point number system is a great tool for representing a large array of numbers with some small quirks that surprises developers on occasion.

In most scenarios, these minor rounding errors wont dramatically change the result of a calculation, (being 0.00000000000000004 off the result is not a game changer).  

Where they do become important is when doing comparisons, e.g. `(x + y === 3)` or when presenting these results to humans. When working with floating point numbers it's important to account for these scenarios and potentially limit the decimal places or parse the values as Integers. 
A common solution for avoiding this is to only work with whole numbers (e.g. cents instead of dollars). 

Now, the next time someone asks you `what is 0.1 plus 0.2?` You will have a new opportunity to answer `It depends`.

## Other interesting quirks of Floating Point numbers

As the sign and mantissa are distinct values, this standard can create some interesting values:  
(16 bit floating point binaries shown for brevity)

---|---
Infinity | 0 11111 0000000000 
-Infinity | 1 11111 0000000000  
0 | 0 00000 0000000000 
-0 | 1 00000 0000000000 
NaN | 0 11111 0000000001 

* When the exponent is all `1`s and mantissa is all `0`s this is considered `Infinity`
* When the sign is `1` `Infinity` naturally becomes `-Infinity`
* When the exponent is all `0`s and mantissa is all `0`s the result is `0`
* Again, when the sign is `1` we get `-0`
* When the exponent is all `1`s and the mantissa is a non `0` value, this is considered Not a Number (`NaN`)

## Further Reading / Viewing

To learn more about this topic I highly recommend these:

* [YT - Computer Science - IEEE 754 Standard for Floating Point Binary Arithmetic](https://www.youtube.com/watch?v=RuKkePyo9zk)
* [YT - Low Byte Productions - Why 0.1 + 0.2 === 0.30000000000000004: Implementing IEEE 754 in JS](https://www.youtube.com/watch?v=wPBjd-vb9eI)
* [YT - Computerphile - Floating Point Numbers](https://www.youtube.com/watch?v=PZRI1IfStY0)
* [Wikipedia - Double-Precision Floating Point Format](https://en.wikipedia.org/wiki/Double-precision_floating-point_format)