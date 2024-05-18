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
1. And AWS EC2 instance resource
2. an aws ami image data reference for EC2 to run.

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

## Step 3
Open up the AWS management console in your browser of choice and login to your aws account.

Open the `IAM` service and ...

(create new user with admin priveledges)
(assign api key for that user)
(create aws-provider file)
(add provider creds to that file)
(ensure file is not committed to version control (add to .gitignore)
