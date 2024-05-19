---
layout: post
title: "Getting Started with AWS and Terraform: 01 - Creating an EC2 Intance"
date: 2024-05-17 16:00:00 +0800
categories: aws terraform infratructure IaC
description: In this multi-part blog series we will learn how to create a modern enterprise ready web service in AWS using Terraform. In this first post we will create an EC2 instance to host our web service in AWS using Terraform
---

# Introduction

(introduce the topic and describe the journey, and what the end result will be)

## Prerequisites

Before we start building, you'll want to have setup a couple things:

1. Have an [AWS Account](https://aws.amazon.com) setup
2. Installed [Terraform cli](https://developer.hashicorp.com/terraform/install?product_intent=terraform)

## Step 0 - Create a folder for your project

As we'll be building our infractructure using Terraform, which is an IaC tool, we'll need somewhere to write this code.
Let's create a folder called `my-unicorn-project` and inside that folder create another folder called `infra`.

## Step 1 - Define our Terraform provider

Now we will create our `main.tf` file inside our `infra` folder where we will define our cloud provider.

```terraform
# /infra/main.tf

terraform {
  required_version = ">= 1.2.0"
  required_providers {
    aws = {
            source = "hashicorp/aws"
            version = ">= 5.41.0"
        }
    }
}
```

Now when you open a terminal in the current directory and run `terraform init` Terraform will (what will it do exactly? Download the aws provider and create a state file?)


## Step 2 - Create an AWS EC2 instance

Now we have successfully initialized terraform with the aws provider we can define aws resources in our code. In this step we will create two entities:
1. An AWS EC2 instance resource
2. An aws ami image data reference for EC2 to run.

Create a new file called `unicorn-api.tf`.  
Inside the file, add:

```terraform
# /infra/unicorn-api.tf

data "aws_ami" "amazon_x86_image" {
    most_recent = true
    owners = ["amazon"]
    name_regex = "^al2023-ami-ecs.*"

    filter {
        name = "architecure"
        values = ["x86_64"]
    }
}

resource "aws_instance" "unicorn_vm" {
    ami = data.aws_ami.amazon_x86_image.id
    instance_type = "t2.micro"

    tags = {
        Name = "Unicorn"
    }
}
```

Now when you open the terminal and run `terraform plan` the logs will show that we're adding one new resource.  

Now try running `terraform apply` and confirm the plan.

It fails! But why?

Even though we've created an aws account, and downloaded Terraform, and the aws provider for Terraform to use, we still need Terraform to authenticate with aws in order to create these resources.

## Step 3 - Create an AWS API Key for terraform

In order for Terraform to manage resources in AWS it needs access to an aws account. We can accomplish this by creating an aws account specifically for this tool and defining corresponding API keys for it.

. Create a new file called `aws-provider-key.tf` and add the following content:

```terraform
# /aws-provider-key.tf

provider "aws" {
    access_key = ""
    secret_key = ""
    region = "ap-southeast-2"
}
```

You can opt to use a region closer to you. As I'm in Australia I'm opting to use the australian region.


> These API keys should be treated like credentials. Do not commit this file to source control. Otherwise the key could be discovered and you'll need to replace them.


Now we've defined the provider in Terraform, we need to create the aws api key for it to use.

Login to AWS and open the `IAM` service

![screenshot of the IAM service in aws]()

Open the `Users` page with IAM console
and select `Create user` (This will likely be a button on the top right)

![screenshot of the users page with the create user button]()

Give the user a name, e.g. `terraform-user` and do not provide it access to the aws console (There shouldn't be a need)

![ss]()

On the `Set permissions` page, select `Attach policies directly` and select the `AdministatorAccess` policy, then click `Next`. This role policy allows the user to do just about anything (except a few tasks reserved for the root account).

Review the change and then click `Create user`

Now we have created the user, select the user that was just created and navigate to `Security credentials`

Scroll down to `Access keys` and select `Create access key`

From the options menu select `Command Line Interface (CLI) and select the confirmation box acknowledging there are alternatives

Give a helpful description tag, e.g. `key-for-local-terraform` and click `Create access key`

Copy the Access key and secret key values into your `aws-provider.tf` file.


Now try running `terraform init` to register the aws provider credentials and then run `terraform apply`.
