---
layout: post
title: "Getting Started with AWS and Terraform: 01 - Creating an EC2 Intance"
date: 2024-05-17 16:00:00 +0800
categories: aws terraform infratructure IaC
description: In this multi-part blog series we will learn how to create a modern enterprise ready web service in AWS using Terraform. In this first post we will create an EC2 instance to host our web service in AWS using Terraform
---

# Introduction

In this series of blog posts, we will build an enterprise scale web infrastructure; Starting small with a simple virtual machine image, and iterating as our needs develop until eventually we will have a highly availble, secure, and resiliant web infrastructure capable of meeting the needs of tens of customers! All of this will be managed with the popular Infrastructure As Code tool, Terraform.  
In this first post, we will:
 1. Configure Terraform with a pre-existing AWS account
 2. Deploy an EC2 instance to AWS
 3. Allow incoming connections to the EC2 instance from our local device
 4. SSH into our EC2 instance using a ssh key pair

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

Now when you open a terminal in the current directory and run `terraform init` Terraform will download the required provider modules so they can be used to configure our services.


## Step 2 - Create an AWS EC2 instance

Now we have successfully initialized terraform with the aws provider we can define aws resources in our code. In this step we will create two things:
1. An AWS EC2 instance resource
2. An aws ami image data reference for EC2 to run

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

Now try running `terraform apply` to... err... apply the plan.  

It fails! But why?

Even though we've created an aws account, and downloaded Terraform, and the aws provider for Terraform to use, we still need Terraform to authenticate with aws in order to create these resources.

## Step 2.1 - Create an AWS API Key for terraform

In order for Terraform to manage resources in AWS it needs access to an aws account. We can accomplish this by creating an aws account specifically for this tool and defining corresponding API keys for it.

Create a new file called `aws-provider-key.tf` and add the following content:

```terraform
# /infra/aws-provider-key.tf

provider "aws" {
    access_key = ""
    secret_key = ""
    region = "ap-southeast-2"
}
```

You can opt to use a region closer to you. As I'm in Australia I'm opting to use the australian region.

Next you need to create two things in the AWS Management Console:
1. Create a [new User](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html) with administrator permission
2. Create an [access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) for the user

Take the access key and corresponding secret key and add them to your provider key your defined earlier.

> These API keys should be treated like credentials. Do not commit this file to source control. Otherwise the key could be discovered and you'll need to replace them.

Now try running `terraform apply` once more and everything should be hunky dory.

## Step 3 - Connect to our EC2 Instance

If you've made it this far it means you've successfully configured terraform with an aws account and have deployed an EC2 instance to AWS. Nice!  
Let's try connect to this instance.  
We can find the ip address by logging in to the AWS Management Console and opening the instance details within EC2.
Copy the IPv4 address and in a terminal run `ping <the-ip-address>`.

No response...  

This is because when we define the EC2 instance, a default security group is applied to it. This security group allows incoming connections on any port using any protocol but only from other aws resources with the same security group rules...

If we want to connect to our instance, we need to make our own rules.

When defining a security group rule, we declare if the rule is an ingress or egress rule (incoming or outgoing). We can also declare which port the rule applies to and the ip address range.

We don't want just anyone to connect to this service so for now we'll only allow our local device's public ip address in the address range. You can find this easily using a site like [whatismyipaddress.com](www.whatismyipaddress.com). 

Open `unicon-api.tf` and add the following resources, providing your public ip for `cidr_ipv4` value:

```terraform
# /infra/unicorn-api.tf

resource "aws_security_group" "unicorn_api_security_group" {
  name = "unicorn-api-security-group"
}

resource "aws_vpc_security_group_ingress_rule" "allow_from_local_device" {
  security_group_id = aws_security_group.unicorn_api_security_group.id
  description       = "allow ingress on any port from any ip"
  cidr_ipv4         = "<YOUR_IP_ADDRESS_HERE>/32"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}
```

Next, apply the security group to the ec2 instance, adding the following property to the ec2 instance:

```terraform 
# /infra/unicorn-api.tf

resource "aws_instance" "web_service_vm" {

    # ...

  vpc_security_group_ids = [aws_security_group.unicorn_api_security_group.id]
}
```

With these new resources defined, we can re-apply our changes with `terraform apply`. This will rebuild the EC2 instance, so we'll need to get the latest ip address so we can ping it.  
Once the resources have been updated and the latest IP address copied, we can now ping our EC2 instance with:  

`ping <the-ip-address>`

## Step 4 - SSH into the EC2 Instance

In this step we're going to create an ssh key pair using terraform. The public key will be added to the ec2 instance as one of its known ssh public keys.  
We'll save the private key as a local file so we can reference it when we try connect to the ec2 instance.

First, add the following providers to our `main.tf`:

```terraform
# infra/main.tf

required_providers {

    # ...

    tls = {
          source  = "hashicorp/tls"
          version = "~> 4.0.4"
        }

    local = {
      source  = "hashicorp/local"
      version = "2.4.1"
    }
}
```

Next, create a new file named `ssh_key.tf` and add the following:

```terraform

# create a tls key pair using rsa algorithm
resource "tls_private_key" "ssh_key" {
    algorithm = "RSA"
    rsa_bits = 4096
}

# save the private key to a local file named "key.pem"
resource "local_file" "rsa_key" {
    content = tls_private_key.ssh_key.private_key_openssh
    filename = "${path.module}/key.pem"
}

# define an aws key pair, providing the public key from the tls key pair defined above
resource "aws_key_pair" "key_pair_for_ec2_instance" {
    key_name = "ssh-key"
    public_key = tls_private_key.ssh_key.public_key_openssh
}
```

Next, add the following property to your ec2 instance:

```terraform

resource "aws_instance" "web_service_vm" {

    # ...

  key_name = aws_key_pair.key_pair_for_ec2_instance.key_name
}
```
With those resources defined and linked to our EC2 instance, we can once again reapply our terraform config to deploy the changes to aws.

Now that those changes have been applied we should now have a new local file, `key.pem`. Before we try sshing into our instance, we need to set the access permissions for this file. Something like `chmod 400 key.pem` should suffice. This will give the current account read permissions for the file, and no permissions for other users.  
For more information on how chmod works, [see here](https://ss64.com/bash/chmod.html).  

Next we can find the IPv4 DNS name of the instance from the aws management console, this will be something `ec2-11-11-11-11.your-aws-region.compute.amaonaws.com`.  
Copy that dns name and then in a console run:  
`ssh ec2-user@<EC2-DNS-NAME> -i 'key.pem'`. 

And voila! You've successfully:
 * Deployed a virtual machine instance to a public cloud environment
 * Confiured network security rules on the instance to accept incoming connections from only your device
 * Configured an ssh key pair for the instance and ssh'd into the instance 
 * Done it all using Terraform as our IaC tool so these steps can be easily repeated with just a single command!

In the next post we will update our EC2 instance to build and run a web server from ECR.

