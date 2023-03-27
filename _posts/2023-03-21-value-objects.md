---
layout: post
title: "The Value of Value Objects"
date: 2023-03-21 16:00:00 +0800
categories: domain driven design primitives design patterns clean code value objects primitive obsession
---

![this is a Domain Driven Design thing](/assets/2023-03-21-value-objects/d%20d%20d.PNG)

Does this scenario sound familiar to you? You're writing an api in Kotlin that accepts a customer id and a message to send to the customer.
You validate the fields as they enter the api then write the function to send the message to the customer with the signature:

`fun sendMessageToCustomer(message: String, customerId: String): Unit { ...`

Now, for reasons decided a long time ago a valid customer id has the format of 4 lowercase letters followed by 6 numeric values. And the message cannot be empty. You've already validated the values as they entered the api, but do you need validate them again within this method, or the methods these are passed to? 
In some cases you might. You might even have a validation library that's used by all your customer apis for validating the id to ensure the validation rules don't drift (except for within that one service).

Then as the consumer of this method, was the signature 

`sendMessageToCustomer(customerId, message)` or  
`sendMessageToCustomer(message, customerId)`

Both will compile fine. You'd better add validation somewhere to ensure that something breaks if the wrong properties are used (Or if using an OO language, maybe restructure to something like `customer.sendMessage(message)`).

# Introducing Value Objects

Alternatively, your could introduce some value objects. These replace primitive types as the building blocks of your domain. 
This is very straight forward in Kotlin through the use of data classes. 

{% highlight kotlin %}
data class CustomerId(val value: String) {
    init {
        val tester = Regex("^[a-z]{4}\\d{6}$")
        
        if (!tester.containsMatchIn(value)) {
            throw InvalidCustomerIdException("Invalid customer id format: ${value})
        }
    }
}

data class Message(val value: String) {
    init {
        if (value.count() < 1) {
            throw InvalidMessageException("Message must be at least 1 character long")
        }
    }
}
{% endhighlight %}  

We can now update our function signature to:  
`sendMessageToCustomer(message: Message, customer: CustomerId)`  

Now these properties can be used in place of strings for any function parameter that expects a customer id or a message and the function can be certain the values are correct as the validation is part the object. 

# Conclusion

Value objects can be an effective way to reduce ambiguity and duplication within domain code as well as emphasizing use of the ubiquitous language within your domain. The next time you find yourself representing a core concept of your domain as a String or Int or Boolean, consider defining a value object instead.